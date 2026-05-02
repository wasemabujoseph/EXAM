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

      {/* Secondary Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--admin-border)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={22} color="var(--admin-primary)" />
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {stats.recentAttempts.map((attempt: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--admin-primary)', border: '1px solid var(--admin-border)' }}>
                  {attempt.percentage}%
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '700', margin: 0 }}>Exam Attempt</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{new Date(attempt.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--admin-border)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>User Segmentation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ProgressStat label="Active Users" value={stats.users.active} max={stats.users.total} color="#10b981" />
            <ProgressStat label="PRO Accounts" value={stats.users.pro} max={stats.users.total} color="#f59e0b" />
            <ProgressStat label="Admins" value={stats.users.admins} max={stats.users.total} color="#6366f1" />
            <ProgressStat label="Blocked" value={stats.users.blocked} max={stats.users.total} color="#ef4444" />
          </div>
        </div>
      </div>
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
        <span>{label}</span>
        <span>{value} ({pct}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${pct}%`, borderRadius: '10px' }}></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
