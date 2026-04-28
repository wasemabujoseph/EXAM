import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  ChevronLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const ReviewAttempt: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { vault } = useVault();

  const attempt = vault?.attempts.find(a => a.id === attemptId);

  if (!attempt) {
    return (
      <div className="error-state">
        <AlertCircle size={48} />
        <h2>Attempt not found</h2>
        <Link to="/dashboard/history" className="back-link">Back to History</Link>
      </div>
    );
  }

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
            <strong>{attempt.percent}%</strong>
            <span>Score</span>
          </div>
          <div className="summary-pill">
            <CheckCircle size={16} />
            <strong>{attempt.score}/{attempt.total}</strong>
            <span>Correct</span>
          </div>
          <div className="summary-pill">
            <Clock size={16} />
            <strong>{Math.round(attempt.timeMs / 1000 / 60)}m</strong>
            <span>Time</span>
          </div>
        </div>
      </header>

      <div className="review-list">
        {attempt.questionsSnapshot.map((q, i) => {
          const userAns = attempt.answers[i] || [];
          const isCorrect = userAns.length > 0 && 
            userAns.sort().join(',') === q.answers.sort().join(',');

          return (
            <div key={i} className={`review-card ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="review-q-head">
                <div className="q-status-icon">
                  {isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                </div>
                <h3>Q{i + 1}: {q.text}</h3>
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

              {q.explanation && (
                <div className="explanation-box">
                  <div className="explanation-title">
                    <HelpCircle size={16} />
                    <span>Explanation</span>
                  </div>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
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
          background: #eff6ff;
          padding: 1.25rem;
          border-radius: 0.75rem;
          border: 1px solid #dbeafe;
        }
        .explanation-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        .explanation-box p { font-size: 0.9rem; color: #1e3a8a; line-height: 1.5; }
      `}</style>
    </div>
  );
};

export default ReviewAttempt;
