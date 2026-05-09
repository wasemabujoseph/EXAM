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
  Zap,
  Server,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wrench
} from 'lucide-react';
import { formatSafeDate, formatPercent } from '../utils/robustHelpers';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.adminGetStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBackend = async () => {
    setIsCheckingBackend(true);
    try {
      const caps = await api.getServerCapabilities();
      setBackendStatus({
        ok: true,
        version: caps.version,
        hasGetMaterialFileData: caps.actions.includes('getMaterialFileData'),
        actions: caps.actions
      });
    } catch (err: any) {
      setBackendStatus({
        ok: false,
        error: err.message || 'Connection failed'
      });
    } finally {
      setIsCheckingBackend(false);
    }
  };

  const repairMetadata = async () => {
    if (!confirm('This will scan all materials and repair missing metadata (MIME types, sizes, URLs). Continue?')) return;
    setIsRepairing(true);
    try {
      const res = await api.repairMaterialsMetadata();
      alert(`Repair complete! Updated ${res.count} rows.`);
      loadStats();
    } catch (err: any) {
      alert(`Repair failed: ${err.message}`);
    } finally {
      setIsRepairing(false);
    }
  };

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
        <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="diagnostic-btn secondary" 
            onClick={repairMetadata} 
            disabled={isRepairing}
            title="Repair Materials Metadata"
          >
            {isRepairing ? <Loader2 className="animate-spin" size={16} /> : <Wrench size={16} />}
            <span>Repair Metadata</span>
          </button>
          <button 
            className="diagnostic-btn" 
            onClick={checkBackend} 
            disabled={isCheckingBackend}
          >
            {isCheckingBackend ? <Loader2 className="animate-spin" size={16} /> : <Server size={16} />}
            <span>Check Backend</span>
          </button>
          <div className="header-sync">
            <Zap size={14} /> <span>Live Sync Active</span>
          </div>
        </div>
      </header>

      {backendStatus && (
        <section className={`backend-status-card ${backendStatus.ok ? 'success' : 'error'} animate-pop-in`}>
          <div className="status-icon">
            {backendStatus.ok ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="status-details">
            {backendStatus.ok ? (
              <>
                <h3>Backend Connected: {backendStatus.version}</h3>
                <p>
                  {backendStatus.hasGetMaterialFileData 
                    ? "✅ System supports Secure Internal Viewers." 
                    : "⚠️ Outdated Version: Missing getMaterialFileData. Please redeploy Apps Script as a new version."}
                </p>
              </>
            ) : (
              <>
                <h3>Backend Unreachable</h3>
                <p>{backendStatus.error}</p>
              </>
            )}
          </div>
          <button className="close-status" onClick={() => setBackendStatus(null)}>Dismiss</button>
        </section>
      )}

      <div className="admin-stats-overview">
        <StatCard Icon={Users} label="Total Users" value={stats.users.total} variant="blue" />
        <StatCard Icon={FileText} label="Cloud Exams" value={stats.exams.total} variant="indigo" />
        <StatCard Icon={History} label="Attempt Logs" value={stats.attempts.total} variant="green" />
        <StatCard Icon={TrendingUp} label="Global Accuracy" value={formatPercent(stats.attempts.avgScore)} variant="orange" />
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
                  <span className="info-time">{formatSafeDate(attempt.created_at)}</span>
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
        .admin-dashboard-page { display: flex; flex-direction: column; gap: 2rem; }
        .admin-view-header { display: flex; justify-content: space-between; align-items: center; }
        .header-txt h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; }
        .header-txt p { color: var(--text-muted); font-weight: 600; }
        .header-sync { display: flex; align-items: center; gap: 0.5rem; background: var(--success-soft); color: var(--success); padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; }
        
        .diagnostic-btn {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--bg-soft); border: 1px solid var(--border);
          color: var(--text-soft); padding: 0 1rem; height: 32px;
          border-radius: 8px; font-size: 0.75rem; font-weight: 800;
          transition: all 0.2s;
        }
        .diagnostic-btn:hover:not(:disabled) { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }
        .diagnostic-btn.secondary:hover { background: var(--warning-soft); color: var(--warning); border-color: var(--warning); }
        .diagnostic-btn:disabled { opacity: 0.5; }

        .backend-status-card {
          display: flex; align-items: center; gap: 1.5rem;
          padding: 1.5rem 2rem; border-radius: 1.5rem;
          border: 1px solid var(--border); margin-bottom: 1rem;
        }
        .backend-status-card.success { background: var(--success-soft-fade); border-color: var(--success); color: var(--success); }
        .backend-status-card.error { background: var(--danger-soft-fade); border-color: var(--danger); color: var(--danger); }
        .status-details { flex: 1; }
        .status-details h3 { font-size: 1rem; font-weight: 900; }
        .status-details p { font-size: 0.85rem; font-weight: 700; opacity: 0.9; }
        .close-status { font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; background: rgba(0,0,0,0.05); }

        .admin-stats-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.blue { background: #eff6ff; color: #3b82f6; }
        .stat-icon.indigo { background: #eef2ff; color: #6366f1; }
        .stat-icon.green { background: #f0fdf4; color: #22c55e; }
        .stat-icon.orange { background: #fff7ed; color: #f97316; }
        .stat-info .label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 4px; }
        .stat-info .value { display: block; font-size: 1.5rem; font-weight: 900; color: var(--text-strong); }

        .admin-dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        .admin-feature-card { background: var(--surface); border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.5rem; }
        .feature-card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-soft); }
        .feature-card-header h2 { font-size: 1.1rem; font-weight: 900; }
        
        .activity-scroll-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 400px; overflow-y: auto; }
        .admin-activity-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 12px; background: var(--bg-soft-fade); }
        .activity-badge-small { width: 44px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 900; }
        .activity-badge-small.pass { background: var(--success-soft); color: var(--success); }
        .activity-badge-small.fail { background: var(--danger-soft); color: var(--danger); }
        .activity-info-stack { flex: 1; display: flex; flex-direction: column; }
        .info-title { font-size: 0.85rem; font-weight: 800; color: var(--text-strong); }
        .info-time { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }
        .activity-check { color: var(--success); opacity: 0.5; }

        .segment-progress-stack { display: flex; flex-direction: column; gap: 1.5rem; }
        .progress-item .progress-label { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 800; color: var(--text-soft); margin-bottom: 6px; }
        .progress-bar-bg { height: 8px; background: var(--bg-soft); border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 4px; }

        @media (max-width: 1024px) {
          .admin-stats-overview { grid-template-columns: repeat(2, 1fr); }
          .admin-dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ Icon, label, value, variant }: any) => (
  <div className="stat-card">
    <div className={`stat-icon ${variant}`}>
      <Icon size={24} />
    </div>
    <div className="stat-info">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  </div>
);

const ProgressStat = ({ label, value, max, color }: any) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-item">
      <div className="progress-label">
        <span>{label}</span>
        <span>{value} ({percent}%)</span>
      </div>
      <div className="progress-bar-bg">
        <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
