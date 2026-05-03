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
  CheckCircle,
  X,
  Hash,
  Loader2,
  Layout,
  Layers,
  Pause,
  Play,
  AlertCircle
} from 'lucide-react';

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
              title: `Retry: ${foundExam.title}`,
              questions: location.state.wrongQuestions
            };
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
    <div className="exam-session">
      {/* Header Section */}
      <header className="exam-header">
        <div className="header-left">
          <button className="icon-btn-exit" onClick={() => navigate(-1)} aria-label="Exit Exam">
            <X size={20} />
          </button>
          <div className="exam-title-group">
            <h1 className="text-ellipsis">{exam.title}</h1>
            <span className="q-counter">Question {currentIndex + 1} of {questions.length}</span>
          </div>
        </div>

        <div className="header-right">
           <div className={`exam-timer ${isTimerPaused ? 'is-paused' : ''}`}>
             <Timer size={18} />
             <span>{timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}</span>
             <button className="pause-toggle" onClick={() => setIsTimerPaused(!isTimerPaused)}>
               {isTimerPaused ? <Play size={14} /> : <Pause size={14} />}
             </button>
           </div>
           <button className="exam-submit-btn" onClick={() => handleSubmit()} disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <span>Submit</span>}
           </button>
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
                    <p className="question-text text-wrap-safe">{currentQ.text || currentQ.question}</p>
                  </div>

                  <div className="options-container">
                    {currentQ.options.map((opt: any) => (
                      <label key={opt.id} className={`option-item ${(answers[currentIndex] || []).includes(opt.id) ? 'selected' : ''}`}>
                        <input 
                          type={(currentQ.answers || currentQ.correct_answers || [currentQ.correctAnswer]).length > 1 ? 'checkbox' : 'radio'}
                          name={`q-${currentIndex}`}
                          checked={(answers[currentIndex] || []).includes(opt.id)}
                          onChange={(e) => handleAnswerChange(currentIndex, opt.id, e.target.checked)}
                        />
                        <span className="option-letter">{opt.id}</span>
                        <span className="option-text text-wrap-safe">{opt.text}</span>
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
                <div key={idx} className="full-mode-question">
                  <h3>{idx + 1}. {q.text || q.question}</h3>
                  <div className="full-options-grid">
                    {q.options.map((opt: any) => (
                      <label key={opt.id} className={`option-item ${(answers[idx] || []).includes(opt.id) ? 'selected' : ''}`}>
                        <input 
                          type={(q.answers || q.correct_answers || [q.correctAnswer]).length > 1 ? 'checkbox' : 'radio'}
                          name={`q-full-${idx}`}
                          checked={(answers[idx] || []).includes(opt.id)}
                          onChange={(e) => handleAnswerChange(idx, opt.id, e.target.checked)}
                        />
                        <span className="option-letter">{opt.id}</span>
                        <span className="option-text">{opt.text}</span>
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
               <Layout size={18} /> Single
             </button>
             <button 
               className={`mode-toggle-btn ${displayMode === 'full' ? 'active' : ''}`}
               onClick={() => setDisplayMode('full')}
             >
               <Layers size={18} /> Full Page
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
        .exam-session {
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          color: var(--text);
        }

        .exam-header {
          height: var(--header-height);
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
        }

        .header-left, .header-right { display: flex; align-items: center; gap: 1rem; }
        
        .icon-btn-exit {
          width: 40px; height: 40px;
          border-radius: var(--radius-lg);
          background: var(--bg-soft);
          color: var(--text-muted);
        }
        .icon-btn-exit:hover { background: var(--danger-soft); color: var(--danger); }

        .exam-title-group h1 { font-size: 1.1rem; max-width: 200px; margin: 0; }
        .q-counter { font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }

        .exam-timer {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--danger-soft); color: var(--danger);
          padding: 0.5rem 0.75rem; border-radius: var(--radius-lg);
          font-family: monospace; font-weight: 800; font-size: 1.1rem;
        }
        .exam-timer.is-paused { background: var(--bg-soft); color: var(--text-muted); }
        .pause-toggle { background: var(--surface); color: inherit; padding: 4px; border-radius: 4px; margin-left: 4px; }

        .exam-submit-btn {
          background: var(--primary); color: white;
          padding: 0 1.25rem; height: 40px; border-radius: var(--radius-lg);
          font-weight: 800; box-shadow: var(--shadow-md);
        }

        .exam-viewport { flex: 1; display: flex; overflow: hidden; position: relative; }

        .exam-main {
          flex: 1; overflow-y: auto; padding: 2rem;
          display: flex; flex-direction: column; align-items: center;
        }

        .question-wrapper { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 2rem; }

        .question-card {
          background: var(--surface);
          padding: clamp(1.25rem, 5vw, 3rem);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }

        .question-header { margin-bottom: 2rem; }
        .question-label { font-size: 0.8rem; font-weight: 800; color: var(--primary); text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
        .question-text { font-size: clamp(1.1rem, 3vw, 1.5rem); font-weight: 700; color: var(--text-strong); line-height: 1.4; }

        .options-container { display: flex; flex-direction: column; gap: 1rem; }

        .option-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.25rem 1.5rem; border-radius: var(--radius-xl);
          background: var(--bg-soft); border: 2px solid transparent;
          cursor: pointer; transition: all 0.2s;
        }
        .option-item:hover { border-color: var(--primary-soft); background: var(--surface); }
        .option-item.selected { border-color: var(--primary); background: var(--surface); box-shadow: var(--shadow-md); }

        .option-letter {
          width: 32px; height: 32px; flex-shrink: 0;
          background: var(--surface); border: 2px solid var(--border);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.9rem;
        }
        .option-item.selected .option-letter { background: var(--primary); color: white; border-color: var(--primary); }
        .option-text { font-weight: 600; font-size: 1.05rem; }

        .question-tools {
          margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);
          display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;
        }

        .tool-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; border-radius: var(--radius-md);
          background: var(--bg-soft); color: var(--text-muted); font-weight: 700;
        }
        .tool-btn.flag.active { background: var(--warning-soft); color: var(--warning); border: 1px solid var(--warning); }

        .note-input-wrapper {
          flex: 1; min-width: 200px;
          display: flex; align-items: center; gap: 0.75rem;
          background: var(--bg-soft); padding: 0.5rem 1rem; border-radius: var(--radius-md);
        }
        .note-input-wrapper input { background: transparent; border: none; padding: 0; }

        .desktop-navigation { display: flex; align-items: center; gap: 2rem; width: 100%; margin-top: auto; }
        .nav-step-btn {
          padding: 0 1.5rem; height: 48px; border-radius: var(--radius-lg);
          background: var(--surface); border: 1px solid var(--border);
          font-weight: 800; color: var(--text-strong);
        }
        .exam-progress { flex: 1; height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); transition: width 0.3s ease; }

        .exam-navigator {
          width: 300px; background: var(--surface); border-left: 1px solid var(--border);
          padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;
        }

        .nav-header { font-weight: 800; text-transform: uppercase; font-size: 0.8rem; color: var(--text-soft); display: flex; align-items: center; gap: 0.5rem; }
        .nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; }
        .nav-grid-item {
          aspect-ratio: 1; border-radius: 8px; border: 1px solid var(--border);
          background: var(--bg-soft); font-weight: 800; font-size: 0.85rem;
        }
        .nav-grid-item.active { background: var(--primary); color: white; border-color: var(--primary); transform: scale(1.1); z-index: 1; }
        .nav-grid-item.completed { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }
        .nav-grid-item.flagged { border-color: var(--warning); color: var(--warning); background: var(--warning-soft); }

        .nav-legend { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-soft); }
        .dot { width: 10px; height: 10px; border-radius: 3px; }
        .dot.active { background: var(--primary); }
        .dot.completed { background: var(--primary-soft); border: 1px solid var(--primary); }
        .dot.flagged { background: var(--warning); }

        .view-mode-toggle { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .mode-toggle-btn {
          height: 36px; border-radius: 8px; border: 1px solid var(--border);
          font-size: 0.75rem; font-weight: 800; color: var(--text-muted);
        }
        .mode-toggle-btn.active { background: var(--bg-soft); color: var(--primary); border-color: var(--primary); }

        .mobile-footer-nav { display: none; }

        .exam-loading, .exam-error {
          position: fixed; inset: 0; background: var(--bg); z-index: 3000;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .exam-navigator {
            position: fixed; top: var(--header-height); bottom: 0; right: 0;
            transform: translateX(100%); transition: transform 0.3s ease;
            box-shadow: var(--shadow-xl); z-index: 500;
          }
          .exam-navigator.mob-show { transform: translateX(0); }
          .desktop-navigation { display: none; }
          .mobile-footer-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            height: 72px; background: var(--surface); border-top: 1px solid var(--border);
            padding: 0 1rem; padding-bottom: var(--safe-bottom);
            align-items: center; justify-content: space-between; z-index: 100;
          }
          .mob-nav-btn { width: 48px; height: 48px; border-radius: 12px; background: var(--bg-soft); color: var(--text-strong); }
          .mob-questions-btn { flex: 1; margin: 0 1rem; height: 48px; border-radius: 12px; background: var(--primary); color: white; font-weight: 800; }
          .exam-main { padding: 1.25rem; padding-bottom: 100px; }
          .question-card { padding: 1.5rem; }
          .exam-title-group h1 { max-width: 150px; font-size: 1rem; }
        }

        @media (max-width: 480px) {
          .exam-header { padding: 0 0.5rem; gap: 0.25rem; height: 64px; }
          .exam-timer { font-size: 0.85rem; padding: 0.35rem 0.5rem; gap: 0.25rem; min-width: 80px; }
          .exam-submit-btn { padding: 0 0.6rem; font-size: 0.85rem; height: 36px; }
          .header-left { gap: 0.25rem; min-width: 0; }
          .exam-title-group h1 { font-size: 0.85rem; max-width: 100px; }
          .q-counter { font-size: 0.65rem; }
          .question-text { font-size: 1.15rem; line-height: 1.3; }
          .option-text { font-size: 0.95rem; }
          .option-item { padding: 1rem; gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
};

export default ExamRunner;
