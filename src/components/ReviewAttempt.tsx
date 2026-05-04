import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Sparkles,
  RotateCcw
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
      // Robustly get correct answers
      const qAnswers = q.answers || q.correct_answers || (q.correctAnswer ? [q.correctAnswer] : []) || (typeof q.answer !== 'undefined' ? [q.options[q.answer]?.id || q.answer] : []);
      
      const questionContext = {
        questionText: q.text || q.question || '',
        options: q.options || [],
        correctOption: Array.isArray(qAnswers) ? qAnswers.join(',') : String(qAnswers),
        studentOption: userAns.join(','),
        isCorrect: userAns.length > 0 && userAns.sort().join(',') === [...qAnswers].sort().join(',')
      };

      const result = await api.aiExplain(questionContext);
      if (result && result.content) {
        setAiExplanations(prev => ({ ...prev, [index]: result.content }));
      } else {
        throw new Error('AI returned an empty explanation. Please try again.');
      }
    } catch (err: any) {
      console.error('AI Insight Error:', err);
      alert(err.message || 'AI Insight could not load. Please try again.');
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
      const qAnswers = q.answers || q.correct_answers || [q.correctAnswer] || (typeof q.answer !== 'undefined' ? [q.options[q.answer]?.id || q.answer] : []) || [];
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

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Loading performance report...</span></div>;
  if (!attempt) return <div className="page-error"><AlertCircle size={48} /> <h2>Review data not found</h2><Link to="/dashboard/history">Return to Completed Exams</Link></div>;

  const scorePercent = attempt.percent || Math.round((attempt.score / (attempt.totalQuestions || attempt.total)) * 100);
  const timeSpentMin = attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) : Math.round(attempt.timeMs / 1000 / 60);

  return (
    <div className="review-page animate-fade-in">
      <header className="review-header">
        <Link to="/dashboard/history" className="back-link-nav">
          <ChevronLeft size={20} /> Back to Completed Exams
        </Link>
        <div className="review-title-section">
          <h1>{attempt.examTitle}</h1>
          <p>Attempted on {new Date(attempt.createdAt || attempt.date).toLocaleDateString()}</p>
        </div>

        <div className="review-stats-summary">
          <div className="summary-card">
            <div className="summary-icon score"><TrendingUp size={20} /></div>
            <div className="summary-val">
              <span className="val-main">{scorePercent}%</span>
              <span className="val-label">Accuracy</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon qcount"><CheckCircle size={20} /></div>
            <div className="summary-val">
              <span className="val-main">{attempt.score}/{attempt.totalQuestions || attempt.total}</span>
              <span className="val-label">Correct</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon time"><Clock size={20} /></div>
            <div className="summary-val">
              <span className="val-main">{timeSpentMin || 1}m</span>
              <span className="val-label">Duration</span>
            </div>
          </div>
        </div>

        <div className="review-header-actions">
           <button className="btn-redo-alt" onClick={handleRedoFull}><RotateCcw size={18} /> Redo Full</button>
           {scorePercent < 100 && (
             <button className="btn-redo-main" onClick={handleRedoWrong}><Sparkles size={18} /> Redo Mistakes</button>
           )}
        </div>
      </header>

      <div className="review-list-stack">
        {(attempt.questionsSnapshot || attempt.questions || []).map((q: any, i: number) => {
          const userAns = attempt.answers[i] || attempt.answers[q.id] || [];
          const qAnswers = q.answers || q.correct_answers || [q.correctAnswer] || (typeof q.answer !== 'undefined' ? [q.options[q.answer]?.id || q.answer] : []) || [];
          const isCorrect = userAns.length > 0 && userAns.sort().join(',') === [...qAnswers].sort().join(',');

          return (
            <div key={i} className={`review-q-card ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="review-q-header">
                <div className="q-status-badge">
                  {isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  <span>Question {i + 1}</span>
                </div>
                <button 
                  className={`ai-btn ${aiExplanations[i] ? 'has-data' : ''} ${explainLoading[i] ? 'is-loading' : ''}`}
                  onClick={() => handleAIExplain(q, i, userAns)}
                  disabled={explainLoading[i]}
                >
                  {explainLoading[i] ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>{explainLoading[i] ? 'Generating...' : (aiExplanations[i] ? 'AI Insight Ready' : 'AI Insight')}</span>
                </button>
              </div>

              <div className="review-q-body">
                <p className="q-text-large text-wrap-safe">{q.text}</p>
                
                <div className="review-options-list">
                  {q.options.map((opt: any) => {
                    const isUserChoice = userAns.includes(opt.id);
                    const isCorrectChoice = q.answers.includes(opt.id);
                    
                    let state = '';
                    if (isCorrectChoice) state = 'correct';
                    else if (isUserChoice) state = 'wrong';

                    return (
                      <div key={opt.id} className={`review-opt-item ${state}`}>
                        <span className="opt-marker">{opt.id}</span>
                        <span className="opt-text">{opt.text}</span>
                        <div className="opt-icon-wrap">
                           {isCorrectChoice && <CheckCircle size={18} />}
                           {isUserChoice && !isCorrectChoice && <XCircle size={18} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(aiExplanations[i] || q.explanation) && (
                  <div className="explanation-area">
                    <div className="exp-header">
                       <HelpCircle size={16} /> 
                       <span>{aiExplanations[i] ? 'AI Detailed Explanation' : 'Explanation'}</span>
                    </div>
                    <div className="exp-content markdown-body" dir="auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiExplanations[i] || q.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .review-page { display: flex; flex-direction: column; gap: 3rem; }

        .review-header {
          background: var(--surface); padding: 2.5rem; border-radius: var(--radius-2xl);
          border: 1px solid var(--border); box-shadow: var(--shadow-premium);
          display: flex; flex-direction: column; gap: 2rem;
        }

        .back-link-nav { display: flex; align-items: center; gap: 0.5rem; color: var(--text-soft); font-weight: 700; font-size: 0.9rem; text-decoration: none; }
        .back-link-nav:hover { color: var(--primary); }

        .review-title-section h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
        .review-title-section p { color: var(--text-muted); font-weight: 600; }

        .review-stats-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .summary-card {
          background: var(--bg-soft); padding: 1.25rem; border-radius: var(--radius-xl);
          display: flex; align-items: center; gap: 1rem; border: 1px solid var(--border);
        }
        .summary-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .summary-icon.score { background: var(--primary-soft); color: var(--primary); }
        .summary-icon.qcount { background: var(--success-soft); color: var(--success); }
        .summary-icon.time { background: var(--accent-soft); color: var(--accent); }
        .summary-val { display: flex; flex-direction: column; }
        .val-main { font-size: 1.25rem; font-weight: 900; color: var(--text-strong); }
        .val-label { font-size: 0.7rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }

        .review-header-actions { display: flex; gap: 1rem; }
        .btn-redo-main { flex: 1; background: var(--primary); color: white; height: 48px; border-radius: var(--radius-lg); font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; box-shadow: var(--shadow-md); }
        .btn-redo-alt { background: var(--surface); border: 2px solid var(--border); color: var(--text-strong); padding: 0 1.5rem; height: 48px; border-radius: var(--radius-lg); font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; }

        .review-list-stack { display: flex; flex-direction: column; gap: 2rem; }
        .review-q-card {
          background: var(--surface); border-radius: var(--radius-2xl);
          border: 1px solid var(--border); overflow: hidden;
          display: flex; flex-direction: column;
        }
        .review-q-card.is-correct { border-left: 8px solid var(--success); }
        .review-q-card.is-wrong { border-left: 8px solid var(--danger); }

        .review-q-header {
          padding: 1.5rem 2rem; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .q-status-badge { display: flex; align-items: center; gap: 1rem; font-weight: 800; color: var(--text-soft); }
        .is-correct .q-status-badge { color: var(--success); }
        .is-wrong .q-status-badge { color: var(--danger); }

        .ai-btn {
          background: var(--primary-soft); color: var(--primary);
          padding: 0 1.25rem; height: 38px; border-radius: 99px;
          display: flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 0.85rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer; border: 1px solid transparent;
        }
        .ai-btn:hover:not(:disabled) { background: var(--primary); color: white; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .ai-btn.has-data { background: var(--success-soft); color: var(--success); border-color: var(--success); }
        .ai-btn.has-data:hover:not(:disabled) { background: var(--success); color: white; }
        .ai-btn.is-loading { opacity: 0.8; cursor: wait; }

        .review-q-body { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        .q-text-large { font-size: 1.25rem; font-weight: 700; color: var(--text-strong); line-height: 1.5; }

        .review-options-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .review-opt-item {
          display: flex; align-items: center; gap: 1.25rem;
          padding: 1rem 1.5rem; border-radius: var(--radius-xl);
          background: var(--bg-soft); border: 1px solid var(--border);
        }
        .review-opt-item.correct { background: var(--success-soft); border-color: var(--success); color: var(--success-text); }
        .review-opt-item.wrong { background: var(--danger-soft); border-color: var(--danger); color: var(--danger-text); }

        .opt-marker {
          width: 28px; height: 28px; flex-shrink: 0;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.8rem;
        }
        .review-opt-item.correct .opt-marker { background: var(--success); color: white; border-color: var(--success); }
        .review-opt-item.wrong .opt-marker { background: var(--danger); color: white; border-color: var(--danger); }
        
        .opt-text { flex: 1; font-weight: 600; }
        .opt-icon-wrap { width: 24px; display: flex; justify-content: flex-end; }

        .explanation-area {
          background: var(--bg-soft); padding: 1.5rem; border-radius: var(--radius-xl);
          border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1rem;
        }
        .exp-header { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; color: var(--primary); font-size: 0.85rem; text-transform: uppercase; }
        .exp-content { font-size: 0.95rem; color: var(--text-main); line-height: 1.7; }

        @media (max-width: 768px) {
          .review-header { padding: 1.25rem; gap: 1.25rem; }
          .review-stats-summary { grid-template-columns: 1fr; gap: 0.75rem; }
          .review-header-actions { flex-direction: column; gap: 0.75rem; }
          .btn-redo-main, .btn-redo-alt { width: 100%; height: 44px; font-size: 0.9rem; }
          .review-q-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .ai-btn { width: 100%; justify-content: center; }
          .review-q-body { padding: 1.25rem; }
          .q-text-large { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
};

export default ReviewAttempt;
