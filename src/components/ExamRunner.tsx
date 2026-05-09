import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { curriculum } from '../data/curriculum';
import { api } from '../lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  StickyNote, 
  Timer, 
  X,
  Hash,
  Loader2,
  Layout,
  Layers,
  Pause,
  Play, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import ProtectedContentShell from './security/ProtectedContentShell';

const ExamRunner: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useVault();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [displayMode, setDisplayMode] = useState<'single' | 'full'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startedAt] = useState(Date.now());
  
  // Security State
  const [isProtected, setIsProtected] = useState(false);
  const [securityMode, setSecurityMode] = useState<'normal' | 'protected' | 'official'>('normal');

  useEffect(() => {
    if (user && user.role !== 'admin' && user.plan === 'free') {
      if (user.attempt_count >= user.trial_limit) {
        alert('You have reached your free exam attempts limit. Please upgrade to PRO to continue.');
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchExamData = async () => {
      setIsLoading(true);
      let foundExam: any = null;
      let protection = false;
      let mode: 'normal' | 'protected' | 'official' = 'normal';

      try {
        if (location.state?.redoMode) {
          foundExam = location.state.exam;
          protection = location.state.isProtected || false;
          mode = location.state.securityMode || 'normal';
          
          if (location.state.redoMode === 'wrong-only' && location.state.wrongQuestions) {
            foundExam = {
              ...foundExam,
              title: `Redo: ${foundExam.title}`,
              questions: location.state.wrongQuestions
            };
          }
        } else if (type === 'material' && id) {
          // If starting from material, we MUST have metadata for protection
          try {
            const materialMetadata = await api.getMaterialById(id);
            protection = materialMetadata.isProtected === 'TRUE' || materialMetadata.isProtected === true;
            mode = protection ? 'protected' : 'normal';
            
            const content = await api.getMaterialContent(id);
            const examData = JSON.parse(content.content);
            foundExam = {
              id,
              title: materialMetadata.title,
              questions: examData.questions || [],
              timeLimit: examData.timeLimit || examData.time_limit_minutes || 0
            };
          } catch (e) {
            console.error('Failed to load material exam', e);
            // Fallback to state if fetch fails
            foundExam = location.state?.exam;
          }
        } else if (type === 'curriculum') {
          foundExam = location.state?.exam;
          if (!foundExam) {
            const [yearId, semesterId, subjectName] = (id || '').split('|');
            const year = curriculum.years.find(y => y.year === yearId);
            const semester = year?.semesters.find(s => s.semester === semesterId);
            const subject = semester?.subjects.find(s => s.name === subjectName);
            if (subject) {
              foundExam = {
                id,
                title: subject.name,
                questions: subject.sub.exams.length > 0 ? subject.sub.exams[0].questions : [],
              };
            }
          }
        } else if ((type === 'my' || type === 'cloud' || type === 'public') && id) {
          foundExam = await api.getExamById(id);
          // Check for security flags in cloud exam metadata
          protection = foundExam.isProtected === 'TRUE' || foundExam.isProtected === true;
          if (foundExam.securityMode) mode = foundExam.securityMode;
          else if (protection) mode = 'protected';
        }
      } catch (err) {
        console.error('Failed to fetch exam', err);
      }

      if (foundExam) {
        setExam(foundExam);
        const qs = foundExam.examData?.questions || foundExam.questions || [];
        setQuestions(qs);
        const limit = foundExam.time_limit_minutes || foundExam.timeLimit || (qs.length * 1.5);
        setTimeRemaining(limit > 0 ? Math.floor(limit * 60) : null);
        setIsProtected(protection);
        setSecurityMode(mode);
      }
      setIsLoading(false);
    };
    
    fetchExamData();
  }, [type, id, location.state]);

  // Timer logic with auto-submit
  useEffect(() => {
    if (timeRemaining === null || isSubmitting || isTimerPaused) return;
    
    if (timeRemaining <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitting, isTimerPaused]);

  // Responsive mode handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640 && displayMode === 'full') {
        setDisplayMode('single');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayMode]);

  const handleAnswerChange = (qIndex: number, optionId: string, checked: boolean) => {
    const q = questions[qIndex];
    const correctCount = (q.answers || q.correct_answers || [q.correctAnswer]).length;
    const isMultiple = correctCount > 1;
    setAnswers(prev => {
      const current = prev[qIndex] || [];
      let next: string[];
      if (isMultiple) {
        next = checked ? [...current, optionId] : current.filter(id => id !== optionId);
      } else {
        next = checked ? [optionId] : [];
      }
      return { ...prev, [qIndex]: next };
    });
  };

  const toggleFlag = (qIndex: number) => {
    setFlags(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  const handleSubmit = async (auto = false) => {
    if (isSubmitting) return;
    if (!auto && !confirm('Submit this exam now?')) return;
    
    setIsSubmitting(true);
    let correctCount = 0;
    questions.forEach((q, i) => {
      const userAns = (answers[i] || []).sort().join(',');
      const qAnswers = q.answers || q.correct_answers || [q.correctAnswer];
      const correctAns = qAnswers.sort().join(',');
      if (userAns === correctAns) correctCount++;
    });

    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
    
    try {
      const response = await api.saveAttempt({
        examId: exam.id || id,
        score: correctCount,
        totalQuestions: questions.length,
        answers,
        questionsSnapshot: questions,
        durationSeconds,
        mode: location.state?.redoMode || 'normal',
        securityMode // Track security level used
      });
      await refreshUser();
      
      if (auto) {
        alert('Time is up! Your exam has been submitted automatically.');
      }
      
      navigate(`/dashboard/review/${response.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to save attempt. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="exam-loading"><Loader2 className="animate-spin" size={48} /><span>Initializing Secure Workspace...</span></div>;
  if (!exam) return <div className="exam-error"><AlertCircle size={48} /><span>Exam content unavailable.</span><button onClick={() => navigate(-1)}>Return</button></div>;

  const currentQ = questions[currentIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isProtectedExam = isProtected || securityMode !== 'normal';

  return (
    <ProtectedContentShell 
      isProtected={isProtectedExam} 
      examId={exam.id} 
      title={exam.title}
    >
      <div className={`exam-session ${isProtectedExam ? 'is-protected-view' : ''}`}>
        <header className="exam-header">
          <div className="header-left">
            <button className="icon-btn-exit" onClick={() => navigate(-1)} title="Exit Exam">
              <X size={20} />
            </button>
            <div className="exam-title-group">
              <h1>{exam.title}</h1>
              <div className="badge-row">
                <span className="q-counter">Q {currentIndex + 1} / {questions.length}</span>
                {isProtectedExam && (
                  <span className={`security-badge ${securityMode}`}>
                    <ShieldAlert size={12} />
                    <span>{securityMode === 'official' ? 'OFFICIAL EXAM' : 'PROTECTED MODE'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="header-right">
             <div className={`exam-timer ${isTimerPaused ? 'is-paused' : ''} ${timeRemaining !== null && timeRemaining < 300 ? 'urgent' : ''}`}>
               <Timer size={18} />
               <span>{timeRemaining !== null ? formatTime(timeRemaining) : '∞'}</span>
               <button className="pause-toggle" onClick={() => setIsTimerPaused(!isTimerPaused)}>
                 {isTimerPaused ? <Play size={14} /> : <Pause size={14} />}
               </button>
             </div>
             <button className="exam-submit-btn" onClick={() => handleSubmit()} disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <span>Submit</span>}
             </button>
          </div>
        </header>

        <div className="exam-viewport">
          <main className={`exam-main ${displayMode === 'full' ? 'is-full' : ''}`}>
            {displayMode === 'single' ? (
              <div className="question-wrapper">
                 <div className="question-card">
                    <div className="question-header">
                      <span className="question-label">QUESTION {currentIndex + 1}</span>
                      <div className="question-text" dir="auto">
                        {currentQ.text || currentQ.question}
                      </div>
                    </div>

                    <div className="options-container" dir="ltr">
                      {currentQ.options.map((opt: any) => (
                        <label key={opt.id} className={`option-item ${(answers[currentIndex] || []).includes(opt.id) ? 'selected' : ''}`}>
                          <span className="option-letter">{opt.id}</span>
                          <span className="option-text">{opt.text}</span>
                          <div className="option-control">
                            <input 
                              type={(currentQ.answers || currentQ.correct_answers || [currentQ.correctAnswer]).length > 1 ? 'checkbox' : 'radio'}
                              name={`q-${currentIndex}`}
                              checked={(answers[currentIndex] || []).includes(opt.id)}
                              onChange={(e) => handleAnswerChange(currentIndex, opt.id, e.target.checked)}
                            />
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="question-tools">
                      <button className={`tool-btn flag ${flags.has(currentIndex) ? 'active' : ''}`} onClick={() => toggleFlag(currentIndex)}>
                        <Flag size={18} />
                        <span>{flags.has(currentIndex) ? 'Flagged' : 'Flag'}</span>
                      </button>
                      <div className="note-input-wrapper">
                        <StickyNote size={18} />
                        <input 
                          type="text" 
                          placeholder="Private note..." 
                          value={notes[currentIndex] || ''}
                          onChange={(e) => setNotes({...notes, [currentIndex]: e.target.value})}
                        />
                      </div>
                    </div>
                 </div>

                 <div className="desktop-navigation">
                    <button className="nav-step-btn" disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)}>
                      <ChevronLeft size={20} /> <span>Previous</span>
                    </button>
                    <div className="exam-progress">
                      <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                    </div>
                    <button className="nav-step-btn" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)}>
                      <span>Next</span> <ChevronRight size={20} />
                    </button>
                 </div>
              </div>
            ) : (
              <div className="full-exam-view">
                {questions.map((q, idx) => (
                  <div key={idx} className="full-mode-question" dir="ltr">
                    <h3 className="full-q-text">{idx + 1}. {q.text || q.question}</h3>
                    <div className="full-options-grid">
                      {q.options.map((opt: any) => (
                        <label key={opt.id} className={`option-item ${(answers[idx] || []).includes(opt.id) ? 'selected' : ''}`}>
                          <span className="option-letter">{opt.id}</span>
                          <span className="option-text">{opt.text}</span>
                          <div className="option-control">
                            <input 
                              type={(q.answers || q.correct_answers || [q.correctAnswer]).length > 1 ? 'checkbox' : 'radio'}
                              name={`q-full-${idx}`}
                              checked={(answers[idx] || []).includes(opt.id)}
                              onChange={(e) => handleAnswerChange(idx, opt.id, e.target.checked)}
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          <aside className="exam-navigator">
            <div className="nav-header">
               <Hash size={18} /> <span>Navigator</span>
            </div>
            <div className="nav-grid">
              {questions.map((_, i) => (
                <button
                  key={i}
                  className={`nav-grid-item ${currentIndex === i ? 'active' : ''} ${answers[i]?.length > 0 ? 'completed' : ''} ${flags.has(i) ? 'flagged' : ''}`}
                  onClick={() => setCurrentIndex(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <div className="view-mode-toggle">
               <button className={`mode-toggle-btn ${displayMode === 'single' ? 'active' : ''}`} onClick={() => setDisplayMode('single')}>
                 <Layout size={18} /> <span>Single</span>
               </button>
               <button 
                 className={`mode-toggle-btn ${displayMode === 'full' ? 'active' : ''}`} 
                 onClick={() => setDisplayMode('full')}
                 style={{ display: window.innerWidth <= 640 ? 'none' : 'flex' }}
               >
                 <Layers size={18} /> <span>Full Page</span>
               </button>
            </div>
          </aside>
        </div>

        <footer className="mobile-footer-nav">
          <button className="mob-nav-btn" disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)}>
            <ChevronLeft size={24} />
          </button>
          <button className="mob-questions-btn" onClick={() => document.querySelector('.exam-navigator')?.classList.toggle('mob-show')}>
            Questions ({currentIndex + 1}/{questions.length})
          </button>
          <button className="mob-nav-btn" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)}>
            <ChevronRight size={24} />
          </button>
        </footer>

        <style>{`
          .exam-session {
            position: fixed; inset: 0; background: var(--bg); z-index: 2000;
            display: flex; flex-direction: column; color: var(--text); overflow: hidden;
          }
          
          .is-protected-view { user-select: none; }
          .is-protected-view * { user-select: none !important; }

          .exam-header {
            height: 72px; background: var(--surface); border-bottom: 1px solid var(--border);
            padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between;
          }

          .exam-title-group h1 { font-size: 1.1rem; font-weight: 900; color: var(--text-strong); }
          .badge-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 2px; }
          .q-counter { font-size: 0.7rem; font-weight: 800; color: var(--primary); }
          
          .security-badge {
            display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px;
            font-size: 0.65rem; font-weight: 900;
          }
          .security-badge.protected { background: #fff1f2; color: #e11d48; border: 1px solid #fda4af; }
          .security-badge.official { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }

          .exam-timer {
            display: flex; align-items: center; gap: 0.5rem; background: var(--bg-soft);
            padding: 0.5rem 1rem; border-radius: 12px; font-family: 'JetBrains Mono', monospace; font-weight: 800;
          }
          .exam-timer.urgent { background: #fee2e2; color: #dc2626; animation: timerPulse 1s infinite; }
          @keyframes timerPulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }

          .exam-viewport { flex: 1; display: flex; overflow: hidden; background: var(--bg); }
          .exam-main { flex: 1; overflow-y: auto; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center; }
          
          .question-wrapper { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 2rem; }
          .question-card { background: var(--surface); padding: 3rem; border-radius: 2rem; border: 1px solid var(--border); box-shadow: var(--shadow-xl); }
          .question-text { font-size: 1.4rem; font-weight: 800; color: var(--text-strong); line-height: 1.4; margin-bottom: 2.5rem; }
          
          .full-exam-view { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 4rem; padding-bottom: 10rem; }
          .full-mode-question { background: var(--surface); padding: 3rem; border-radius: 2rem; border: 1px solid var(--border); }
          .full-q-text { font-size: 1.25rem; font-weight: 800; margin-bottom: 2rem; color: var(--text-strong); }

          .option-item {
            display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem;
            border-radius: 1.25rem; border: 1.5px solid var(--border); transition: all 0.2s;
            background: var(--surface); margin-bottom: 0.75rem;
          }
          .option-item:hover { border-color: var(--primary); background: var(--primary-soft-fade); }
          .option-item.selected { border-color: var(--primary); background: var(--primary-soft); box-shadow: 0 4px 12px var(--primary-soft); }
          .option-letter { 
            width: 38px; height: 38px; background: var(--bg-soft); border-radius: 10px;
            display: flex; align-items: center; justify-content: center; font-weight: 900;
          }
          .option-item.selected .option-letter { background: var(--primary); color: white; }
          .option-text { flex: 1; font-weight: 700; font-size: 1.1rem; }

          .exam-navigator { width: 300px; background: var(--surface); border-left: 1px solid var(--border); padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
          .nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
          .nav-grid-item { aspect-ratio: 1; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-soft); font-weight: 900; font-size: 0.9rem; }
          .nav-grid-item.active { background: var(--primary); color: white; border-color: var(--primary); transform: scale(1.1); }
          .nav-grid-item.completed { background: var(--primary-soft-fade); color: var(--primary); border-color: var(--primary); }

          .mobile-footer-nav { display: none; }

          @media (max-width: 1024px) {
            .exam-navigator { position: fixed; top: 72px; bottom: 0; right: 0; width: 280px; transform: translateX(100%); transition: transform 0.3s; z-index: 1000; box-shadow: -10px 0 30px rgba(0,0,0,0.2); }
            .exam-navigator.mob-show { transform: translateX(0); }
            .mobile-footer-nav { 
              display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 80px; 
              background: var(--surface); border-top: 1px solid var(--border); padding: 0 1rem; align-items: center; justify-content: space-between; z-index: 100;
            }
            .mob-nav-btn { width: 50px; height: 50px; border-radius: 12px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; }
            .mob-questions-btn { flex: 1; margin: 0 1rem; height: 50px; border-radius: 12px; background: var(--primary); color: white; font-weight: 800; }
            .exam-main { padding-bottom: 120px; }
            .desktop-navigation { display: none; }
          }
        `}</style>
      </div>
    </ProtectedContentShell>
  );
};

export default ExamRunner;
