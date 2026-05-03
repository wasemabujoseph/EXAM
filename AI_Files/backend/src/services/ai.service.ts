
import prisma from './db.service';
import { OpenRouterClient } from './openrouter.client';
import { DeepAIClient } from './deepai.client';
import { PromptBuilderService } from './promptBuilder.service';
import { AICacheService } from './aiCache.service';
import { StudentAnalysisSchema, ExamAnalysisSchema, CohortSummarySchema } from '../validators/ai.validators';
import { RiskLevel, StudentAnalysisResponse, ExamAnalysisResponse, CohortSummaryResponse } from '../types/ai.types';
import { computeUserAnalytics } from './analytics.service';
import { getDashboardStats } from './stats.service';

/**
 * AI Service for academic intelligence and analytics.
 */
export class AIService {
  
  /**
   * Internal helper to route to the correct AI provider based on environment settings.
   */
  public static async getAIResponse(messages: { role: string; content: string }[], options: any = {}): Promise<string> {
    const provider = process.env.AI_PROVIDER || 'openrouter';
    const enableOpenRouterFallback = process.env.AI_ENABLE_OPENROUTER_FALLBACK === 'true';

    if (provider === 'local_deepai') {
      try {
        console.log('[AI] Using local DeepAI provider...');
        return await DeepAIClient.chat(messages, options);
      } catch (err: any) {
        console.warn(`[AI] Local DeepAI failed: ${err.message}`);
        if (enableOpenRouterFallback) {
          console.log('[AI] Falling back to OpenRouter...');
          return await OpenRouterClient.chat(messages, options);
        }
        throw err; // Let the service's own fallback logic handle it
      }
    }

    return await OpenRouterClient.chat(messages, options);
  }

  /**
   * Internal helper to route streaming requests to the correct AI provider.
   */
  public static async getAIStream(messages: { role: string; content: string }[], options: any = {}): Promise<any> {
    const provider = process.env.AI_PROVIDER || 'openrouter';
    const enableOpenRouterFallback = process.env.AI_ENABLE_OPENROUTER_FALLBACK === 'true';

    if (provider === 'local_deepai') {
      try {
        console.log('[AI] Using local DeepAI provider (Streaming)...');
        return await DeepAIClient.streamChat(messages, options);
      } catch (err: any) {
        console.warn(`[AI] Local DeepAI Stream failed: ${err.message}`);
        if (enableOpenRouterFallback) {
          console.log('[AI] Falling back to OpenRouter Stream...');
          return await OpenRouterClient.streamChat(messages, options);
        }
        throw err;
      }
    }

    return await OpenRouterClient.streamChat(messages, options);
  }

