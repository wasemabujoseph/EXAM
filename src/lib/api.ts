/**
 * API Client for Google Apps Script Backend
 */

const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL;

if (!API_URL) {
  console.warn('⚠️ VITE_APPS_SCRIPT_API_URL is not defined. Cloud features are disabled.');
} else {
  console.log('✅ API Client Initialized with URL:', API_URL);
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function request<T>(action: string, payload: any = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('Backend URL not configured. Please check your .env file.');
  }

  const token = localStorage.getItem('exam_session_token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  console.log(`🚀 API [${action}] Request:`, { hasToken: !!token });

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
      throw new Error(`Server status ${response.status}. Ensure Apps Script is deployed as "Anyone".`);
    }

    const text = await response.text();
    let result: ApiResponse<T>;
    
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('❌ Malformed API response:', text);
      throw new Error('Malformed backend response. Check Apps Script deployment and permissions.');
    }

    console.log(`✅ API [${action}] Response:`, result);

    if (result.ok === false) {
      throw new Error(result.error || 'Backend returned an unsuccessful status without an error message.');
    }

    if (result.ok === true) {
      return result.data as T;
    }

    throw new Error('Invalid response structure from backend. Missing "ok" field.');
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`🕒 API [${action}] Timeout`);
      throw new Error('Backend request timed out. Please try again.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      console.error(`📡 API [${action}] Network Error`);
      throw new Error('Could not connect to backend. Check Apps Script URL and deployment permissions.');
    }

    console.error(`❌ API [${action}] Error:`, error.message);
    throw error;
  }
}

export const api = {
  // Diagnostics
  health: () => request<any>('health'),

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
