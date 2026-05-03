
import prisma from './db.service';
import { AIService } from './ai.service';
import { PromptBuilderService } from './promptBuilder.service';

export class AIDiscussionService {
  /**
   * Generates the initial AI explanation for a specific question in a result.
   */
  static async generateQuestionExplanation(resultId: string, questionId: string, userId: string) {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { exam: true }
    });

    if (!result) throw new Error('RESULT_NOT_FOUND');
    if (result.userId !== userId) throw new Error('UNAUTHORIZED');
    if (result.status !== 'SUBMITTED') throw new Error('EXAM_NOT_SUBMITTED');

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) throw new Error('QUESTION_NOT_FOUND');

    // Get student's answer for this question
    const answers = result.answers as Record<string, number>;
    const selectedIndex = answers[questionId] !== undefined ? answers[questionId] : null;
    const options = question.options as string[];
    
    console.log(`[AIDiscussionService] Generating explanation for Result:${resultId}, Question:${questionId}...`);
    
    const context = {
      examTitle: result.exam.title,
      subject: result.exam.subjectAr,
      unit: result.exam.unitTitleAr,
      lesson: result.exam.subunitTitleAr,
      questionText: question.text,
      options: options,
      correctOption: options[question.correctIndex],
      studentOption: selectedIndex !== null ? options[selectedIndex] : null,
      isCorrect: selectedIndex === question.correctIndex,
      existingExplanation: question.explanation
    };

    const prompt = PromptBuilderService.buildQuestionExplanationPrompt(context);

    try {
      console.time(`[AI-LATENCY] Explanation:${questionId}`);
      const response = await AIService.getAIResponse([
        { role: 'system', content: 'أنت مساعد أكاديمي متخصص في المناهج الدراسية.' },
        { role: 'user', content: prompt }
      ]);
      console.timeEnd(`[AI-LATENCY] Explanation:${questionId}`);

      return {
        explanation: response,
        questionContext: {
          text: question.text,
          correctAnswer: options[question.correctIndex],
          studentAnswer: selectedIndex !== null ? options[selectedIndex] : null,
          isCorrect: selectedIndex === question.correctIndex
        }
      };
    } catch (err: any) {
      console.error('[AIDiscussionService] Explanation Failed:', err.message);
      if (err.response?.status === 429 || err.message?.includes('429')) {
        throw new Error('AI_LIMIT_REACHED');
      }
      throw new Error(`AI_GEN_FAILED: ${err.message}`);
    }
  }

  /**
   * Handles follow-up chat messages for a specific question.
   */
  static async chatAboutQuestion(
    resultId: string, 
    questionId: string, 
    userId: string, 
    newMessage: string, 
    history: { role: string; content: string }[]
  ) {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { exam: true }
    });

    if (!result) throw new Error('RESULT_NOT_FOUND');
    if (result.userId !== userId) throw new Error('UNAUTHORIZED');

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) throw new Error('QUESTION_NOT_FOUND');

    const answers = result.answers as Record<string, number>;
    const selectedIndex = answers[questionId] !== undefined ? answers[questionId] : null;
    const options = question.options as string[];

    const context = {
      questionText: question.text,
      correctOption: options[question.correctIndex],
      studentOption: selectedIndex !== null ? options[selectedIndex] : 'لم يجب'
    };

    console.log(`[AIDiscussionService] Processing follow-up for Result:${resultId}, Question:${questionId}...`);
    const prompt = PromptBuilderService.buildQuestionFollowupPrompt(context, history, newMessage);

    try {
      console.time(`[AI-LATENCY] Follow-up:${questionId}`);
      const response = await AIService.getAIResponse([
        { role: 'system', content: 'أنت مساعد أكاديمي متخصص. أجب باختصار وتركيز على السؤال.' },
        { role: 'user', content: prompt }
      ]);
      console.timeEnd(`[AI-LATENCY] Follow-up:${questionId}`);

      return { content: response };
    } catch (err: any) {
      console.error('[AIDiscussionService] Follow-up Chat Failed:', err.message);
      if (err.response?.status === 429 || err.message?.includes('429')) {
        throw new Error('AI_LIMIT_REACHED');
      }
      throw new Error(`AI_CHAT_FAILED: ${err.message}`);
    }
  }

  /**
   * Internal helper to dry up context retrieval.
   */
  private static async getQuestionDiscussionContext(resultId: string, questionId: string, userId: string) {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { exam: true }
    });

    if (!result) throw new Error('RESULT_NOT_FOUND');
    if (result.userId !== userId) throw new Error('UNAUTHORIZED');

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) throw new Error('QUESTION_NOT_FOUND');

    const answers = result.answers as Record<string, number>;
    const selectedIndex = answers[questionId] !== undefined ? answers[questionId] : null;
    const options = question.options as string[];

    return { result, question, selectedIndex, options };
  }
  /**
   * Generates a streaming explanation for a specific question.
   */
  static async streamQuestionExplanation(resultId: string, questionId: string, userId: string) {
    const { result, question, selectedIndex, options } = await this.getQuestionDiscussionContext(resultId, questionId, userId);

    const context = {
      examTitle: result.exam.title,
      subject: result.exam.subjectAr,
      unit: result.exam.unitTitleAr,
      lesson: result.exam.subunitTitleAr,
      questionText: question.text,
      options: options,
      correctOption: options[question.correctIndex],
      studentOption: selectedIndex !== null ? options[selectedIndex] : null,
      isCorrect: selectedIndex === question.correctIndex,
      existingExplanation: question.explanation
    };

    const prompt = PromptBuilderService.buildQuestionExplanationPrompt(context);
    
    // Return the stream directly
    return AIService.getAIStream([
      { role: 'system', content: 'أنت مساعد أكاديمي متخصص في المناهج الدراسية.' },
      { role: 'user', content: prompt }
    ]);
  }

  /**
   * Follow-up streaming chat about a specific question.
   */
  static async streamChatAboutQuestion(resultId: string, questionId: string, userId: string, newMessage: string, history: any[]) {
    const { result, question, selectedIndex, options } = await this.getQuestionDiscussionContext(resultId, questionId, userId);

    const context = {
      questionText: question.text,
      options: options as string[],
      correctOption: (options as string[])[question.correctIndex],
      studentOption: selectedIndex !== null ? (options as string[])[selectedIndex] : 'لم يجب'
    };

    const prompt = PromptBuilderService.buildQuestionFollowupPrompt(context, history, newMessage);
    
    return AIService.getAIStream([
      { role: 'system', content: 'أنت مساعد أكاديمي متخصص. أجب باختصار وتركيز على السؤال.' },
      { role: 'user', content: prompt }
    ]);
  }
}
