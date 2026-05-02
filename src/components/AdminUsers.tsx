import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle2, 
  Star, 
  UserPlus, 
  Mail,
  Calendar,
  Loader2,
  Trash2,
  ArrowUpDown
} from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.adminGetUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateUser = async (userId: string, updates: any) => {
    setIsUpdating(userId);
    try {
      await api.adminUpdateUser(userId, updates);
      await loadUsers(); // Reload
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium">Manage permissions, plans, and account status</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by username or email..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-6 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="user">Students</option>
          <option value="admin">Administrators</option>
        </select>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role & Plan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.username}</p>
                      <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                      <Shield size={12} /> {u.role.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${u.plan === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      <Star size={12} /> {u.plan.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status === 'active' ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                    {u.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    {u.status === 'active' ? (
                      <button 
                        onClick={() => handleUpdateUser(u.id, { status: 'blocked' })}
                        disabled={isUpdating === u.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Block User"
                      >
                        <Ban size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateUser(u.id, { status: 'active' })}
                        disabled={isUpdating === u.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Unblock User"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleUpdateUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })}
                      disabled={isUpdating === u.id}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title={u.plan === 'pro' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                    >
                      <Star size={18} fill={u.plan === 'pro' ? 'currentColor' : 'none'} />
                    </button>

                    {u.role === 'user' ? (
                      <button 
                        onClick={() => handleUpdateUser(u.id, { role: 'admin' })}
                        disabled={isUpdating === u.id}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Make Admin"
                      >
                        <Shield size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateUser(u.id, { role: 'user' })}
                        disabled={isUpdating === u.id}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Remove Admin"
                      >
                        <Shield size={18} className="fill-current" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
