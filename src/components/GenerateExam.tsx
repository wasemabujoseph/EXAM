import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { parsePlainText } from '../utils/parser';
import { 
  FileText, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Layers,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

const GenerateExam: React.FC = () => {
  const navigate = useNavigate();
  
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (inputText.trim()) {
      try {
        const parsed = parsePlainText(inputText);
        setQuestions(parsed);
        if (parsed.length > 0) {
          setError('');
        } else {
          setError('No questions detected. Check your format.');
        }
      } catch (err) {
        setError('Failed to parse text.');
      }
    } else {
      setQuestions([]);
      setError('');
    }
  }, [inputText]);

  const handleSave = async () => {
    if (questions.length === 0) return;
    
    setIsUploading(true);
    setError('');

    const examData = {
      title: title || 'Untitled Exam',
      questions: questions.map((q, i) => ({
        ...q,
        id: `q-${i + 1}`,
        answers: normalizeAnswers(q.answerRaw, q.options)
      }))
    };

    try {
      await api.saveExam({
        title: examData.title,
        description: 'Pasted MCQ Exam',
        grade: 'Other',
        subject: 'General',
        examData: examData,
        isPublic
      });
      setSuccess('Exam saved to Cloud successfully!');
      
      setInputText('');
      setTitle('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save exam.');
    } finally {
      setIsUploading(false);
    }
  };

  const normalizeAnswers = (raw: string, options: any[]) => {
    const out: string[] = [];
    const upper = raw.toUpperCase();
    options.forEach(opt => {
      if (upper.includes(opt.id.toUpperCase())) {
        out.push(opt.id);
      }
    });
    return out;
  };

  return (
    <div className="generate-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Generate Exam</h1>
        <p className="page-subtitle">Paste your MCQs to create a cloud exam</p>
      </header>

      <div className="generate-grid">
        <div className="input-section card">
          <div className="section-head">
            <FileText size={20} />
            <h2>Paste MCQs</h2>
          </div>
          <div className="form-group">
            <label>Exam Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Anatomy Midterm 2024"
              className="title-input"
            />
          </div>
          <div className="form-group">
            <label>MCQ Text Content</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Q1. Question text?&#10;A. Option 1&#10;B. Option 2&#10;Answer: A"
              className="mcq-textarea"
            />
          </div>
          
          <div className="format-help">
            <h3>Supported Format:</h3>
            <code>
              Q1. What is anatomy?<br/>
              A. Study of structure<br/>
              B. Study of drugs<br/>
              Answer: A
            </code>
          </div>
        </div>

        <div className="preview-section card">
          <div className="section-head">
            <Layers size={20} />
            <h2>Parsing Preview</h2>
            <span className="count-badge">{questions.length} Questions</span>
          </div>

          {error && (
            <div className="error-pill">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-pill">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="preview-list">
            {questions.length > 0 ? (
              questions.slice(0, 10).map((q, i) => (
                <div key={i} className="preview-item">
                  <div className="preview-q">
                    <strong>Q{i + 1}:</strong> {q.text}
                  </div>
                  <div className="preview-options">
                    {q.options.map((opt: any) => (
                      <div key={opt.id} className="preview-opt">
                        <span className="opt-label">{opt.label}</span> {opt.text}
                      </div>
                    ))}
                  </div>
                  <div className="preview-ans">
                    Answer: <span className="ans-text">{q.answerRaw}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-preview">
                <HelpCircle size={48} />
                <p>Start pasting text to see the live preview here.</p>
              </div>
            )}
            {questions.length > 10 && (
              <div className="more-badge">...and {questions.length - 10} more questions</div>
            )}
          </div>

          <div className="api-options">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <div className="toggle-content">
                <span>{isPublic ? 'Public Exam (Visible on Leaderboard)' : 'Private Exam'}</span>
              </div>
            </label>
          </div>

          <div className="action-footer">
            <button 
              className="action-btn secondary"
              onClick={() => setInputText('')}
              disabled={!inputText || isUploading}
            >
              <Trash2 size={18} />
              Clear
            </button>
            <button 
              className="action-btn primary"
              onClick={handleSave}
              disabled={questions.length === 0 || isUploading}
            >
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isUploading ? 'Saving...' : 'Save to Cloud'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .generate-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .generate-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        .card {
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 2rem;
          transition: all 0.3s;
        }

        .card:focus-within {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 2px solid var(--background);
          padding-bottom: 1.5rem;
        }

        .section-head h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-main);
          margin: 0;
          letter-spacing: -0.03em;
        }

        .section-head svg {
          color: var(--primary);
        }

        .count-badge {
          margin-left: auto;
          background: var(--primary-light);
          color: var(--primary);
          padding: 0.35rem 1rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 800;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .title-input {
          width: 100%;
          padding: 1rem 1.25rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-main);
          transition: all 0.2s;
        }

        .mcq-textarea {
          width: 100%;
          height: 450px;
          padding: 1.25rem;
          background: #0f172a;
          color: #e2e8f0;
          border: none;
          border-radius: var(--radius);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          resize: none;
          box-shadow: var(--shadow-inner);
        }

        .format-help {
          background: var(--primary-light);
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }

        .format-help h3 {
          font-size: 0.9rem;
          color: var(--primary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .format-help code {
          display: block;
          font-family: monospace;
          font-size: 0.85rem;
          color: var(--text-main);
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          line-height: 1.5;
        }

        .preview-list {
          flex: 1;
          overflow-y: auto;
          max-height: 550px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-right: 0.5rem;
        }

        .preview-item {
          padding: 1.5rem;
          background: var(--background);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }

        .preview-item:hover {
          border-color: var(--primary-light);
          transform: translateX(4px);
        }

        .preview-q {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .preview-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .preview-opt {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          display: flex;
          gap: 0.75rem;
        }

        .opt-label {
          font-weight: 800;
          color: var(--primary);
          min-width: 1.5rem;
        }

        .preview-ans {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--success);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px dashed var(--border);
        }

        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          color: var(--text-dim);
          text-align: center;
          gap: 1rem;
        }

        .api-options {
          padding: 1.5rem;
          background: var(--background);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
        }

        .toggle-content {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .action-footer {
          display: flex;
          gap: 1.5rem;
          padding-top: 1.5rem;
          border-top: 2px solid var(--background);
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius);
          font-weight: 800;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .action-btn.primary {
          background: var(--primary);
          color: white;
          border: none;
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .action-btn.primary:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px var(--primary-glow);
        }

        .action-btn.secondary {
          background: white;
          border: 2px solid var(--border);
          color: var(--text-muted);
        }

        .action-btn.secondary:hover:not(:disabled) {
          border-color: var(--danger);
          color: var(--danger);
          background: #fef2f2;
        }

        .error-pill, .success-pill {
          padding: 1rem;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 700;
          animation: scaleUp 0.3s ease-out;
        }

        .error-pill { background: #fef2f2; color: var(--danger); border: 1px solid #fee2e2; }
        .success-pill { background: #ecfdf5; color: var(--success); border: 1px solid #d1fae5; }

        @media (max-width: 1024px) {
          .generate-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default GenerateExam;
