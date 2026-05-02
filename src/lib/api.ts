/**
 * API Client for Google Apps Script Backend
 */

const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL;

if (!API_URL) {
  console.warn('⚠️ VITE_APPS_SCRIPT_API_URL is not defined in the environment variables.');
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function request<T>(action: string, payload: any = {}): Promise<T> {
  if (!API_URL) {
    console.error('❌ API Request Failed: URL not configured.');
    throw new Error('Backend URL not configured. Please check your .env file or deployment settings.');
  }

  const token = localStorage.getItem('exam_session_token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  console.log(`🚀 API Request: ${action}`, { hasToken: !!token });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        payload,
        token,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}. Please check your Apps Script deployment.`);
    }

    const text = await response.text();
    let result: ApiResponse<T>;
    
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse API response:', text);
      throw new Error('Invalid response from backend. Ensure your Apps Script is deployed as "Anyone".');
    }

    console.log(`✅ API Response: ${action}`, result);

    if (!result.ok) {
      throw new Error(result.error || 'Unknown backend error');
    }

    return result.data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`❌ API Error: ${action}`, error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Backend request timed out. Please try again.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to backend. Check Apps Script URL and deployment permissions.');
    }
    
    throw error;
  }
}

export const api = {
  // Auth
  register: (data: any) => request<any>('register', data),
  login: (data: any) => request<any>('login', data),
  logout: () => request<any>('logout'),
  getMe: () => request<any>('getMe'),

  // Exams
  saveExam: (data: any) => request<any>('saveExam', data),
  getMyExams: () => request<any[]>('getMyExams'),
  getPublicExams: () => request<any[]>('getPublicExams'),
  getExamById: (id: string) => request<any>('getExamById', { id }),
  deleteExam: (id: string) => request<any>('deleteExam', { id }),

  // Attempts
  saveAttempt: (data: any) => request<any>('saveAttempt', data),
  getMyAttempts: () => request<any[]>('getMyAttempts'),
  getAttemptReview: (id: string) => request<any>('getAttemptReview', { id }),
  getLeaderboard: (examId?: string) => request<any[]>('getLeaderboard', { examId }),
};

export const isApiConfigured = !!API_URL;
