import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-toggle-group">
      <button 
        onClick={() => setTheme('light')} 
        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
        aria-label="Light Mode"
        title="Light Mode"
      >
        <Sun size={18} />
      </button>
      <button 
        onClick={() => setTheme('dark')} 
        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
        aria-label="Dark Mode"
        title="Dark Mode"
      >
        <Moon size={18} />
      </button>
      <button 
        onClick={() => setTheme('system')} 
        className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
        aria-label="System Preference"
        title="System Preference"
      >
        <Laptop size={18} />
      </button>

      <style>{`
        .theme-toggle-group {
          display: flex;
          background: var(--bg-soft);
          padding: 4px;
          border-radius: var(--radius-lg);
          gap: 2px;
          border: 1px solid var(--border);
        }
        .theme-btn {
          width: 36px;
          height: 36px;
          min-height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .theme-btn:hover {
          color: var(--primary);
          background: var(--surface);
        }
        .theme-btn.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
};

export default ThemeToggle;
