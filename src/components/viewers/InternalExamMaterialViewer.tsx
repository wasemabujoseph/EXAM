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
  Code
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
      <div className="exam-material-state">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p>Loading exam structure...</p>
      </div>
    );
  }

  return (
    <div className="internal-exam-material-viewer">
      <div className="exam-preview-hero">
        <div className="hero-icon-box">
          <FileJson size={64} className="text-primary" />
          <div className="question-badge">{questionCount} Q</div>
        </div>
        
        <h2>{material.title}</h2>
        <p className="exam-description">{material.description || 'Interactive medical practice examination.'}</p>
        
        <div className="exam-meta-grid">
          <div className="meta-card">
            <span>Subject</span>
            <strong>{material.subject}</strong>
          </div>
          <div className="meta-card">
            <span>Academic Year</span>
            <strong>{material.year}</strong>
          </div>
          <div className="meta-card">
            <span>Status</span>
            <div className="status-indicator">
              <CheckCircle2 size={14} className="text-success" />
              <strong>Validated</strong>
            </div>
          </div>
        </div>

        <div className="action-row">
          <button onClick={onStartExam} className="start-exam-large">
            <Play size={20} fill="currentColor" />
            <span>Start Practice Exam</span>
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`edit-json-btn ${isEditing ? 'active' : ''}`}
            >
              <Code size={18} />
              <span>{isEditing ? 'Close Editor' : 'Edit JSON Content'}</span>
            </button>
          )}
        </div>

        {error && (
          <div className="exam-error-box animate-shake">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {isEditing && isAdmin && (
        <div className="json-editor-overlay animate-slide-up">
          <div className="editor-header">
            <div className="header-left">
              <Code size={18} />
              <h3>JSON Exam Content Editor</h3>
            </div>
            <div className="header-right">
              <button onClick={formatJson} className="editor-secondary-btn">Format JSON</button>
              <button onClick={() => setIsEditing(false)} className="editor-secondary-btn">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="editor-save-btn">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
          <div className="editor-body">
            <textarea 
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="json-textarea"
              spellCheck={false}
              placeholder='{"questions": [...] }'
            />
          </div>
          <div className="editor-footer">
            <ShieldCheck size={14} />
            <span>Changes are saved directly to the material storage.</span>
          </div>
        </div>
      )}

      <style>{`
        .internal-exam-material-viewer {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--bg);
          overflow-y: auto;
        }

        .exam-preview-hero {
          max-width: 600px;
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 2rem;
          padding: 3rem;
          text-align: center;
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .hero-icon-box { position: relative; margin-bottom: 0.5rem; }
        .question-badge {
          position: absolute;
          bottom: -5px;
          right: -10px;
          background: var(--primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 99px;
          border: 3px solid var(--surface);
        }

        .exam-preview-hero h2 { font-size: 1.75rem; font-weight: 900; color: var(--text-strong); }
        .exam-description { color: var(--text-muted); line-height: 1.5; font-weight: 500; }

        .exam-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          width: 100%;
          margin: 1rem 0;
        }

        .meta-card {
          padding: 1rem;
          background: var(--bg-soft-fade);
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .meta-card span { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .meta-card strong { font-size: 0.9rem; color: var(--text-strong); }
        .status-indicator { display: flex; align-items: center; justify-content: center; gap: 4px; }

        .action-row { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
        
        .start-exam-large {
          height: 60px;
          background: var(--primary);
          color: white;
          border-radius: 1rem;
          font-weight: 800;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }
        .start-exam-large:hover { transform: translateY(-3px); box-shadow: var(--shadow-premium); }

        .edit-json-btn {
          height: 52px;
          background: var(--bg-soft);
          color: var(--text-soft);
          border: 1px solid var(--border);
          border-radius: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }
        .edit-json-btn:hover { background: var(--border); color: var(--text-strong); }
        .edit-json-btn.active { background: #1e293b; color: #38bdf8; border-color: #38bdf8; }

        .exam-error-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--danger-soft);
          color: var(--danger);
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          width: 100%;
        }

        .json-editor-overlay {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70vh;
          background: #0f172a;
          border-top: 1px solid rgba(255,255,255,0.1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -20px 50px rgba(0,0,0,0.5);
        }

        .editor-header {
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
        }
        .header-left { display: flex; align-items: center; gap: 0.75rem; }
        .header-right { display: flex; gap: 0.75rem; }
        
        .editor-secondary-btn { 
          padding: 0 1rem; height: 36px; border-radius: 8px; 
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); 
          font-size: 0.8rem; font-weight: 700;
        }
        .editor-secondary-btn:hover { background: rgba(255,255,255,0.15); color: white; }
        
        .editor-save-btn {
          padding: 0 1.25rem; height: 36px; border-radius: 8px;
          background: #38bdf8; color: #0f172a;
          font-size: 0.85rem; font-weight: 800;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .editor-save-btn:hover { background: #7dd3fc; }
        .editor-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .editor-body { flex: 1; padding: 1rem; }
        .json-textarea {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          resize: none;
          outline: none;
        }

        .editor-footer { padding: 0.75rem 2rem; background: #1e293b; color: rgba(255,255,255,0.4); font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }

        .exam-material-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }

        @media (max-width: 640px) {
          .exam-preview-hero { padding: 1.5rem; }
          .exam-meta-grid { grid-template-columns: 1fr; }
          .json-editor-overlay { height: 90vh; }
          .editor-header { flex-direction: column; gap: 1rem; height: auto; }
        }
      `}</style>
    </div>
  );
};

export default InternalExamMaterialViewer;
