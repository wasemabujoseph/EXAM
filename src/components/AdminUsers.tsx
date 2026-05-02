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
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>User Management</h1>
        <p>Manage permissions, plans, and account status for all {users.length} users</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--admin-border)', fontSize: '0.875rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--admin-border)', fontSize: '0.875rem', fontWeight: '700' }}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="user">Students</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Plan</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: u.role === 'admin' ? '#4f46e5' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem' }}>
                      <span style={{ margin: 'auto' }}>{u.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: '700' }}>{u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`status-pill ${u.role}`}>{u.role}</span></td>
                <td><span className={`status-pill ${u.plan}`}>{u.plan}</span></td>
                <td><span style={{ fontSize: '0.75rem', fontWeight: '800', color: u.status === 'active' ? '#10b981' : '#ef4444' }}>{u.status.toUpperCase()}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleUpdateUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '0.4rem', borderRadius: '0.5rem' }}
                      title="Toggle Plan"
                    >
                      <Star size={16} fill={u.plan === 'pro' ? '#f59e0b' : 'none'} color={u.plan === 'pro' ? '#f59e0b' : '#64748b'} />
                    </button>
                    <button 
                      onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '0.4rem', borderRadius: '0.5rem' }}
                    >
                      {u.status === 'active' ? <Ban size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#10b981" />}
                    </button>
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
