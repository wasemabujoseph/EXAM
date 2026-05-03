
import axios from 'axios';
import { OpenRouterChatResponse } from '../types/ai.types';

/**
 * OpenRouter AI Client
 * Handles communication with OpenRouter's OpenAI-compatible completions endpoint.
 * Upgraded with robust 429 resilience and fallback model chaining.
 */
export class OpenRouterClient {
  private static baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  private static apiKey = process.env.OPENROUTER_API_KEY;
  private static primaryModel = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';
  private static timeout = Number(process.env.OPENROUTER_TIMEOUT_MS) || 60000;
  private static appUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';

  private static fallbackModels = [
    'google/gemma-2-9b-it:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'google/gemma-3-12b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'openrouter/free'
  ];

  /**
   * Send a chat completion request with robust retries and model fallbacks.
   */
  static async chat(messages: { role: string; content: string }[], options: { temperature?: number; jsonMode?: boolean } = {}): Promise<string> {
    if (!this.apiKey) throw new Error('AI_CONFIG_ERROR');

    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError: any = null;

    for (const model of modelsToTry) {
        const maxRetries = 3;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`[OpenRouterClient] Attempting ${model} (Trial ${attempt + 1})...`);
                const response = await axios.post<OpenRouterChatResponse>(
                    `${this.baseUrl}/chat/completions`,
                    {
                        model: model,
                        messages,
                        temperature: options.temperature ?? 0.2,
                        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
                        max_tokens: 2000
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': this.appUrl,
                            'X-Title': 'Imtihani Academic Platform'
                        },
                        timeout: this.timeout
                    }
                );

                const content = response.data.choices[0]?.message?.content;
                if (content) return content;
                throw new Error('EMPTY_RESPONSE');

            } catch (err: any) {
                lastError = err;
                const status = err.response?.status;
                const isRateLimit = status === 429;
                
                if (isRateLimit) {
                    const errorMsg = err.response?.data?.error?.message || '';
                    const isDailyLimit = errorMsg.includes('free-models-per-day') || errorMsg.includes('daily limit');
                    
                    if (isDailyLimit) {
                        console.error(`[OpenRouterClient] DAILY LIMIT REACHED on ${model}.`);
                        break; // Stop trying this model and potentially others if it's account-wide
                    }

                    if (attempt < maxRetries - 1) {
                        const delay = (attempt + 1) * 3000 + Math.random() * 1000;
                        console.warn(`[OpenRouterClient] 429 Rate Limit on ${model}. Retrying in ${Math.round(delay)}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }

                console.warn(`[OpenRouterClient] Failed model ${model} | Status: ${status || 'TIMEOUT'} | Error: ${err.message}`);
                break; // Try next model in chain
            }
        }
    }

    console.error('[OpenRouterClient] All models failed in fallback chain.');
    throw lastError || new Error('AI_SERVICE_UNAVAILABLE');
  }

  /**
   * Send a streaming chat request with initial 429 fallback capability.
   */
  static async streamChat(messages: { role: string; content: string }[], options: { temperature?: number } = {}): Promise<any> {
    const apiKey = (this.apiKey || '').trim();
    if (!apiKey) throw new Error('AI_CONFIG_ERROR');

    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError: any = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[OpenRouterClient] Initializing Stream | Model: ${model}`);
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: model,
                    messages,
                    temperature: options.temperature ?? 0.2,
                    stream: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream',
                        'HTTP-Referer': this.appUrl,
                        'X-Title': 'Imtihani Academic Platform'
                    },
                    responseType: 'stream',
                    timeout: 60000
                }
            );

            return response.data;
        } catch (err: any) {
            lastError = err;
            const status = err.response?.status;
            const errorMsg = err.response?.data?.error?.message || err.message;
            
            console.warn(`[OpenRouterClient] Stream Failed for ${model} | Status: ${status || 'ERR'} | Msg: ${errorMsg}`);
            
            // On any error, try the next model in the chain
            continue; 
        }
    }

    throw lastError || new Error('STREAM_INIT_FAILED');
  }
}
