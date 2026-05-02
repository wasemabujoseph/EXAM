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
  CheckCircle,
  X,
  AlertCircle,
  Hash,
  Loader2
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

  // Plan Limit Check
  useEffect(() => {
    if (user && user.role !== 'admin' && user.plan === 'free') {
      if (user.attempt_count >= user.trial_limit) {
        alert('You have reached your 4 free exam attempts. Please upgrade to PRO to continue.');
        navigate('/dashboard');
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchExam = async () => {
      setIsLoading(true);
      let foundExam: any = null;
      
      try {
        // Handle Redo Modes
        if (location.state?.redoMode) {
          foundExam = location.state.exam;
          if (location.state.redoMode === 'wrong-only' && location.state.wrongQuestions) {
            foundExam = {
              ...foundExam,
              title: `Retry Wrong Questions - ${foundExam.title}`,
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
                id: id,
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
        // Default time: 1 min per question unless exam has time_limit
        const limit = foundExam.time_limit_minutes || foundExam.timeLimit || (qs.length * 1);
        setTimeRemaining(limit > 0 ? limit * 60 : null);
      }
      setIsLoading(false);
    };

    fetchExam();
  }, [type, id, location.state]);

  // Timer logic
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitting || isTimerPaused) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitting, isTimerPaused]);

  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit(true);
    }
  }, [timeRemaining]);

  const handleAnswerChange = (qIndex: number, optionId: string, checked: boolean) => {
    const q = questions[qIndex];
    // Some exams might have answers array, some might have correct_answers
    const correctCount = (q.answers || q.correct_answers || [q.correctAnswer]).length;
    const isMultiple = correctCount > 1;
    
    setAnswers(prev => {
      const current = prev[qIndex] || [];
      let next: string[];
      if (isMultiple) {
        if (checked) next = [...current, optionId];
        else next = current.filter(id => id !== optionId);
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
    if (!auto && !confirm('Are you sure you want to submit?')) return;
    setIsSubmitting(true);

    let correctCount = 0;
    questions.forEach((q, i) => {
      const userAns = (answers[i] || []).sort().join(',');
      // Handle both formats
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
      await refreshUser(); // Update attempt count locally
      navigate(`/dashboard/review/${response.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to save attempt. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Loading exam...</div>;
  if (!exam) return <div className="error-screen">Exam not found.</div>;

  const currentQ = questions[currentIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="exam-runner animate-fade-in">
      <header className="runner-header">
        <div className="runner-info">
          <button className="exit-btn" onClick={() => navigate(-1)}>
            <X size={20} />
          </button>
          <div className="title-stack">
            <h1>{exam.title}</h1>
            <p>Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>

        <div className="runner-stats">
          <button 
            className="mode-btn" 
            onClick={() => setDisplayMode(prev => prev === 'single' ? 'full' : 'single')}
          >
            {displayMode === 'single' ? 'Full Page View' : 'Single Question View'}
          </button>

          <div className={`stat-item timer ${isTimerPaused ? 'paused' : ''}`}>
            <Timer size={20} />
            <span>{timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}</span>
            <button 
              className="pause-btn" 
              onClick={() => setIsTimerPaused(!isTimerPaused)}
            >
              {isTimerPaused ? 'Resume' : 'Pause'}
            </button>
          </div>

          <button className="submit-btn" onClick={() => handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="spinner" size={18} /> : 'Submit Exam'}
          </button>
        </div>
      </header>

      <div className="runner-layout">
        <main className={`question-area ${displayMode}-mode`}>
          {displayMode === 'single' ? (
            <>
              <div className="question-card-run">
                <div className="q-header">
                  <span className="q-num">Q{currentIndex + 1}</span>
                  <p className="q-text">{currentQ.text || currentQ.question}</p>
                </div>

                <div className="options-list-run">
                  {currentQ.options.map((opt: any) => (
                    <label key={opt.id} className={`opt-row-run ${(answers[currentIndex] || []).includes(opt.id) ? 'active' : ''}`}>
                      <input 
                        type={(currentQ.answers || currentQ.correct_answers || [currentQ.correctAnswer]).length > 1 ? 'checkbox' : 'radio'}
                        name={`q-${currentIndex}`}
                        checked={(answers[currentIndex] || []).includes(opt.id)}
                        onChange={(e) => handleAnswerChange(currentIndex, opt.id, e.target.checked)}
                      />
                      <span className="opt-badge-run">{opt.id}</span>
                      <span className="opt-text-run">{opt.text}</span>
                    </label>
                  ))}
                </div>

                <div className="q-footer-run">
                  <button 
                    className={`flag-btn ${flags.has(currentIndex) ? 'active' : ''}`}
                    onClick={() => toggleFlag(currentIndex)}
                  >
                    <Flag size={18} />
                    {flags.has(currentIndex) ? 'Flagged' : 'Flag Question'}
                  </button>
                  
                  <div className="notes-area">
                    <StickyNote size={18} />
                    <input 
                      type="text" 
                      placeholder="Private note for this question..." 
                      value={notes[currentIndex] || ''}
                      onChange={(e) => setNotes({...notes, [currentIndex]: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="nav-controls-run">
                <button 
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="nav-btn"
                >
                  <ChevronLeft size={20} /> Previous
                </button>
                <div className="progress-track">
                  <div 
                    className="progress-bar-run" 
                    style={{ width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%` }}
                  ></div>
                </div>
                <button 
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="nav-btn"
                >
                  Next <ChevronRight size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="full-page-scroll">
              {questions.map((q, idx) => (
                <div key={idx} id={`q-anchor-${idx}`} className="question-card-run full-mode-card">
                  <div className="q-header">
                    <span className="q-num">Question {idx + 1}</span>
                    <p className="q-text">{q.text || q.question}</p>
                  </div>
                  <div className="options-list-run">
                    {q.options.map((opt: any) => (
                      <label key={opt.id} className={`opt-row-run ${(answers[idx] || []).includes(opt.id) ? 'active' : ''}`}>
                        <input 
                          type={(q.answers || q.correct_answers || [q.correctAnswer]).length > 1 ? 'checkbox' : 'radio'}
                          name={`q-${idx}`}
                          checked={(answers[idx] || []).includes(opt.id)}
                          onChange={(e) => handleAnswerChange(idx, opt.id, e.target.checked)}
                        />
                        <span className="opt-badge-run">{opt.id}</span>
                        <span className="opt-text-run">{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="p-10 text-center">
                <button className="submit-btn large mx-auto" onClick={() => handleSubmit()} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinner" size={24} /> : 'Final Submission'}
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="navigator-sidebar">
          <div className="nav-grid-head">
            <Hash size={18} />
            <span>Navigator</span>
          </div>
          <div className="q-grid">
            {questions.map((_, i) => (
              <button
                key={i}
                className={`q-grid-btn ${currentIndex === i ? 'current' : ''} ${answers[i]?.length > 0 ? 'done' : ''} ${flags.has(i) ? 'flagged' : ''}`}
                onClick={() => setCurrentIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="nav-legend">
            <div className="legend-item"><span className="dot current"></span> Current</div>
            <div className="legend-item"><span className="dot done"></span> Answered</div>
            <div className="legend-item"><span className="dot flagged"></span> Flagged</div>
          </div>
        </aside>
      </div>

      <style>{`
        .loading-screen, .error-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-weight: 700;
          color: var(--text-main);
          background: #f1f5f9;
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .exam-runner {
          position: fixed;
          inset: 0;
          background: #f1f5f9;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }
        .runner-header {
          height: 72px;
          background: white;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }
        .runner-info { display: flex; align-items: center; gap: 1.5rem; }
        .exit-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .title-stack h1 { font-size: 1.125rem; font-weight: 800; color: var(--text-main); margin: 0; }
        .title-stack p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
        
        .runner-stats { display: flex; align-items: center; gap: 1.5rem; }
        .stat-item { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--text-main); }
        .timer { color: var(--danger); font-family: monospace; font-size: 1.25rem; }
        
        .submit-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
 
        .runner-layout {
          flex: 1;
          display: flex;
          padding: 2rem;
          gap: 2rem;
          overflow: hidden;
        }
        .question-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .question-card-run {
          background: white;
          padding: 2.5rem;
          border-radius: 1.5rem;
          border: 1px solid var(--border);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .q-header { margin-bottom: 2rem; }
        .q-num { font-size: 0.875rem; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
        .q-text { font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.5; }
        
        .options-list-run { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2.5rem; }
        .opt-row-run {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          border-radius: 1rem;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
        }
        .opt-row-run:hover { background: #f8fafc; border-color: var(--primary); }
        .opt-row-run.active { background: var(--primary-light); border-color: var(--primary); }
        .opt-row-run input { width: 20px; height: 20px; accent-color: var(--primary); }
        .opt-badge-run {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: white;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.875rem;
        }
        .opt-row-run.active .opt-badge-run { background: var(--primary); color: white; border-color: var(--primary); }
        .opt-text-run { flex: 1; font-weight: 600; color: #475569; }
 
        .q-footer-run {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .flag-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          font-weight: 700;
          color: #94a3b8;
          cursor: pointer;
        }
        .flag-btn.active { color: #f59e0b; }
        .notes-area {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          color: #94a3b8;
        }
        .notes-area input {
          background: none;
          border: none;
          flex: 1;
          font-size: 0.875rem;
          color: var(--text-main);
        }
        .notes-area input:focus { outline: none; }
 
        .nav-controls-run {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: white;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
        }
        .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .progress-track {
          flex: 1;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-run { height: 100%; background: var(--primary); transition: width 0.3s; }
 
        .navigator-sidebar {
          width: 300px;
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .nav-grid-head { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; color: var(--text-main); }
        .q-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }
        .q-grid-btn {
          aspect-ratio: 1;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .q-grid-btn:hover { border-color: var(--primary); color: var(--primary); }
        .q-grid-btn.current { background: var(--primary); color: white; border-color: var(--primary); }
        .q-grid-btn.done { background: #f1f5f9; color: var(--primary); border-color: #cbd5e1; }
        .q-grid-btn.flagged { border: 2px solid #f59e0b; color: #f59e0b; }
        
        .nav-legend { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .legend-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.current { background: var(--primary); }
        .dot.done { background: #cbd5e1; }
        .dot.flagged { background: #f59e0b; }
 
        @media (max-width: 1024px) {
          .navigator-sidebar { display: none; }
          .runner-layout { padding: 1rem; }
        }

        .mode-btn {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-btn:hover { background: #e2e8f0; color: var(--primary); }

        .pause-btn {
          margin-left: 0.5rem;
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
          padding: 0.25rem 0.75rem;
          border-radius: 0.4rem;
          font-size: 0.7rem;
          font-weight: 800;
          cursor: pointer;
        }
        .timer.paused { opacity: 0.6; }
        .timer.paused span { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }

        .full-page-scroll {
          flex: 1;
          overflow-y: auto;
          padding-right: 1rem;
          scroll-behavior: smooth;
        }
        .full-mode-card {
          margin-bottom: 2rem;
        }
        .question-area.full-mode {
          max-width: 900px;
        }
        .submit-btn.large {
          padding: 1.25rem 3rem;
          font-size: 1.25rem;
          border-radius: 1rem;
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ExamRunner;