  /**
   * Generates a comprehensive performance analysis for a student.
   */
  static async analyzeStudentPerformance(userId: string): Promise<StudentAnalysisResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, _count: { select: { results: true } } }
    });

    if (!user) throw new Error('USER_NOT_FOUND');

    const freshnessSignature = `results:${user._count.results}`;
    const cacheKey = AICacheService.generateKey('STUDENT_ANALYSIS', userId);
    const cached = AICacheService.get<StudentAnalysisResponse>(cacheKey, freshnessSignature);
    
    if (cached) return { ...cached, cached: true };

    const analytics = await computeUserAnalytics(userId);
    const totalExams = await prisma.exam.count();
    const uniqueSubjects = await prisma.exam.groupBy({ by: ['subjectAr'] });
    
    // Anonymized metrics payload
    const payload = {
      id: userId.substring(0, 8),
      totalAttempts: user._count.results,
      platformTotalExams: totalExams,
      platformSubjects: uniqueSubjects.map(s => s.subjectAr).filter(Boolean),
      subjectStats: Object.entries(analytics.subjectStats).map(([s, d]) => ({ 
        subject: s, 
        accuracy: Math.round((d.correct / Math.max(1, d.totalQuestions)) * 100) 
      })),
      weakness: analytics.weakness.map(w => w.subject),
      mastery: analytics.masteryHeatmap,
      projections: analytics.projections
    };

    const prompt = PromptBuilderService.buildStudentAnalysisPrompt(payload);

    try {
      const response = await this.getAIResponse([
        { role: 'system', content: 'You are a precise academic analytics engine. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true });

      const parsed = this.safeParseAndValidate(response, StudentAnalysisSchema);
      
      const result: StudentAnalysisResponse = {
        ...parsed,
        aiAvailable: true,
        generatedAt: new Date().toISOString()
      };

      AICacheService.set(cacheKey, result, freshnessSignature);
      return result;
    } catch (err: any) {
      const isLimit = err.response?.status === 429 || err.message?.includes('429');
      console.error('[AIService] Student Analysis Failed:', err.message);
      return this.getStudentFallback(payload, isLimit);
    }
  }

  /**
   * Analyzes the quality and difficulty patterns of a specific exam.
   */
  static async analyzeExamQuality(examId: string): Promise<ExamAnalysisResponse> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { 
        results: { select: { score: true, createdAt: true } },
        _count: { select: { questions: true } }
      }
    });

    if (!exam) throw new Error('EXAM_NOT_FOUND');

    const cacheKey = AICacheService.generateKey('EXAM_ANALYSIS', examId);
    const cached = AICacheService.get<ExamAnalysisResponse>(cacheKey);
    if (cached) return cached;

    // Aggregate question-level difficulty from logs
    const questionStats = await (prisma.questionLog.groupBy as any)({
      by: ['questionId', 'isCorrect'],
      where: { examId },
      _count: { _all: true }
    });

    // Process stats into a map of [questionId]: { total, correct }
    const difficultyMap: Record<string, { total: number, correct: number }> = {};
    questionStats.forEach((stat: any) => {
      const qid = stat.questionId;
      if (!difficultyMap[qid]) difficultyMap[qid] = { total: 0, correct: 0 };
      difficultyMap[qid].total += stat._count._all;
      if (stat.isCorrect) difficultyMap[qid].correct += stat._count._all;
    });

    const metrics = {
      title: exam.title,
      subject: exam.subjectAr,
      totalQuestions: exam._count.questions,
      attemptCount: exam.results.length,
      averageScore: exam.results.length > 0 
        ? (exam.results.reduce((sum, r) => sum + r.score, 0) / (exam.results.length * exam.questionCount)) * 100
        : 0,
      difficultQuestions: Object.entries(difficultyMap)
        .map(([id, s]) => ({ id, accuracy: s.correct / s.total }))
        .filter(q => q.accuracy < 0.4)
        .map(q => ({ id: q.id, failureRate: 1 - q.accuracy }))
    };

    const prompt = PromptBuilderService.buildExamAnalysisPrompt(metrics);

    try {
      const response = await this.getAIResponse([
        { role: 'system', content: 'You are a psychometric expert. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true });

      const parsed = this.safeParseAndValidate(response, ExamAnalysisSchema);
      const result: ExamAnalysisResponse = {
        ...parsed,
        aiAvailable: true,
        generatedAt: new Date().toISOString()
      };

      AICacheService.set(cacheKey, result);
      return result;
    } catch (err: any) {
      const isLimit = err.response?.status === 429 || err.message?.includes('429');
      console.error('[AIService] Exam Quality Analysis Failed:', err.message);
      return this.getExamFallback(metrics, isLimit);
    }
  }

  /**
   * Generates strategic cohort intelligence for the entire platform.
   */
  static async analyzeCohortIntelligence(): Promise<CohortSummaryResponse> {
    try {
      const cacheKey = AICacheService.generateKey('COHORT_SUMMARY', 'global');
      const cached = AICacheService.get<CohortSummaryResponse>(cacheKey);
      if (cached) return cached;

      const stats = await getDashboardStats();
      
      // Deeper stats aggregation for "Pro Ultra" Admin Intelligence
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [newUsers, activeUserCount] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.result.groupBy({ by: ['userId'], where: { createdAt: { gte: sevenDaysAgo } } }).then(res => res.length)
      ]);

      // Audit Exam Quality - Find hardest exams (lowest avg scores)
      const examStats = await prisma.result.groupBy({
        by: ['examId'],
        _avg: { score: true },
        _count: { id: true },
        orderBy: {
          _avg: {
            score: 'asc'
          }
        },
        take: 100,
      });

      const hardestExamsRaw = await Promise.all(
        examStats
          .sort((a, b) => (a._avg.score || 0) - (b._avg.score || 0))
          .slice(0, 5)
          .map(async s => {
            if (!s.examId) return null;
            const exam = await prisma.exam.findUnique({ 
              where: { id: s.examId }, 
              select: { title: true, subjectAr: true, questionCount: true } 
            });
            if (!exam) return null;

            return {
              title: exam.title,
              subject: exam.subjectAr,
              avgScore: Math.round(((s._avg.score || 0) / Math.max(1, exam.questionCount)) * 100),
              attempts: s._count.id
            };
          })
      );

      const payload = {
        totalUsers: stats.metrics.users,
        newUsersLast7Days: newUsers,
        activeUsersLast7Days: activeUserCount,
        totalExams: stats.metrics.exams,
        totalAttempts: stats.metrics.results,
        hardestExams: hardestExamsRaw.filter((e): e is any => e !== null && e.attempts >= 2), 
        subjectPerformance: (stats.recentAllResults as any[] || []).slice(0, 50).reduce((acc: any, r: any) => {
          const sub = r.exam?.subjectAr;
          if (!sub) return acc;
          if (!acc[sub]) acc[sub] = { sum: 0, count: 0 };
          const accuracy = (r.score / Math.max(1, r.exam?.questionCount || 1)) * 100;
          acc[sub].sum += accuracy;
          acc[sub].count++;
          return acc;
        }, {})
      };

      const prompt = PromptBuilderService.buildCohortSummaryPrompt(payload);

      const response = await this.getAIResponse([
        { role: 'system', content: 'You are an educational strategist. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ], { jsonMode: true });

      const parsed = this.safeParseAndValidate(response, CohortSummarySchema);
      const result: CohortSummaryResponse = {
        ...parsed,
        aiAvailable: true,
        generatedAt: new Date().toISOString()
      };

      AICacheService.set(cacheKey, result);
      return result;
    } catch (err: any) {
      const isLimit = err.response?.status === 429 || err.message?.includes('429');
      console.error('[AIService] analyzeCohortIntelligence Fatal Error:', err);
      return this.getCohortFallback(isLimit);
    }
  }

  /**
   * Interactive chat session with the AI Mentor.
   */
  static async chatWithMentor(userId: string, messages: { role: string; content: string }[], context?: any) {
    const analytics = await computeUserAnalytics(userId);
    const systemPrompt = PromptBuilderService.buildMentorSystemPrompt(analytics, context);

    const chatHistory = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response = await this.getAIResponse(chatHistory);
      return { content: response, generatedAt: new Date().toISOString() };
    } catch (err: any) {
      console.error('[AIService] Mentor Chat Failed:', err.message);
      if (err.response?.status === 429 || err.message?.includes('429')) {
        throw new Error('AI_LIMIT_REACHED');
      }
      throw new Error('MENTOR_UNAVAILABLE');
    }
  }

  /**
   * Streaming version of the AI Mentor chat.
   */
  static async *streamMentorChat(userId: string, messages: { role: string; content: string }[], context?: any) {
    const analytics = await computeUserAnalytics(userId);
    const systemPrompt = PromptBuilderService.buildMentorSystemPrompt(analytics, context);

    const chatHistory = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const stream = await this.getAIStream(chatHistory);
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') return;
          try {
            const data = JSON.parse(dataStr);
            const text = data.choices[0]?.delta?.content || '';
            if (text) yield text;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Safe JSON extraction and validation with robust parsing.
   */
  private static safeParseAndValidate(raw: string, schema: any): any {
    if (!raw) throw new Error('EMPTY_AI_RESPONSE');
    
    // Remove markdown code blocks if present
    let cleaned = raw.replace(/```(?:json)?\n?([\s\S]*?)```/g, '$1').trim();
    
    // If there is text before or after the JSON, try to extract only the JSON part
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      const parsed = JSON.parse(cleaned);
      return schema.parse(parsed);
    } catch (err) {
      console.warn('[AIService] Validation failed, text was:', raw.substring(0, 100));
      throw new Error('AI_INVALID_JSON_FORMAT');
    }
  }

  private static getStudentFallback(payload: any, isLimit = false): StudentAnalysisResponse {
    const weakest = payload.weakness[0] || 'المواد التي تحتاج تركيز';
    const limitMsg = "وصلت لحد الاستخدام اليومي للذكاء الاصطناعي. تم استخدام التحليل الإحصائي المحلي بدلاً من ذلك.";
    return {
      aiAvailable: false,
      summary: isLimit ? limitMsg : "تحليلات الذكاء الاصطناعي غير متوفرة حالياً. بناءً على إحصائياتك المحلية، نلاحظ وجود فجوة في بعض المواضيع.",
      riskLevel: payload.totalAttempts < 5 ? RiskLevel.MEDIUM : RiskLevel.LOW,
      strengths: ["الاستمرار في ممارسة الاختبارات"],
      weakAreas: [{ type: "subject", name: weakest, reason: "أداء أقل من المتوسط في المحاولات الأخيرة" }],
      observedFacts: [`إجمالي المحاولات: ${payload.totalAttempts}`, `أضعف مادة: ${weakest}`],
      inferredPatterns: ["تحتاج لمزيد من الممارسة في الوحدات المتقدمة"],
      recommendedActions: [{ priority: 1, action: `ركز على مراجعة ${weakest}`, why: "لتحسين معدلك العام" }],
      nextBestLesson: null,
      nextBestExam: null,
      generatedAt: new Date().toISOString()
    };
  }

  private static getExamFallback(metrics: any, isLimit = false): ExamAnalysisResponse {
    return {
      aiAvailable: false,
      summary: isLimit ? "وصلت لحد الاستخدام اليومي للذكاء الاصطناعي. (تحليل جودة محدود)" : "تحليل الجودة التلقائي معطل حالياً.",
      observedFacts: [`إجمالي المحاولات: ${metrics.attemptCount}`, `متوسط الدرجة: ${Math.round(metrics.averageScore)}%`],
      inferredPatterns: ["توزيع الدرجات طبيعي بناءً على العينة الحالية"],
      hardQuestions: metrics.difficultQuestions.map((q: any) => ({ ...q, note: "نسبة رسوب عالية" })),
      qualityRisks: ["لا توجد مخاطر إحصائية واضحة"],
      recommendedActions: ["راجع الأسئلة ذات نسبة الرسوب العالية"],
      generatedAt: new Date().toISOString()
    };
  }

  private static getCohortFallback(isLimit = false): CohortSummaryResponse {
    return {
      aiAvailable: false,
      summary: isLimit ? "وصلت لحد الاستخدام اليومي للذكاء الاصطناعي بريميوم." : "ملخص النشاط العام غير متوفر حالياً.",
      growthAnalysis: "تحليل النمو غير متوفر في وضع الاحتياط.",
      qualityAudit: "تدقيق الجودة غير متوفر في وضع الاحتياط.",
      riskAlerts: [],
      recommendedInterventions: ["استمر في مراقبة أداء الطلاب"],
      generatedAt: new Date().toISOString()
    };
  }
}
