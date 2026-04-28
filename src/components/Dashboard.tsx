import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  LogOut, 
  Search, 
  Filter,
  GraduationCap,
  Calendar,
  Layers,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import CurriculumOverview from './CurriculumOverview';
import YearView from './YearView';
import SubjectDetails from './SubjectDetails';
import { curriculum } from '../data/curriculum';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Full Curriculum', path: '/dashboard/curriculum', icon: BookOpen },
  ];

  return (
    <div className="dashboard-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="mobile-brand">MD Exam Hub</span>
        <div style={{ width: 24 }}></div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <GraduationCap size={28} className="brand-icon" />
            <span>MD Hub</span>
          </div>
          <button className="mobile-close" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <p className="section-label">Navigation</p>
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <p className="section-label">Years / Courses</p>
            {curriculum.years.map((year) => (
              <Link 
                key={year.year} 
                to={`/dashboard/year/${year.year}`}
                className={`nav-link ${location.pathname.includes(`/year/${encodeURIComponent(year.year)}`) ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Calendar size={20} />
                <span>{year.year}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CurriculumOverview />} />
          <Route path="/curriculum" element={<CurriculumOverview />} />
          <Route path="/year/:yearId" element={<YearView />} />
          <Route path="/subject/:yearId/:semesterId/:subjectName" element={<SubjectDetails />} />
        </Routes>
      </main>

      <style>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--background);
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: white;
          border-bottom: 1px solid var(--border);
          padding: 0 1rem;
          align-items: center;
          justify-content: space-between;
          z-index: 40;
        }

        .mobile-header button {
          background: none;
          border: none;
          color: var(--text-main);
        }

        .mobile-brand {
          font-weight: 800;
          font-size: 1.125rem;
          color: var(--primary);
        }

        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
          transition: transform 0.3s ease;
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--text-main);
        }

        .brand-icon {
          color: var(--primary);
        }

        .mobile-close {
          display: none;
          background: none;
          border: none;
          color: var(--text-muted);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .nav-section {
          margin-bottom: 2rem;
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          padding-left: 0.75rem;
          letter-spacing: 0.05em;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: var(--secondary);
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.2s;
          margin-bottom: 0.25rem;
        }

        .nav-link:hover {
          background: var(--primary-light);
          color: var(--primary);
        }

        .nav-link.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: var(--danger);
          background: #fff5f5;
          border: 1px solid #fee2e2;
          border-radius: 0.5rem;
          font-weight: 700;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #fecaca;
        }

        .main-content {
          flex: 1;
          padding: 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 1024px) {
          .mobile-header {
            display: flex;
          }

          .sidebar {
            position: fixed;
            transform: translateX(-100%);
          }

          .sidebar.is-open {
            transform: translateX(0);
          }

          .mobile-close {
            display: block;
          }

          .main-content {
            padding: 1.5rem;
            padding-top: 5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
