import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserVault, loginUser, saveVault as saveToStorage, createAccount as registerToStorage } from '../utils/vault';

interface VaultContextType {
  vault: UserVault | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateVault: (newVault: UserVault) => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vault, setVault] = useState<UserVault | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to restore session from sessionStorage if password exists
    const sessionPassword = sessionStorage.getItem('session_key');
    const userEmail = localStorage.getItem('currentUserEmail');
    
    if (sessionPassword && userEmail) {
      loginUser(userEmail, sessionPassword)
        .then(v => {
          setVault(v);
          setPassword(sessionPassword);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const v = await loginUser(email, pass);
    setVault(v);
    setPassword(pass);
    sessionStorage.setItem('session_key', pass);
    localStorage.setItem('currentUserEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const register = async (name: string, email: string, pass: string) => {
    const v = await registerToStorage({ name, email }, pass);
    setVault(v);
    setPassword(pass);
    sessionStorage.setItem('session_key', pass);
    localStorage.setItem('currentUserEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setVault(null);
    setPassword(null);
    sessionStorage.removeItem('session_key');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUserEmail');
  };

  const updateVault = async (newVault: UserVault) => {
    if (!password || !vault) return;
    await saveToStorage(vault.profile.email, password, newVault);
    setVault(newVault);
  };

  return (
    <VaultContext.Provider value={{ vault, isLoading, login, register, logout, updateVault }}>
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
