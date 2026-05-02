import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet, Link, NavLink } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  Trophy, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  FileText,
  User as UserIcon,
  Search,
  Globe,
  ShieldAlert as ShieldIcon
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { logout, user } = useVault();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Curriculum', path: '/dashboard/curriculum' },
    { icon: <PlusCircle size={20} />, label: 'Generate Exam', path: '/dashboard/generate' },
    { icon: <FileText size={20} />, label: 'My Exams', path: '/dashboard/my-exams' },
    { icon: <History size={20} />, label: 'Results History', path: '/dashboard/history' },
    { icon: <Trophy size={20} />, label: 'Leaderboard', path: '/dashboard/leaderboard' },
    { icon: <SettingsIcon size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  const profileName = user?.username || 'User';
  const profileEmail = user?.role ? user.role.toUpperCase() : 'STUDENT';

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} className="icon-btn">
          <Menu size={24} />
        </button>
        <span className="mobile-logo">EXAM CLOUD</span>
        <div className="avatar-small">
          {profileName.charAt(0)}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-box">
            <BookOpen size={24} />
            <span>EXAM CLOUD</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="close-btn md-hidden">
            <X size={24} />
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {profileName.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{profileName}</span>
            <span className="user-email">{profileEmail}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          {(user?.role === 'admin' || user?.email === 'wasemkhallaf864@gmail.com') && (
            <NavLink 
              to="/admin" 
              className="nav-item admin-link"
              onClick={() => setIsSidebarOpen(false)}
              style={{ borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}
            >
              <ShieldIcon size={20} style={{ color: '#f59e0b' }} />
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        <div className="plan-stats">
          <div className="stats-header">
            <span className="label">Usage Status</span>
            <span className={`plan-badge ${user?.plan}`}>{user?.plan?.toUpperCase()}</span>
          </div>
          {user?.plan === 'free' ? (
            <div className="progress-box">
              <div className="progress-text">
                <span>Attempts</span>
                <span>{user?.attempt_count} / {user?.trial_limit}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, ((user?.attempt_count || 0) / (user?.trial_limit || 4)) * 100)}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="pro-status">
              <span className="pro-text">Unlimited Access</span>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--primary);
        }

        .user-profile {
          padding: 1.25rem;
          margin: 0 1rem 1.5rem;
          background: #f1f5f9;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name {
          font-weight: 700;
          color: var(--text-main);
          font-size: 0.9rem;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          text-transform: capitalize;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--border);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: var(--danger);
          background: none;
          border: none;
          font-weight: 600;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: #fef2f2;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
        }

        .content-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .mobile-header {
          display: none;
          padding: 1rem;
          background: white;
          border-bottom: 1px solid var(--border);
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .avatar-small {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.is-open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0;
            padding: 1rem;
          }
          .mobile-header {
            display: flex;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 45;
          }
          .md-hidden { display: block; }
        }

        .admin-link {
          margin-top: 0.5rem;
          background: #eef2ff;
          color: #4f46e5;
        }

        .admin-link:hover {
          background: #e0e7ff;
        }

        .plan-stats {
          margin: 1rem;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .stats-header .label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .plan-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 0.4rem;
        }

        .plan-badge.free { background: #fff7ed; color: #ea580c; }
        .plan-badge.pro { background: #ecfdf5; color: #059669; }

        .progress-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
        }

        .progress-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .pro-status {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          background: #ecfdf5;
          border-radius: 0.5rem;
        }

        .pro-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
