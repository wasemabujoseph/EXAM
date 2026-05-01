import React, { useRef } from 'react';
import { useVault } from '../context/VaultContext';
import { resetAllData } from '../utils/vault';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  AlertTriangle,
  Info,
  Lock,
  FileJson
} from 'lucide-react';

const Settings: React.FC = () => {
  const { vault, updateVault } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    if (!vault) return;
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedVault = JSON.parse(event.target?.result as string);
        if (importedVault.profile && importedVault.myExams && importedVault.attempts) {
          if (confirm('Importing this backup will overwrite your current local data. Continue?')) {
            await updateVault(importedVault);
            alert('Backup imported successfully!');
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('CRITICAL: This will delete ALL encrypted local data, including your account and history. This cannot be undone. Are you sure?')) {
      resetAllData();
      window.location.href = '/';
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Settings & Security</h1>
        <p className="page-subtitle">Manage your encrypted vault and local data</p>
      </header>

      <div className="settings-grid">
        <section className="settings-section card">
          <div className="section-head">
            <Shield size={20} />
            <h2>Security Model</h2>
          </div>
          <div className="security-info-box">
            <div className="info-item">
              <Lock size={18} />
              <div>
                <strong>Local Encryption (AES-GCM)</strong>
                <p>Your data is encrypted in your browser using a key derived from your password (PBKDF2). We never see or store your password.</p>
              </div>
            </div>
            <div className="info-item">
              <Shield size={18} />
              <div>
                <strong>Static Hosting (GitHub Pages)</strong>
                <p>This app runs entirely in your browser. No data is sent to a server. Your exams and results stay on your device.</p>
              </div>
            </div>
            <div className="info-item warning">
              <AlertTriangle size={18} />
              <div>
                <strong>No Password Recovery</strong>
                <p>Because encryption happens locally, we cannot reset your password. If you forget it, you must reset your local vault and lose your data.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section card">
          <div className="section-head">
            <FileJson size={20} />
            <h2>Backup & Portability</h2>
          </div>
          <p className="section-desc">Export your encrypted data to move it to another browser or device.</p>
          <div className="action-buttons">
            <button className="settings-btn" onClick={handleExportBackup}>
              <Download size={18} />
              Export Encrypted Backup
            </button>
            <button className="settings-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              Import Encrypted Backup
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleImportBackup}
            />
          </div>
          <div className="hint-box">
            <Info size={16} />
            <span>The backup file contains your profile, exams, and history in plain JSON. Keep it safe!</span>
          </div>
        </section>

        <section className="settings-section card">
          <div className="section-head">
            <Upload size={20} />
            <h2>GitHub Integration</h2>
          </div>
          <p className="section-desc">Configure your private GitHub repository for encrypted cloud backups.</p>
          <div className="form-group">
            <label>GitHub Token (PAT)</label>
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxx"
              value={vault?.githubSettings?.token || ''}
              onChange={(e) => {
                if (!vault) return;
                updateVault({
                  ...vault,
                  githubSettings: { ...(vault.githubSettings || {}), token: e.target.value }
                });
              }}
              className="settings-input"
            />
          </div>
          <div className="form-group">
            <label>Repository (user/repo)</label>
            <input 
              type="text" 
              placeholder="wasemabujoseph/EXAM-Vault"
              value={vault?.githubSettings?.repo || ''}
              onChange={(e) => {
                if (!vault) return;
                updateVault({
                  ...vault,
                  githubSettings: { ...(vault.githubSettings || {}), repo: e.target.value }
                });
              }}
              className="settings-input"
            />
          </div>
          <div className="hint-box">
            <Info size={16} />
            <span>Tokens are stored only in your encrypted local vault.</span>
          </div>
        </section>

        <section className="settings-section card danger-zone">
          <div className="section-head">
            <Trash2 size={20} />
            <h2>Danger Zone</h2>
          </div>
          <p className="section-desc">Permanently delete all data from this browser.</p>
          <button className="reset-btn" onClick={handleReset}>
            <Trash2 size={18} />
            Reset Local Vault & Account
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
        .info-item.warning { color: #92400e; }
        .info-item.warning strong { color: #b45309; }
        .info-item.warning p { color: #92400e; }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .settings-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }
        .settings-btn:hover { background: #f8fafc; border-color: var(--primary); color: var(--primary); }

        .hint-box {
          background: #f1f5f9;
          padding: 0.75rem;
          border-radius: 0.5rem;
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #64748b;
          align-items: center;
        }

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
