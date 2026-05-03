import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Globe, 
  Lock, 
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  FileJson,
  Edit2
} from 'lucide-react';

const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [examMeta, setExamMeta] = useState({
    title: '',
    description: '',
    grade: '',
    subject: '',
    difficulty: 'medium',
    timeLimit: 30,
    isPublic: true
  });

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const data = await api.adminGetAllExams();
      setExams(data);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleParse = () => {
    const questions: any[] = [];
    const blocks = rawText.split(/\d+\.\s/).filter(b => b.trim());
    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 3) return;
      const questionText = lines[0];
      const options: any[] = [];
      let correctAnswer = '';
      lines.slice(1).forEach(line => {
        const match = line.match(/^([A-D])\)\s*(.*)/i);
        if (match) options.push({ id: match[1].toUpperCase(), text: match[2] });
        else if (line.toLowerCase().startsWith('answer:')) correctAnswer = line.split(':')[1].trim().toUpperCase();
      });
      if (options.length > 0) {
        questions.push({ id: idx + 1, question: questionText, options, correctAnswer: correctAnswer || options[0].id, explanation: '' });
      }
    });
    setParsedQuestions(questions);
  };

  const handleSaveExam = async () => {
    if (!examMeta.title || parsedQuestions.length === 0) {
      alert('Please provide a title and at least one question.');
      return;
    }
    try {
      await api.saveExam({ ...examMeta, examData: { questions: parsedQuestions }, status: 'published' });
      setShowAddModal(false);
      setParsedQuestions([]);
      setRawText('');
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Failed to save exam');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam? This cannot be undone.')) return;
    try {
      await api.deleteExam(id);
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Loading exam inventory...</span></div>;

  return (
    <div className="admin-exams-page animate-fade-in">
      <header className="admin-view-header">
        <div className="header-txt">
          <h1>Exam Inventory</h1>
          <p>Curate public assessments and clinical practice materials.</p>
        </div>
        <button className="btn-create-exam" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          <span>New Exam</span>
        </button>
      </header>

      <div className="admin-exams-grid">
        {exams.map((exam) => (
          <div key={exam.id} className="admin-exam-card">
            <div className="exam-card-top">
              <div className={`pub-badge ${exam.is_public === 'TRUE' ? 'is-public' : 'is-private'}`}>
                {exam.is_public === 'TRUE' ? <Globe size={18} /> : <Lock size={18} />}
              </div>
              <div className="exam-card-actions">
                <button className="icon-btn-edit"><Edit2 size={16} /></button>
                <button className="icon-btn-delete" onClick={() => handleDeleteExam(exam.id)}><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="exam-card-body">
              <h3 className="text-ellipsis">{exam.title}</h3>
              <p className="description-text line-clamp-2">{exam.description || 'Global clinical assessment.'}</p>
              
              <div className="exam-tags-row">
                <span className="tag-pill">{exam.subject}</span>
                <span className="tag-pill">{exam.grade}</span>
                <span className="tag-pill time"><Clock size={12} /> {exam.time_limit_minutes}m</span>
              </div>
            </div>

            <div className="exam-card-footer">
              <span className="date-txt">{new Date(exam.created_at).toLocaleDateString()}</span>
              <span className={`diff-txt ${exam.difficulty}`}>{exam.difficulty}</span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="admin-modal animate-slide-up">
            <header className="modal-header">
              <div className="modal-title">
                <div className="icon-box"><FileJson size={24} /></div>
                <div>
                  <h2>Create Public Exam</h2>
                  <p>Define metadata and MCQ content</p>
                </div>
              </div>
              <button className="btn-modal-close" onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </header>

            <div className="modal-scroll-body">
              <div className="modal-grid-layout">
                <div className="modal-form-col">
                  <h4 className="modal-section-label">General Metadata</h4>
                  <div className="form-stack">
                    <div className="input-group">
                      <label>Exam Title</label>
                      <input placeholder="e.g. Clinical Medicine 2024" value={examMeta.title} onChange={e => setExamMeta({...examMeta, title: e.target.value})} />
                    </div>
                    <div className="grid-split">
                      <div className="input-group">
                        <label>Subject</label>
                        <input placeholder="Anatomy" value={examMeta.subject} onChange={e => setExamMeta({...examMeta, subject: e.target.value})} />
                      </div>
                      <div className="input-group">
                        <label>Year / Grade</label>
                        <input placeholder="Year 3" value={examMeta.grade} onChange={e => setExamMeta({...examMeta, grade: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid-split">
                      <div className="input-group">
                        <label>Time Limit (min)</label>
                        <input type="number" value={examMeta.timeLimit} onChange={e => setExamMeta({...examMeta, timeLimit: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Difficulty</label>
                        <select value={examMeta.difficulty} onChange={e => setExamMeta({...examMeta, difficulty: e.target.value})}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                    <div className="visibility-toggle">
                       <Globe size={18} className="text-success" />
                       <div className="toggle-info">
                          <p>Public Visibility</p>
                          <span>Visible to all registered students</span>
                       </div>
                       <input type="checkbox" checked={examMeta.isPublic} onChange={e => setExamMeta({...examMeta, isPublic: e.target.checked})} />
                    </div>
                  </div>
                </div>

                <div className="modal-parser-col">
                  <h4 className="modal-section-label">MCQ Content</h4>
                  <div className="parser-card">
                    <div className="parser-header">
                       <span>FORMATTED TEXT</span>
                       <button onClick={handleParse}>PARSE CONTENT</button>
                    </div>
                    <textarea 
                      placeholder="1. Question?&#10;A) Opt 1&#10;B) Opt 2&#10;Answer: B"
                      value={rawText}
                      onChange={e => setRawText(e.target.value)}
                    />
                  </div>
                  <div className="parser-preview">
                     <div className="preview-info">
                        <span>PARSED PREVIEW</span>
                        <strong>{parsedQuestions.length} Questions</strong>
                     </div>
                     <div className="preview-list-mini">
                        {parsedQuestions.slice(0, 3).map((q, i) => (
                          <div key={i} className="preview-row-item"><CheckCircle size={14} className="text-success" /> <span>{q.question}</span></div>
                        ))}
                        {parsedQuestions.length > 3 && <p className="preview-more">... and {parsedQuestions.length - 3} more</p>}
                        {parsedQuestions.length === 0 && <div className="preview-empty"><AlertCircle size={32} /><p>No parsed content</p></div>}
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="modal-footer">
               <button className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
               <button className="btn-modal-save" onClick={handleSaveExam}>Save & Publish Exam</button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .admin-exams-page { display: flex; flex-direction: column; gap: 2.5rem; }
        .btn-create-exam { background: var(--primary); color: white; padding: 0 1.5rem; height: 52px; border-radius: 14px; display: flex; align-items: center; gap: 0.75rem; font-weight: 800; box-shadow: var(--shadow-md); }

        .admin-exams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; }
        .admin-exam-card { background: var(--surface); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s; }
        .admin-exam-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }

        .exam-card-top { display: flex; justify-content: space-between; align-items: center; }
        .pub-badge { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .pub-badge.is-public { background: var(--success-soft); color: var(--success); }
        .pub-badge.is-private { background: var(--bg-soft); color: var(--text-soft); }
        
        .exam-card-actions { display: flex; gap: 0.5rem; }
        .icon-btn-edit, .icon-btn-delete { width: 32px; height: 32px; border-radius: 8px; color: var(--text-soft); display: flex; align-items: center; justify-content: center; }
        .icon-btn-edit:hover { background: var(--bg-soft); color: var(--primary); }
        .icon-btn-delete:hover { background: var(--danger-soft); color: var(--danger); }

        .exam-card-body h3 { font-size: 1.1rem; color: var(--text-strong); }
        .description-text { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; height: 2.6rem; }

        .exam-tags-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .tag-pill { background: var(--bg-soft); color: var(--text-soft); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
        .tag-pill.time { background: var(--primary-soft); color: var(--primary); }

        .exam-card-footer { display: flex; justify-content: space-between; border-top: 1px solid var(--border-soft); padding-top: 1rem; margin-top: 0.5rem; font-size: 0.75rem; font-weight: 800; }
        .date-txt { color: var(--text-soft); }
        .diff-txt { text-transform: uppercase; color: var(--primary); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .admin-modal { background: var(--surface); width: 100%; max-width: 1000px; max-height: 90vh; border-radius: 28px; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-premium); }
        .modal-header { padding: 1.5rem 2.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-soft-fade); }
        .modal-title { display: flex; align-items: center; gap: 1rem; }
        .modal-title .icon-box { background: var(--primary); color: white; padding: 10px; border-radius: 14px; }
        .modal-title h2 { font-size: 1.25rem; }
        .modal-title p { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

        .modal-scroll-body { flex: 1; overflow-y: auto; padding: 2.5rem; }
        .modal-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
        .modal-section-label { font-size: 0.75rem; font-weight: 900; color: var(--text-soft); text-transform: uppercase; margin-bottom: 1.5rem; border-left: 4px solid var(--primary); padding-left: 10px; }

        .form-stack { display: flex; flex-direction: column; gap: 1.25rem; }
        .grid-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.8rem; font-weight: 800; color: var(--text-soft); }
        .input-group input, .input-group select { width: 100%; height: 44px; padding: 0 1rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-soft-fade); font-weight: 700; color: var(--text-strong); }

        .visibility-toggle { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--success-soft-fade); border: 1px solid var(--success-soft); border-radius: 16px; margin-top: 1rem; }
        .toggle-info { flex: 1; }
        .toggle-info p { font-size: 0.9rem; font-weight: 800; color: var(--text-strong); }
        .toggle-info span { font-size: 0.75rem; color: var(--text-muted); }
        .visibility-toggle input { width: 22px; height: 22px; cursor: pointer; }

        .parser-card { background: #0f172a; border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .parser-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; font-weight: 800; color: #64748b; }
        .parser-header button { background: var(--primary); color: white; padding: 4px 12px; border-radius: 6px; }
        .parser-card textarea { width: 100%; height: 200px; background: transparent; border: none; color: #e2e8f0; font-family: monospace; font-size: 0.85rem; line-height: 1.5; resize: none; outline: none; }

        .parser-preview { margin-top: 2rem; background: var(--bg-soft-fade); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; }
        .preview-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.75rem; font-weight: 800; color: var(--text-soft); }
        .preview-list-mini { display: flex; flex-direction: column; gap: 0.75rem; }
        .preview-row-item { display: flex; gap: 0.75rem; font-size: 0.8rem; font-weight: 700; color: var(--text-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .preview-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; opacity: 0.3; }

        .modal-footer { padding: 1.5rem 2.5rem; border-top: 1px solid var(--border); background: var(--bg-soft-fade); display: flex; justify-content: flex-end; gap: 1rem; }
        .btn-modal-cancel { font-weight: 800; color: var(--text-soft); padding: 0 1.5rem; }
        .btn-modal-save { background: var(--primary); color: white; height: 52px; padding: 0 2rem; border-radius: 14px; font-weight: 800; box-shadow: var(--shadow-md); }

        @media (max-width: 992px) {
          .modal-grid-layout { grid-template-columns: 1fr; gap: 2.5rem; }
          .admin-exams-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminExams;
