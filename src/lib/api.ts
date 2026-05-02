/**
 * API Client for Google Apps Script Backend
 */

const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL?.trim();

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

import { safeStorage } from '../utils/safeStorage';

async function request<T>(action: string, payload: any = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('Backend URL not configured. Please check your .env file.');
  }

  const token = safeStorage.getItem('exam_cloud_token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    console.log(`📡 Sending [${action}] to:`, API_URL);
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

    console.log(`📥 [${action}] Response Status:`, response.status);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server status ${response.status}. Ensure Apps Script is deployed as "Anyone".`);
    }

    const text = await response.text();
    console.log(`📥 Raw Response Body:`, text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    let result: ApiResponse<T>;
    
    try {
      console.log('📡 Parsing JSON from:', API_URL);
      result = JSON.parse(text);
    } catch (e) {
      console.error('❌ Malformed API response:', text);
      const isHtml = text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html');
      if (isHtml) {
        throw new Error('Backend returned HTML instead of JSON. This usually means the Apps Script deployment URL is wrong or the script has a syntax error.');
      }
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

  // Admin Actions
  adminGetStats: () => request<any>('adminGetStats'),
  adminGetUsers: () => request<any[]>('adminGetUsers'),
  adminUpdateUser: (userId: string, updates: any) => request<any>('adminUpdateUser', { userId, updates }),
  adminGetAllExams: () => request<any[]>('adminGetAllExams'),
  adminGetAllAttempts: () => request<any[]>('adminGetAllAttempts'),
};

export const isApiConfigured = !!API_URL;
