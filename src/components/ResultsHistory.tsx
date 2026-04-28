import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  History, 
  ChevronRight, 
  Trash2, 
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

const ResultsHistory: React.FC = () => {
  const { vault, updateVault } = useVault();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (!vault || !confirm('Delete this attempt from history?')) return;
    const newVault = {
      ...vault,
      attempts: vault.attempts.filter(a => a.id !== id)
    };
    await updateVault(newVault);
  };

  const attempts = vault?.attempts || [];

  return (
    <div className="history-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Exam History</h1>
        <p className="page-subtitle">Review your past performance and metrics</p>
      </header>

      {attempts.length > 0 ? (
        <div className="history-list">
          {attempts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((attempt) => (
            <div key={attempt.id} className="attempt-card">
              <div className="attempt-status" style={{ 
                background: attempt.percent >= 60 ? 'var(--success)' : 'var(--danger)' 
              }}></div>
              
              <div className="attempt-main">
                <div className="attempt-info">
                  <h3>{attempt.examTitle}</h3>
                  <div className="attempt-meta">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>{new Date(attempt.date).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{Math.round(attempt.timeMs / 1000 / 60)} min spent</span>
                    </div>
                  </div>
                </div>

                <div className="attempt-stats">
                  <div className="stat-pill">
                    <span className="stat-label">Score</span>
                    <span className="stat-value">{attempt.score}/{attempt.total}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-label">Percent</span>
                    <span className="stat-value">{attempt.percent}%</span>
                  </div>
                </div>

                <div className="attempt-actions">
                  <button 
                    className="review-btn"
                    onClick={() => navigate(`/dashboard/review/${attempt.id}`)}
                  >
                    Review <ChevronRight size={16} />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(attempt.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <History size={64} />
          <h2>No attempts recorded</h2>
          <p>Complete an exam to see your results history here.</p>
        </div>
      )}

      <style>{`
        .history-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .attempt-card {
          background: white;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          overflow: hidden;
          display: flex;
          transition: all 0.2s;
        }
        .attempt-card:hover { border-color: var(--primary); transform: translateX(4px); }
        .attempt-status {
          width: 6px;
        }
        .attempt-main {
          flex: 1;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .attempt-info {
          flex: 1;
        }
        .attempt-info h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .attempt-meta {
          display: flex;
          gap: 1rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .attempt-stats {
          display: flex;
          gap: 1rem;
        }
        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 0.75rem;
        }
        .stat-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .attempt-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .review-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
        }
        .delete-btn {
          color: #94a3b8;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .delete-btn:hover { color: var(--danger); }

        .empty-state {
          padding: 5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          color: #94a3b8;
        }
        @media (max-width: 768px) {
          .attempt-main { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .attempt-stats { width: 100%; }
          .stat-pill { flex: 1; }
          .attempt-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

export default ResultsHistory;
