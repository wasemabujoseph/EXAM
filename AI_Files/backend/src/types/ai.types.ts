
/**
 * Shared DTOs and Types for the AI Intelligence Layer.
 */

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export interface AIWeakArea {
  type: "subject" | "unit" | "lesson" | "skill";
  name: string;
  reason: string;
}

export interface AIAction {
  priority: number;
  action: string;
  why: string;
}

export interface StudentAnalysisResponse {
  aiAvailable: boolean;
  summary: string;
  riskLevel: RiskLevel;
  strengths: string[];
  weakAreas: AIWeakArea[];
  observedFacts: string[];
  inferredPatterns: string[];
  recommendedActions: AIAction[];
  nextBestLesson: string | null;
  nextBestExam: string | null;
  generatedAt: string;
  cached?: boolean;
}

export interface ExamAnalysisResponse {
  aiAvailable: boolean;
  summary: string;
  observedFacts: string[];
  inferredPatterns: string[];
  hardQuestions: Array<{
    questionId: string;
    failureRate: number;
    note: string;
  }>;
  qualityRisks: string[];
  recommendedActions: string[];
  generatedAt: string;
}

export interface CohortSummaryResponse {
  aiAvailable: boolean;
  summary: string;
  growthAnalysis: string;
  qualityAudit: string;
  riskAlerts: string[];
  recommendedInterventions: string[];
  generatedAt: string;
}

export interface AIErrorResponse {
  error: string;
  code: string;
  fallbackUsed: boolean;
}

export interface CacheEntry<T> {
  data: T;
  expires: number;
  freshnessSignature: string;
}

export interface OpenRouterChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
    };
    finish_reason: string;
  }>;
}
