
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to get item ${key}:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to set item ${key}:`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove item ${key}:`, e);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('[SafeStorage] Failed to clear storage:', e);
    }
  },
  length: (): number => {
    try {
      return localStorage.length;
    } catch (e) {
      return 0;
    }
  },
  key: (index: number): string | null => {
    try {
      return localStorage.key(index);
    } catch (e) {
      return null;
    }
  }
};
