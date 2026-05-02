import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Search, 
  History, 
  User, 
  FileText, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Loader2,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminAttempts: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const data = await api.adminGetAllAttempts();
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load attempts', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttempts();
  }, []);

  const filteredAttempts = attempts.filter(a => 
    a.username.toLowerCase().includes(search.toLowerCase()) || 
    a.exam_id.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attempt Audit</h1>
        <p className="text-slate-500 font-medium">Monitor all student submissions and performance metrics</p>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by student or exam ID..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Score</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Mode</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAttempts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-slate-400" />
                    <span className="font-bold text-slate-900">{a.username}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{a.exam_id}</p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className={`text-lg font-black ${parseInt(a.percentage) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {a.percentage}%
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{a.score}/{a.total_questions}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${a.mode === 'retry_wrong' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {a.mode || 'normal'}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                  {new Date(a.created_at).toLocaleDateString()}<br/>
                  {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-5 text-right">
                  <Link 
                    to={`/dashboard/review/${a.id}`}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm"
                  >
                    View Details
                    <ExternalLink size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAttempts;
