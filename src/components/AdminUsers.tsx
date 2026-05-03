import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Search, 
  Ban, 
  CheckCircle2, 
  Star, 
  Loader2,
  Filter,
  Users,
  Shield,
  Clock
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
      await loadUsers();
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

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Fetching user directory...</span></div>;

  return (
    <div className="admin-users-page animate-fade-in">
      <header className="admin-view-header">
        <div className="header-txt">
          <h1>User Management</h1>
          <p>Control access, roles, and subscription levels for the platform community.</p>
        </div>
      </header>

      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by username or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-select-wrap">
          <Filter size={18} />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Global (All Roles)</option>
            <option value="user">Students Only</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      <div className="admin-users-list-container">
        {/* Desktop Table */}
        <div className="admin-table-responsive">
          <table className="admin-table-premium">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Access Status</th>
                <th className="text-right">Management</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-user-profile">
                      <div className={`user-init-avatar ${u.role}`}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-meta-stack">
                        <span className="user-name-txt">{u.username}</span>
                        <span className="user-email-txt">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className={`role-tag ${u.role}`}>{u.role}</span></td>
                  <td><span className={`plan-tag ${u.plan}`}>{u.plan}</span></td>
                  <td>
                    <div className="status-flex">
                       <span className={`status-text ${u.status}`}>{u.status.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="admin-action-btns">
                      <button 
                        onClick={() => handleUpdateUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })}
                        className={`action-btn-icon ${u.plan === 'pro' ? 'is-pro' : ''}`}
                        title="Toggle PRO Plan"
                        disabled={isUpdating === u.id}
                      >
                        <Star size={18} fill={u.plan === 'pro' ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })}
                        className={`action-btn-icon ${u.status === 'active' ? 'is-active' : 'is-blocked'}`}
                        title={u.status === 'active' ? 'Restrict Access' : 'Restore Access'}
                        disabled={isUpdating === u.id}
                      >
                        {u.status === 'active' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="admin-users-mobile-stack">
           {filteredUsers.map((u) => (
             <div key={u.id} className="user-mobile-card">
                <div className="card-top">
                  <div className={`user-init-avatar ${u.role}`}>{u.username.charAt(0).toUpperCase()}</div>
                  <div className="user-meta-stack">
                     <span className="user-name-txt">{u.username}</span>
                     <span className="user-email-txt">{u.email}</span>
                  </div>
                  <span className={`status-text ${u.status}`}>{u.status}</span>
                </div>
                <div className="card-mid">
                   <div className="badge-row">
                      <span className={`role-tag ${u.role}`}>{u.role}</span>
                      <span className={`plan-tag ${u.plan}`}>{u.plan}</span>
                   </div>
                </div>
                <div className="card-actions-row">
                    <button onClick={() => handleUpdateUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })} className={`btn-mob-action ${u.plan === 'pro' ? 'active' : ''}`}><Star size={16} /> <span>Toggle Plan</span></button>
                    <button onClick={() => handleUpdateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' })} className={`btn-mob-action ${u.status === 'active' ? 'danger' : 'success'}`}>{u.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />} <span>Status</span></button>
                </div>
             </div>
           ))}
        </div>
      </div>

      <style>{`
        .admin-users-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .admin-filters-bar { display: grid; grid-template-columns: 1fr 240px; gap: 1rem; }
        .admin-search-wrap, .admin-select-wrap { position: relative; display: flex; align-items: center; }
        .admin-search-wrap svg, .admin-select-wrap svg { position: absolute; left: 1rem; color: var(--text-soft); }
        .admin-search-wrap input, .admin-select-wrap select { width: 100%; height: 48px; padding: 0 1rem 0 3rem; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text-strong); font-weight: 700; }

        .admin-table-premium { width: 100%; border-collapse: separate; border-spacing: 0; }
        .admin-table-premium th { padding: 1rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; border-bottom: 2px solid var(--border); }
        .admin-table-premium td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-soft); vertical-align: middle; }
        .admin-table-premium tr:hover { background: var(--bg-soft-fade); }

        .admin-user-profile { display: flex; align-items: center; gap: 1rem; }
        .user-init-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; color: white; }
        .user-init-avatar.admin { background: var(--primary); }
        .user-init-avatar.user { background: var(--text-soft); }

        .user-meta-stack { display: flex; flex-direction: column; }
        .user-name-txt { font-weight: 800; color: var(--text-strong); }
        .user-email-txt { font-size: 0.75rem; color: var(--text-muted); }

        .role-tag, .plan-tag { padding: 2px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
        .role-tag.admin { background: var(--primary-soft); color: var(--primary); }
        .role-tag.user { background: var(--bg-soft); color: var(--text-soft); }
        .plan-tag.pro { background: var(--warning-soft); color: var(--warning); }
        .plan-tag.free { background: var(--bg-soft); color: var(--text-muted); }

        .status-text.active { color: var(--success); font-weight: 800; font-size: 0.75rem; }
        .status-text.blocked { color: var(--danger); font-weight: 800; font-size: 0.75rem; }

        .admin-action-btns { display: flex; justify-content: flex-end; gap: 0.5rem; }
        .action-btn-icon { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border); color: var(--text-soft); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .action-btn-icon:hover { background: var(--surface); color: var(--primary); border-color: var(--primary); }
        .action-btn-icon.is-pro { color: var(--warning); border-color: var(--warning); }
        .action-btn-icon.is-blocked { color: var(--success); }
        .action-btn-icon.is-active:hover { color: var(--danger); border-color: var(--danger); }

        .admin-users-mobile-stack { display: none; flex-direction: column; gap: 1rem; }
        .user-mobile-card { background: var(--surface); padding: 1.25rem; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem; }
        .card-top { display: flex; align-items: center; gap: 1rem; }
        .card-top .status-text { margin-left: auto; }
        .card-actions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .btn-mob-action { height: 40px; border-radius: 8px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 800; color: var(--text-soft); }
        .btn-mob-action.active { color: var(--warning); border-color: var(--warning); }
        .btn-mob-action.danger { color: var(--danger); border-color: var(--danger); }
        .btn-mob-action.success { color: var(--success); border-color: var(--success); }

        @media (max-width: 992px) {
          .admin-table-responsive { display: none; }
          .admin-users-mobile-stack { display: flex; }
          .admin-filters-bar { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;
