import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  plan: string;
  trial_limit: number;
  attempt_count: number;
}

interface VaultContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

// Storage Keys
const KEYS = {
  TOKEN: 'exam_cloud_token',
  USER: 'exam_cloud_user',
  THEME: 'exam_theme'
};

import { safeStorage } from '../utils/safeStorage';

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Initial Check & Cleanup
  useEffect(() => {
    const init = async () => {
      try {
        // Test storage accessibility
        const testKey = '__storage_test__';
        safeStorage.setItem(testKey, 'test');
        if (safeStorage.getItem(testKey) !== 'test') {
          throw new Error('Local storage is not persisting data. Please check your browser settings.');
        }
        safeStorage.removeItem(testKey);

        // Cleanup Legacy Data
        const legacyKeys = [
          'exam_session_token', 
          'isLoggedIn', 
          'currentUserEmail', 
          'exam_users', 
          'exam_vault_index',
          'session_key',
          'exam_vault_currentUser',
          'exam_vault_password',
          'exam_users_index'
        ];
        legacyKeys.forEach(k => safeStorage.removeItem(k));
        
        // Remove any keys starting with exam_vault_
        try {
          const len = safeStorage.length();
          for (let i = 0; i < len; i++) {
            const key = safeStorage.key(i);
            if (key && key.startsWith('exam_vault_')) {
              safeStorage.removeItem(key);
              // Note: removeItem can shift indices, but safeStorage.key(i) handles basic errors.
              // For a full purge of prefix, it's safer to gather keys first.
            }
          }
          
          // Second pass with key gathering to be thorough
          const keysToClear = [];
          for(let i=0; i<safeStorage.length(); i++) {
            const k = safeStorage.key(i);
            if(k && (k.startsWith('exam_vault_') || k.startsWith('exam_users'))) keysToClear.push(k);
          }
          keysToClear.forEach(k => safeStorage.removeItem(k));
        } catch (e) {
          console.warn('Legacy cleanup failed partially:', e);
        }

        // Diagnostic health check
        api.health().then(status => {
          console.log('🩺 Backend Health Check:', status);
        }).catch(err => {
          console.error('🩺 Backend Health Check Failed:', err.message);
        });

        const token = safeStorage.getItem(KEYS.TOKEN);
        const storedUser = safeStorage.getItem(KEYS.USER);
        
        if (token && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            // Verify session with backend
            const userData = await api.getMe();
            setUser(userData);
            safeStorage.setItem(KEYS.USER, JSON.stringify(userData));
          } catch (e) {
            console.warn('Session expired or invalid user data');
            logout();
          }
        }
      } catch (error: any) {
        console.error('Initialization error:', error);
        if (error.message.includes('storage') || error.message.includes('insecure')) {
          setStorageError(error.message);
        } else {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async (username: string, pass: string) => {
    const response = await api.login({ username, password: pass });
    safeStorage.setItem(KEYS.TOKEN, response.token);
    safeStorage.setItem(KEYS.USER, JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const response = await api.register({ username: name, email, password: pass });
    safeStorage.setItem(KEYS.TOKEN, response.token);
    safeStorage.setItem(KEYS.USER, JSON.stringify(response.user));
    setUser(response.user);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const userData = await api.getMe();
      setUser(userData);
      safeStorage.setItem(KEYS.USER, JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const logout = () => {
    api.logout().catch(() => {}); // Fire and forget
    safeStorage.removeItem(KEYS.TOKEN);
    safeStorage.removeItem(KEYS.USER);
    setUser(null);
  };

  if (storageError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#fef2f2', color: '#991b1b', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Storage Error</h2>
        <p>{storageError}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#991b1b', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <VaultContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout,
      refreshUser
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
