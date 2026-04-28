import React from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Trophy, 
  Medal, 
  Star,
  Target,
  Award,
  BookOpen
} from 'lucide-react';

const Leaderboard: React.FC = () => {
  const { vault } = useVault();

  const attempts = vault?.attempts || [];
  
  // Local leaderboard: group by exam title and pick best score
  const leaderboardData = React.useMemo(() => {
    const map: Record<string, any> = {};
    attempts.forEach(a => {
      if (!map[a.examId] || a.percent > map[a.examId].percent) {
        map[a.examId] = {
          title: a.examTitle,
          percent: a.percent,
          score: `${a.score}/${a.total}`,
          date: new Date(a.date).toLocaleDateString(),
          attempts: attempts.filter(x => x.examId === a.examId).length
        };
      }
    });
    return Object.values(map).sort((a, b) => b.percent - a.percent);
  }, [attempts]);

  return (
    <div className="leaderboard-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">Local Leaderboard</h1>
        <p className="page-subtitle">Your personal best scores across all exams</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <Trophy size={24} className="stat-icon gold" />
          <div className="stat-content">
            <span className="stat-label">Exams Completed</span>
            <span className="stat-value">{attempts.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <Target size={24} className="stat-icon blue" />
          <div className="stat-content">
            <span className="stat-label">Avg. Accuracy</span>
            <span className="stat-value">
              {attempts.length > 0 
                ? Math.round(attempts.reduce((acc, a) => acc + a.percent, 0) / attempts.length) 
                : 0}%
            </span>
          </div>
        </div>
        <div className="stat-card">
          <Award size={24} className="stat-icon green" />
          <div className="stat-content">
            <span className="stat-label">Top Performance</span>
            <span className="stat-value">
              {leaderboardData.length > 0 ? `${leaderboardData[0].percent}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="leaderboard-card card">
        <div className="card-head">
          <Star size={20} />
          <h2>Hall of Fame</h2>
        </div>

        <div className="leaderboard-table">
          <div className="table-header">
            <div className="col rank">Rank</div>
            <div className="col title">Exam Title</div>
            <div className="col score">Best Score</div>
            <div className="col date">Date</div>
            <div className="col count">Attempts</div>
          </div>

          <div className="table-body">
            {leaderboardData.length > 0 ? (
              leaderboardData.map((item, index) => (
                <div key={index} className="table-row">
                  <div className="col rank">
                    {index === 0 ? <Medal size={20} className="gold" /> : 
                     index === 1 ? <Medal size={20} className="silver" /> :
                     index === 2 ? <Medal size={20} className="bronze" /> :
                     index + 1}
                  </div>
                  <div className="col title"><strong>{item.title}</strong></div>
                  <div className="col score"><span className="percent-badge">{item.percent}%</span> {item.score}</div>
                  <div className="col date">{item.date}</div>
                  <div className="col count">{item.attempts}</div>
                </div>
              ))
            ) : (
              <div className="empty-table">
                <BookOpen size={48} />
                <p>No exam data available for the leaderboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="privacy-note">
        <Star size={14} />
        <span>This leaderboard is calculated locally based on your encrypted history. No data is shared online.</span>
      </div>

      <style>{`
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
        .col.title { flex: 2; }
        .col.score { flex: 1.5; display: flex; align-items: center; gap: 0.75rem; }
        .col.date { flex: 1; color: var(--text-muted); }
        .col.count { flex: 0 0 100px; text-align: center; }

        .percent-badge {
          background: var(--primary-light);
          color: var(--primary);
          padding: 0.2rem 0.5rem;
          border-radius: 0.4rem;
          font-weight: 700;
          font-size: 0.8rem;
        }

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
        }

        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr; }
          .col.date, .col.count { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
