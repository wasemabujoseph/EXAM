import React, { useState, useEffect } from 'react';
import { 
  Play, 
  FileJson, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2,
  PlusCircle,
  ShieldCheck,
  Code,
  Calendar,
  Layers,
  Activity
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { api } from '../../lib/api';

interface InternalExamMaterialViewerProps {
  material: any;
  onStartExam: () => void;
  onUpdateMetadata: (updates: any) => void;
}

const InternalExamMaterialViewer: React.FC<InternalExamMaterialViewerProps> = ({ 
  material, 
  onStartExam,
  onUpdateMetadata
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  
  const [jsonContent, setJsonContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.getMaterialContent(material.id);
        setJsonContent(response.content);
        try {
          const data = JSON.parse(response.content);
          setQuestionCount(Array.isArray(data.questions) ? data.questions.length : 0);
        } catch (e) {}
        setIsLoading(false);
      } catch (err: any) {
        setError('Failed to load exam content: ' + err.message);
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [material.id]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setError(null);
    try {
      // Validate JSON
      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (e: any) {
        throw new Error('Invalid JSON format: ' + e.message);
      }

      await api.updateMaterialContent(material.id, jsonContent);
      const newCount = Array.isArray(parsed.questions) ? parsed.questions.length : 0;
      setQuestionCount(newCount);
      setIsEditing(false);
      onUpdateMetadata({ examQuestionCount: newCount });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setError('Cannot format invalid JSON: ' + e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="exam-material-state-shell">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p>Analyzing practice exam structure...</p>
      </div>
    );
  }

  return (
    <div className="internal-exam-material-viewer-pro theme-aware">
      <div className="exam-preview-hero-card">
        <div className="hero-branding">
          <div className="branding-icon-shell">
            <Activity size={32} className="text-primary" />
            <div className="q-badge-pro">{questionCount} Q</div>
          </div>
          <div className="branding-text">
            <h3>Practice Material</h3>
            <p>Validated Medical Resource</p>
          </div>
        </div>

        <div className="exam-title-section">
          <h2>{material.title}</h2>
          <p className="exam-desc-pro">{material.description || 'Interactive medical practice examination designed for targeted learning and knowledge reinforcement.'}</p>
        </div>
        
        <div className="exam-info-grid-pro">
          <div className="info-item-pro">
            <div className="item-icon-pro"><Layers size={16} /></div>
            <div className="item-content-pro">
              <span>Subject Area</span>
              <strong>{material.subject || 'General Medicine'}</strong>
            </div>
          </div>
          <div className="info-item-pro">
            <div className="item-icon-pro"><Calendar size={16} /></div>
            <div className="item-content-pro">
              <span>Academic Year</span>
              <strong>{material.year || 'V Year'}</strong>
            </div>
          </div>
          <div className="info-item-pro">
            <div className="item-icon-pro"><ShieldCheck size={16} /></div>
            <div className="item-content-pro">
              <span>Verification</span>
              <div className="v-status">
                <CheckCircle2 size={12} className="text-success" />
                <strong>System Certified</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="exam-actions-pro">
          <button onClick={onStartExam} className="btn-launch-exam">
            <Play size={22} fill="currentColor" />
            <span>Launch Practice Session</span>
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`btn-edit-schema ${isEditing ? 'active' : ''}`}
            >
              <Code size={18} />
              <span>{isEditing ? 'Close Schema Editor' : 'Edit Exam JSON'}</span>
            </button>
          )}
        </div>

        {error && (
          <div className="error-box-pro">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {isEditing && isAdmin && (
        <div className="json-editor-drawer animate-slide-up">
          <div className="drawer-header">
            <div className="header-meta">
              <Code size={18} />
              <h4>SCHEMA DEFINITION</h4>
            </div>
            <div className="header-controls">
              <button onClick={formatJson} className="d-btn">Format</button>
              <button onClick={() => setIsEditing(false)} className="d-btn">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="d-save">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Update Schema</span>
              </button>
            </div>
          </div>
          <div className="drawer-body">
            <textarea 
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="editor-textarea"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      <style>{`
        .internal-exam-material-viewer-pro {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--bg-soft);
          overflow-y: auto;
        }

        .exam-preview-hero-card {
          max-width: 700px;
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 3.5rem;
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
        }

        .hero-branding { display: flex; align-items: center; gap: 1.25rem; }
        .branding-icon-shell {
          width: 64px;
          height: 64px;
          background: var(--primary-soft);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: 1px solid var(--primary-soft);
        }
        .q-badge-pro {
          position: absolute;
          top: -8px;
          right: -12px;
          background: var(--primary);
          color: white;
          font-size: 0.7rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 99px;
          border: 3px solid var(--surface);
          box-shadow: var(--shadow-sm);
        }
        .branding-text h3 { font-size: 0.75rem; color: var(--primary); text-transform: uppercase; margin-bottom: 2px; }
        .branding-text p { font-size: 0.85rem; color: var(--text-soft); font-weight: 700; }

        .exam-title-section { text-align: left; }
        .exam-title-section h2 { font-size: 1.75rem; font-weight: 900; margin-bottom: 0.75rem; color: var(--text-strong); }
        .exam-desc-pro { color: var(--text-muted); line-height: 1.6; font-size: 1rem; font-weight: 500; }

        .exam-info-grid-pro {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .info-item-pro {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem;
          background: var(--bg-soft-fade);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }
        .item-icon-pro { color: var(--primary); opacity: 0.6; }
        .item-content-pro { display: flex; flex-direction: column; }
        .item-content-pro span { font-size: 0.6rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }
        .item-content-pro strong { font-size: 0.85rem; color: var(--text-strong); }
        .v-status { display: flex; align-items: center; gap: 4px; }

        .exam-actions-pro { display: flex; flex-direction: column; gap: 1rem; }
        .btn-launch-exam {
          height: 64px;
          background: var(--primary);
          color: white;
          border-radius: var(--radius-xl);
          font-weight: 900;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-premium);
        }
        .btn-launch-exam:hover { transform: translateY(-4px); filter: brightness(1.1); }

        .btn-edit-schema {
          height: 52px;
          background: var(--surface-muted);
          color: var(--text-muted);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
        }
        .btn-edit-schema.active { background: var(--bg-soft); color: var(--primary); border-color: var(--primary); }

        .error-box-pro {
          padding: 1rem;
          background: var(--danger-soft);
          color: var(--danger);
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 700;
          display: flex; align-items: center; gap: 0.5rem;
        }

        .json-editor-drawer {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 80vh;
          background: #0f172a;
          border-top: 2px solid var(--primary);
          z-index: 3000;
          display: flex; flex-direction: column;
          box-shadow: 0 -20px 50px rgba(0,0,0,0.5);
        }
        .drawer-header {
          padding: 1.25rem 2.5rem;
          display: flex; align-items: center; justify-content: space-between;
          background: #1e293b;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .header-meta { display: flex; align-items: center; gap: 0.75rem; color: var(--primary); font-weight: 900; font-size: 0.7rem; }
        .header-controls { display: flex; gap: 1rem; }
        .d-btn { height: 36px; padding: 0 1rem; border-radius: 8px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: 800; }
        .d-save { height: 36px; padding: 0 1.25rem; border-radius: 8px; background: var(--primary); color: white; font-size: 0.8rem; font-weight: 900; display: flex; align-items: center; gap: 0.5rem; }

        .drawer-body { flex: 1; padding: 1.5rem; }
        .editor-textarea {
          width: 100%; height: 100%; background: transparent; border: none; outline: none;
          color: #cbd5e1; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; resize: none;
        }

        .exam-material-state-shell { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; color: var(--text-soft); }

        @media (max-width: 768px) {
          .exam-preview-hero-card { padding: 2rem; border-radius: 0; border: none; height: 100%; max-width: none; }
          .exam-info-grid-pro { grid-template-columns: 1fr; }
          .exam-actions-pro { margin-top: auto; }
        }
      `}</style>
    </div>
  );
};

export default InternalExamMaterialViewer;
