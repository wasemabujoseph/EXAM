import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Trophy, 
  Medal, 
  Star,
  Target,
  Award,
  Loader2,
  Users,
  Calendar
} from 'lucide-react';
import { getAverageAccuracy, getHighestAccuracy, formatSafeDate, formatPercent, calculateAccuracy } from '../utils/robustHelpers';

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
        const avg = getAverageAccuracy(data);
        const top = getHighestAccuracy(data);
        setStats({ total, avg, top });
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Updating global rankings...</span></div>;

  return (
    <div className="leaderboard-page animate-fade-in">
      <header className="page-header-alt">
        <div className="header-info">
          <h1>Global Leaderboard</h1>
          <p>Top medical students across the platform.</p>
        </div>
        <div className="header-icon-wrap">
           <Trophy size={32} />
        </div>
      </header>

      <div className="leader-stats-grid">
        <div className="leader-stat-card">
          <div className="stat-icon-circle blue"><Users size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">Total Entries</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="leader-stat-card">
          <div className="stat-icon-circle green"><Target size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">Avg. Accuracy</span>
            <span className="stat-value">{formatPercent(stats.avg)}</span>
          </div>
        </div>
        <div className="leader-stat-card">
          <div className="stat-icon-circle gold"><Award size={20} /></div>
          <div className="stat-data">
            <span className="stat-label">Highest Score</span>
            <span className="stat-value">{formatPercent(stats.top)}</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-table-card">
        <div className="table-head">
           <Star size={18} />
           <h2>Rankings</h2>
        </div>

        <div className="leaderboard-responsive-list">
          {leaderboardData.length > 0 ? (
            leaderboardData.map((item, index) => {
              const percent = item.percent || calculateAccuracy(item.score, item.totalQuestions);
              const scoreDisplay = item.scoreDisplay || (item.totalQuestions ? `${item.score}/${item.totalQuestions}` : item.score);
              const isTopThree = index < 3;

              return (
                <div key={index} className={`leader-row ${isTopThree ? 'top-rank' : ''}`}>
                  <div className="rank-col">
                    {index === 0 ? <Medal size={24} className="medal-gold" /> : 
                     index === 1 ? <Medal size={24} className="medal-silver" /> :
                     index === 2 ? <Medal size={24} className="medal-bronze" /> :
                     <span className="rank-num">{index + 1}</span>}
                  </div>
                  
                  <div className="user-col">
                    <div className="user-avatar-placeholder">
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-name-info">
                       <span className="username text-ellipsis">{item.username}</span>
                       <span className="mobile-meta"><Calendar size={12} /> {formatSafeDate(item.createdAt || item.date)}</span>
                    </div>
                  </div>

                  <div className="score-col">
                    <div className="percent-pill">{formatPercent(percent)}</div>
                    <span className="raw-score-txt">{scoreDisplay}</span>
                  </div>

                  <div className="date-col">
                    <span>{formatSafeDate(item.createdAt || item.date)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-leaderboard">
               <Users size={48} />
               <p>No entries yet. Be the first to top the charts!</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .leaderboard-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .leader-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .leader-stat-card {
          background: var(--surface); padding: 1.5rem; border-radius: var(--radius-xl);
          border: 1px solid var(--border); display: flex; align-items: center; gap: 1.25rem;
          box-shadow: var(--shadow-sm);
        }
        .stat-icon-circle { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon-circle.blue { background: var(--primary-soft); color: var(--primary); }
        .stat-icon-circle.green { background: var(--success-soft); color: var(--success); }
        .stat-icon-circle.gold { background: var(--warning-soft); color: var(--warning); }
        .stat-data { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.75rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }
        .stat-value { font-size: 1.5rem; font-weight: 900; color: var(--text-strong); }

        .leaderboard-table-card {
          background: var(--surface); border-radius: var(--radius-2xl);
          border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-md);
        }
        .table-head { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem; color: var(--text-strong); }
        .table-head h2 { font-size: 1.1rem; margin: 0; }

        .leader-row {
          display: grid; grid-template-columns: 80px 1fr 180px 140px;
          align-items: center; padding: 1.25rem 2rem; border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }
        .leader-row:hover { background: var(--bg-soft); }
        .leader-row:last-child { border-bottom: none; }
        .leader-row.top-rank { background: var(--primary-soft-fade); }

        .rank-col { display: flex; justify-content: center; }
        .rank-num { font-size: 1.1rem; font-weight: 900; color: var(--text-soft); }
        .medal-gold { color: #fbbf24; }
        .medal-silver { color: #94a3b8; }
        .medal-bronze { color: #b45309; }

        .user-col { display: flex; align-items: center; gap: 1rem; }
        .user-avatar-placeholder {
          width: 36px; height: 36px; border-radius: 10px; background: var(--primary); color: white;
          display: flex; align-items: center; justify-content: center; font-weight: 800;
        }
        .user-name-info { display: flex; flex-direction: column; }
        .username { font-weight: 700; color: var(--text-strong); }
        .mobile-meta { display: none; font-size: 0.7rem; color: var(--text-soft); align-items: center; gap: 4px; }

        .score-col { display: flex; align-items: center; gap: 1rem; }
        .percent-pill {
          background: var(--bg-soft); color: var(--primary);
          padding: 4px 12px; border-radius: 8px; font-weight: 800; font-size: 0.9rem;
          border: 1px solid var(--border);
        }
        .raw-score-txt { font-size: 0.85rem; color: var(--text-soft); font-weight: 600; }

        .date-col { color: var(--text-soft); font-size: 0.9rem; font-weight: 600; }

        .empty-leaderboard { padding: 5rem 2rem; text-align: center; color: var(--text-soft); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

        @media (max-width: 992px) {
          .leader-row { grid-template-columns: 60px 1fr 140px; }
          .date-col { display: none; }
        }

        @media (max-width: 640px) {
          .leader-stats-grid { grid-template-columns: 1fr; }
          .leader-row { grid-template-columns: 50px 1fr 80px; padding: 1.25rem; }
          .score-col { flex-direction: column; align-items: flex-end; gap: 4px; }
          .raw-score-txt { display: none; }
          .mobile-meta { display: flex; }
          .user-col { gap: 0.75rem; }
          .user-avatar-placeholder { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
