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
          gap: 1.5rem;
          font-weight: 800;
          color: var(--primary);
          background: var(--background);
        }

        .exam-runner {
          position: fixed;
          inset: 0;
          background: var(--background);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
        }

        .runner-header {
          height: 80px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          z-index: 10;
        }

        .runner-info { display: flex; align-items: center; gap: 2rem; }
        
        .exit-btn {
          width: 44px;
          height: 44px;
          border-radius: 1rem;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .exit-btn:hover {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
          transform: rotate(90deg);
        }

        .title-stack h1 { 
          font-size: 1.25rem; 
          font-weight: 900; 
          color: var(--text-main); 
          margin: 0; 
          letter-spacing: -0.03em;
        }

        .title-stack p { 
          font-size: 0.8rem; 
          font-weight: 700;
          color: var(--primary); 
          margin: 0; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .runner-stats { display: flex; align-items: center; gap: 2rem; }
        
        .mode-btn {
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid rgba(99, 102, 241, 0.1);
          padding: 0.6rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 800;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mode-btn:hover {
          background: var(--primary);
          color: white;
        }

        .stat-item.timer { 
          display: flex; 
          align-items: center; 
          gap: 0.75rem; 
          padding: 0.6rem 1.25rem;
          background: #fef2f2;
          color: var(--danger);
          border-radius: 0.75rem;
          font-family: 'JetBrains Mono', monospace; 
          font-size: 1.25rem; 
          font-weight: 800;
          border: 1px solid rgba(239, 68, 68, 0.1);
        }

        .stat-item.timer.paused {
          background: var(--background);
          color: var(--text-dim);
        }
        
        .pause-btn {
          padding: 0.35rem 0.75rem;
          border-radius: 0.5rem;
          background: white;
          border: 1px solid currentColor;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .submit-btn {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: var(--radius);
          font-weight: 800;
          box-shadow: 0 8px 15px -3px var(--primary-glow);
        }

        .runner-layout {
          flex: 1;
          display: flex;
          padding: 3rem;
          gap: 3rem;
          overflow: hidden;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .question-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          overflow-y: auto;
          padding-right: 1rem;
        }

        .question-card-run {
          background: white;
          padding: 3.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          animation: slideUp 0.5s ease-out;
        }

        .q-header { margin-bottom: 2.5rem; }
        .q-num { 
          font-size: 0.9rem; 
          font-weight: 900; 
          color: var(--primary); 
          text-transform: uppercase; 
          margin-bottom: 1rem; 
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .q-num::after { content: ''; flex: 1; height: 1px; background: var(--primary-light); }
        
        .q-text { 
          font-size: 1.5rem; 
          font-weight: 800; 
          color: var(--text-main); 
          line-height: 1.4; 
          letter-spacing: -0.02em;
        }
        
        .options-list-run { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 3rem; }
        
        .opt-row-run {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          border-radius: var(--radius);
          border: 2px solid var(--background);
          background: var(--background);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .opt-row-run:hover { 
          background: white; 
          border-color: var(--primary-light);
          transform: translateX(8px);
        }

        .opt-row-run.active { 
          background: white; 
          border-color: var(--primary); 
          box-shadow: var(--shadow-md);
        }

        .opt-row-run input { 
          width: 24px; 
          height: 24px; 
          accent-color: var(--primary);
          cursor: pointer;
        }

        .opt-badge-run {
          width: 36px;
          height: 36px;
          border-radius: 0.75rem;
          background: white;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .opt-row-run.active .opt-badge-run { 
          background: var(--primary); 
          color: white; 
          border-color: var(--primary); 
          transform: scale(1.1);
        }

        .opt-text-run { 
          flex: 1; 
          font-weight: 700; 
          color: var(--text-main); 
          font-size: 1.1rem;
        }
 
        .q-footer-run {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 2.5rem;
          border-top: 2px solid var(--background);
        }

        .flag-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--background);
          border: 1px solid var(--border);
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 800;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
        }

        .flag-btn.active { 
          background: #fff7ed;
          color: #ea580c; 
          border-color: #fdba74;
          box-shadow: 0 4px 10px rgba(234, 88, 12, 0.1);
        }

        .notes-area {
          flex: 0.8;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--background);
          padding: 0.75rem 1.5rem;
          border-radius: 1rem;
          border: 1px solid var(--border);
          transition: focus-within 0.2s;
        }

        .notes-area:focus-within {
          border-color: var(--primary-light);
          background: white;
        }

        .notes-area input {
          background: none;
          border: none;
          flex: 1;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
        }
 
        .nav-controls-run {
          display: flex;
          align-items: center;
          gap: 3rem;
          margin-top: auto;
          padding-top: 1rem;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          border-radius: 1rem;
          border: 2px solid var(--border);
          background: white;
          font-weight: 800;
          color: var(--text-main);
          transition: all 0.2s;
        }

        .nav-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .progress-track {
          flex: 1;
          height: 12px;
          background: var(--border);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: var(--shadow-inner);
        }

        .progress-bar-run { 
          height: 100%; 
          background: linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%); 
          transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
 
        .navigator-sidebar {
          width: 320px;
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 2rem;
          box-shadow: var(--shadow-md);
        }

        .nav-grid-head { 
          display: flex; 
          align-items: center; 
          gap: 1rem; 
          font-weight: 900; 
          color: var(--text-main); 
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.9rem;
        }

        .q-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.75rem;
        }

        .q-grid-btn {
          aspect-ratio: 1;
          border-radius: 0.75rem;
          border: 2px solid var(--background);
          background: var(--background);
          font-weight: 900;
          color: var(--text-dim);
          transition: all 0.3s;
        }

        .q-grid-btn:hover { border-color: var(--primary-light); color: var(--primary); }
        
        .q-grid-btn.current { 
          background: var(--primary); 
          color: white; 
          border-color: var(--primary); 
          box-shadow: 0 4px 10px var(--primary-glow);
          transform: scale(1.1);
        }

        .q-grid-btn.done { 
          background: white; 
          color: var(--primary); 
          border-color: var(--primary-light); 
        }

        .q-grid-btn.flagged { 
          border-color: #ea580c; 
          color: #ea580c; 
          background: #fff7ed;
        }
        
        .nav-legend { 
          display: flex; 
          flex-direction: column; 
          gap: 0.75rem; 
          padding-top: 1.5rem; 
          border-top: 1px solid var(--border); 
        }

        .legend-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
        .dot { width: 12px; height: 12px; border-radius: 4px; }
        .dot.current { background: var(--primary); }
        .dot.done { border: 2px solid var(--primary-light); background: white; }
        .dot.flagged { background: #ea580c; }
  
        @media (max-width: 1200px) {
          .navigator-sidebar { display: none; }
          .runner-layout { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default ExamRunner;
