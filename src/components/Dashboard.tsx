import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import AIGuide from './AIGuide';
import ThemeToggle from './ThemeToggle';
import { useVault } from '../context/VaultContext';
import { 
  ClipboardCheck,
  LayoutDashboard, 
  PlusCircle,
  FileText,
  History, 
  Trophy, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  ShieldAlert as ShieldIcon,
  FolderOpen
} from 'lucide-react';
import BrandLogo from './BrandLogo';

const Dashboard: React.FC = () => {
  const { logout, user } = useVault();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => {
      // Auto-close only on small screens
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth <= 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard/curriculum' },
    { icon: <PlusCircle size={20} />, label: 'Generate Exam', path: '/dashboard/generate' },
    { icon: <FileText size={20} />, label: 'My Exams', path: '/dashboard/my-exams' },
    { icon: <ClipboardCheck size={20} />, label: 'Completed Exams', path: '/dashboard/history' },
    { icon: <FolderOpen size={20} />, label: 'Learning Materials', path: '/dashboard/materials' },
    { icon: <Trophy size={20} />, label: 'Leaderboard', path: '/dashboard/leaderboard' },
    { icon: <SettingsIcon size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  const profileName = user?.username || 'User';
  const profileEmail = user?.role ? user.role.toUpperCase() : 'STUDENT';

  return (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Top Header */}
      <header className="mobile-top-bar">
        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open Menu">
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <BrandLogo variant="icon" size="sm" />
        </div>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <BrandLogo variant="compact" size="md" />
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close Menu">
              <X size={24} />
            </button>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">{profileName.charAt(0)}</div>
            <div className="profile-details">
              <h4 className="profile-name text-ellipsis">{profileName}</h4>
              <p className="profile-role">{profileEmail}</p>
            </div>
          </div>

          <nav className="nav-menu">
            {navItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => window.innerWidth <= 1024 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
            {(user?.role === 'admin' || user?.email === 'wasemkhallaf864@gmail.com') && (
              <NavLink 
                to="/admin" 
                className="nav-link admin-nav-link"
                onClick={() => window.innerWidth <= 1024 && setIsSidebarOpen(false)}
              >
                <span className="nav-icon"><ShieldIcon size={20} /></span>
                <span className="nav-label">Admin Panel</span>
              </NavLink>
            )}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-theme-wrapper">
             <ThemeToggle />
          </div>
          <button className="nav-link logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {!isSidebarOpen && (
          <button 
            className="desktop-menu-toggle animate-fade-in" 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>
        )}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>

      <AIGuide userName={profileName} />

      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        /* Sidebar Styles */
        .dashboard-sidebar {
          width: var(--sidebar-width);
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 1000;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden; /* Hide outer scroll */
        }

        .sidebar-top {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          flex: 1;
          overflow-y: auto; /* Only this part scrolls */
          scrollbar-width: none; /* Hide scrollbar for Firefox */
          -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
        }

        .sidebar-top::-webkit-scrollbar { 
          display: none; /* Hide scrollbar for Chrome/Safari */
        }

        .sidebar-bottom { 
          padding: 1.5rem; 
          border-top: 1px solid var(--border); 
          display: flex; 
          flex-direction: column; 
          gap: 1rem;
          background: var(--surface);
          margin-top: auto;
        }

        .dashboard-sidebar:not(.active) {
          transform: translateX(-100%);
        }

        .sidebar-top {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.5rem;
        }

        .sidebar-close-btn { 
          display: flex; /* Always show close button */
          background: transparent; 
          color: var(--text-muted); 
          padding: 8px;
          border-radius: var(--radius-lg);
        }
        .sidebar-close-btn:hover { background: var(--bg-soft); color: var(--text-strong); }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-soft);
          border-radius: var(--radius-xl);
          margin-bottom: 2rem;
          border: 1px solid var(--border);
        }

        .profile-avatar {
          width: 44px;
          height: 44px;
          background: var(--primary);
          color: white;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
        }

        .profile-name { font-size: 0.95rem; font-weight: 700; color: var(--text-strong); }
        .profile-role { font-size: 0.75rem; color: var(--primary); font-weight: 800; text-transform: uppercase; }

        .nav-menu { display: flex; flex-direction: column; gap: 0.5rem; }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-lg);
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }

        .nav-link:hover { background: var(--bg-soft); color: var(--text-strong); }
        .nav-link.active { background: var(--primary); color: white; box-shadow: var(--shadow-premium); }
        .nav-link.active .nav-icon { color: white; }

        .admin-nav-link { margin-top: 1rem; border-left: 4px solid var(--warning); background: var(--warning-soft); }
        .admin-nav-link:hover { background: var(--warning); color: white; }


        .logout-btn { color: var(--danger); width: 100%; justify-content: flex-start; }
        .logout-btn:hover { background: var(--danger-soft); color: var(--danger); }

        /* Main Content Styles */
        .dashboard-main {
          flex: 1;
          margin-left: 0;
          transition: margin-left 0.3s ease;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .dashboard-container.sidebar-open .dashboard-main {
          margin-left: var(--sidebar-width);
        }

        @media (max-width: 1024px) {
          .dashboard-container.sidebar-open .dashboard-main {
            margin-left: 0;
          }
        }

        .dashboard-content {
          padding: clamp(1rem, 4vw, 2.5rem);
          max-width: var(--container);
          margin: 0 auto;
          width: 100%;
        }

        .desktop-menu-toggle {
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-strong);
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          z-index: 50;
          cursor: pointer;
          transition: all 0.2s;
        }

        .desktop-menu-toggle:hover {
          background: var(--bg-soft);
          transform: scale(1.05);
        }

        .mobile-top-bar { display: none; }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .dashboard-main { margin-left: 0 !important; padding-top: var(--header-height); }
          .desktop-menu-toggle { display: none; }
          .dashboard-sidebar { width: min(85vw, 300px); }
          .dashboard-sidebar.active { transform: translateX(0); }
          .sidebar-close-btn { display: flex; }
          .mobile-top-bar {
            display: flex;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: var(--header-height);
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 0 1.25rem;
            align-items: center;
            justify-content: space-between;
            z-index: 900;
            backdrop-filter: blur(10px);
          }
          .mobile-logo img { height: 32px; }
          .menu-toggle-btn { background: transparent; color: var(--text-strong); }
          .sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(4px);
            z-index: 950;
          }
          .dashboard-content { padding: 1.25rem; }
        }

        @media (max-width: 480px) {
          .full-logo { display: none; }
          .compact-logo { display: block; }
          .dashboard-content { padding: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
