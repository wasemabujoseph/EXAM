import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  BarChart3, 
  Users, 
  FileText, 
  History, 
  Settings, 
  ShieldAlert,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import '../styles/admin.css';

const AdminLayout: React.FC = () => {
  const { user } = useVault();

  if (user?.role !== 'admin' && user?.email !== 'wasemkhallaf864@gmail.com') {
    return (
      <div className="admin-access-denied">
        <div className="denied-card">
          <ShieldAlert size={64} color="#ef4444" />
          <h1>Access Denied</h1>
          <p>You do not have administrative privileges.</p>
          <NavLink to="/dashboard" className="admin-btn admin-btn-primary">
            Back to Dashboard
          </NavLink>
        </div>
        <style>{`
          .admin-access-denied { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8fafc; }
          .denied-card { text-align: center; padding: 3rem; background: white; border-radius: 2rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); max-width: 400px; }
          .denied-card h1 { margin: 1.5rem 0 0.5rem; font-weight: 900; color: #1e293b; }
          .denied-card p { color: #64748b; margin-bottom: 2rem; }
        `}</style>
      </div>
    );
  }

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
    { icon: <FileText size={20} />, label: 'Exams', path: '/admin/exams' },
    { icon: <History size={20} />, label: 'Attempts', path: '/admin/attempts' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <img src="/brand/medexam-icon.png" alt="MEDEXAM" style={{ height: '32px', marginRight: '0.5rem' }} />
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="stat-icon" style={{ background: 'var(--admin-primary)', color: 'white', width: '40px', height: '40px', fontSize: '1rem', fontWeight: '900' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-user-info">
              <h4>{user?.username}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
          <NavLink to="/dashboard" className="exit-btn">
            <LogOut size={18} />
            <span>Exit Admin</span>
          </NavLink>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
