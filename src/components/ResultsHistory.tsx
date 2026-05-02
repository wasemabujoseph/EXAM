import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { api } from '../lib/api';
import { 
  History, 
  ChevronRight, 
  Trash2, 
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';

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

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Loading history...</div>;

  return (
    <div className="history-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Exam History</h1>
        <p className="page-subtitle">Review your past performance and metrics</p>
      </header>

      {attempts.length > 0 ? (
        <div className="history-list">
          {attempts.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()).map((attempt) => (
            <div key={attempt.id} className="attempt-card">
              <div className="attempt-status" style={{ 
                background: (attempt.percent >= 60 || (attempt.score / attempt.totalQuestions >= 0.6)) ? 'var(--success)' : 'var(--danger)' 
              }}></div>
              
              <div className="attempt-main">
                <div className="attempt-info">
                  <h3>{attempt.examTitle}</h3>
                  <div className="attempt-meta">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>{new Date(attempt.createdAt || attempt.date).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <Clock size={14} />
                      <span>{attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) : Math.round(attempt.timeMs / 1000 / 60)} min spent</span>
                    </div>
                  </div>
                </div>

                <div className="attempt-stats">
                  <div className="stat-pill">
                    <span className="stat-label">Score</span>
                    <span className="stat-value">{attempt.score}/{attempt.totalQuestions || attempt.total}</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-label">Percent</span>
                    <span className="stat-value">{attempt.percent || Math.round((attempt.score / (attempt.totalQuestions || attempt.total)) * 100)}%</span>
                  </div>
                </div>

                <div className="attempt-actions">
                  <button 
                    className="review-btn"
                    onClick={() => navigate(`/dashboard/review/${attempt.id}`)}
                  >
                    Review <ChevronRight size={16} />
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
