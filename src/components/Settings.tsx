import React from 'react';
import { useVault } from '../context/VaultContext';
import ThemeToggle from './ThemeToggle';
import { 
  Trash2, 
  Shield, 
  Lock,
  Cloud,
  CheckCircle,
  Database,
  Moon,
  LogOut
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useVault();

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out? Your cloud data will remain safe.')) {
      logout();
    }
  };

  return (
    <div className="settings-page animate-fade-in">
      <header className="page-header-alt">
        <div className="header-info">
          <h1>Settings & Account</h1>
          <p>Personalize your experience and manage your academic profile.</p>
        </div>
      </header>

      <div className="settings-layout-grid">
        {/* Appearance Section */}
        <section className="settings-block">
          <div className="block-header">
            <Moon size={20} />
            <h2>Appearance</h2>
          </div>
          <div className="block-content">
            <div className="theme-setting-row">
              <div className="theme-text">
                <strong>Color Theme</strong>
                <p>Choose between light, dark, or system preference.</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="settings-block">
          <div className="block-header">
            <Shield size={20} />
            <h2>Privacy & Security</h2>
          </div>
          <div className="block-content security-stack">
            <div className="sec-item">
              <Cloud size={18} />
              <div className="sec-text">
                <strong>Encrypted Cloud Sync</strong>
                <p>Your data is stored in the MEDEXAM Cloud, secured via private Google Apps Script infrastructure.</p>
              </div>
            </div>
            <div className="sec-item">
              <Lock size={18} />
              <div className="sec-text">
                <strong>Secure Authentication</strong>
                <p>Sessions are tokenized. We never store plain-text passwords in the browser.</p>
              </div>
            </div>
            <div className="sec-item">
               <CheckCircle size={18} />
               <div className="sec-text">
                 <strong>GDPR & Data Ownership</strong>
                 <p>You have full ownership of your data stored in your personal cloud sheet.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Account Info Section */}
        <section className="settings-block">
          <div className="block-header">
            <Database size={20} />
            <h2>Account Details</h2>
          </div>
          <div className="block-content info-table">
            <div className="info-entry">
              <span>Account Role</span>
              <strong>{user?.role?.toUpperCase() || 'STUDENT'}</strong>
            </div>
            <div className="info-entry">
              <span>Username</span>
              <strong>{user?.username}</strong>
            </div>
            <div className="info-entry">
              <span>Platform Version</span>
              <strong>v3.5.0-stable</strong>
            </div>
            <div className="info-entry">
              <span>Cloud Status</span>
              <strong className="text-success">Connected</strong>
            </div>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="settings-block danger-block">
          <div className="block-header">
            <Trash2 size={20} />
            <h2>Account Actions</h2>
          </div>
          <div className="block-content">
            <p className="danger-note">Sign out of your account and clear all local cache. Your cloud exams will not be affected.</p>
            <button className="btn-logout-settings" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Sign Out from Device</span>
            </button>
          </div>
        </section>
      </div>

      <style>{`
        .settings-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .settings-layout-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;
        }

        .settings-block {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm);
          display: flex; flex-direction: column;
        }

        .block-header {
          padding: 1.5rem 2rem; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 1rem; color: var(--primary);
        }
        .block-header h2 { font-size: 1.2rem; color: var(--text-strong); }

        .block-content { padding: 2rem; }

        .theme-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
        .theme-text strong { display: block; font-size: 1rem; color: var(--text-strong); margin-bottom: 0.25rem; }
        .theme-text p { font-size: 0.85rem; color: var(--text-muted); }

        .security-stack { display: flex; flex-direction: column; gap: 1.5rem; }
        .sec-item { display: flex; gap: 1rem; color: var(--text-soft); }
        .sec-text strong { display: block; font-size: 0.95rem; color: var(--text-strong); margin-bottom: 0.25rem; }
        .sec-text p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }

        .info-table { display: flex; flex-direction: column; gap: 1rem; }
        .info-entry { display: flex; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-soft); font-size: 0.9rem; }
        .info-entry span { color: var(--text-muted); font-weight: 600; }
        .info-entry strong { color: var(--text-strong); font-weight: 700; }

        .danger-block { border-color: var(--danger-soft); }
        .danger-block .block-header { color: var(--danger); }
        .danger-note { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; font-weight: 500; }
        
        .btn-logout-settings {
          width: 100%; height: 48px; border-radius: var(--radius-lg);
          background: var(--danger-soft); color: var(--danger);
          font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          transition: all 0.2s;
        }
        .btn-logout-settings:hover { background: var(--danger); color: white; }

        @media (max-width: 1024px) {
          .settings-layout-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .block-content { padding: 1.5rem; }
          .theme-setting-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default Settings;
