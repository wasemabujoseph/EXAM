import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Users, 
  FileText, 
  History, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  UserCheck,
  ShieldCheck,
  Loader2
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.adminGetStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  if (!stats) {
    return (
      <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">No statistics available</h2>
        <p className="text-slate-500 mb-6">Ensure your Google Sheet tabs are set up correctly and contain data.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>System Overview</h1>
        <p>Real-time platform metrics and activity as of {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          Icon={Users} 
          label="Total Users" 
          value={stats.users.total} 
          bg="#eff6ff"
          color="#3b82f6"
        />
        <StatCard 
          Icon={FileText} 
          label="Total Exams" 
          value={stats.exams.total} 
          bg="#eef2ff"
          color="#6366f1"
        />
        <StatCard 
          Icon={History} 
          label="Total Attempts" 
          value={stats.attempts.total} 
          bg="#f0fdf4"
          color="#22c55e"
        />
        <StatCard 
          Icon={TrendingUp} 
          label="Avg. Accuracy" 
          value={`${stats.attempts.avgScore}%`} 
          bg="#fff7ed"
          color="#f97316"
        />
      </div>

      <div className="admin-layout-grid">
        <div className="admin-main-card">
          <h3 className="card-title">
            <Clock size={22} />
            Recent Platform Activity
          </h3>
          <div className="activity-list">
            {stats.recentAttempts.map((attempt: any, i: number) => (
              <div key={i} className="activity-item">
                <div className="activity-score" style={{ 
                  background: attempt.percentage >= 80 ? '#ecfdf5' : attempt.percentage >= 50 ? '#fff7ed' : '#fef2f2',
                  color: attempt.percentage >= 80 ? '#059669' : attempt.percentage >= 50 ? '#ea580c' : '#ef4444'
                }}>
                  {attempt.percentage}%
                </div>
                <div className="activity-details">
                  <p className="activity-type">Exam Attempt Completed</p>
                  <p className="activity-time">{new Date(attempt.created_at).toLocaleString()}</p>
                </div>
                <div className="activity-status">
                  <CheckCircle size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-main-card">
          <h3 className="card-title">
            <ShieldCheck size={22} />
            User Segmentation
          </h3>
          <div className="segmentation-list">
            <ProgressStat label="Active Users" value={stats.users.active} max={stats.users.total} color="var(--success)" />
            <ProgressStat label="PRO Accounts" value={stats.users.pro} max={stats.users.total} color="#f59e0b" />
            <ProgressStat label="System Administrators" value={stats.users.admins} max={stats.users.total} color="var(--primary)" />
            <ProgressStat label="Access Restricted" value={stats.users.blocked} max={stats.users.total} color="var(--danger)" />
          </div>
        </div>
      </div>

      <style>{`
        .admin-page {
          animation: fadeIn 0.6s ease-out;
        }

        .admin-page-header {
          margin-bottom: 2.5rem;
        }

        .admin-page-header h1 {
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--text-main);
          letter-spacing: -0.05em;
          margin-bottom: 0.5rem;
        }

        .admin-page-header p {
          font-size: 1.1rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .admin-layout-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .admin-main-card {
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          transition: transform 0.3s ease;
        }

        .admin-main-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text-main);
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          letter-spacing: -0.02em;
        }

        .card-title svg {
          color: var(--primary);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          background: var(--background);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }

        .activity-item:hover {
          background: white;
          border-color: var(--primary-light);
          transform: scale(1.02);
        }

        .activity-score {
          width: 56px;
          height: 56px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.95rem;
          box-shadow: var(--shadow-sm);
        }

        .activity-details {
          flex: 1;
        }

        .activity-type {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }

        .activity-time {
          font-size: 0.8rem;
          color: var(--text-dim);
          font-weight: 600;
          margin: 0;
        }

        .activity-status {
          color: var(--success);
          opacity: 0.5;
        }

        .segmentation-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (max-width: 640px) {
          .admin-layout-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<any> = ({ Icon, label, value, bg, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg, color: color }}>
      <Icon size={28} />
    </div>
    <div className="stat-info">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  </div>
);

const ProgressStat: React.FC<any> = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-stat-item">
      <div className="progress-label-row">
        <span className="label-text">{label}</span>
        <span className="label-value">{value} <small>({pct}%)</small></span>
      </div>
      <div className="progress-track-bg">
        <div className="progress-fill-bar" style={{ background: color, width: `${pct}%` }}></div>
      </div>

      <style>{`
        .progress-stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .progress-label-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .label-text {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .label-value {
          font-size: 1rem;
          font-weight: 900;
          color: var(--text-main);
        }
        .label-value small {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 700;
        }
        .progress-track-bg {
          width: 100%;
          height: 10px;
          background: var(--background);
          border-radius: 5px;
          overflow: hidden;
          box-shadow: var(--shadow-inner);
        }
        .progress-fill-bar {
          height: 100%;
          border-radius: 5px;
          transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
