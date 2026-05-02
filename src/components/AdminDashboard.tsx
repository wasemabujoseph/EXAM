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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-medium">Real-time platform metrics and activity</p>
        </div>
        <div className="text-sm font-bold text-slate-400 bg-slate-100 px-4 py-2 rounded-lg">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          Icon={Users} 
          label="Total Users" 
          value={stats.users.total} 
          color="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          Icon={FileText} 
          label="Total Exams" 
          value={stats.exams.total} 
          color="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard 
          Icon={History} 
          label="Total Attempts" 
          value={stats.attempts.total} 
          color="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard 
          Icon={TrendingUp} 
          label="Avg. Accuracy" 
          value={`${stats.attempts.avgScore}%`} 
          color="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" />
            Recent Activity
          </h3>
          <div className="space-y-6">
            {stats.recentAttempts.map((attempt: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                  {attempt.percentage}%
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">User Attempted Exam</p>
                  <p className="text-xs text-slate-500 font-medium">{new Date(attempt.created_at).toLocaleString()}</p>
                </div>
                <div className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                  {attempt.exam_id.substring(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">User Segmentation</h3>
          <div className="space-y-4">
            <ProgressStat label="Active" value={stats.users.active} max={stats.users.total} color="bg-emerald-500" />
            <ProgressStat label="Blocked" value={stats.users.blocked} max={stats.users.total} color="bg-red-500" />
            <ProgressStat label="PRO Plan" value={stats.users.pro} max={stats.users.total} color="bg-amber-500" />
            <ProgressStat label="Admins" value={stats.users.admins} max={stats.users.total} color="bg-indigo-500" />
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900">{stats.exams.public}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Public Exams</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900">{stats.exams.private}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Private Exams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<any> = ({ Icon, label, value, color, iconColor }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
      <Icon size={28} className={iconColor} />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
    </div>
  </div>
);

const ProgressStat: React.FC<any> = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900">{value} ({pct}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
