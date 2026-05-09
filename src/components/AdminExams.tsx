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
  Edit2,
  Settings,
  Code,
  ShieldCheck,
  Save,
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatSafeDate } from '../utils/robustHelpers';
import { getAcademicYears, getSubjectsByYear, normalizeAcademicYear } from '../utils/curriculumHelpers';

const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');

  // Exam form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    year: '',
    subject: '',
    difficulty: 'medium',
    timeLimit: 30,
    isPublic: true,
    isProtected: true
  });

  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [jsonContent, setJsonContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    setJsonContent(JSON.stringify({ questions }, null, 2));
  };

  const handleSaveExam = async () => {
    if (!form.title || !form.year || !form.subject) {
      alert('Please fill in required fields.');
      return;
    }
    
    let finalExamData;
    try {
      finalExamData = JSON.parse(jsonContent);
    } catch (e) {
      alert('Invalid JSON format.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingExam) {
        await api.adminUpdateExam(editingExam.id, {
          ...form,
          grade: form.year, // Backend uses grade for year
          exam_data_json: jsonContent
        });
      } else {
        await api.saveExam({ 
          ...form, 
          grade: form.year,
          examData: finalExamData, 
          status: 'published' 
        });
      }
      
      closeModals();
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Failed to save exam');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (exam: any) => {
    setEditingExam(exam);
    setForm({
      title: exam.title,
      description: exam.description || '',
      year: normalizeAcademicYear(exam.grade || exam.year),
      subject: exam.subject,
      difficulty: exam.difficulty || 'medium',
      timeLimit: exam.time_limit_minutes || 30,
      isPublic: exam.is_public === 'TRUE' || exam.is_public === true,
      isProtected: exam.is_protected === 'TRUE' || exam.is_protected === true || true
    });
    setJsonContent(exam.exam_data_json || '');
    setShowAddModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingExam(null);
    setShowJsonEditor(false);
    setParsedQuestions([]);
    setRawText('');
    setForm({
      title: '',
      description: '',
      year: '',
      subject: '',
      difficulty: 'medium',
      timeLimit: 30,
      isPublic: true,
      isProtected: true
    });
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure? This will delete the exam permanently.')) return;
    try {
      await api.deleteExam(id);
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'All' || normalizeAcademicYear(e.grade || e.year) === filterYear;
    return matchesSearch && matchesYear;
  });

  if (isLoading && exams.length === 0) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Syncing exam inventory...</span></div>;

  return (
    <div className="admin-exams-page animate-fade-in">
      <header className="admin-view-header">
        <div className="header-txt">
          <h1>Exam Inventory</h1>
          <p>Create and manage official assessments for students.</p>
        </div>
        <button className="btn-create-exam" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          <span>New Exam</span>
        </button>
      </header>

      <div className="materials-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search exams..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={14} />
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="All">All Years</option>
              {getAcademicYears().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="admin-exams-grid">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="admin-exam-card">
            <div className="exam-card-top">
              <div className={`pub-badge ${exam.is_public === 'TRUE' ? 'is-public' : 'is-private'}`}>
                {exam.is_public === 'TRUE' ? <Globe size={18} /> : <Lock size={18} />}
              </div>
              <div className="exam-card-actions">
                <button className="icon-btn-edit" onClick={() => handleEditClick(exam)}><Settings size={18} /></button>
                <button className="icon-btn-delete" onClick={() => handleDeleteExam(exam.id)}><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="exam-card-body">
              <h3 className="text-ellipsis">{exam.title}</h3>
              <div className="exam-meta-pills">
                 <span className="meta-pill">{exam.subject}</span>
                 <span className="meta-pill">{exam.grade}</span>
              </div>
              <div className="exam-stats-row">
                 <div className="stat-unit"><Clock size={12} /> <span>{exam.time_limit_minutes}m</span></div>
                 <div className="stat-unit"><FileText size={12} /> <span>MCQ</span></div>
              </div>
            </div>

            <div className="exam-card-footer">
              <span className="date-txt">{formatSafeDate(exam.created_at || exam.createdAt)}</span>
              <span className={`diff-badge ${exam.difficulty}`}>{exam.difficulty}</span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="admin-modal animate-slide-up">
            <header className="modal-header">
              <div className="modal-title">
                <div className="icon-box">{editingExam ? <Settings size={24} /> : <Plus size={24} />}</div>
                <div>
                  <h2>{editingExam ? 'Edit Assessment' : 'New Assessment'}</h2>
                  <p>{editingExam ? 'Update metadata and content' : 'Define new MCQ based exam'}</p>
                </div>
              </div>
              <button className="btn-modal-close" onClick={closeModals}><X size={24} /></button>
            </header>

            <div className="modal-scroll-body">
              <div className="modal-grid-layout">
                <div className="modal-form-col">
                  <h4 className="modal-section-label">Configuration</h4>
                  <div className="form-stack">
                    <div className="input-group">
                      <label>Exam Title *</label>
                      <input placeholder="e.g. Clinical Pediatrics Final" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    </div>
                    
                    <div className="grid-split">
                      <div className="input-group">
                        <label>Academic Year *</label>
                        <select value={form.year} onChange={e => setForm({...form, year: e.target.value, subject: ''})}>
                          <option value="">Select Year...</option>
                          {getAcademicYears().map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Subject *</label>
                        <select disabled={!form.year} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                          <option value="">Choose Year...</option>
                          {getSubjectsByYear(form.year).map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="Custom">Other / Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid-split">
                      <div className="input-group">
                        <label>Time Limit (min)</label>
                        <input type="number" value={form.timeLimit} onChange={e => setForm({...form, timeLimit: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Difficulty</label>
                        <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Description</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
                    </div>

                    <div className="toggles-grid">
                      <label className="toggle-item-v2">
                        <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} />
                        <div className="toggle-txt"><strong>Public Exam</strong><span>Visible to all students</span></div>
                      </label>
                      <label className="toggle-item-v2">
                        <input type="checkbox" checked={form.isProtected} onChange={e => setForm({...form, isProtected: e.target.checked})} />
                        <div className="toggle-txt"><strong>Protected Mode</strong><span>Watermark + Anti-cheat</span></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-parser-col">
                  <h4 className="modal-section-label">Content Management</h4>
                  
                  {!showJsonEditor ? (
                    <div className="content-management-box">
                      <div className="parser-card">
                        <div className="parser-header">
                           <span>IMPORT FROM TEXT</span>
                           <button onClick={handleParse}>PARSE & PREVIEW</button>
                        </div>
                        <textarea 
                          placeholder="1. Question?&#10;A) Opt 1&#10;B) Opt 2&#10;Answer: B"
                          value={rawText}
                          onChange={e => setRawText(e.target.value)}
                        />
                      </div>
                      
                      <div className="parser-preview">
                        <div className="preview-info">
                          <span>PARSED STATUS</span>
                          <strong className={parsedQuestions.length > 0 ? 'text-success' : ''}>
                            {parsedQuestions.length > 0 ? `${parsedQuestions.length} Questions Ready` : 'No questions parsed'}
                          </strong>
                        </div>
                        <button className="switch-editor-btn" onClick={() => {
                          if (parsedQuestions.length > 0) {
                            setJsonContent(JSON.stringify({ questions: parsedQuestions }, null, 2));
                          }
                          setShowJsonEditor(true);
                        }}>
                          <Code size={16} />
                          <span>Switch to JSON Expert Editor</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="json-expert-box animate-fade-in">
                       <div className="json-header">
                         <div className="json-title"><FileJson size={16} /> <span>JSON EDITOR</span></div>
                         <button onClick={() => setShowJsonEditor(false)} className="back-to-parser">Back to Simple Parser</button>
                       </div>
                       <textarea 
                          className="json-textarea-expert"
                          value={jsonContent}
                          onChange={e => setJsonContent(e.target.value)}
                          spellCheck={false}
                       />
                       <div className="json-footer">
                          <ShieldCheck size={12} />
                          <span>JSON is validated before saving.</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="modal-footer">
               <button className="btn-modal-cancel" onClick={closeModals}>Cancel</button>
               <button className="btn-modal-save" onClick={handleSaveExam} disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>{editingExam ? 'Update Assessment' : 'Publish Assessment'}</span>
               </button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .admin-exams-page { display: flex; flex-direction: column; gap: 2rem; }
        .admin-view-header { display: flex; justify-content: space-between; align-items: center; }
        .header-txt h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; }
        .header-txt p { color: var(--text-muted); font-weight: 600; }
        
        .btn-create-exam { background: var(--primary); color: white; padding: 0 1.5rem; height: 52px; border-radius: 14px; display: flex; align-items: center; gap: 0.75rem; font-weight: 800; box-shadow: var(--shadow-md); transition: all 0.2s; }
        .btn-create-exam:hover { transform: translateY(-2px); box-shadow: var(--shadow-premium); }

        .admin-exams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
        .admin-exam-card { background: var(--surface); padding: 1.75rem; border-radius: 1.5rem; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem; transition: all 0.2s; }
        .admin-exam-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }

        .exam-card-top { display: flex; justify-content: space-between; align-items: center; }
        .pub-badge { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .pub-badge.is-public { background: var(--success-soft); color: var(--success); }
        .pub-badge.is-private { background: var(--bg-soft); color: var(--text-muted); }
        
        .exam-card-actions { display: flex; gap: 0.5rem; }
        .icon-btn-edit, .icon-btn-delete { width: 36px; height: 36px; border-radius: 10px; color: var(--text-soft); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); transition: all 0.2s; }
        .icon-btn-edit:hover { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }
        .icon-btn-delete:hover { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }

        .exam-card-body h3 { font-size: 1.2rem; font-weight: 800; color: var(--text-strong); }
        .exam-meta-pills { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
        .meta-pill { font-size: 0.65rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: var(--bg-soft); color: var(--text-soft); }

        .exam-stats-row { display: flex; gap: 1rem; margin-top: 0.5rem; }
        .stat-unit { display: flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; }

        .exam-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-soft); padding-top: 1rem; margin-top: 0.5rem; }
        .date-txt { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }
        .diff-badge { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; padding: 4px 10px; border-radius: 99px; }
        .diff-badge.easy { background: var(--success-soft); color: var(--success); }
        .diff-badge.medium { background: var(--primary-soft); color: var(--primary); }
        .diff-badge.hard { background: var(--danger-soft); color: var(--danger); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .admin-modal { background: var(--surface); width: 100%; max-width: 1100px; max-height: 90vh; border-radius: 2.5rem; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-premium); border: 1px solid var(--border); }
        
        .modal-header { padding: 1.5rem 3rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-soft-fade); }
        .modal-title { display: flex; align-items: center; gap: 1.25rem; }
        .modal-title .icon-box { background: var(--primary); color: white; padding: 12px; border-radius: 16px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
        .modal-title h2 { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; }
        .modal-title p { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

        .modal-scroll-body { flex: 1; overflow-y: auto; padding: 3rem; }
        .modal-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
        .modal-section-label { font-size: 0.75rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 2rem; letter-spacing: 0.1em; display: flex; align-items: center; gap: 10px; }
        .modal-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border-soft); }

        .form-stack { display: flex; flex-direction: column; gap: 1.5rem; }
        .grid-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .input-group label { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.6rem; display: block; }
        .input-group input, .input-group select, .input-group textarea { width: 100%; padding: 0.8rem 1.25rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-soft-fade); font-weight: 650; color: var(--text-strong); outline: none; }
        .input-group input:focus { border-color: var(--primary); }

        .toggle-item-v2 { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: var(--bg-soft-fade); border: 1px solid var(--border-soft); border-radius: 16px; cursor: pointer; transition: all 0.2s; }
        .toggle-item-v2:hover { border-color: var(--primary); background: var(--bg-soft); }
        .toggle-item-v2 input { width: 20px; height: 20px; cursor: pointer; accent-color: var(--primary); }

        .parser-card { background: #0f172a; border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .parser-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; font-weight: 800; color: #64748b; }
        .parser-header button { background: var(--primary); color: #0f172a; padding: 6px 16px; border-radius: 8px; font-weight: 800; }
        .parser-card textarea { width: 100%; height: 250px; background: transparent; border: none; color: #cbd5e1; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.6; resize: none; outline: none; }

        .parser-preview { margin-top: 1.5rem; background: var(--bg-soft-fade); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .preview-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 800; color: var(--text-soft); }
        .switch-editor-btn { width: 100%; height: 48px; background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: all 0.2s; }
        .switch-editor-btn:hover { background: #334155; color: white; }

        .json-expert-box { display: flex; flex-direction: column; height: 100%; background: #0f172a; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .json-header { padding: 1rem 1.5rem; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
        .json-title { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 900; color: #94a3b8; }
        .back-to-parser { font-size: 0.7rem; font-weight: 800; color: #38bdf8; }
        .json-textarea-expert { width: 100%; height: 400px; background: transparent; border: none; padding: 1.5rem; color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.5; resize: none; outline: none; }
        .json-footer { padding: 0.75rem 1.5rem; background: rgba(0,0,0,0.2); font-size: 0.65rem; color: #64748b; font-weight: 700; display: flex; align-items: center; gap: 6px; }

        .modal-footer { padding: 1.5rem 3rem; border-top: 1px solid var(--border); background: var(--bg-soft-fade); display: flex; justify-content: flex-end; gap: 1.5rem; }
        .btn-modal-cancel { font-weight: 800; color: var(--text-soft); }
        .btn-modal-save { background: var(--primary); color: white; height: 56px; padding: 0 2.5rem; border-radius: 16px; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 10px 20px var(--primary-soft); }

        @media (max-width: 1024px) {
          .modal-grid-layout { grid-template-columns: 1fr; gap: 3rem; }
          .admin-modal { max-width: 95vw; }
        }
      `}</style>
    </div>
  );
};

export default AdminExams;
