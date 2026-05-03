
import { Request, Response } from 'express';
import { AIDiscussionService } from '../services/aiDiscussion.service';

export class AIDiscussionController {
  /**
   * POST /api/review/question-explanation
   * Body: { resultId: string, questionId: string }
   */
  /**
   * Streaming GET/POST /api/review/question-explanation
   */
  static async getExplanation(req: Request, res: Response) {
    try {
      const { resultId, questionId } = req.body;
      const userId = req.user.id;

      if (!resultId || !questionId) {
        return res.status(400).json({ error: 'Missing resultId or questionId' });
      }

      const stream = await AIDiscussionService.streamQuestionExplanation(resultId, questionId, userId);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.on('data', (chunk: Buffer) => {
        res.write(chunk);
      });

      stream.on('end', () => {
        res.end();
      });

      stream.on('error', (err: Error) => {
        console.error('[AIDiscussionController] Stream Error:', err);
        res.end();
      });

    } catch (err: any) {
      console.error('[AIDiscussionController] getExplanation Error:', err.message);
      return res.status(500).json({ error: `Failed to start stream: ${err.message}` });
    }
  }

  /**
   * Streaming POST /api/review/question-chat
   */
  static async sendMessage(req: Request, res: Response) {
    try {
      const { resultId, questionId, message, history } = req.body;
      const userId = req.user.id;

      if (!resultId || !questionId || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const stream = await AIDiscussionService.streamChatAboutQuestion(resultId, questionId, userId, message, history || []);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      stream.on('data', (chunk: Buffer) => {
        res.write(chunk);
      });

      stream.on('end', () => {
        res.end();
      });

      stream.on('error', (err: Error) => {
        console.error('[AIDiscussionController] Chat Stream Error:', err);
        res.end();
      });

    } catch (err: any) {
      console.error('[AIDiscussionController] sendMessage Error:', err.message);
      return res.status(500).json({ error: 'Failed to start chat stream.' });
    }
  }
}
