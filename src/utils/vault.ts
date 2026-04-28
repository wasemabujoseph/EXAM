import { encryptData, decryptData } from './crypto';
import { Subject } from '../data/curriculum';

export interface UserProfile {
  name: string;
  email: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  total: number;
  percent: number;
  timeMs: number;
  date: string;
  answers: Record<number, string[]>;
  questionsSnapshot: any[];
}

export interface UserVault {
  profile: UserProfile;
  myExams: any[];
  attempts: ExamAttempt[];
  settings: Record<string, any>;
}

const USERS_KEY = 'exam_users_index';
const VAULT_PREFIX = 'exam_vault_';

export function getUsersIndex(): { email: string; salt: string; iv: string }[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUserIndex(email: string, salt: string, iv: string) {
  const index = getUsersIndex();
  const existing = index.findIndex(u => u.email === email);
  if (existing >= 0) {
    index[existing] = { email, salt, iv };
  } else {
    index.push({ email, salt, iv });
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(index));
}

export async function createAccount(profile: UserProfile, password: string): Promise<UserVault> {
  const initialVault: UserVault = {
    profile,
    myExams: [],
    attempts: [],
    settings: {}
  };
  
  const encrypted = await encryptData(initialVault, password);
  saveUserIndex(profile.email, encrypted.salt, encrypted.iv);
  localStorage.setItem(VAULT_PREFIX + profile.email, encrypted.ciphertext);
  
  return initialVault;
}

export async function loginUser(email: string, password: string): Promise<UserVault> {
  const index = getUsersIndex();
  const user = index.find(u => u.email === email);
  if (!user) throw new Error('User not found.');
  
  const ciphertext = localStorage.getItem(VAULT_PREFIX + email);
  if (!ciphertext) throw new Error('Vault data missing.');
  
  const vault = await decryptData(ciphertext, user.salt, user.iv, password);
  return vault;
}

export async function saveVault(email: string, password: string, vault: UserVault) {
  const encrypted = await encryptData(vault, password);
  saveUserIndex(email, encrypted.salt, encrypted.iv);
  localStorage.setItem(VAULT_PREFIX + email, encrypted.ciphertext);
}

export function deleteAccount(email: string) {
  const index = getUsersIndex().filter(u => u.email !== email);
  localStorage.setItem(USERS_KEY, JSON.stringify(index));
  localStorage.removeItem(VAULT_PREFIX + email);
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('currentUserEmail');
  localStorage.removeItem('currentSessionPassword'); // We store this in session storage for the session
}

export function resetAllData() {
  const index = getUsersIndex();
  index.forEach(u => localStorage.removeItem(VAULT_PREFIX + u.email));
  localStorage.removeItem(USERS_KEY);
  localStorage.clear();
  sessionStorage.clear();
}
