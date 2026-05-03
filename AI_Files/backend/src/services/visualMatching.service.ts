import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import prisma from './db.service';
import { parseVisualFilename, ParsedVisual } from '../utils/visualParser';

export interface VisualMatchSummary {
  matched: number;
  overwritten: number;
  duplicates: number;
  unknown: number;
  wrongExamId: number;
  invalidFilename: number;
  unmatched: number;
  questionsWithoutVisuals: number;
  autoRecoveredExamIdMismatch: number;
}

export interface UnresolvedItem {
  filename: string;
  reason: 'UNKNOWN_QUESTION' | 'WRONG_EXAM_ID' | 'INVALID_FILENAME' | 'DUPLICATE' | 'UNMATCHED';
}

export interface RecoveredItem {
  originalFilename: string;
  newFilename: string;
  reason: string;
}

export interface MatchResults {
  summary: VisualMatchSummary;
  unresolved: UnresolvedItem[];
  recovered: RecoveredItem[];
}

export async function processVisualsZip(
  examId: string,
  zipPath: string,
  visualAssetsRoot: string
): Promise<MatchResults> {
  const results: MatchResults = {
    summary: {
      matched: 0,
      overwritten: 0,
      duplicates: 0,
      unknown: 0,
      wrongExamId: 0,
      invalidFilename: 0,
      unmatched: 0,
      questionsWithoutVisuals: 0,
      autoRecoveredExamIdMismatch: 0
    },
    unresolved: [],
    recovered: []
  };

  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  const examDir = path.join(visualAssetsRoot, examId);
  if (!fs.existsSync(examDir)) fs.mkdirSync(examDir, { recursive: true });

  // Get all questions for this exam to match against
  const questions = await prisma.question.findMany({
    where: { examId },
    orderBy: { orderIndex: 'asc' }
  });

  const questionMap = new Map<number, typeof questions[0]>();
  questions.forEach((q, idx) => {
    questionMap.set(q.orderIndex + 1, q); // 1-based matching
  });

  const processedInThisZip = new Set<string>(); // To track duplicates within the same ZIP

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    const filename = path.basename(entry.entryName);
    if (filename.startsWith('.') || filename.startsWith('__MACOSX')) continue;

    const parsed = parseVisualFilename(filename);

    if (!parsed.isValid) {
      results.summary.invalidFilename++;
      results.unresolved.push({ filename, reason: 'INVALID_FILENAME' });
      continue;
    }

    let currentFilename = filename;
    let isRecovered = false;

    if (parsed.examId !== examId) {
      // Try recovery if it's not 'unknown' and all qRefs are valid for the target exam
      const allExist = parsed.questionRefs.length > 0 && 
                       !parsed.questionRefs.includes('unknown') && 
                       parsed.questionRefs.every(ref => questionMap.has(parseInt(ref)));

      if (allExist) {
        isRecovered = true;
        results.summary.autoRecoveredExamIdMismatch++;
        
        // Construct standard new filename using target examId
        const qPart = `q${parsed.questionRefs.join('-q')}`;
        currentFilename = `${examId}_${qPart}_${parsed.visualType}_${parsed.index}.${parsed.extension}`;
        
        results.recovered.push({
          originalFilename: filename,
          newFilename: currentFilename,
          reason: 'RECOVERED_BY_QUESTION_REF'
        });
      } else {
        results.summary.wrongExamId++;
        results.unresolved.push({ filename: currentFilename, reason: 'WRONG_EXAM_ID' });
        continue;
      }
    }

    if (parsed.questionRefs.includes('unknown')) {
      results.summary.unknown++;
      results.unresolved.push({ filename, reason: 'UNKNOWN_QUESTION' });
      continue;
    }

    // Check for duplicates in the same ZIP
    const targetKey = `${parsed.questionRefs.join('-')}_${parsed.visualType}_${parsed.index}`;
    if (processedInThisZip.has(targetKey)) {
      results.summary.duplicates++;
      results.unresolved.push({ filename, reason: 'DUPLICATE' });
      continue;
    }
    processedInThisZip.add(targetKey);

    let wasMatchedAtLeastOnce = false;
    const targetPath = path.join(examDir, currentFilename);

    for (const qRef of parsed.questionRefs) {
      const qIndex = parseInt(qRef);
      const question = questionMap.get(qIndex);

      if (question) {
        // Save the file
        fs.writeFileSync(targetPath, entry.getData());

        // Update database
        const hasExisting = question.imagePath && question.visualSourceType === 'image';
        
        await prisma.question.update({
          where: { id: question.id },
          data: {
            imagePath: `${examId}/${currentFilename}`,
            imageAssetKey: currentFilename,
            visualSourceType: 'image'
          }
        });

        if (hasExisting) {
          results.summary.overwritten++;
        } else {
          results.summary.matched++;
        }
        wasMatchedAtLeastOnce = true;
      }
    }

    if (!wasMatchedAtLeastOnce) {
      results.summary.unmatched++;
      results.unresolved.push({ filename, reason: 'UNMATCHED' });
    }
  }

  // Calculate questions still lacking visuals
  const updatedQuestions = await prisma.question.findMany({
    where: { examId, visualSourceType: { not: 'image' } }
  });
  results.summary.questionsWithoutVisuals = updatedQuestions.length;

  return results;
}
