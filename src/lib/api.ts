/**
 * API Client for Google Apps Script Backend
 */

const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(action: string, payload: any = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('API URL not configured. Please set VITE_APPS_SCRIPT_API_URL in your .env file.');
  }

  const token = localStorage.getItem('exam_session_token');

  const response = await fetch(API_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // GAS requires this for POST sometimes to avoid preflight issues
    },
    body: JSON.stringify({
      action,
      payload,
      token,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
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
