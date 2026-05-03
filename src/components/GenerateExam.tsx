import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePlainText } from '../utils/parser';
import { 
  FileText, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Layers,
  Loader2,
  Eye
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
        setError(parsed.length > 0 ? '' : 'No questions detected. Check your format.');
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
      if (upper.includes(opt.id.toUpperCase())) out.push(opt.id);
    });
    return out;
  };

  return (
    <div className="generate-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Generate Exam</h1>
        <p className="page-subtitle">Paste MCQs, preview the format, and save a clean exam to your cloud library.</p>
      </div>

      <div className="generate-layout">
        {/* Input Section */}
        <div className="gen-card gen-input-card">
          <div className="gen-card-header">
            <FileText className="gen-header-icon" />
            <h2>Source Material</h2>
          </div>

          <div className="gen-form">
            <div className="gen-field">
              <label>Exam Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Cardiology Fundamentals 2024"
              />
            </div>

            <div className="gen-field">
              <label>Content (Paste MCQs)</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Q1. Question text?&#10;A. Option 1&#10;B. Option 2&#10;Answer: A"
                className="mcq-editor"
              />
            </div>

            <div className="gen-help">
               <h4>Expected Format:</h4>
               <pre>
                Q1. What is anatomy?{'\n'}
                A. Study of structure{'\n'}
                B. Study of drugs{'\n'}
                Answer: A
               </pre>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="gen-card gen-preview-card">
          <div className="gen-card-header">
            <Eye className="gen-header-icon" />
            <h2>Live Preview</h2>
            <span className="gen-count">{questions.length} Questions</span>
          </div>

          <div className="gen-preview-area">
            {error && <div className="gen-alert error"><AlertCircle size={18} /> {error}</div>}
            {success && <div className="gen-alert success"><CheckCircle size={18} /> {success}</div>}

            <div className="gen-preview-list">
              {questions.length > 0 ? (
                questions.slice(0, 15).map((q, i) => (
                  <div key={i} className="gen-preview-item">
                    <p className="preview-q"><strong>{i + 1}.</strong> {q.text}</p>
                    <div className="preview-options">
                      {q.options.map((opt: any) => (
                        <div key={opt.id} className="preview-opt">
                          <span className="opt-id">{opt.id}</span>
                          <span className="opt-txt">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                    <p className="preview-ans">Answer: <span>{q.answerRaw}</span></p>
                  </div>
                ))
              ) : (
                <div className="gen-empty">
                  <HelpCircle size={48} />
                  <p>Paste your MCQ text in the left panel to see the live preview here.</p>
                </div>
              )}
              {questions.length > 15 && <p className="gen-more">...and {questions.length - 15} more questions.</p>}
            </div>
          </div>

          <div className="gen-actions">
            <div className="gen-visibility">
               <label className="checkbox-wrap">
                 <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                 <span className="checkbox-box" />
                 <span>Public Exam (Visible to others)</span>
               </label>
            </div>
            
            <div className="gen-btns">
               <button className="gen-btn-clear" onClick={() => setInputText('')} disabled={!inputText}>
                 <Trash2 size={18} /> Clear
               </button>
               <button className="gen-btn-save" onClick={handleSave} disabled={questions.length === 0 || isUploading}>
                 {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                 <span>{isUploading ? 'Saving...' : 'Save Exam'}</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .generate-page { display: flex; flex-direction: column; gap: 2rem; }
        
        .generate-layout {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;
        }

        .gen-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg);
          display: flex; flex-direction: column; overflow: hidden;
        }

        .gen-card-header {
          padding: 1.5rem 2rem; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 1rem;
        }
        .gen-card-header h2 { font-size: 1.25rem; flex: 1; }
        .gen-header-icon { color: var(--primary); }
        .gen-count { background: var(--bg-soft); color: var(--text-muted); font-weight: 800; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; }

        .gen-form { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .gen-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .gen-field label { font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

        .mcq-editor {
          height: clamp(300px, 50vh, 500px);
          font-family: 'JetBrains Mono', monospace; font-size: 0.9rem;
          background: var(--surface-muted); border-color: var(--border);
          line-height: 1.6; resize: none;
        }

        .gen-help { background: var(--primary-soft); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--primary-glow); }
        .gen-help h4 { font-size: 0.8rem; color: var(--primary); margin-bottom: 0.5rem; text-transform: uppercase; }
        .gen-help pre { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; font-family: monospace; white-space: pre-wrap; }

        .gen-preview-area { flex: 1; display: flex; flex-direction: column; padding: 2rem; gap: 1.5rem; background: var(--surface-muted); }
        .gen-preview-list { display: flex; flex-direction: column; gap: 1.25rem; max-height: 600px; overflow-y: auto; padding-right: 0.5rem; }
        
        .gen-preview-item {
          background: var(--surface); padding: 1.25rem; border-radius: var(--radius-xl); border: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 1rem;
        }
        .preview-q { font-weight: 700; color: var(--text-strong); line-height: 1.4; }
        .preview-options { display: flex; flex-direction: column; gap: 0.5rem; }
        .preview-opt { display: flex; gap: 0.75rem; font-size: 0.9rem; color: var(--text-muted); }
        .opt-id { font-weight: 800; color: var(--primary); }
        .preview-ans { font-size: 0.85rem; font-weight: 800; color: var(--success); padding-top: 0.75rem; border-top: 1px dashed var(--border); }

        .gen-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; text-align: center; color: var(--text-soft); gap: 1.5rem; }
        .gen-alert { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.9rem; }
        .gen-alert.error { background: var(--danger-soft); color: var(--danger); border: 1px solid var(--danger); }
        .gen-alert.success { background: var(--success-soft); color: var(--success); border: 1px solid var(--success); }

        .gen-actions { padding: 1.5rem 2rem; background: var(--surface); border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.5rem; }
        .checkbox-wrap { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-weight: 700; font-size: 0.9rem; color: var(--text-strong); }
        .gen-btns { display: grid; grid-template-columns: 140px 1fr; gap: 1rem; }
        
        .gen-btn-clear { background: var(--surface); border: 2px solid var(--border); color: var(--text-muted); font-weight: 800; }
        .gen-btn-clear:hover:not(:disabled) { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }
        
        .gen-btn-save { background: var(--primary); color: white; font-weight: 800; box-shadow: var(--shadow-md); }
        .gen-btn-save:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        @media (max-width: 1024px) {
          .generate-layout { grid-template-columns: 1fr; }
          .mcq-editor { height: 350px; }
          .gen-btns { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .gen-card-header { padding: 1.25rem; }
          .gen-form, .gen-preview-area { padding: 1.25rem; }
          .gen-actions { padding: 1.25rem; }
          .gen-btns { grid-template-columns: 1fr; }
          .gen-btn-save, .gen-btn-clear { height: 44px; }
        }
      `}</style>
    </div>
  );
};

export default GenerateExam;
