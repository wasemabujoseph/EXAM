/**
 * API Client for MEDEXAM Core Cloud Backend
 */

const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL?.trim();

if (!API_URL) {
  console.warn('⚠️ VITE_APPS_SCRIPT_API_URL is not defined. MEDEXAM Core features are disabled.');
} else {
  console.log('✅ API Client Initialized with URL:', API_URL);
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

import { safeStorage } from '../utils/safeStorage';

async function request<T>(action: string, payload: any = {}, timeoutMs: number = 15000): Promise<T> {
  if (!API_URL) {
    throw new Error('Apps Script API URL is not configured.');
  }

  const token = safeStorage.getItem('exam_cloud_token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {

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
      throw new Error(`Cloud connection failed (${response.status}). Service might be under maintenance.`);
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
        throw new Error('Backend infrastructure error. The cloud gateway returned an unexpected response format.');
      }
      throw new Error('Cloud response integrity check failed. Please refresh and try again.');
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
      throw new Error('Could not establish connection to MEDEXAM Cloud. Please check your network connectivity.');
    }

    console.error(`❌ API [${action}] Error:`, error.message);
    throw error;
  }
}

export const api = {
  // Diagnostics
  health: () => request<any>('health'),
  getServerCapabilities: () => request<any>('serverCapabilities'),
  materialsHealth: () => request<any>('materialsHealth'),
  
  // Auth
  register: (payload: any) => request<any>('register', payload),
  login: (payload: any) => request<any>('login', payload),
  logout: () => request<any>('logout'),
  getMe: () => request<any>('getMe'),

  // Exams
  saveExam: (payload: any) => request<any>('saveExam', payload),
  getMyExams: () => request<any[]>('getMyExams'),
  getPublicExams: () => request<any[]>('getPublicExams'),
  getExamById: (id: string) => request<any>('getExamById', { id }),
  deleteExam: (id: string) => request<any>('deleteExam', { id }),

  // Attempts
  saveAttempt: (payload: any) => request<any>('saveAttempt', payload),
  getMyAttempts: () => request<any[]>('getMyAttempts'),
  getAttemptReview: (id: string) => request<any>('getAttemptReview', { id }),
  getLeaderboard: (examId?: string) => request<any[]>('getLeaderboard', { examId }),

  // Admin
  adminGetStats: () => request<any>('adminGetStats'),
  adminGetUsers: () => request<any[]>('adminGetUsers'),
  adminUpdateUser: (userId: string, updates: any) => request<any>('adminUpdateUser', { userId, updates }),
  adminGetAllExams: () => request<any[]>('adminGetAllExams'),
  adminGetAllAttempts: () => request<any[]>('adminGetAllAttempts'),
  adminUpdateExam: (id: string, updates: any) => request<any>('adminUpdateExam', { id, updates }),
  adminUpdateExamJson: (id: string, examData: any) => request<any>('adminUpdateExamJson', { id, examData }),

  // AI
  aiChat: (messages: any[], context?: any) => request<any>('aiChat', { messages, context }),
  aiExplain: (questionContext: any) => request<any>('aiExplain', { questionContext }),

  // Materials
  uploadMaterial: (payload: any) => request<any>('uploadMaterial', payload),
  listMaterials: (payload: any = {}) => request<any[]>('listMaterials', payload),
  getMaterialById: (id: string) => request<any>('getMaterialById', { id }),
  getMaterialFileData: (id: string) => request<any>('getMaterialFileData', { id }),
  getMaterialContent: (id: string) => request<any>('getMaterialContent', { id }),
  updateMaterialMetadata: (id: string, updates: any) => request<any>('updateMaterialMetadata', { id, updates }),
  deleteMaterial: (id: string) => request<any>('deleteMaterial', { id }),
  updateMaterialContent: (id: string, content: string) => request<any>('updateMaterialContent', { id, content }),
  replaceMaterialFile: (payload: any) => request<any>('replaceMaterialFile', payload),
  syncMaterialsFromDrive: () => request<any>('syncMaterialsFromDrive'),
  repairMaterialsMetadata: () => request<any>('repairMaterialsMetadata'),
  
  // Security
  logSecurityEvent: (payload: any) => request<any>('logSecurityEvent', payload),
  validateExamAccess: (payload: any = {}) => request<any>('validateExamAccess', payload)
};
