import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet, Link, NavLink } from 'react-router-dom';
import AIGuide from './AIGuide';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Stats & Dashboard', path: '/dashboard/curriculum' },
    { icon: <PlusCircle size={20} />, label: 'Generate Exam', path: '/dashboard/generate' },
    { icon: <FileText size={20} />, label: 'My Exams', path: '/dashboard/my-exams' },
    { icon: <History size={20} />, label: 'Results History', path: '/dashboard/history' },
    { icon: <Trophy size={20} />, label: 'Leaderboard', path: '/dashboard/leaderboard' },
    { icon: <SettingsIcon size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  const profileName = user?.username || 'User';
  const profileEmail = user?.role ? user.role.toUpperCase() : 'STUDENT';

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
          <div className="sidebar-header">
            <div className="logo-box">
              <img src="/brand/medexam-logo-primary.png" alt="MEDEXAM AI Medical Learning Assistant" className="sidebar-logo" />
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="close-btn">
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
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="floating-menu-btn">
              <Menu size={24} />
            </button>
          )}
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
            background-color: var(--background);
          }

          .sidebar {
            width: 280px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: 100vh;
            z-index: 50;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: var(--shadow-premium);
          }

          .sidebar:not(.is-open) {
            width: 0;
            margin-left: -280px;
            opacity: 0;
            pointer-events: none;
          }

          .floating-menu-btn {
            position: fixed;
            top: 1.5rem;
            left: 1.5rem;
            z-index: 40;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border);
            padding: 0.75rem;
            border-radius: 0.75rem;
            box-shadow: var(--shadow-premium);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary);
            transition: all 0.2s;
            animation: fadeIn 0.3s ease;
          }

          .floating-menu-btn:hover {
            transform: scale(1.05);
            background: var(--primary-light);
          }

          .close-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: var(--primary-light);
            color: var(--primary);
          }

          .sidebar-header {
            padding: 2rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .logo-box {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .sidebar-logo {
            height: 40px;
            object-fit: contain;
          }

          .mobile-logo-img {
            height: 32px;
            object-fit: contain;
          }

          .logo-box svg {
            color: var(--primary);
            filter: drop-shadow(0 0 8px var(--primary-glow));
          }

          .user-profile {
            padding: 1.25rem;
            margin: 0 1rem 2rem;
            background: var(--primary-light);
            border-radius: var(--radius);
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 1px solid rgba(99, 102, 241, 0.1);
            transition: transform 0.2s;
          }

          .user-profile:hover {
            transform: scale(1.02);
          }

          .avatar {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
            color: white;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.25rem;
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
          }

          .user-info {
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .user-name {
            font-weight: 800;
            color: var(--text-main);
            font-size: 0.95rem;
            letter-spacing: -0.01em;
          }

          .user-email {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.8;
          }

          .sidebar-nav {
            flex: 1;
            padding: 0 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.875rem 1.25rem;
            color: var(--text-muted);
            text-decoration: none;
            font-weight: 700;
            border-radius: var(--radius);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .nav-item:hover {
            background: var(--surface-hover);
            color: var(--text-main);
            padding-left: 1.5rem;
          }

          .nav-item.active {
            background: var(--primary);
            color: white;
            box-shadow: 0 8px 15px -3px var(--primary-glow);
          }

          .nav-item svg {
            transition: transform 0.3s;
          }

          .nav-item:hover svg {
            transform: translateX(2px);
          }

          .sidebar-footer {
            padding: 1.5rem;
            border-top: 1px solid var(--border);
          }

          .logout-btn {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            color: var(--danger);
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid transparent;
            font-weight: 700;
            border-radius: var(--radius);
            cursor: pointer;
            transition: all 0.2s;
          }

          .logout-btn:hover {
            background: var(--danger);
            color: white;
            box-shadow: 0 8px 15px -3px rgba(239, 68, 68, 0.3);
          }

          .main-content {
            flex: 1;
            padding: 2.5rem;
            min-width: 0;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .content-container {
            max-width: var(--container-max);
            margin: 0 auto;
            animation: fadeIn 0.6s ease-out;
          }

          .mobile-header {
            display: none;
            padding: 1rem 1.5rem;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border);
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 40;
          }

          .mobile-logo-img {
            height: 32px;
            object-fit: contain;
          }

          .avatar-small {
            width: 36px;
            height: 36px;
            background: var(--primary);
            color: white;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 800;
          }

          @media (max-width: 992px) {
            .sidebar {
              position: fixed;
              margin-left: 0;
              transform: translateX(-100%);
              width: 280px;
              opacity: 1;
              pointer-events: all;
            }
            .sidebar.is-open {
              transform: translateX(0);
            }
            .sidebar:not(.is-open) {
              width: 280px;
              margin-left: 0;
              transform: translateX(-100%);
            }
            .main-content {
              padding: 1.5rem;
            }
            .floating-menu-btn {
              display: flex;
            }
            .sidebar-overlay {
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              backdrop-filter: blur(4px);
              z-index: 45;
            }
          }

          .admin-link {
            margin-top: 1rem;
            background: #fff7ed;
            color: #ea580c;
            border: 1px solid rgba(234, 88, 12, 0.1);
          }

          .admin-link:hover {
            background: #ffedd5;
            color: #c2410c;
          }

          .plan-stats {
            margin: 1rem;
            padding: 1.5rem;
            background: var(--surface);
            border-radius: var(--radius);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
          }

          .stats-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .stats-header .label {
            font-size: 0.75rem;
            font-weight: 800;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .plan-badge {
            font-size: 0.7rem;
            font-weight: 800;
            padding: 0.25rem 0.6rem;
            border-radius: 0.5rem;
            text-transform: uppercase;
          }

          .plan-badge.free { background: #fff7ed; color: #ea580c; }
          .plan-badge.pro { background: #ecfdf5; color: #059669; }

          .progress-box {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
          }

          .progress-text {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-muted);
          }

          .progress-bar {
            height: 8px;
            background: var(--background);
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%);
            border-radius: 4px;
            transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .pro-status {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            background: #ecfdf5;
            border-radius: 0.75rem;
            color: #059669;
            font-size: 0.8rem;
            font-weight: 800;
            gap: 0.5rem;
          }
        `}</style>
      </div>
      <AIGuide userName={profileName} />
    </>
  );
};

export default Dashboard;
