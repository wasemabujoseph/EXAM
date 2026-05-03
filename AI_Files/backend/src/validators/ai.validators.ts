import { z } from 'zod';
import { RiskLevel } from '../types/ai.types';

/**
 * Zod schemas for AI model response validation and API requests.
 */

export const WeakAreaSchema = z.object({
  type: z.enum(["subject", "unit", "lesson", "skill"]),
  name: z.string(),
  reason: z.string()
});

export const ActionSchema = z.object({
  priority: z.number(),
  action: z.string(),
  why: z.string()
});

export const StudentAnalysisSchema = z.object({
  summary: z.string(),
  riskLevel: z.nativeEnum(RiskLevel),
  strengths: z.array(z.string()),
  weakAreas: z.array(WeakAreaSchema),
  observedFacts: z.array(z.string()).optional(),
  inferredPatterns: z.array(z.string()).optional(),
  recommendedActions: z.array(ActionSchema),
  nextBestLesson: z.string().nullable().optional(),
  nextBestExam: z.string().nullable().optional()
});

export const ExamAnalysisSchema = z.object({
  summary: z.string(),
  observedFacts: z.array(z.string()),
  inferredPatterns: z.array(z.string()),
  hardQuestions: z.array(z.object({
    questionId: z.string(),
    failureRate: z.number(),
    note: z.string()
  })),
  qualityRisks: z.array(z.string()),
  recommendedActions: z.array(z.string())
});

export const CohortSummarySchema = z.object({
  summary: z.string(),
  growthAnalysis: z.string(),
  qualityAudit: z.string(),
  riskAlerts: z.array(z.string()),
  recommendedInterventions: z.array(z.string())
});

export const AnalyzeStudentParams = z.object({
  userId: z.string()
});

export const AnalyzeExamParams = z.object({
  examId: z.string().uuid()
});

export const ChatMessageSchema = z.array(z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
}));

export const AIChatSchema = z.object({
  messages: ChatMessageSchema,
  context: z.any().optional()
});
