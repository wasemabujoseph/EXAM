import React, { useState, useEffect } from 'react';
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
  BookOpen,
  Lock,
  Info
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
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.plan === 'free') {
      if (user.attempt_count >= user.trial_limit) {
        alert('You have reached your free exam attempts limit. Please upgrade to PRO to continue.');
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchExam = async () => {
      setIsLoading(true);
      let foundExam: any = null;
      try {
        if (location.state?.redoMode) {
          foundExam = location.state.exam;
          if (location.state.redoMode === 'wrong-only' && location.state.wrongQuestions) {
            foundExam = {
              ...foundExam,
              title: `Redo Wrongs: ${foundExam.title}`,
              questions: location.state.wrongQuestions
            };
          }
        } else if (type === 'curriculum' || type === 'material') {
          foundExam = location.state?.exam;
          if (!foundExam && type === 'curriculum') {
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
        setIsProtected(foundExam.is_protected === 'TRUE' || foundExam.is_protected === true || foundExam.isProtected === 'TRUE' || foundExam.isProtected === true || type === 'material');
      }
      setIsLoading(false);
    };
    fetchExam();
  }, [type, id, location.state]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitting || isTimerPaused) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitting, isTimerPaused]);

  useEffect(() => {
    if (timeRemaining === 0) handleSubmit(true);
  }, [timeRemaining]);

  // Force single question mode on mobile
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
    if (!auto && !confirm('Submit this exam now? You will be able to review your answers after submission.')) return;
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
        mode: location.state?.redoMode || 'normal'
      });
      await refreshUser();
      navigate(`/dashboard/review/${response.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to save attempt. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="exam-loading"><Loader2 className="animate-spin" size={48} /><span>Preparing your exam workspace...</span></div>;
  if (!exam) return <div className="exam-error"><AlertCircle size={48} /><span>Exam not found or failed to load.</span><button onClick={() => navigate(-1)}>Go Back</button></div>;

  const currentQ = questions[currentIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ProtectedContentShell 
      isProtected={isProtected} 
      examId={exam.id} 
      title={exam.title}
    >
      <div className="exam-session">
      {/* Header Section */}
      <header className="exam-header-premium">
        <div className="header-content container">
          <div className="header-left">
            <button className="btn-exit-session" onClick={() => navigate(-1)}>
              <X size={20} />
            </button>
            <div className="exam-info-stack">
              <h1 className="exam-main-title">{exam.title}</h1>
              <div className="exam-meta-row">
                <span className="q-progress-pill">Question {currentIndex + 1} of {questions.length}</span>
                {isProtected && (
                  <div className="security-pill-premium animate-fade-in">
                    <div className="security-dot-active" />
                    <ShieldCheck size={12} />
                    <span>Strict Protection Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="header-center">
            <div className={`smart-timer ${isTimerPaused ? 'is-paused' : ''} ${timeRemaining !== null && timeRemaining < 300 ? 'timer-urgent' : ''}`}>
              <div className="timer-icon-wrap">
                <Timer size={18} />
              </div>
              <span className="timer-digits">{timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}</span>
              <button className="timer-control" onClick={() => setIsTimerPaused(!isTimerPaused)}>
                {isTimerPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              </button>
            </div>
          </div>

          <div className="header-right">
             <button className="btn-submit-premium" onClick={() => handleSubmit()} disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                 <>
                   <span>Complete Exam</span>
                   <ChevronRight size={18} />
                 </>
               )}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="exam-viewport">
        <main className={`exam-main ${displayMode === 'full' ? 'is-full' : ''}`}>
          {displayMode === 'single' ? (
            <div className="question-wrapper animate-fade-in">
               <div className="question-card">
                  <div className="question-header">
                    <span className="question-label">Question {currentIndex + 1}</span>
                    <div className="question-text" dir="auto">
                      {currentQ.text || currentQ.question}
                    </div>
                  </div>

                  <div className="options-stack" dir="ltr">
                    {currentQ.options.map((opt: any) => {
                      const isSelected = (answers[currentIndex] || []).includes(opt.id);
                      return (
                        <button 
                          key={opt.id} 
                          className={`smart-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleAnswerChange(currentIndex, opt.id, !isSelected)}
                        >
                          <div className="option-id-box">{opt.id}</div>
                          <div className="option-body-text">{opt.text}</div>
                          <div className="option-selection-ring">
                            <div className="inner-dot" />
                          </div>
                        </button>
                      );
                    })}
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
                        placeholder="Add a private note..." 
                        value={notes[currentIndex] || ''}
                        onChange={(e) => setNotes({...notes, [currentIndex]: e.target.value})}
                      />
                    </div>
                  </div>
               </div>

               {/* Standard Navigation */}
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
            <div className="full-exam-view scroll-container">
              {questions.map((q, idx) => (
                <div key={idx} className="full-mode-question" dir="ltr">
                  <h3>{idx + 1}. {q.text || q.question}</h3>
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

        {/* Side Question Navigator */}
        <aside className="exam-navigator">
          <div className="nav-header">
             <Hash size={18} /> <span>Question Navigator</span>
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
          <div className="nav-legend">
            <div className="legend-item"><span className="dot active" /> Current</div>
            <div className="legend-item"><span className="dot completed" /> Answered</div>
            <div className="legend-item"><span className="dot flagged" /> Flagged</div>
          </div>

          <div className="view-mode-toggle">
             <button 
               className={`mode-toggle-btn ${displayMode === 'single' ? 'active' : ''}`}
               onClick={() => setDisplayMode('single')}
             >
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

      {/* Mobile Sticky Bottom Navigation */}
      <footer className="mobile-footer-nav">
        <button 
          className="mob-nav-btn" 
          disabled={currentIndex === 0} 
          onClick={() => setCurrentIndex(prev => prev - 1)}
        >
          <ChevronLeft size={24} />
        </button>
        
        <button className="mob-questions-btn" onClick={() => {
           const nav = document.querySelector('.exam-navigator');
           nav?.classList.toggle('mob-show');
        }}>
          Questions ({currentIndex + 1}/{questions.length})
        </button>

        <button 
          className="mob-nav-btn" 
          disabled={currentIndex === questions.length - 1} 
          onClick={() => setCurrentIndex(prev => prev + 1)}
        >
          <ChevronRight size={24} />
        </button>
      </footer>

      <style>{`
        :root {
          --safe-bottom: env(safe-area-inset-bottom, 0px);
        }

        .exam-session {
          position: fixed;
          inset: 0;
          background: #ffffff;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          color: var(--text-strong);
          overflow: hidden;
        }

        .exam-header-premium {
          height: 80px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-soft);
          display: flex;
          align-items: center;
          z-index: 100;
          position: sticky;
          top: 0;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0 2rem;
        }

        .header-left { display: flex; align-items: center; gap: 1.5rem; flex: 1; min-width: 0; }
        .header-right { display: flex; align-items: center; gap: 1rem; }

        .btn-exit-session {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: var(--bg-soft);
          color: var(--text-muted);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .btn-exit-session:hover { background: #fee2e2; color: #ef4444; transform: scale(1.05); }

        .exam-info-stack { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .exam-main-title { 
          font-size: 1.1rem; 
          font-weight: 900; 
          margin: 0; 
          letter-spacing: -0.02em;
          color: var(--text-strong);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .exam-meta-row { display: flex; align-items: center; gap: 1rem; }
        .q-progress-pill { font-size: 0.7rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .security-pill-premium {
          display: flex; align-items: center; gap: 6px;
          background: #0f172a; color: #f8fafc;
          padding: 4px 12px; border-radius: 99px;
          font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
        }
        .security-dot-active {
          width: 6px; height: 6px; background: #10b981; border-radius: 50%;
          box-shadow: 0 0 8px #10b981; animation: security-pulse 2s infinite;
        }
        @keyframes security-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .smart-timer {
          display: flex; align-items: center; gap: 0.75rem;
          background: var(--bg-soft); padding: 6px; border-radius: 14px;
          border: 1px solid var(--border-soft);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .smart-timer.timer-urgent { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .timer-icon-wrap {
          width: 32px; height: 32px; background: var(--surface); border-radius: 10px;
          display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);
        }
        .timer-digits { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 1.1rem; min-width: 60px; text-align: center; }
        .timer-control {
          width: 32px; height: 32px; border-radius: 10px; background: var(--surface);
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .timer-control:hover { background: var(--primary); color: white; }

        .btn-submit-premium {
          background: linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%);
          color: white; height: 48px; padding: 0 1.5rem; border-radius: 14px;
          font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); transition: all 0.2s;
        }
        .btn-submit-premium:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }

        .exam-viewport { flex: 1; display: flex; overflow: hidden; background: #ffffff; }
        .exam-main { flex: 1; overflow-y: auto; padding: 3rem 2rem; background: #ffffff; }

        .question-wrapper { width: 100%; max-width: 850px; margin: 0 auto; }
        .question-card {
          background: #ffffff; padding: 3.5rem; border-radius: 2.5rem;
          border: 1px solid #f1f5f9; box-shadow: 0 20px 50px rgba(0,0,0,0.04);
          margin-bottom: 2rem;
        }

        .question-label { font-size: 0.75rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 1rem; display: block; letter-spacing: 0.1em; }
        .question-text { font-size: 1.6rem; font-weight: 800; color: #0f172a; line-height: 1.4; margin-bottom: 3rem; }

        .options-stack { display: flex; flex-direction: column; gap: 1rem; }
        .smart-option-card {
          width: 100%; display: grid; grid-template-columns: 50px 1fr 40px; align-items: center;
          padding: 1.25rem 1.5rem; border-radius: 1.5rem; background: #ffffff;
          border: 1.5px solid #f1f5f9; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer; text-align: left;
        }
        .smart-option-card:hover { border-color: var(--primary-soft); background: #f8fafc; transform: translateX(6px); }
        .smart-option-card.is-selected { border-color: var(--primary); background: #eff6ff; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.1); }

        .option-id-box {
          width: 36px; height: 36px; background: #f1f5f9; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.9rem; color: #64748b; transition: all 0.2s;
        }
        .is-selected .option-id-box { background: var(--primary); color: white; }

        .option-body-text { padding: 0 1rem; font-size: 1.1rem; font-weight: 600; color: #1e293b; line-height: 1.4; }
        .option-selection-ring {
          width: 24px; height: 24px; border: 2px solid #e2e8f0; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .is-selected .option-selection-ring { border-color: var(--primary); }
        .inner-dot { width: 12px; height: 12px; background: var(--primary); border-radius: 50%; opacity: 0; transform: scale(0.5); transition: all 0.2s; }
        .is-selected .inner-dot { opacity: 1; transform: scale(1); }

        .question-tools {
          margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #f1f5f9;
          display: flex; align-items: center; gap: 1.5rem;
        }
        .tool-btn {
          display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.25rem;
          border-radius: 14px; background: #f8fafc; color: #64748b; font-weight: 800;
          font-size: 0.85rem; transition: all 0.2s;
        }
        .tool-btn.active { background: #fef3c7; color: #d97706; border: 1px solid #fbbf24; }
        .note-input-wrapper {
          flex: 1; display: flex; align-items: center; gap: 0.75rem;
          background: #f8fafc; padding: 0.75rem 1.25rem; border-radius: 14px;
          border: 1px solid #f1f5f9;
        }
        .note-input-wrapper input { background: transparent; border: none; flex: 1; font-weight: 600; color: #1e293b; }

        .desktop-navigation { display: flex; align-items: center; gap: 2.5rem; margin-top: 3rem; }
        .nav-step-btn {
          height: 56px; padding: 0 2rem; border-radius: 16px; background: #ffffff;
          border: 1.5px solid #e2e8f0; font-weight: 900; color: #1e293b;
          display: flex; align-items: center; gap: 10px; transition: all 0.2s;
        }
        .nav-step-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: #f0f7ff; }
        .nav-step-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .exam-progress { flex: 1; height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 99px; }

        .exam-navigator {
          width: 360px; background: #ffffff; border-left: 1px solid #f1f5f9;
          padding: 2.5rem; display: flex; flex-direction: column; gap: 2.5rem;
        }
        .nav-header { font-weight: 900; color: #0f172a; display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
        .nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
        .nav-grid-item {
          aspect-ratio: 1; border-radius: 14px; background: #f8fafc; border: 1.5px solid #f1f5f9;
          font-weight: 900; color: #64748b; transition: all 0.2s;
        }
        .nav-grid-item.active { background: #0f172a; color: white; border-color: #0f172a; transform: scale(1.05); }
        .nav-grid-item.completed { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
        .nav-grid-item.flagged { background: #fffbeb; color: #b45309; border-color: #fef3c7; }

        .nav-legend { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
        .legend-item { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.active { background: #0f172a; }
        .dot.completed { background: #bae6fd; }
        .dot.flagged { background: #fbbf24; }

        .mobile-footer-nav { display: none; }

        @media (max-width: 1024px) {
          .exam-header-premium { height: 72px; }
          .header-content { padding: 0 1.25rem; }
          .exam-navigator { display: none; }
          .exam-main { padding: 2rem 1rem; }
          .question-card { padding: 2rem; border-radius: 2rem; }
          .question-text { font-size: 1.3rem; }
          .mobile-footer-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            height: 80px; background: #ffffff; border-top: 1px solid #f1f5f9;
            padding: 0 1.25rem; align-items: center; justify-content: space-between; z-index: 1000;
          }
          .mob-nav-btn { width: 48px; height: 48px; border-radius: 14px; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; }
          .mob-questions-btn { flex: 1; margin: 0 1rem; height: 48px; border-radius: 14px; background: #0f172a; color: white; font-weight: 800; }
        }
      `}</style>
    </div>
    </ProtectedContentShell>
  );
};

export default ExamRunner;

