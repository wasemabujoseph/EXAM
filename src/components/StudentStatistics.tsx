import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  BookOpen, 
  CheckCircle, 
  BarChart3,
  Calendar,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentStatistics: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    avgScore: 0,
    totalMinutes: 0,
    bestScore: 0,
    recentScore: 0
  });
  const [newExams, setNewExams] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attemptsData, publicExams] = await Promise.all([
          api.getMyAttempts(),
          api.getPublicExams()
        ]);

        setAttempts(attemptsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setNewExams(publicExams.slice(0, 3));
        
        if (attemptsData.length > 0) {
          const totalScore = attemptsData.reduce((acc: number, curr: any) => acc + (parseFloat(curr.percentage) || 0), 0);
          const totalSeconds = attemptsData.reduce((acc: number, curr: any) => acc + (parseInt(curr.duration_seconds) || 0), 0);
          const best = Math.max(...attemptsData.map((curr: any) => parseFloat(curr.percentage) || 0));
          
          setStats({
            totalAttempts: attemptsData.length,
            avgScore: Math.round(totalScore / attemptsData.length),
            totalMinutes: Math.round(totalSeconds / 60),
            bestScore: best,
            recentScore: parseFloat(attemptsData[0].percentage) || 0
          });
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="stats-loading">
        <div className="shimmer-card"></div>
        <div className="shimmer-grid">
          <div className="shimmer-item"></div>
          <div className="shimmer-item"></div>
          <div className="shimmer-item"></div>
          <div className="shimmer-item"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container animate-fade-in">
      <header className="stats-header-section">
        <div className="header-text">
          <div className="badge-ai">
            <Sparkles size={14} />
            <span>Personalized AI Insights Ready</span>
          </div>
          <h1>Learning Dashboard</h1>
          <p>Track your progress and medical academic excellence</p>
        </div>
        
        <div className="main-stat-card glass">
          <div className="stat-main-info">
            <span className="label">Overall Proficiency</span>
            <div className="value-row">
              <span className="value">{stats.avgScore}%</span>
              <div className={`trend ${stats.avgScore >= 70 ? 'up' : 'stable'}`}>
                <TrendingUp size={16} />
                <span>{stats.avgScore >= 70 ? '+12%' : 'Stable'}</span>
              </div>
            </div>
            <div className="progress-track-large">
              <div className="progress-fill-large" style={{ width: `${stats.avgScore}%` }}></div>
            </div>
          </div>
          <div className="stat-visual">
            <BarChart3 size={120} className="chart-icon-bg" />
          </div>
        </div>
      </header>

      <div className="stats-grid-small">
        <div className="mini-card glass">
          <div className="icon-wrap blue"><BookOpen size={20} /></div>
          <div className="data">
            <span className="v">{stats.totalAttempts}</span>
            <span className="l">Exams Taken</span>
          </div>
        </div>
        <div className="mini-card glass">
          <div className="icon-wrap green"><Clock size={20} /></div>
          <div className="data">
            <span className="v">{stats.totalMinutes}m</span>
            <span className="l">Focus Time</span>
          </div>
        </div>
        <div className="mini-card glass">
          <div className="icon-wrap gold"><Award size={20} /></div>
          <div className="data">
            <span className="v">{stats.bestScore}%</span>
            <span className="l">Best Score</span>
          </div>
        </div>
        <div className="mini-card glass">
          <div className="icon-wrap purple"><CheckCircle size={20} /></div>
          <div className="data">
            <span className="v">{stats.recentScore}%</span>
            <span className="l">Last Score</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-split">
        <section className="recent-activity card glass">
          <div className="card-head">
            <h3>Recent Attempts</h3>
            <Link to="/dashboard/history" className="view-all">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="activity-list">
            {attempts.length > 0 ? (
              attempts.slice(0, 5).map((attempt, i) => (
                <div key={i} className="activity-item">
                  <div className={`score-badge ${attempt.percentage >= 70 ? 'pass' : 'fail'}`}>
                    {attempt.percentage}%
                  </div>
                  <div className="activity-info">
                    <h4>{attempt.examTitle || 'Medical Exam'}</h4>
                    <div className="meta">
                      <Calendar size={12} />
                      <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link to={`/dashboard/review/${attempt.id}`} className="review-link">Review</Link>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <p>No attempts yet. Start your first exam!</p>
                <Link to="/dashboard/curriculum" className="btn-primary-small">Browse Curriculum</Link>
              </div>
            )}
          </div>
        </section>

        <section className="recommendations card glass">
          <div className="card-head">
            <h3>New Added Exams</h3>
          </div>
          <div className="new-exams-list">
            {newExams.map((exam, i) => (
              <div key={i} className="new-exam-item">
                <div className="exam-icon-small"><Zap size={16} /></div>
                <div className="exam-text">
                  <h4>{exam.title}</h4>
                  <p>{exam.subject} • {exam.grade}</p>
                </div>
                <Link to={`/dashboard/exam/public/${exam.id}`} className="start-tiny">Start</Link>
              </div>
            ))}
          </div>

          <div className="dashboard-roadmap">
            <h3>Upcoming Features</h3>
            <div className="roadmap-grid">
              <div className="roadmap-item">
                <span className="dot"></span>
                <span>Anatomy 3D Viewer</span>
              </div>
              <div className="roadmap-item">
                <span className="dot"></span>
                <span>Live Peer Battles</span>
              </div>
              <div className="roadmap-item">
                <span className="dot"></span>
                <span>Clinical Case Simulator</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .stats-container {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          padding-bottom: 5rem;
        }

        .stats-header-section {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 3rem;
          align-items: center;
        }

        .header-text h1 {
          font-size: 3.5rem;
          font-weight: 900;
          color: var(--text-main);
          margin: 0.5rem 0;
          letter-spacing: -0.05em;
        }

        .header-text p {
          font-size: 1.2rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .badge-ai {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .main-stat-card {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          border-radius: 2.5rem;
          padding: 3rem;
          color: white;
          display: flex;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
        }

        .stat-main-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          z-index: 2;
          flex: 1;
        }

        .stat-main-info .label {
          color: #94A3B8;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
        }

        .value-row {
          display: flex;
          align-items: baseline;
          gap: 1.5rem;
        }

        .value-row .value {
          font-size: 5rem;
          font-weight: 900;
          line-height: 1;
        }

        .trend {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 99px;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .trend.up { background: rgba(16, 185, 129, 0.2); color: #10B981; }
        .trend.stable { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }

        .progress-track-large {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          margin-top: 1rem;
        }

        .progress-fill-large {
          height: 100%;
          background: linear-gradient(90deg, #6366F1, #8B5CF6);
          border-radius: 6px;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }

        .chart-icon-bg {
          position: absolute;
          right: -20px;
          bottom: -20px;
          color: rgba(255, 255, 255, 0.05);
          transform: rotate(-15deg);
        }

        .stats-grid-small {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .mini-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: 1px solid var(--border);
          transition: transform 0.3s;
        }

        .mini-card:hover { transform: translateY(-5px); }

        .icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-wrap.blue { background: #EFF6FF; color: #3B82F6; }
        .icon-wrap.green { background: #ECFDF5; color: #10B981; }
        .icon-wrap.gold { background: #FFFBEB; color: #D97706; }
        .icon-wrap.purple { background: #FAF5FF; color: #8B5CF6; }

        .data { display: flex; flex-direction: column; }
        .data .v { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
        .data .l { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

        .dashboard-content-split {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
        }

        .card {
          background: white;
          padding: 2rem;
          border-radius: 2rem;
          border: 1px solid var(--border);
        }

        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .card-head h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
        .view-all { color: var(--primary); font-weight: 700; font-size: 0.9rem; text-decoration: none; display: flex; align-items: center; gap: 0.25rem; }

        .activity-list { display: flex; flex-direction: column; gap: 1rem; }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem;
          border-radius: 1.25rem;
          background: #F8FAFC;
          transition: background 0.2s;
        }
        .activity-item:hover { background: #F1F5F9; }

        .score-badge {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.9rem;
        }
        .score-badge.pass { background: #ECFDF5; color: #059669; border: 2px solid #10B981; }
        .score-badge.fail { background: #FEF2F2; color: #DC2626; border: 2px solid #EF4444; }

        .activity-info { flex: 1; }
        .activity-info h4 { font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
        .activity-info .meta { display: flex; align-items: center; gap: 0.4rem; color: var(--text-dim); font-size: 0.8rem; font-weight: 600; }

        .review-link {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-main);
          text-decoration: none;
        }
        .review-link:hover { background: var(--primary); color: white; border-color: var(--primary); }

        .rec-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .rec-item {
          display: flex;
          gap: 1.25rem;
          padding: 1.25rem;
          border-radius: 1.25rem;
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
        }

        .rec-icon {
          width: 44px;
          height: 44px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0284C7;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .rec-text h4 { font-size: 1rem; font-weight: 800; color: #0C4A6E; margin-bottom: 0.25rem; }
        .rec-text p { font-size: 0.9rem; color: #075985; line-height: 1.5; font-weight: 500; }

        .new-exams-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .new-exam-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #fdf2f8;
          border-radius: 1rem;
          border: 1px solid #fbcfe8;
        }
        .exam-icon-small { width: 32px; height: 32px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ec4899; }
        .exam-text { flex: 1; }
        .exam-text h4 { font-size: 0.9rem; font-weight: 800; color: #831843; margin: 0; }
        .exam-text p { font-size: 0.75rem; color: #9d174d; margin: 0; }
        .start-tiny { padding: 0.4rem 0.8rem; background: white; color: #ec4899; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 800; text-decoration: none; border: 1px solid #fbcfe8; }

        .dashboard-roadmap { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
        .dashboard-roadmap h3 { font-size: 1rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem; }
        .roadmap-grid { display: grid; gap: 0.75rem; }
        .roadmap-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .roadmap-item .dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; }

        .stats-loading { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        .shimmer-card { height: 300px; background: #f1f5f9; border-radius: 2.5rem; animation: pulse 2s infinite; }
        .shimmer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .shimmer-item { height: 100px; background: #f1f5f9; border-radius: 1.5rem; animation: pulse 2s infinite; }

        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

        @media (max-width: 1024px) {
          .stats-header-section { grid-template-columns: 1fr; gap: 2rem; text-align: center; }
          .header-text { display: flex; flex-direction: column; align-items: center; }
          .stats-grid-small { grid-template-columns: repeat(2, 1fr); }
          .dashboard-content-split { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default StudentStatistics;
