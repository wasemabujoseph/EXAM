import React from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Shield, 
  Lock,
  Cloud,
  CheckCircle,
  Database
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useVault();

  const handleReset = () => {
    if (confirm('Are you sure you want to sign out and clear local session data? This will not delete your data from the cloud.')) {
      logout();
      window.location.href = '/';
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Settings & Account</h1>
        <p className="page-subtitle">Manage your cloud connection and preferences</p>
      </header>

      <div className="settings-grid">
        <section className="settings-section card">
          <div className="section-head">
            <Shield size={20} />
            <h2>Security & Privacy</h2>
          </div>
          <div className="security-info-box">
            <div className="info-item">
              <Cloud size={18} />
              <div>
                <strong>Secure Cloud Backend</strong>
                <p>Your exams and attempts are stored securely in Google Sheets via a private Apps Script API. No personal exam content is stored in your browser's persistent storage.</p>
              </div>
            </div>
            <div className="info-item">
              <Lock size={18} />
              <div>
                <strong>Authenticated Sessions</strong>
                <p>We use secure tokens to communicate with your backend. Your password is never stored in plain text and is handled only during the login process.</p>
              </div>
            </div>
            <div className="info-item">
              <CheckCircle size={18} />
              <div>
                <strong>Data Ownership</strong>
                <p>You own your data. Since it resides in your personal Google Sheet, you have full control over your records at all times.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section card">
          <div className="section-head">
            <Database size={20} />
            <h2>System Information</h2>
          </div>
          <div className="system-info">
            <div className="info-row">
              <span>Account Type:</span>
              <strong>{user?.role?.toUpperCase() || 'USER'}</strong>
            </div>
            <div className="info-row">
              <span>Username:</span>
              <strong>{user?.username}</strong>
            </div>
            <div className="info-row">
              <span>Backend Type:</span>
              <strong>Google Apps Script (v3.1.0)</strong>
            </div>
            <div className="info-row">
              <span>Local Storage:</span>
              <strong>Session Only</strong>
            </div>
          </div>
        </section>

        <section className="settings-section card danger-zone">
          <div className="section-head">
            <Trash2 size={20} />
            <h2>Account Actions</h2>
          </div>
          <p className="section-desc">Sign out and clear all cached session data from this browser.</p>
          <button className="reset-btn" onClick={handleReset}>
            <Trash2 size={18} />
            Sign Out & Clear Session
          </button>
        </section>
      </div>

      <style>{`
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .settings-section {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .section-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin: 0;
        }
        .security-info-box {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .info-item {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
        }
        .info-item strong { display: block; color: var(--text-main); margin-bottom: 0.25rem; }
        .info-item p { margin: 0; color: #64748b; line-height: 1.5; }
        
        .system-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.9rem;
        }
        .info-row span { color: var(--text-muted); }
        .info-row strong { color: var(--text-main); }

        .danger-zone { border-color: #fee2e2; }
        .danger-zone h2 { color: var(--danger); }
        .reset-btn {
          background: #fef2f2;
          color: var(--danger);
          border: 1px solid #fee2e2;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reset-btn:hover { background: var(--danger); color: white; border-color: var(--danger); }

        @media (max-width: 1024px) {
          .settings-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Settings;
