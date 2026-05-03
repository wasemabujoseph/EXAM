import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useVault } from '../context/VaultContext';
import { api } from '../lib/api';
import { 
  ChevronLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  Loader2,
  Sparkles
} from 'lucide-react';

const ReviewAttempt: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [explainLoading, setExplainLoading] = useState<Record<number, boolean>>({});
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadAttempt = async () => {
      setIsLoading(true);
      try {
        if (attemptId) {
          const data = await api.getAttemptReview(attemptId);
          setAttempt(data);
        }
      } catch (err) {
        console.error('Failed to load attempt review', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId]);

  const handleAIExplain = async (q: any, index: number, userAns: string[]) => {
    setExplainLoading(prev => ({ ...prev, [index]: true }));
    try {
      const questionContext = {
        questionText: q.text,
        options: q.options,
        correctOption: q.answers.join(','),
        studentOption: userAns.join(','),
        isCorrect: userAns.sort().join(',') === q.answers.sort().join(',')
      };

      const result = await api.aiExplain(questionContext);
      setAiExplanations(prev => ({ ...prev, [index]: result.content }));
    } catch (err: any) {
      alert(err.message || 'Failed to get AI explanation');
    } finally {
      setExplainLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleRedoFull = () => {
    const qs = attempt.questionsSnapshot || attempt.questions || [];
    navigate(`/dashboard/exam/cloud/${attempt.examId}`, { 
      state: { 
        redoMode: 'full',
        exam: { id: attempt.examId, title: attempt.examTitle, questions: qs } 
      } 
    });
  };

  const handleRedoWrong = () => {
    const qs = attempt.questionsSnapshot || attempt.questions || [];
    const wrongQs = qs.filter((q: any, i: number) => {
      const uAns = (attempt.answers[i] || attempt.answers[q.id] || []).sort().join(',');
      const qAnswers = q.answers || q.correct_answers || [q.correctAnswer] || [];
      const cAns = qAnswers.sort().join(',');
      return uAns !== cAns;
    });

    navigate(`/dashboard/exam/cloud/${attempt.examId}`, { 
      state: { 
        redoMode: 'wrong-only',
        wrongQuestions: wrongQs,
        exam: { id: attempt.examId, title: attempt.examTitle, questions: qs } 
      } 
    });
  };

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Loading review...</div>;

  if (!attempt) {
    return (
      <div className="error-state">
        <AlertCircle size={48} />
        <h2>Attempt not found</h2>
        <Link to="/dashboard/history" className="back-link">Back to History</Link>
      </div>
    );
  }

  const scorePercent = attempt.percent || Math.round((attempt.score / (attempt.totalQuestions || attempt.total)) * 100);
  const correctCount = attempt.score;
  const totalQuestions = attempt.totalQuestions || attempt.total;
  const timeSpentMin = attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) : Math.round(attempt.timeMs / 1000 / 60);

  return (
    <div className="review-container animate-fade-in">
      <header className="page-header">
        <Link to="/dashboard/history" className="back-breadcrumb">
          <ChevronLeft size={20} /> Back to History
        </Link>
        <h1 className="page-title">Review: {attempt.examTitle}</h1>
        <div className="attempt-summary-row">
          <div className="summary-pill">
            <TrendingUp size={16} />
            <strong>{scorePercent}%</strong>
            <span>Score</span>
          </div>
          <div className="summary-pill">
            <CheckCircle size={16} />
            <strong>{correctCount}/{totalQuestions}</strong>
            <span>Correct</span>
          </div>
          <div className="summary-pill">
            <Clock size={16} />
            <strong>{timeSpentMin}m</strong>
            <span>Time</span>
          </div>

          <div className="redo-actions">
            <button 
              onClick={handleRedoFull}
              className="redo-btn primary"
            >
              Redo Full Exam
            </button>

            {scorePercent < 100 && (
              <button 
                onClick={handleRedoWrong}
                className="redo-btn secondary"
              >
                Redo Wrong Questions
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="review-list">
        {(attempt.questionsSnapshot || attempt.questions || []).map((q: any, i: number) => {
          const userAns = attempt.answers[i] || attempt.answers[q.id] || [];
          const isCorrect = userAns.length > 0 && 
            userAns.sort().join(',') === q.answers.sort().join(',');

          return (
            <div key={i} className={`review-card ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="review-q-head">
                <div className="q-status-icon">
                  {isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3>Q{i + 1}: {q.text}</h3>
                  <button 
                    className="ai-explain-btn"
                    onClick={() => handleAIExplain(q, i, userAns)}
                    disabled={explainLoading[i]}
                  >
                    {explainLoading[i] ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
                    {aiExplanations[i] ? 'Deep Insights Ready' : 'AI Medical Explanation'}
                  </button>
                </div>
              </div>

              <div className="review-options">
                {q.options.map((opt: any) => {
                  const isUserChoice = userAns.includes(opt.id);
                  const isCorrectChoice = q.answers.includes(opt.id);
                  
                  let statusClass = '';
                  if (isCorrectChoice) statusClass = 'correct-opt';
                  else if (isUserChoice && !isCorrectChoice) statusClass = 'wrong-opt';

                  return (
                    <div key={opt.id} className={`review-opt-row ${statusClass}`}>
                      <span className="opt-badge">{opt.label || opt.display}</span>
                      <span className="opt-text">{opt.text}</span>
                      {isCorrectChoice && <CheckCircle size={16} className="opt-status-icon" />}
                      {isUserChoice && !isCorrectChoice && <XCircle size={16} className="opt-status-icon" />}
                    </div>
                  );
                })}
              </div>

              {(aiExplanations[i] || q.explanation) && (
                <div className="explanation-box ai-style">
                  <div className="explanation-title">
                    <HelpCircle size={16} />
                    <span>{aiExplanations[i] ? 'AI Insight' : 'Explanation'}</span>
                  </div>
                  <div className="explanation-text" dir="auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiExplanations[i] || q.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .loading-screen {
          padding: 5rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .review-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .back-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.875rem;
          text-decoration: none;
          margin-bottom: 1rem;
        }
        .back-breadcrumb:hover { color: var(--primary); }
        
        .attempt-summary-row {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .summary-pill {
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 1rem;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
        }
        .summary-pill strong { font-size: 1.125rem; color: var(--text-main); }
        .summary-pill span { color: var(--text-muted); text-transform: uppercase; font-size: 0.7rem; font-weight: 700; }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .review-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          border-left: 6px solid #cbd5e1;
        }
        .review-card.is-correct { border-left-color: var(--success); }
        .review-card.is-wrong { border-left-color: var(--danger); }

        .review-q-head {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .review-q-head h3 { font-size: 1.125rem; font-weight: 700; color: var(--text-main); line-height: 1.4; }
        .q-status-icon {
          color: #cbd5e1;
          flex-shrink: 0;
        }
        .is-correct .q-status-icon { color: var(--success); }
        .is-wrong .q-status-icon { color: var(--danger); }

        .review-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .review-opt-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          position: relative;
        }
        .opt-badge {
          width: 24px;
          height: 24px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
        }
        .opt-text { flex: 1; font-size: 0.95rem; color: #475569; }
        .opt-status-icon { margin-left: auto; }

        .correct-opt {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }
        .correct-opt .opt-badge { background: var(--success); color: white; border-color: var(--success); }
        .correct-opt .opt-status-icon { color: var(--success); }

        .wrong-opt {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }
        .wrong-opt .opt-badge { background: var(--danger); color: white; border-color: var(--danger); }
        .wrong-opt .opt-status-icon { color: var(--danger); }

        .explanation-box {
          background: #e6ebf2;
          padding: 1.25rem;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
        }
        .explanation-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        .explanation-box p { font-size: 0.9rem; color: var(--text-main); line-height: 1.5; }

        .error-state {
          padding: 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .back-link {
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
        }

        .redo-actions {
          display: flex;
          gap: 0.75rem;
          margin-left: auto;
        }
        .redo-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .redo-btn.primary {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 10px var(--primary-glow);
        }
        .redo-btn.secondary {
          background: #ecfdf5;
          color: var(--success);
          border: 1px solid #bbf7d0;
        }
        .redo-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }
        
        .ai-explain-btn {
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .ai-explain-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          transform: scale(1.05);
        }
        
        .ai-explain-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .explanation-box.ai-style {
          background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
          border: 1px solid #dbeafe;
          box-shadow: var(--shadow-sm);
        }

        .explanation-text {
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .attempt-summary-row { flex-direction: column; }
          .redo-actions { margin-left: 0; width: 100%; }
          .redo-btn { flex: 1; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default ReviewAttempt;
