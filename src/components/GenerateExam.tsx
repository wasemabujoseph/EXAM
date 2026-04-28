import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { parsePlainText } from '../utils/parser';
import { 
  FileText, 
  Play, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';

const GenerateExam: React.FC = () => {
  const { vault, updateVault } = useVault();
  const navigate = useNavigate();
  
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    if (!vault || questions.length === 0) return;
    
    const newExam = {
      id: `custom-${Date.now()}`,
      title: title || 'Untitled Exam',
      description: 'Pasted MCQ Exam',
      questions: questions.map((q, i) => ({
        ...q,
        id: `q-${i + 1}`,
        answers: normalizeAnswers(q.answerRaw, q.options)
      })),
      createdAt: new Date().toISOString()
    };

    const newVault = {
      ...vault,
      myExams: [newExam, ...vault.myExams]
    };

    try {
      await updateVault(newVault);
      setSuccess('Exam saved to your private vault!');
      setInputText('');
      setTitle('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save exam.');
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
        <p className="page-subtitle">Paste your MCQs to create a private exam</p>
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

          <div className="action-footer">
            <button 
              className="action-btn secondary"
              onClick={() => setInputText('')}
              disabled={!inputText}
            >
              <Trash2 size={18} />
              Clear
            </button>
            <button 
              className="action-btn primary"
              onClick={handleSave}
              disabled={questions.length === 0}
            >
              <Save size={18} />
              Save to My Exams
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .generate-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .generate-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .section-head {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
        }
        .section-head h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }
        .count-badge {
          margin-left: auto;
          background: var(--primary-light);
          color: var(--primary);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .title-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 1rem;
        }
        .mcq-textarea {
          width: 100%;
          height: 400px;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-family: monospace;
          font-size: 0.9rem;
          resize: vertical;
        }
        .format-help {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
        }
        .format-help code {
          display: block;
          margin-top: 0.5rem;
          color: #475569;
        }
        .preview-list {
          flex: 1;
          overflow-y: auto;
          max-height: 500px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-right: 0.5rem;
        }
        .preview-item {
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 0.85rem;
        }
        .preview-options {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          color: #64748b;
        }
        .opt-label {
          font-weight: 700;
          color: var(--text-main);
        }
        .preview-ans {
          margin-top: 0.5rem;
          font-weight: 600;
          color: var(--success);
        }
        .empty-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #94a3b8;
          text-align: center;
        }
        .action-footer {
          display: flex;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn.primary {
          background: var(--primary);
          color: white;
          border: none;
        }
        .action-btn.secondary {
          background: white;
          border: 1px solid var(--border);
          color: #64748b;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-pill, .success-pill {
          padding: 0.75rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
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
