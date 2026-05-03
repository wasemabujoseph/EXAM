import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Users, 
  FileText, 
  History, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ShieldCheck,
  Loader2,
  Activity,
  Zap
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

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Syncing analytics...</span></div>;

  if (!stats) {
    return (
      <div className="page-error">
        <Activity size={48} />
        <h2>Data pipeline inactive</h2>
        <p>No platform statistics found. Please verify your cloud synchronization.</p>
        <button className="primary-button" onClick={() => window.location.reload()}>Retry Handshake</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page animate-fade-in">
      <header className="admin-view-header">
        <div className="header-txt">
          <h1>System Insights</h1>
          <p>Global platform performance and user activity.</p>
        </div>
        <div className="header-sync">
          <Zap size={14} /> <span>Live Sync Active</span>
        </div>
      </header>

      <div className="admin-stats-overview">
        <StatCard Icon={Users} label="Total Users" value={stats.users.total} variant="blue" />
        <StatCard Icon={FileText} label="Cloud Exams" value={stats.exams.total} variant="indigo" />
        <StatCard Icon={History} label="Attempt Logs" value={stats.attempts.total} variant="green" />
        <StatCard Icon={TrendingUp} label="Global Accuracy" value={`${stats.attempts.avgScore}%`} variant="orange" />
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-feature-card">
          <div className="feature-card-header">
            <Clock size={20} />
            <h2>Recent Platform Activity</h2>
          </div>
          <div className="activity-scroll-list">
            {stats.recentAttempts.map((attempt: any, i: number) => (
              <div key={i} className="admin-activity-row">
                <div className={`activity-badge-small ${attempt.percentage >= 60 ? 'pass' : 'fail'}`}>
                  {attempt.percentage}%
                </div>
                <div className="activity-info-stack">
                  <span className="info-title">Exam Attempt</span>
                  <span className="info-time">{new Date(attempt.created_at).toLocaleString()}</span>
                </div>
                <CheckCircle size={16} className="activity-check" />
              </div>
            ))}
          </div>
        </section>

        <section className="admin-feature-card">
          <div className="feature-card-header">
            <ShieldCheck size={20} />
            <h2>User Segmentation</h2>
          </div>
          <div className="segment-progress-stack">
            <ProgressStat label="Active Students" value={stats.users.active} max={stats.users.total} color="var(--primary)" />
            <ProgressStat label="PRO Subscriptions" value={stats.users.pro} max={stats.users.total} color="var(--warning)" />
            <ProgressStat label="System Admins" value={stats.users.admins} max={stats.users.total} color="var(--success)" />
            <ProgressStat label="Access Restricted" value={stats.users.blocked} max={stats.users.total} color="var(--danger)" />
          </div>
        </section>
      </div>

      <style>{`
        .admin-dashboard-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .admin-view-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .header-txt h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 0.5rem; }
        .header-txt p { color: var(--text-muted); font-weight: 600; }
        .header-sync { display: flex; align-items: center; gap: 0.5rem; background: var(--success-soft); color: var(--success); padding: 6px 14px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; }

        .admin-stats-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
        
        .admin-dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; align-items: start; }
        .admin-feature-card { background: var(--surface); border-radius: var(--radius-2xl); border: 1px solid var(--border); box-shadow: var(--shadow-md); display: flex; flex-direction: column; overflow: hidden; }
        .feature-card-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; }
        .feature-card-header h2 { font-size: 1.1rem; font-weight: 800; }

        .activity-scroll-list { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; max-height: 480px; overflow-y: auto; }
        .admin-activity-row { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; background: var(--bg-soft-fade); border-radius: 12px; border: 1px solid var(--border-soft); }
        .activity-badge-small { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.9rem; }
        .activity-badge-small.pass { background: var(--success-soft); color: var(--success); }
        .activity-badge-small.fail { background: var(--danger-soft); color: var(--danger); }
        .activity-info-stack { display: flex; flex-direction: column; flex: 1; }
        .info-title { font-weight: 800; font-size: 0.9rem; color: var(--text-strong); }
        .info-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
        .activity-check { color: var(--success); opacity: 0.6; }

        .segment-progress-stack { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }

        @media (max-width: 1024px) {
          .admin-dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<any> = ({ Icon, label, value, variant }) => {
  const colors: any = {
    blue: { bg: 'var(--primary-soft)', text: 'var(--primary)' },
    indigo: { bg: 'var(--accent-soft)', text: 'var(--accent)' },
    green: { bg: 'var(--success-soft)', text: 'var(--success)' },
    orange: { bg: 'var(--warning-soft)', text: 'var(--warning)' },
  };
  const theme = colors[variant];

  return (
    <div className="admin-stat-card-premium">
      <div className="stat-icon-box" style={{ background: theme.bg, color: theme.text }}>
        <Icon size={24} />
      </div>
      <div className="stat-info-stack">
        <span className="stat-label-txt">{label}</span>
        <span className="stat-value-txt">{value}</span>
      </div>
      <style>{`
        .admin-stat-card-premium { background: var(--surface); padding: 1.5rem; border-radius: var(--radius-xl); border: 1px solid var(--border); display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s; }
        .admin-stat-card-premium:hover { transform: translateY(-4px); border-color: var(--primary); }
        .stat-icon-box { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-info-stack { display: flex; flex-direction: column; }
        .stat-label-txt { font-size: 0.75rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }
        .stat-value-txt { font-size: 1.75rem; font-weight: 900; color: var(--text-strong); line-height: 1; }
      `}</style>
    </div>
  );
};

const ProgressStat: React.FC<any> = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-group">
      <div className="progress-label-row">
        <span className="prog-label">{label}</span>
        <span className="prog-val">{value} <small>({pct}%)</small></span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ background: color, width: `${pct}%` }}></div>
      </div>
      <style>{`
        .progress-group { display: flex; flex-direction: column; gap: 0.75rem; }
        .progress-label-row { display: flex; justify-content: space-between; align-items: flex-end; }
        .prog-label { font-size: 0.85rem; font-weight: 800; color: var(--text-soft); }
        .prog-val { font-size: 1rem; font-weight: 900; color: var(--text-strong); }
        .prog-val small { font-size: 0.7rem; color: var(--text-muted); }
        .progress-track { width: 100%; height: 10px; background: var(--bg-soft-fade); border-radius: 99px; overflow: hidden; border: 1px solid var(--border-soft); }
        .progress-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
