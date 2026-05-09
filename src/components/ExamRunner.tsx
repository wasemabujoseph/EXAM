import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { curriculum } from '../data/curriculum';
import { api } from '../lib/api';
import { 
  Timer, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle, 
  Clock, 
  Layout, 
  Layers, 
  X, 
  ChevronUp, 
  Menu,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  Lightbulb,
  StickyNote,
  Loader2,
  AlertCircle,
  Hash
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import ProtectedContentShell from './security/ProtectedContentShell';

const ExamRunner: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useVault();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [displayMode, setDisplayMode] = useState<'single' | 'full'>('single');
  const [isQuestionsMenuOpen, setIsQuestionsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startedAt] = useState(Date.now());
  const [isProtected, setIsProtected] = useState(false);
  const [aiHints, setAiHints] = useState<Record<number, { text: string; loading: boolean; error?: string }>>({});

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
        const protectedValue = foundExam.is_protected || foundExam.isProtected;
        setIsProtected(protectedValue === 'TRUE' || protectedValue === true || type === 'material');
      }
      setIsLoading(false);
    };
    fetchExam();
  }, [type, id, location.state]);

  useEffect(() => {
    if (exam) {
      const protectedValue = exam.is_protected || exam.isProtected;
      setIsProtected(protectedValue === 'TRUE' || protectedValue === true || type === 'material');
    }
  }, [exam, type]);

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

  const getRequestHint = async (index: number) => {
    if (aiHints[index]?.text || aiHints[index]?.loading) return;

    setAiHints(prev => ({
      ...prev,
      [index]: { text: '', loading: true }
    }));

    try {
      const question = questions[index];
      const context = {
        questionText: question.text || question.question,
        options: question.options.map((o: any) => `${o.id}: ${o.text}`).join('\n')
      };

      const response = await api.aiChat([
        { 
          role: 'system', 
          content: 'You are a medical mentor. Give a VERY SHORT (max 15 words) hint for the medical question provided. DO NOT give the answer. Guide the student to think about the mechanism, anatomy, or a key symptom.' 
        },
        { 
          role: 'user', 
          content: `Question: ${context.questionText}\nOptions:\n${context.options}` 
        }
      ]);

      setAiHints(prev => ({
        ...prev,
        [index]: { text: response.content || 'Think carefully about the clinical presentation.', loading: false }
      }));
    } catch (err) {
      setAiHints(prev => ({
        ...prev,
        [index]: { text: '', loading: false, error: 'AI is busy. Try again.' }
      }));
    }
  };

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
    setFlaggedQuestions(prev => {
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
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
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
      <header className="exam-header-premium">
        <div className="header-content container">
            <div className="header-left">
              <button onClick={() => navigate(-1)} className="btn-exit-session" title="Exit Session">
                <X size={20} />
              </button>
              <div className="v-divider" />
              <BrandLogo variant="full" size="md" className="exam-header-logo" />
              <div className="v-divider" />
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

          <div className="header-right">
            <div className={`smart-timer ${timeRemaining !== null && timeRemaining < 300 ? 'timer-urgent' : ''}`}>
              <div className="timer-icon-wrap">
                <Clock size={16} className={isTimerPaused ? '' : 'animate-pulse'} />
              </div>
              <span className="timer-digits">{formatTime(timeRemaining)}</span>
            </div>

            <button 
              onClick={() => handleSubmit()} 
              className="btn-submit-premium desktop-only"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Finalizing...' : 'Submit Exam'}</span>
              <ChevronRight size={18} />
            </button>
            
            <button className="mobile-only menu-toggle-btn" onClick={() => setIsQuestionsMenuOpen(!isQuestionsMenuOpen)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

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
                    <button 
                      className={`tool-btn ${flaggedQuestions.has(currentIndex) ? 'active' : ''}`}
                      onClick={() => toggleFlag(currentIndex)}
                    >
                      <Flag size={16} />
                      <span>{flaggedQuestions.has(currentIndex) ? 'Flagged' : 'Flag Question'}</span>
                    </button>

                    <button 
                      className={`tool-btn ai-hint-btn ${aiHints[currentIndex]?.text ? 'has-hint' : ''}`}
                      onClick={() => getRequestHint(currentIndex)}
                      disabled={aiHints[currentIndex]?.loading}
                    >
                      {aiHints[currentIndex]?.loading ? (
                        <Sparkles size={16} className="animate-spin" />
                      ) : (
                        <Lightbulb size={16} />
                      )}
                      <span>{aiHints[currentIndex]?.text ? 'Hint Ready' : 'AI Hint'}</span>
                    </button>

                    <div className="note-input-wrapper">
                      <StickyNote size={16} />
                      <input 
                        type="text" 
                        placeholder="Add a private note to this question..."
                        value={notes[currentIndex] || ''}
                        onChange={(e) => setNotes({...notes, [currentIndex]: e.target.value})}
                      />
                    </div>
                  </div>

                  {aiHints[currentIndex]?.text && (
                    <div className="hint-display-box animate-slide-up">
                      <div className="hint-header">
                        <Sparkles size={12} /> <span>Medical Mentor Hint</span>
                      </div>
                      <p className="hint-text">{aiHints[currentIndex].text}</p>
                    </div>
                  )}
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
            <div className="full-exam-view scroll-container">
              {questions.map((q, idx) => (
                <div key={idx} className="full-mode-question-card animate-fade-in" dir="ltr">
                  <div className="full-q-header">
                    <span className="full-q-num">Question {idx + 1}</span>
                    <h3 className="full-q-text">{q.text || q.question}</h3>
                  </div>
                  <div className="full-options-stack">
                    {q.options.map((opt: any) => {
                      const isSelected = (answers[idx] || []).includes(opt.id);
                      return (
                        <button 
                          key={opt.id} 
                          className={`smart-option-card compact ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleAnswerChange(idx, opt.id, !isSelected)}
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
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Side Question Navigator */}
        <aside className={`exam-navigator ${isQuestionsMenuOpen ? 'mob-show' : ''}`}>
          <div className="nav-mob-header mobile-only">
            <span>Questions</span>
            <button onClick={() => setIsQuestionsMenuOpen(false)}><X size={20} /></button>
          </div>
          <div className="nav-header">
             <Hash size={18} /> <span>Question Navigator</span>
          </div>
          <div className="nav-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`nav-grid-item ${currentIndex === i ? 'active' : ''} ${answers[i]?.length > 0 ? 'completed' : ''} ${flaggedQuestions.has(i) ? 'flagged' : ''}`}
                onClick={() => {
                  setCurrentIndex(i);
                  setIsQuestionsMenuOpen(false);
                }}
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

          <div className="smart-view-switcher">
             <button 
               className={`view-switch-btn ${displayMode === 'single' ? 'active' : ''}`}
               onClick={() => setDisplayMode('single')}
               title="Single Question View"
             >
               <Layout size={18} /> <span>Single</span>
             </button>
             <button 
               className={`view-switch-btn ${displayMode === 'full' ? 'active' : ''}`}
               onClick={() => setDisplayMode('full')}
               style={{ display: window.innerWidth <= 640 ? 'none' : 'flex' }}
               title="Full Exam View"
             >
               <Layers size={18} /> <span>Full Page</span>
             </button>
          </div>
        </aside>

        {/* Mobile Navigation Footer */}
        <div className="mobile-footer-nav mobile-only">
          <button className="mob-nav-btn" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
            <ChevronLeft size={20} />
          </button>
          <button className="mob-questions-btn" onClick={() => setIsQuestionsMenuOpen(true)}>
            Q {currentIndex + 1} / {questions.length}
          </button>
          {currentIndex === questions.length - 1 ? (
            <button className="mob-submit-btn" onClick={() => handleSubmit()}>
              Submit
            </button>
          ) : (
            <button className="mob-nav-btn" onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))}>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        :root {
          --safe-bottom: env(safe-area-inset-bottom, 0px);
        }

        .exam-session {
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          color: var(--text-strong);
          overflow: hidden;
        }

        .exam-header-premium {
          height: 80px;
          background: var(--surface-glass);
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
        .btn-exit-session:hover { background: var(--danger-soft); color: var(--danger); transform: scale(1.05); }

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
          background: var(--text-strong); color: var(--bg);
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
          color: var(--text-strong);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .smart-timer.timer-urgent { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
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
          background: var(--primary);
          color: white; height: 48px; padding: 0 1.5rem; border-radius: 14px;
          font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;
          box-shadow: var(--shadow-premium); transition: all 0.2s;
        }
        .btn-submit-premium:hover { transform: translateY(-2px); box-shadow: var(--shadow-xl); }

        .exam-viewport { flex: 1; display: flex; overflow: hidden; background: var(--bg); }
        .exam-main { flex: 1; overflow-y: auto; padding: 3rem 2rem; background: var(--bg); }

        .question-wrapper { width: 100%; max-width: 850px; margin: 0 auto; }
        .question-card {
          background: var(--surface); padding: 3.5rem; border-radius: 2.5rem;
          border: 1px solid var(--border); box-shadow: var(--shadow-xl);
          margin-bottom: 2rem;
        }

        .question-label { font-size: 0.75rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 1rem; display: block; letter-spacing: 0.1em; }
        .question-text { font-size: 1.6rem; font-weight: 800; color: var(--text-strong); line-height: 1.4; margin-bottom: 3rem; }

        .options-stack { display: flex; flex-direction: column; gap: 1rem; }
        .smart-option-card {
          width: 100%; display: grid; grid-template-columns: 50px 1fr 40px; align-items: center;
          padding: 1.25rem 1.5rem; border-radius: 1.5rem; background: var(--surface);
          border: 1.5px solid var(--border); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer; text-align: left;
          color: var(--text-main);
        }
        .smart-option-card:hover { border-color: var(--primary-soft); background: var(--bg-soft); transform: translateX(6px); }
        .smart-option-card.is-selected { border-color: var(--primary); background: var(--primary-soft-fade); box-shadow: var(--shadow-md); }

        .option-id-box {
          width: 36px; height: 36px; background: var(--bg-soft); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.9rem; color: var(--text-muted); transition: all 0.2s;
        }
        .is-selected .option-id-box { background: var(--primary); color: white; }

        .option-body-text { padding: 0 1rem; font-size: 1.1rem; font-weight: 600; color: var(--text-strong); line-height: 1.4; }
        .option-selection-ring {
          width: 24px; height: 24px; border: 2px solid var(--border); border-radius: 50%;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s;
        }
        .is-selected .option-selection-ring { border-color: var(--primary); }
        .inner-dot { width: 12px; height: 12px; background: var(--primary); border-radius: 50%; opacity: 0; transform: scale(0.5); transition: all 0.2s; }
        .is-selected .inner-dot { opacity: 1; transform: scale(1); }

        .v-divider { width: 1px; height: 32px; background: var(--border-soft); margin: 0 0.5rem; }
        .exam-header-logo { transform: scale(0.9); }

        .pause-icon { width: 12px; height: 12px; border-left: 3px solid currentColor; border-right: 3px solid currentColor; margin: 0 2px; }

        .btn-submit-premium {
          background: var(--primary);
          color: white; height: 48px; padding: 0 1.5rem; border-radius: 14px;
          font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; gap: 10px;
          box-shadow: var(--shadow-premium); transition: all 0.2s;
          border: none; cursor: pointer;
        }

        .ai-hint-btn:hover:not(:disabled) { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .ai-hint-btn.has-hint { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

        .hint-display-box {
          margin-top: 1.5rem;
          background: var(--bg-soft);
          border: 1px dashed var(--border);
          border-radius: 1rem;
          padding: 1.25rem;
          border-left: 4px solid #16a34a;
        }
        .hint-header { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 900; color: #16a34a; text-transform: uppercase; margin-bottom: 0.5rem; }
        .hint-text { font-size: 0.95rem; font-weight: 600; color: var(--text-strong); line-height: 1.5; margin: 0; font-style: italic; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

        .full-exam-view {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding-bottom: 5rem;
        }

        .full-mode-question-card {
          background: var(--surface);
          padding: 2.5rem;
          border-radius: 2rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .full-q-header { margin-bottom: 2rem; }
        .full-q-num { font-size: 0.7rem; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.5rem; }
        .full-q-text { font-size: 1.25rem; font-weight: 800; color: var(--text-strong); line-height: 1.4; margin: 0; }

        .full-options-stack { display: flex; flex-direction: column; gap: 0.75rem; }
        .smart-option-card.compact { padding: 1rem 1.25rem; border-radius: 1.25rem; }
        .smart-option-card.compact .option-id-box { width: 32px; height: 32px; font-size: 0.8rem; }
        .smart-option-card.compact .option-body-text { font-size: 1rem; }

        .smart-view-switcher {
          margin-top: auto;
          background: var(--bg-soft);
          padding: 6px;
          border-radius: 16px;
          display: flex;
          gap: 4px;
        }

        .view-switch-btn {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
        }

        .view-switch-btn:hover { color: var(--text-strong); background: rgba(0,0,0,0.05); }
        .view-switch-btn.active {
          background: var(--surface);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .question-tools {
          margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);
          display: flex; align-items: center; gap: 1.5rem;
        }
        .tool-btn {
          display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.25rem;
          border-radius: 14px; background: var(--bg-soft); color: var(--text-muted); font-weight: 800;
          font-size: 0.85rem; transition: all 0.2s;
        }
        .tool-btn.active { background: var(--warning-soft); color: var(--warning); border: 1px solid var(--warning); }
        .note-input-wrapper {
          flex: 1; display: flex; align-items: center; gap: 0.75rem;
          background: var(--bg-soft); padding: 0.75rem 1.25rem; border-radius: 14px;
          border: 1px solid var(--border);
        }
        .note-input-wrapper input { background: transparent; border: none; flex: 1; font-weight: 600; color: var(--text-strong); }

        .desktop-navigation { display: flex; align-items: center; gap: 2.5rem; margin-top: 3rem; }
        .nav-step-btn {
          height: 56px; padding: 0 2rem; border-radius: 16px; background: var(--surface);
          border: 1.5px solid var(--border); font-weight: 900; color: var(--text-strong);
          display: flex; align-items: center; gap: 10px; transition: all 0.2s;
        }
        .nav-step-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: var(--primary-soft-fade); }
        .nav-step-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .exam-progress { flex: 1; height: 6px; background: var(--border-soft); border-radius: 99px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 99px; }

        .exam-navigator {
          width: 360px; background: var(--surface); border-left: 1px solid var(--border);
          padding: 2.5rem; display: flex; flex-direction: column; gap: 2.5rem;
        }
        .nav-header { font-weight: 900; color: var(--text-strong); display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
        .nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
        .nav-grid-item {
          aspect-ratio: 1; border-radius: 14px; background: var(--bg-soft); border: 1.5px solid var(--border);
          font-weight: 900; color: var(--text-muted); transition: all 0.2s;
        }
        .nav-grid-item.active { background: var(--text-strong); color: var(--bg); border-color: var(--text-strong); transform: scale(1.05); }
        .nav-grid-item.completed { background: var(--primary-soft-fade); color: var(--primary); border-color: var(--primary-soft); }
        .nav-grid-item.flagged { background: var(--warning-soft-fade); color: var(--warning); border-color: var(--warning-soft); }

        .nav-legend { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border); padding-top: 2rem; }
        .legend-item { display: flex; align-items: center; gap: 12px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.active { background: var(--text-strong); }
        .dot.completed { background: var(--primary-soft); border: 1.5px solid var(--primary); }
        .dot.flagged { background: var(--warning); }

        .mobile-footer-nav { display: none; }
        .nav-mob-header { display: none; }

        .desktop-only { display: flex; }
        .mobile-only { display: none !important; }

        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }

          /* ── Header ── */
          .exam-header-premium { height: 52px; padding: 0; }
          .header-content { padding: 0 0.75rem; gap: 0.25rem; }
          .header-left { gap: 0.5rem; flex: 1; }
          .header-right { gap: 0.5rem; flex-shrink: 0; }

          .v-divider { display: none; }
          .exam-header-logo .logo-symbol img { width: 24px !important; height: 24px !important; }
          .exam-header-logo .brand-name { font-size: 0.85rem !important; }
          .exam-main-title { display: none; }
          .q-progress-pill { display: none; }
          .security-pill-premium { display: none; }
          .exam-info-stack { display: none; }

          .btn-exit-session { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; }

          .smart-timer { 
            padding: 4px 8px; border-radius: 10px; gap: 0.3rem;
            background: transparent; border: none;
          }
          .timer-icon-wrap { width: 26px; height: 26px; border-radius: 8px; }
          .timer-digits { font-size: 0.95rem; min-width: 44px; }

          .menu-toggle-btn {
            width: 34px; height: 34px; border-radius: 10px;
            background: var(--bg-soft); color: var(--text-strong);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }

          /* ── Main Content Area ── */
          .exam-viewport { flex-direction: column; }
          .exam-main { padding: 0.75rem 0.75rem 6.5rem; }
          .question-wrapper { max-width: 100%; }

          .question-card { 
            padding: 1.25rem; 
            border-radius: 1.25rem; 
            box-shadow: 0 2px 12px rgba(0,0,0,0.04);
            width: 100%;
            box-sizing: border-box;
          }

          .question-label { font-size: 0.65rem; margin-bottom: 0.5rem; }
          .question-text { font-size: 1.1rem; margin-bottom: 1.25rem; line-height: 1.5; }

          /* ── Option Cards ── */
          .options-stack { gap: 0.6rem; }
          .smart-option-card { 
            padding: 0.75rem 0.85rem; 
            border-radius: 1rem;
            grid-template-columns: 32px 1fr 28px;
            gap: 0;
          }
          .option-id-box { width: 32px; height: 32px; font-size: 0.75rem; border-radius: 8px; }
          .option-body-text { font-size: 0.9rem; padding: 0 0.5rem; line-height: 1.4; }
          .option-selection-ring { width: 20px; height: 20px; }
          .inner-dot { width: 10px; height: 10px; }

          /* ── Question Tools (inside card) ── */
          .question-tools { 
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem; 
            margin-top: 1.25rem;
            padding-top: 1rem;
            border-top-color: var(--border-soft);
          }
          .tool-btn { 
            flex: 1 1 calc(50% - 0.25rem);
            justify-content: center; 
            height: 40px; 
            padding: 0 0.75rem;
            font-size: 0.75rem;
            border-radius: 10px;
          }
          .note-input-wrapper { 
            width: 100%; 
            flex: 1 1 100%;
            height: 40px; 
            margin: 0; 
            box-sizing: border-box;
            border-radius: 10px;
            padding: 0 0.85rem;
            font-size: 0.8rem;
          }
          .note-input-wrapper input { font-size: 0.8rem; }

          /* ── Hint Box ── */
          .hint-display-box { margin-top: 1rem; padding: 1rem; border-radius: 0.75rem; }
          .hint-text { font-size: 0.85rem; }

          /* ── Desktop Nav (hidden) ── */
          .desktop-navigation { display: none !important; }

          /* ── Side Navigator Drawer ── */
          .exam-navigator {
            position: fixed; top: 0; bottom: 0; right: 0;
            transform: translateX(100%); 
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -10px 0 30px rgba(0,0,0,0.15); 
            z-index: 3000;
            width: 280px; 
            padding: 1.25rem;
            background: var(--surface);
            overflow-y: auto;
            overflow-x: hidden;
          }
          .exam-navigator.mob-show { transform: translateX(0); }
          .nav-grid { gap: 0.5rem; }
          .nav-grid-item { border-radius: 10px; font-size: 0.8rem; }
          .nav-mob-header { 
            display: flex; align-items: center; justify-content: space-between; 
            margin-bottom: 1rem; font-weight: 900; font-size: 1rem;
            color: var(--text-strong); 
          }
          .nav-mob-header button {
            width: 34px; height: 34px; border-radius: 10px;
            background: var(--bg-soft); display: flex; align-items: center; justify-content: center;
          }
          .nav-header { display: none; }
          .nav-legend { padding-top: 1rem; gap: 0.75rem; }
          .smart-view-switcher { display: none; }

          /* ── Bottom Navigation Bar ── */
          .mobile-footer-nav {
            position: fixed; bottom: 0; left: 0; right: 0;
            height: calc(64px + var(--safe-bottom));
            padding: 0 0.75rem; padding-bottom: var(--safe-bottom);
            background: var(--surface); 
            border-top: 1px solid var(--border-soft);
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            z-index: 2500;
            box-shadow: 0 -2px 16px rgba(0,0,0,0.06);
          }
          .mob-nav-btn { 
            width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
            background: var(--bg-soft); color: var(--text-strong); 
            display: flex; align-items: center; justify-content: center; 
            transition: all 0.15s;
          }
          .mob-nav-btn:disabled { opacity: 0.3; }
          .mob-nav-btn:active:not(:disabled) { transform: scale(0.92); }
          .mob-questions-btn { 
            flex: 1; height: 44px; border-radius: 12px; 
            background: var(--text-strong); color: var(--bg); 
            font-weight: 800; font-size: 0.8rem;
            display: flex; align-items: center; justify-content: center;
          }
          .mob-submit-btn { 
            padding: 0 1.25rem; height: 44px; border-radius: 12px; 
            background: var(--primary); color: white; 
            font-weight: 800; font-size: 0.8rem; flex-shrink: 0;
          }
        }
      `}</style>
    </div>
    </ProtectedContentShell>
  );
};

export default ExamRunner;

