import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  BarChart3, 
  Users, 
  FileText, 
  History, 
  Settings, 
  ShieldAlert,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user } = useVault();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  if (user?.role !== 'admin' && user?.email !== 'wasemkhallaf864@gmail.com') {
    return (
      <div className="admin-access-denied">
        <div className="denied-card">
          <ShieldAlert size={64} className="text-danger" />
          <h1>Access Denied</h1>
          <p>You do not have administrative privileges to access this area.</p>
          <Link to="/dashboard" className="btn-return">
            Back to Dashboard
          </Link>
        </div>
        <style>{`
          .admin-access-denied { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); padding: 1.5rem; }
          .denied-card { text-align: center; padding: 3rem; background: var(--surface); border-radius: var(--radius-2xl); box-shadow: var(--shadow-xl); max-width: 400px; width: 100%; border: 1px solid var(--border); }
          .denied-card h1 { margin: 1.5rem 0 0.5rem; font-weight: 900; color: var(--text-strong); }
          .denied-card p { color: var(--text-muted); margin-bottom: 2rem; font-weight: 500; }
          .btn-return { display: inline-flex; align-items: center; justify-content: center; background: var(--primary); color: white; padding: 0 1.5rem; height: 48px; border-radius: var(--radius-lg); font-weight: 800; text-decoration: none; }
        `}</style>
      </div>
    );
  }

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'User Management', path: '/admin/users' },
    { icon: <FileText size={20} />, label: 'Exam Library', path: '/admin/exams' },
    { icon: <History size={20} />, label: 'Attempt Logs', path: '/admin/attempts' },
    { icon: <BarChart3 size={20} />, label: 'Platform Stats', path: '/admin/analytics' },
    { icon: <Settings size={20} />, label: 'Core Settings', path: '/admin/settings' },
  ];

  return (
    <div className={`admin-app-layout ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="admin-mobile-brand">
          <img src="/brand/medexam-icon.png" alt="Logo" />
          <span>ADMIN</span>
        </div>
        <div className="header-spacer" />
      </header>

      {/* Overlay */}
      {isMobileMenuOpen && <div className="admin-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <img src="/brand/medexam-icon.png" alt="MEDEXAM" />
            <div className="brand-txt">
              <span className="brand-name">MEDEXAM</span>
              <span className="brand-tag">SYSTEM ADMIN</span>
            </div>
          </div>
          <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="admin-navigation">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="link-icon">{item.icon}</span>
              <span className="link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-current-user">
             <div className="admin-user-avatar">
               {user?.username?.charAt(0).toUpperCase()}
             </div>
             <div className="admin-user-details">
               <span className="admin-user-name">{user?.username}</span>
               <span className="admin-user-email">{user?.email}</span>
             </div>
          </div>
          <Link to="/dashboard" className="btn-exit-admin">
            <ChevronLeft size={18} />
            <span>Return to App</span>
          </Link>
        </div>
      </aside>

      <main className="admin-main-content">
        <div className="admin-content-container">
          <Outlet />
        </div>
      </main>

      <style>{`
        .admin-app-layout { display: flex; min-height: 100vh; background: var(--bg); }

        .admin-mobile-header {
          display: none; position: fixed; top: 0; left: 0; right: 0; height: 64px;
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 0 1rem; align-items: center; z-index: 1000;
        }
        .admin-mobile-brand { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; color: var(--text-strong); margin-left: 1rem; }
        .admin-mobile-brand img { height: 28px; }

        .admin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1100; }

        .admin-sidebar {
          width: 280px; background: var(--surface); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; position: fixed; top: 0; bottom: 0; left: 0; z-index: 1200;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .admin-sidebar-header { padding: 2rem; display: flex; align-items: center; justify-content: space-between; }
        .admin-brand { display: flex; align-items: center; gap: 1rem; }
        .admin-brand img { height: 40px; border-radius: 8px; }
        .brand-txt { display: flex; flex-direction: column; }
        .brand-name { font-weight: 900; font-size: 1.1rem; color: var(--primary); letter-spacing: -0.02em; }
        .brand-tag { font-size: 0.65rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }
        .mobile-close { display: none; color: var(--text-soft); }

        .admin-navigation { flex: 1; padding: 0 1.25rem; display: flex; flex-direction: column; gap: 4px; }
        .admin-nav-link {
          display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1rem;
          border-radius: 12px; color: var(--text-soft); font-weight: 700; text-decoration: none;
          transition: all 0.2s;
        }
        .admin-nav-link:hover { background: var(--bg-soft); color: var(--primary); }
        .admin-nav-link.active { background: var(--primary-soft); color: var(--primary); }
        .link-icon { opacity: 0.8; }
        .active .link-icon { opacity: 1; }

        .admin-sidebar-footer { padding: 1.5rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem; }
        .admin-current-user { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-soft-fade); border-radius: 12px; }
        .admin-user-avatar { width: 40px; height: 40px; border-radius: 10px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; }
        .admin-user-details { display: flex; flex-direction: column; min-width: 0; }
        .admin-user-name { font-weight: 800; color: var(--text-strong); font-size: 0.9rem; }
        .admin-user-email { font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        
        .btn-exit-admin { display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; border-radius: 10px; border: 1px solid var(--border); color: var(--text-soft); font-weight: 800; text-decoration: none; font-size: 0.85rem; }
        .btn-exit-admin:hover { background: var(--bg-soft); color: var(--text-strong); }

        .admin-main-content { flex: 1; margin-left: 280px; padding: 2rem; }
        .admin-content-container { max-width: 1400px; margin: 0 auto; }

        @media (max-width: 1024px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-app-layout.menu-open .admin-sidebar { transform: translateX(0); }
          .admin-mobile-header { display: flex; }
          .admin-main-content { margin-left: 0; padding-top: 5rem; }
          .mobile-close { display: block; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
