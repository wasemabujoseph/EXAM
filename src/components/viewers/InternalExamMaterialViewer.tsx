import React, { useState } from 'react';
import { 
  FileJson, 
  Play, 
  ShieldAlert,
  Info,
  Settings,
  Download,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface InternalExamMaterialViewerProps {
  fileData: {
    base64: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  };
  material: any;
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const InternalExamMaterialViewer: React.FC<InternalExamMaterialViewerProps> = ({ 
  fileData,
  material,
  adminActions
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  const [showDebug, setShowDebug] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // Parse exam data safely
  let examData = null;
  try {
    const jsonString = window.atob(fileData.base64);
    examData = JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to parse exam JSON');
  }

  return (
    <div className="internal-exam-viewer themed-viewer">
      <div className="viewer-toolbar-premium glass">
        <div className="toolbar-left">
          <div className="exam-status-badge">
            <FileJson size={18} className="text-primary" />
            <span>Interactive Exam Material</span>
          </div>
        </div>

        <div className="toolbar-right">
          {isAdmin && (
            <div className="admin-tools-wrapper">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={`toolbar-action-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}
                title="Admin Tools"
              >
                <Settings size={18} />
              </button>
              
              {showAdminMenu && (
                <div className="admin-dropdown-menu animate-pop-in">
                  <div className="menu-header">Admin Control Panel</div>
                  {adminActions?.onDownload && (
                    <button onClick={adminActions.onDownload} className="menu-item">
                      <Download size={16} /> <span>Download JSON</span>
                    </button>
                  )}
                  {adminActions?.onOpenDrive && (
                    <button onClick={adminActions.onOpenDrive} className="menu-item">
                      <ExternalLink size={16} /> <span>Open in Drive</span>
                    </button>
                  )}
                  <button onClick={() => setShowDebug(!showDebug)} className="menu-item">
                    <Info size={16} /> <span>Diagnostic Inspector</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <button className="toolbar-action-btn" title="Reload Material"><RefreshCw size={18} /></button>
        </div>
      </div>

      <div className="exam-workspace">
        <div className="exam-card-premium glass">
          <div className="exam-icon-large">
            <FileJson size={64} className="text-primary" />
          </div>
          
          <div className="exam-details-main">
            <h2>{material.title}</h2>
            <p className="exam-desc">{material.description || 'Practice exam material for medical students.'}</p>
            
            <div className="exam-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Questions</span>
                <span className="stat-value">{examData?.questions?.length || material.examQuestionCount || '--'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Subject</span>
                <span className="stat-value">{material.subject}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Year</span>
                <span className="stat-value">{material.year}</span>
              </div>
            </div>

            <div className="exam-actions-footer">
              <button className="btn-run-exam">
                <Play size={20} fill="currentColor" />
                <span>Start Practice Session</span>
              </button>
              <p className="exam-hint">Your progress will be saved in Attempt Logs.</p>
            </div>
          </div>
        </div>

        {showDebug && isAdmin && (
          <div className="admin-diagnostic-inspector glass animate-pop-in">
            <div className="inspector-header">
              <ShieldAlert size={16} />
              <span>Diagnostic Inspector (Admin)</span>
            </div>
            <div className="inspector-content">
              <div className="inspector-row"><span>Material ID</span> <strong>{material.id}</strong></div>
              <div className="inspector-row"><span>Source</span> <strong>Internal JSON</strong></div>
              <div className="inspector-row"><span>Parsed</span> <strong>{examData ? 'SUCCESS' : 'FAILED'}</strong></div>
            </div>
            <button className="inspector-close" onClick={() => setShowDebug(false)}>Close Inspector</button>
          </div>
        )}
      </div>

      <style>{`
        .themed-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: var(--bg-soft);
          position: relative;
          overflow: hidden;
        }

        .viewer-toolbar-premium {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          margin: 0.75rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          z-index: 100;
          box-shadow: var(--shadow-lg);
        }

        .exam-status-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-strong);
        }

        .toolbar-action-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
          background: transparent;
          min-height: auto;
        }

        .toolbar-action-btn:hover { background: var(--surface-elevated); color: var(--primary); }
        .toolbar-action-btn.active { background: var(--primary); color: white; }

        .admin-tools-wrapper { position: relative; }
        .admin-dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 240px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          padding: 8px;
          z-index: 200;
        }

        .menu-header { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-soft); padding: 8px 12px; font-weight: 800; }
        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: var(--text);
          text-align: left;
          background: transparent;
          min-height: auto;
        }
        .menu-item:hover { background: var(--bg-soft); color: var(--primary); }

        .exam-workspace {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .exam-card-premium {
          width: 100%;
          max-width: 500px;
          padding: 3rem;
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2rem;
        }

        .exam-icon-large {
          width: 120px;
          height: 120px;
          background: var(--primary-soft);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .exam-details-main h2 { font-size: 1.75rem; margin-bottom: 0.75rem; }
        .exam-desc { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2rem; }

        .exam-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          width: 100%;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: var(--surface-muted);
          padding: 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-soft); font-weight: 800; }
        .stat-value { font-size: 1.1rem; font-weight: 800; color: var(--text-strong); }

        .exam-actions-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .btn-run-exam {
          background: var(--primary);
          color: white;
          padding: 0.85rem 2.5rem;
          border-radius: var(--radius-xl);
          font-weight: 800;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 20px -5px var(--primary-glow);
        }

        .exam-hint { font-size: 0.75rem; color: var(--text-soft); }

        .admin-diagnostic-inspector {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          width: 300px;
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--primary-soft);
          z-index: 150;
        }
        .inspector-header { display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 800; font-size: 0.8rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .inspector-content { display: flex; flex-direction: column; gap: 0.5rem; }
        .inspector-row { display: flex; justify-content: space-between; font-size: 0.75rem; }
        .inspector-row span { color: var(--text-soft); }
        .inspector-row strong { color: var(--text-strong); }
        .inspector-close { width: 100%; margin-top: 1rem; background: var(--bg-soft); color: var(--text); font-size: 0.75rem; font-weight: 800; padding: 6px; border-radius: var(--radius-md); }

        @media (max-width: 600px) {
          .exam-card-premium { padding: 2rem; }
          .exam-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default InternalExamMaterialViewer;
