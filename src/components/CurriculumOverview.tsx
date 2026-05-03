import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { 
  BookOpen, 
  Award, 
  Clock, 
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react';
import { api } from '../lib/api';

const CurriculumOverview: React.FC = () => {
  const [userStats, setUserStats] = useState({
    totalAttempts: 0,
    avgScore: 0,
    topScore: 0,
    studyTimeMin: 0
  });
  const [newExams, setNewExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [attempts, exams] = await Promise.all([
          api.getMyAttempts(),
          api.getPublicExams()
        ]);

        if (attempts.length > 0) {
          const total = attempts.length;
          const avg = Math.round(attempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / total);
          const top = Math.max(...attempts.map((a: any) => a.percentage || 0));
          const time = Math.round(attempts.reduce((acc: number, a: any) => acc + (a.duration_seconds || 0), 0) / 60);
          setUserStats({ totalAttempts: total, avgScore: avg, topScore: top, studyTimeMin: time });
        }

        setNewExams(exams.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="overview-page">
      {/* Hero Section */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <div className="badge badge-success animate-fade-in">
            <Sparkles size={14} /> 
            <span>AI Medical Learning Active</span>
          </div>
          <h1 className="hero-title animate-slide-up">
            Welcome to <span className="brand-gradient">MEDEXAM</span>
          </h1>
          <p className="hero-subtitle animate-slide-up">
            Track your progress, practice smarter, and prepare with confidence.
          </p>
          
          <div className="hero-search animate-slide-up">
            <div className="search-box">
              <Search size={20} className="search-icon" />
              <input type="text" placeholder="Search subjects, topics, or years..." />
              <button className="search-button">Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="dashboard-stats-grid">
        {[
          { label: 'Exams Completed', value: userStats.totalAttempts, icon: <Activity />, color: 'var(--primary)' },
          { label: 'Average Accuracy', value: `${userStats.avgScore}%`, icon: <TrendingUp />, color: 'var(--success)' },
          { label: 'Top Performance', value: `${userStats.topScore}%`, icon: <Award />, color: 'var(--warning)' },
          { label: 'Study Minutes', value: userStats.studyTimeMin, icon: <Clock />, color: 'var(--accent)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${0.1 * i}s` }}>
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label text-ellipsis">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid: Curriculum & New Exams */}
      <div className="dashboard-main-grid">
        {/* Journey/Curriculum */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Educational Journey</h2>
            <p>Select your year to begin exploring medical content.</p>
          </div>
          <div className="years-list">
            {curriculum.years.map((year, index) => (
              <Link key={year.year} to={`/dashboard/year/${year.year}`} className="year-row">
                <span className="year-num">0{index + 1}</span>
                <div className="year-details">
                  <h3>{year.year}</h3>
                  <p>{year.semesters.length} Semesters • {year.semesters.reduce((acc, s) => acc + s.subjects.length, 0)} Subjects</p>
                </div>
                <div className="year-meta">
                  <span className="ects-badge">{year.semesters.reduce((acc, s) => acc + s.total_ects_credits, 0)} ECTS</span>
                  <ArrowRight size={20} className="arrow-icon" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* New Exams & Features */}
        <div className="dashboard-side-col">
          <section className="dashboard-section">
            <div className="section-header">
              <h2>New Assessments</h2>
              <p>Latest practice materials.</p>
            </div>
            <div className="new-exams-stack">
              {newExams.map((exam) => (
                <Link key={exam.id} to={`/dashboard/exam/cloud/${exam.id}`} className="exam-mini-card">
                  <div className="exam-mini-header">
                    <span className="mini-tag">NEW</span>
                    <h3>{exam.title}</h3>
                  </div>
                  <div className="exam-mini-meta">
                    <span><Clock size={14} /> {exam.time_limit_minutes || 60}m</span>
                    <span><BookOpen size={14} /> {exam.grade || 'Clinical'}</span>
                  </div>
                </Link>
              ))}
              {newExams.length === 0 && <p className="empty-text">Check back later for new exams.</p>}
            </div>
          </section>

          <section className="dashboard-section">
             <div className="section-header">
              <h2>Roadmap</h2>
              <p>What's coming next.</p>
            </div>
            <div className="roadmap-card">
              <div className="roadmap-item">
                <Zap size={18} />
                <div>
                  <h4>AI Topic Analysis</h4>
                  <p>Deep-dive report of your clinical strengths.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .overview-page { display: flex; flex-direction: column; gap: 3rem; }

        /* Hero */
        .dashboard-hero {
          background: var(--surface);
          padding: clamp(2rem, 8vw, 4rem);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .brand-gradient {
          background: linear-gradient(135deg, var(--primary-brand), var(--teal-brand));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-title { font-size: clamp(2rem, 6vw, 3.5rem); margin-bottom: 1rem; }
        .hero-subtitle { font-size: clamp(1rem, 3vw, 1.25rem); color: var(--text-muted); max-width: 600px; }

        .hero-search { width: 100%; max-width: 600px; margin-top: 2.5rem; }
        .search-box {
          display: flex; align-items: center; gap: 1rem;
          background: var(--bg-soft); border: 1px solid var(--border);
          padding: 0.5rem 0.5rem 0.5rem 1.5rem; border-radius: var(--radius-xl);
          transition: focus-within 0.3s;
        }
        .search-box:focus-within { border-color: var(--primary); background: var(--surface); box-shadow: var(--shadow-md); }
        .search-icon { color: var(--text-soft); }
        .search-box input { border: none; background: transparent; padding: 0; font-weight: 600; }
        .search-button {
          background: var(--primary); color: white;
          padding: 0 1.5rem; height: 44px; border-radius: var(--radius-lg);
          font-weight: 800; font-size: 0.9rem;
        }

        /* Stats */
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 1.5rem;
        }
        .stat-card {
          background: var(--surface); padding: 1.5rem;
          border-radius: var(--radius-xl); border: 1px solid var(--border);
          display: flex; align-items: center; gap: 1.25rem;
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .stat-icon {
          width: 54px; height: 54px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
        }
        .stat-info { display: flex; flex-direction: column; gap: 2px; }
        .stat-value { font-size: 1.75rem; font-weight: 900; color: var(--text-strong); line-height: 1.1; }
        .stat-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

        /* Main Grid */
        .dashboard-main-grid {
          display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem;
        }

        .dashboard-section { display: flex; flex-direction: column; gap: 1.5rem; }
        .section-header h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .section-header p { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }

        .years-list { display: flex; flex-direction: column; gap: 1rem; }
        .year-row {
          display: flex; align-items: center; gap: 1.5rem;
          padding: 1.5rem; background: var(--surface);
          border-radius: var(--radius-xl); border: 1px solid var(--border);
          text-decoration: none; transition: all 0.2s;
        }
        .year-row:hover { border-color: var(--primary); background: var(--bg-soft); transform: translateX(8px); }
        .year-num { font-size: 2rem; font-weight: 900; color: var(--text-soft); opacity: 0.5; }
        .year-details { flex: 1; min-width: 0; }
        .year-details h3 { font-size: 1.25rem; margin-bottom: 2px; color: var(--text-strong); }
        .year-details p { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }
        .year-meta { display: flex; align-items: center; gap: 1rem; }
        .ects-badge {
          background: var(--primary-soft); color: var(--primary);
          padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800;
        }
        .arrow-icon { color: var(--text-soft); }

        .dashboard-side-col { display: flex; flex-direction: column; gap: 2.5rem; }
        .new-exams-stack { display: flex; flex-direction: column; gap: 1rem; }
        .exam-mini-card {
          background: var(--surface); padding: 1.25rem;
          border-radius: var(--radius-lg); border: 1px solid var(--border);
          text-decoration: none; display: flex; flex-direction: column; gap: 0.75rem;
        }
        .exam-mini-card:hover { border-color: var(--primary); box-shadow: var(--shadow-md); }
        .mini-tag { font-size: 0.65rem; font-weight: 900; color: var(--accent); }
        .exam-mini-card h3 { font-size: 1rem; color: var(--text-strong); }
        .exam-mini-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-soft); font-weight: 700; }

        .roadmap-card {
          background: var(--bg-soft); padding: 1.5rem; border-radius: var(--radius-xl); border: 1px dashed var(--border-strong);
        }
        .roadmap-item { display: flex; gap: 1rem; color: var(--primary); }
        .roadmap-item h4 { font-size: 0.95rem; margin-bottom: 2px; }
        .roadmap-item p { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }

        .empty-text { font-size: 0.9rem; color: var(--text-soft); font-style: italic; }

        @media (max-width: 1280px) {
          .dashboard-main-grid { grid-template-columns: 1fr; }
          .dashboard-side-col { flex-direction: row; }
          .dashboard-side-col > section { flex: 1; }
        }

        @media (max-width: 768px) {
          .dashboard-side-col { flex-direction: column; }
          .dashboard-hero { padding: 2.5rem 1.5rem; }
          .hero-search { margin-top: 1.5rem; }
          .search-box { flex-direction: column; padding: 1rem; gap: 0.75rem; }
          .search-box input { text-align: center; }
          .search-button { width: 100%; }
          .year-row { padding: 1.25rem; gap: 1rem; }
          .year-num { display: none; }
          .year-meta { flex-direction: column; align-items: flex-end; gap: 4px; }
          .arrow-icon { display: none; }
        }
      `}</style>
    </div>
  );
};

export default CurriculumOverview;
