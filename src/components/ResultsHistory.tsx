import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  History, 
  ChevronRight, 
  Calendar,
  Clock,
  Loader2,
  Trophy,
  Activity
} from 'lucide-react';
import { formatSafeDate, formatPercent, calculateAccuracy } from '../utils/robustHelpers';

const ResultsHistory: React.FC = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAttempts = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMyAttempts();
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load attempts', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttempts();
  }, []);

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Fetching your performance history...</span></div>;

  const sortedAttempts = [...attempts].sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

  return (
    <div className="history-page animate-fade-in">
      <header className="page-header-alt">
        <div className="header-info">
          <h1>Completed Exams</h1>
          <p>Analyze your progress and review past attempts.</p>
        </div>
        <div className="header-stat-badges">
          <div className="badge badge-primary">
            <Activity size={14} /> <span>{attempts.length} Total</span>
          </div>
        </div>
      </header>

      {attempts.length > 0 ? (
        <div className="history-list-wrapper">
          {sortedAttempts.map((attempt) => {
            const totalQs = attempt.totalQuestions || attempt.total || 0;
            const percentage = attempt.percent !== undefined && attempt.percent !== null && !isNaN(attempt.percent) ? attempt.percent : calculateAccuracy(attempt.score, totalQs);
            const isPass = percentage >= 60;
            const durationMin = attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) : (attempt.timeMs ? Math.round(attempt.timeMs / 1000 / 60) : null);

            // Removed local formatDate as we use the imported one

            return (
              <div key={attempt.id} className="history-item-card">
                <div className={`pass-indicator ${isPass ? 'pass' : 'fail'}`} />
                
                <div className="history-item-content">
                  <div className="item-main">
                    <h3 className="text-ellipsis">{attempt.examTitle}</h3>
                    <div className="item-meta-row">
                      <div className="meta-unit">
                        <Calendar size={14} />
                        <span>{formatSafeDate(attempt.createdAt || attempt.date)}</span>
                      </div>
                      <div className="meta-unit">
                        <Clock size={14} />
                        <span>{durationMin !== null ? `${durationMin} min spent` : 'Not recorded'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="item-stats-row">
                    <div className="compact-stat">
                      <span className="compact-label">Score</span>
                      <span className="compact-value">{attempt.score}/{totalQs}</span>
                    </div>
                    <div className="compact-stat">
                      <span className="compact-label">Result</span>
                      <span className="compact-value percentage" style={{ color: isPass ? 'var(--success)' : 'var(--danger)' }}>{formatPercent(percentage)}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button 
                      className="btn-review-link"
                      onClick={() => navigate(`/dashboard/review/${attempt.id}`)}
                    >
                      Review <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-history-state">
          <div className="empty-history-icon">
            <History size={48} />
          </div>
          <h2>No completed exams yet</h2>
          <p>Complete an exam to review your answers, study your mistakes, and track your progress.</p>
          <button className="primary-button" onClick={() => navigate('/dashboard/curriculum')}>
            Go to My Exams
          </button>
        </div>
      )}

      <style>{`
        .history-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .page-header-alt {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          background: var(--surface); padding: 1.5rem 2rem; border-radius: var(--radius-xl);
          border: 1px solid var(--border);
        }
        .header-info h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .header-info p { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
        
        .header-stat-badges { display: flex; gap: 0.5rem; }
        .badge { display: flex; align-items: center; gap: 0.5rem; padding: 6px 12px; border-radius: 99px; font-weight: 800; font-size: 0.8rem; }
        .badge-primary { background: var(--primary-soft); color: var(--primary); }

        .history-list-wrapper { display: flex; flex-direction: column; gap: 1rem; }

        .history-item-card {
          background: var(--surface); border-radius: var(--radius-xl);
          border: 1px solid var(--border); overflow: hidden;
          display: flex; transition: all 0.2s;
        }
        .history-item-card:hover { transform: translateX(8px); border-color: var(--primary); box-shadow: var(--shadow-md); }

        .pass-indicator { width: 6px; flex-shrink: 0; }
        .pass-indicator.pass { background: var(--success); }
        .pass-indicator.fail { background: var(--danger); }

        .history-item-content {
          flex: 1; padding: 1.25rem 2rem;
          display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 2rem;
        }

        .item-main h3 { font-size: 1.1rem; color: var(--text-strong); margin-bottom: 0.5rem; }
        .item-meta-row { display: flex; gap: 1.5rem; }
        .meta-unit { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

        .item-stats-row { display: flex; gap: 2rem; }
        .compact-stat { display: flex; flex-direction: column; align-items: center; min-width: 60px; }
        .compact-label { font-size: 0.65rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }
        .compact-value { font-size: 1.1rem; font-weight: 800; color: var(--text-strong); }
        .compact-value.percentage { font-size: 1.25rem; }

        .btn-review-link {
          background: var(--bg-soft); color: var(--primary);
          padding: 0 1.25rem; height: 44px; border-radius: var(--radius-lg);
          font-weight: 800; display: flex; align-items: center; gap: 0.5rem;
          transition: all 0.2s;
        }
        .btn-review-link:hover { background: var(--primary); color: white; }

        .empty-history-state {
          background: var(--surface); padding: 5rem 2rem; border-radius: var(--radius-2xl);
          border: 1px dashed var(--border-strong); text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        }
        .empty-history-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--bg-soft); color: var(--text-soft); display: flex; align-items: center; justify-content: center; }
        .empty-history-state h2 { font-size: 1.5rem; }
        .empty-history-state p { color: var(--text-muted); max-width: 400px; font-weight: 600; }
        .primary-button { background: var(--primary); color: white; padding: 0 2.5rem; height: 52px; border-radius: var(--radius-xl); font-weight: 800; box-shadow: var(--shadow-md); }

        @media (max-width: 1024px) {
          .history-item-content { grid-template-columns: 1fr; gap: 1rem; padding: 1.25rem; }
          .item-stats-row { justify-content: space-between; border-top: 1px solid var(--border-soft); border-bottom: 1px solid var(--border-soft); padding: 0.75rem 0; width: 100%; }
          .btn-review-link { width: 100%; justify-content: center; }
          .item-meta-row { flex-direction: row; gap: 1.5rem; }
          .meta-unit { font-size: 0.75rem; }
        }

        @media (max-width: 480px) {
          .item-meta-row { flex-direction: column; gap: 0.25rem; }
          .item-stats-row { gap: 1rem; }
          .compact-value { font-size: 1rem; }
          .compact-value.percentage { font-size: 1.1rem; }
        }

        @media (max-width: 640px) {
          .page-header-alt { flex-direction: column; align-items: flex-start; padding: 1.25rem; }
          .header-stat-badges { width: 100%; }
          .badge { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default ResultsHistory;
