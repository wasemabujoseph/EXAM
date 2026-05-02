import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserVault, loginUser, saveVault as saveToStorage, createAccount as registerToStorage } from '../utils/vault';
import { api, isApiConfigured } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface VaultContextType {
  vault: UserVault | null;
  user: User | null;
  isLoading: boolean;
  isApiMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateVault: (newVault: UserVault) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vault, setVault] = useState<UserVault | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        if (isApiConfigured) {
          // Perform diagnostic health check
          api.health().then(status => {
            console.log('🩺 Backend Health Check:', status);
          }).catch(err => {
            console.error('🩺 Backend Health Check Failed:', err.message);
          });

          const token = localStorage.getItem('exam_session_token');
          if (token) {
            const userData = await api.getMe();
            setUser(userData);
          }
        } else {
          // Local mode
          const sessionPassword = sessionStorage.getItem('session_key');
          const userEmail = localStorage.getItem('currentUserEmail');
          
          if (sessionPassword && userEmail) {
            const v = await loginUser(userEmail, sessionPassword);
            setVault(v);
            setPassword(sessionPassword);
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async (username: string, pass: string) => {
    if (isApiConfigured) {
      const response = await api.login({ username, password: pass });
      localStorage.setItem('exam_session_token', response.token);
      setUser(response.user);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      const v = await loginUser(username, pass);
      setVault(v);
      setPassword(pass);
      sessionStorage.setItem('session_key', pass);
      localStorage.setItem('currentUserEmail', username);
      localStorage.setItem('isLoggedIn', 'true');
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    if (isApiConfigured) {
      const response = await api.register({ username: name, email, password: pass });
      localStorage.setItem('exam_session_token', response.token);
      setUser(response.user);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      const v = await registerToStorage({ name, email }, pass);
      setVault(v);
      setPassword(pass);
      sessionStorage.setItem('session_key', pass);
      localStorage.setItem('currentUserEmail', email);
      localStorage.setItem('isLoggedIn', 'true');
    }
  };

  const logout = () => {
    if (isApiConfigured) {
      api.logout().catch(console.error);
      localStorage.removeItem('exam_session_token');
      setUser(null);
    }
    setVault(null);
    setPassword(null);
    sessionStorage.removeItem('session_key');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUserEmail');
  };

  const updateVault = async (newVault: UserVault) => {
    if (isApiConfigured) {
      // In API mode, we save exams/attempts via specific API calls
      // This updateVault might be less relevant or used for local settings
      setVault(newVault);
      return;
    }
    if (!password || !vault) return;
    await saveToStorage(vault.profile.email, password, newVault);
    setVault(newVault);
  };

  return (
    <VaultContext.Provider value={{ 
      vault, 
      user, 
      isLoading, 
      isApiMode: isApiConfigured,
      login, 
      register, 
      logout, 
      updateVault 
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
