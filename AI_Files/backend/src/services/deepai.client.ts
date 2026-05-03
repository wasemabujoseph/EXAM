
import axios from 'axios';
import { Readable } from 'stream';

/**
 * DeepAI Local Browser-to-API Client
 * Targets the local server at http://127.0.0.1:8000/v1
 * Mirrors the OpenRouterClient interface for seamless replacement.
 */
export class DeepAIClient {
  private static baseUrl = process.env.LOCAL_AI_BASE_URL || 'http://127.0.0.1:8000/v1';
  private static model = process.env.LOCAL_AI_MODEL || 'deepai-standard';
  private static timeout = Number(process.env.AI_TIMEOUT_MS) || 180000;

  /**
   * Send a standard chat completion request.
   */
  static async chat(messages: { role: string; content: string }[], options: { temperature?: number; jsonMode?: boolean } = {}): Promise<string> {
    console.log(`[DeepAIClient] Sending request to ${this.baseUrl} (Model: ${this.model})...`);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: options.temperature ?? 0.2,
          // DeepAI browser API might not support jsonMode natively, 
          // but we include it if it's OpenAI compatible.
          response_format: options.jsonMode ? { type: 'json_object' } : undefined
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        console.error('[DeepAIClient] Empty response from local server:', response.data);
        throw new Error('EMPTY_DEEPAI_RESPONSE');
      }

      console.log(`[DeepAIClient] Raw Response: ${content.substring(0, 200)}...`);
      return content;
    } catch (err: any) {
      console.error(`[DeepAIClient] Chat Failed: ${err.message}`);
      if (err.code === 'ECONNABORTED') throw new Error('DEEPAI_TIMEOUT');
      if (err.code === 'ECONNREFUSED') throw new Error('DEEPAI_SERVER_NOT_RUNNING');
      throw err;
    }
  }

  /**
   * Send a streaming chat request.
   * Since the browser automation waits for the full answer, we simulate the stream
   * by yielding chunks if real streaming isn't perfectly forwarded, 
   * or by piping the response stream if the local server supports it.
   */
  static async streamChat(messages: { role: string; content: string }[], options: { temperature?: number } = {}): Promise<any> {
    console.log(`[DeepAIClient] Initializing Stream for ${this.model}...`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: options.temperature ?? 0.2,
          stream: true
        },
        {
          timeout: this.timeout,
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          }
        }
      );

      return response.data;
    } catch (err: any) {
      console.warn(`[DeepAIClient] Stream Initialization Failed: ${err.message}. Attempting non-stream fallback...`);
      
      // If streaming fails (e.g. server doesn't support it), fallback to regular chat 
      // and wrap result in a fake SSE stream to avoid breaking frontend.
      const fullText = await this.chat(messages, options);
      return this.simulateSSE(fullText);
    }
  }

  /**
   * Helper to wrap a string into a fake SSE stream for compatibility with stream-expecting routes.
   */
  private static simulateSSE(text: string): Readable {
    const stream = new Readable();
    stream._read = () => {};
    
    // Chunk the text to simulate a typing effect or just send it at once
    const data = JSON.stringify({
      choices: [{ delta: { content: text } }]
    });
    
    stream.push(`data: ${data}\n\n`);
    stream.push('data: [DONE]\n\n');
    stream.push(null);
    
    return stream;
  }
}
