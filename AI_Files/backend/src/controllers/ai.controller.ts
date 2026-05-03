
import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { Role } from '@prisma/client';
import { AnalyzeStudentParams, AnalyzeExamParams, AIChatSchema } from '../validators/ai.validators';

export class AIController {
  
  /**
   * Analyzes a specific student's performance.
   * Student can call only for self | Admins for any.
   */
  static async analyzeStudent(req: Request, res: Response) {
    try {
      const { userId } = AnalyzeStudentParams.parse(req.params);
      
      if (req.user.role === Role.STUDENT && req.user.id !== userId) {
        return res.status(403).json({ error: 'You can only analyze your own performance.' });
      }

      const results = await AIService.analyzeStudentPerformance(userId);
      return res.json(results);
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid User ID format' });
      return res.status(500).json({ error: 'AI Student Analysis failed', detail: err.message });
    }
  }

  /**
   * Provides prioritized study recommendations for a student.
   * Student can call only for self | Admins for any.
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const { userId } = AnalyzeStudentParams.parse(req.params);
      
      if (req.user.role === Role.STUDENT && req.user.id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const analysis = await AIService.analyzeStudentPerformance(userId);
      return res.json({
        recommendations: analysis.recommendedActions,
        nextBestLesson: analysis.nextBestLesson,
        nextBestExam: analysis.nextBestExam
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }

  /**
   * Admin-only: Analyze a specific exam's quality and metrics.
   */
  static async analyzeExam(req: Request, res: Response) {
    try {
      const { examId } = AnalyzeExamParams.parse(req.params);
      const results = await AIService.analyzeExamQuality(examId);
      return res.json(results);
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid Exam ID format' });
      return res.status(500).json({ error: 'Exam analysis failed' });
    }
  }

  /**
   * Admin-only: Global cohort intelligence and platform summary.
   */
  static async analyzeCohort(req: Request, res: Response) {
    try {
      const summary = await AIService.analyzeCohortIntelligence();
      return res.json(summary);
    } catch (err: any) {
      return res.status(500).json({ error: 'Cohort analysis failed' });
    }
  }

  /**
   * Admin-only: High-level platform summary.
   */
  static async getAdminSummary(req: Request, res: Response) {
    try {
      const summary = await AIService.analyzeCohortIntelligence();
      return res.json(summary);
    } catch (err: any) {
      console.error(`[AIController] getAdminSummary Error | User: ${req.user.id} (${req.user.role}) | Path: ${req.path}:`, err);
      return res.status(500).json({ error: 'AI Admin Strategic Analysis failed', detail: err.message });
    }
  }

  /**
   * Interactive chat session with the AI Mentor.
   */
  static async handleChat(req: Request, res: Response) {
    try {
      const { messages, context } = AIChatSchema.parse(req.body);
      const userId = req.user.id; 

      const results = await AIService.chatWithMentor(userId, messages, context);
      return res.json(results);
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid chat history format' });
      return res.status(500).json({ error: 'AI Mentor Chat failed', detail: err.message });
    }
  }

  /**
   * Streaming chat session with the AI Mentor.
   */
  static async streamChat(req: Request, res: Response) {
    try {
      const { messages, context } = AIChatSchema.parse(req.body);
      const userId = req.user.id;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = AIService.streamMentorChat(userId, messages, context);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid chat history format' });
      return res.status(500).json({ error: 'AI Mentor Stream failed', detail: err.message });
    }
  }
}
