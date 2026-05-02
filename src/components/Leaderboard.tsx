import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { api } from '../lib/api';
import { 
  Trophy, 
  Medal, 
  Star,
  Target,
  Award,
  BookOpen,
  Loader2,
  Users
} from 'lucide-react';

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avg: 0, top: 0 });

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await api.getLeaderboard();
        setLeaderboardData(data);
        
        const total = data.length;
        const avg = data.length > 0 ? Math.round(data.reduce((acc: number, cur: any) => acc + (cur.score/cur.totalQuestions)*100, 0) / data.length) : 0;
        const top = data.length > 0 ? Math.round((data[0].score / data[0].totalQuestions) * 100) : 0;
        setStats({ total, avg, top });
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Loading rankings...</div>;

  return (
    <div className="leaderboard-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Global Leaderboard</h1>
        <p className="page-subtitle">Top performances across the platform</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <Trophy size={24} className="stat-icon gold" />
          <div className="stat-content">
            <span className="stat-label">Total Entries</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <Target size={24} className="stat-icon blue" />
          <div className="stat-content">
            <span className="stat-label">Avg. Accuracy</span>
            <span className="stat-value">{stats.avg}%</span>
          </div>
        </div>
        <div className="stat-card">
          <Award size={24} className="stat-icon green" />
          <div className="stat-content">
            <span className="stat-label">Top Performance</span>
            <span className="stat-value">{stats.top}%</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-card card">
        <div className="card-head">
          <Star size={20} />
          <h2>Cloud Rankings</h2>
        </div>

        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col rank">Rank</div>
            <div className="col user">User</div>
            <div className="col score">Score</div>
            <div className="col date">Date</div>
          </div>

          <div className="table-body">
            {leaderboardData.length > 0 ? (
              leaderboardData.map((item, index) => {
                const percent = item.percent || Math.round((item.score / item.totalQuestions) * 100);
                const scoreDisplay = item.scoreDisplay || (item.totalQuestions ? `${item.score}/${item.totalQuestions}` : item.score);
                
                return (
                  <div key={index} className="table-row">
                    <div className="col rank">
                      {index === 0 ? <Medal size={20} className="gold" /> : 
                       index === 1 ? <Medal size={20} className="silver" /> :
                       index === 2 ? <Medal size={20} className="bronze" /> :
                       index + 1}
                    </div>
                    <div className="col user">
                      <div className="user-info">
                        <Users size={14} className="user-icon" />
                        <strong>{item.username}</strong>
                      </div>
                    </div>
                    <div className="col score">
                      <span className="percent-badge">{percent}%</span> 
                      <span className="raw-score">{scoreDisplay}</span>
                    </div>
                    <div className="col date">{new Date(item.createdAt || item.date).toLocaleDateString()}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty-table">
                <BookOpen size={48} />
                <p>No rankings available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="privacy-note">
        <Star size={14} />
        <span>Data is synchronized with Google Sheets.</span>
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
        .leaderboard-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .stat-icon { padding: 0.75rem; border-radius: 1rem; }
        .stat-icon.gold { background: #fffbeb; color: #b45309; }
        .stat-icon.blue { background: #eff6ff; color: #1d4ed8; }
        .stat-icon.green { background: #ecfdf5; color: #047857; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }

        .leaderboard-card {
          background: white;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        .card-head {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #f8fafc;
        }
        .card-head h2 { font-size: 1.125rem; font-weight: 700; color: var(--text-main); margin: 0; }

        .leaderboard-table {
          display: flex;
          flex-direction: column;
        }
        .table-header {
          display: flex;
          padding: 1rem 1.5rem;
          background: #f1f5f9;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .table-row {
          display: flex;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
          font-size: 0.9375rem;
          transition: background 0.2s;
        }
        .table-row:hover { background: #f8fafc; }
        .table-row:last-child { border-bottom: none; }
        
        .col { flex: 1; }
        .col.rank { flex: 0 0 80px; display: flex; justify-content: center; font-weight: 800; color: #94a3b8; }
        .col.user { flex: 2; }
        .col.score { flex: 1.5; display: flex; align-items: center; gap: 0.75rem; }
        .col.date { flex: 1; color: var(--text-muted); }

        .user-info { display: flex; align-items: center; gap: 0.5rem; }
        .user-icon { color: #94a3b8; }

        .percent-badge {
          background: var(--primary-light);
          color: var(--primary);
          padding: 0.2rem 0.5rem;
          border-radius: 0.4rem;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .raw-score { font-size: 0.85rem; color: #64748b; }

        .gold { color: #fbbf24; }
        .silver { color: #94a3b8; }
        .bronze { color: #b45309; }

        .empty-table {
          padding: 4rem 2rem;
          text-align: center;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .privacy-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr; }
          .col.date { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
