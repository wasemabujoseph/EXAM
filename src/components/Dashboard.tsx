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
  Search
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { vault, logout } = useVault();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard/curriculum' },
    { icon: <PlusCircle size={20} />, label: 'Generate Exam', path: '/dashboard/generate' },
    { icon: <FileText size={20} />, label: 'My Exams', path: '/dashboard/my-exams' },
    { icon: <History size={20} />, label: 'Results History', path: '/dashboard/history' },
    { icon: <Trophy size={20} />, label: 'Leaderboard', path: '/dashboard/leaderboard' },
    { icon: <SettingsIcon size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)} className="icon-btn">
          <Menu size={24} />
        </button>
        <span className="mobile-logo">MD Exam Hub</span>
        <div className="avatar-small">
          {vault?.profile.name.charAt(0)}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-box">
            <BookOpen size={24} />
            <span>MD Exam Hub</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="close-btn md-hidden">
            <X size={24} />
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {vault?.profile.name.charAt(0)}
          </div>
          <div className="user-info">
            <span className="user-name">{vault?.profile.name}</span>
            <span className="user-email">{vault?.profile.email}</span>
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
        </nav>

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
          padding: 1.5rem;
          margin: 0 1rem 1rem;
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
      `}</style>
    </div>
  );
};

export default Dashboard;
