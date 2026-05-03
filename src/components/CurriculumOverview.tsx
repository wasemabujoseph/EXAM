import React from 'react';
import { Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { getCurriculumStats } from '../utils/curriculumStats';
import { 
  BookOpen, 
  Award, 
  Clock, 
  ArrowRight,
  GraduationCap,
  Sparkles,
  Search,
  Zap,
  Activity
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { api } from '../lib/api';

const CurriculumOverview: React.FC = () => {
  const { user } = useVault();
  const [userStats, setUserStats] = React.useState({
    totalAttempts: 0,
    avgScore: 0,
    topScore: 0,
    studyTimeMin: 0
  });
  const [newExams, setNewExams] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [attempts, exams] = await Promise.all([
          api.getMyAttempts(),
          api.getPublicExams()
        ]);

        // Calculate stats
        if (attempts.length > 0) {
          const total = attempts.length;
          const avg = Math.round(attempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / total);
          const top = Math.max(...attempts.map((a: any) => a.percentage || 0));
          const time = Math.round(attempts.reduce((acc: number, a: any) => acc + (a.duration_seconds || 0), 0) / 60);
          setUserStats({ totalAttempts: total, avgScore: avg, topScore: top, studyTimeMin: time });
        }

        // Get 3 newest exams
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
    <div className="overview-container animate-fade-in">
      {/* Premium Hero Section */}
      <section className="premium-hero glass">
        <div className="hero-content">
          <div className="hero-badge animate-slide-up">
            <Activity size={14} className="text-emerald-500" />
            <span>AI-Driven Learning System Active</span>
          </div>
          <h1 className="hero-title animate-slide-up">
            Welcome to <span className="text-gradient">MEDEXAM</span>
          </h1>
          <p className="hero-subtitle animate-slide-up">
            Access medical curricula, smart exams, and expert resources designed for your clinical success.
          </p>
          
          <div className="hero-actions animate-slide-up">
            <div className="search-bar-premium glass">
              <Search size={20} className="text-dim" />
              <input type="text" placeholder="Search for subjects, years, or topics..." />
              <button className="search-btn">Search</button>
            </div>
          </div>
        </div>
        
        <div className="hero-visual animate-fade-in">
          <div className="floating-card c1 glass"><Zap className="text-blue-500" /></div>
          <div className="floating-card c2 glass"><Award className="text-amber-500" /></div>
          <div className="floating-card c3 glass"><BookOpen className="text-indigo-500" /></div>
        </div>
      </section>

      {/* Stats Grid - Premium Soft UI */}
      <section className="stats-grid-premium">
        {[
          { label: 'Exams Completed', value: userStats.totalAttempts, icon: <Activity />, color: 'blue' },
          { label: 'Average Score', value: `${userStats.avgScore}%`, icon: <Zap />, color: 'green' },
          { label: 'Top Performance', value: `${userStats.topScore}%`, icon: <Award />, color: 'orange' },
          { label: 'Study Minutes', value: userStats.studyTimeMin, icon: <Clock />, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="stat-card-premium animate-slide-up" style={{ animationDelay: `${0.1 * i}s` }}>
            <div className={`stat-icon-wrapper ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="stat-details">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>
      {/* New Exams Section */}
      <section className="new-exams-section">
        <div className="section-header">
          <h2 className="section-title">Newly Added Exams</h2>
          <p className="section-desc">Stay ahead with the latest medical assessments</p>
        </div>
        <div className="new-exams-grid">
          {newExams.map((exam, i) => (
            <Link key={exam.id} to={`/dashboard/exam/cloud/${exam.id}`} className="new-exam-card glass-hover">
              <div className="exam-tag">New</div>
              <h3>{exam.title}</h3>
              <p>{exam.subject || 'Medical Science'} • {exam.difficulty || 'Intermediate'}</p>
              <div className="exam-footer">
                <span className="exam-meta"><Clock size={14} /> {exam.time_limit_minutes || 60}m</span>
                <span className="exam-meta"><BookOpen size={14} /> {exam.grade || 'Clinical'}</span>
              </div>
            </Link>
          ))}
          {newExams.length === 0 && <p className="text-muted">No new exams found. Check back later!</p>}
        </div>
      </section>

      {/* Suggested Features Section */}
      <section className="suggested-features">
        <div className="section-header">
          <h2 className="section-title">AI-Powered Roadmap</h2>
          <p className="section-desc">Future-ready features designed for your clinical mastery</p>
        </div>
        <div className="features-carousel">
          {[
            { title: 'AI Performance Analysis', desc: 'Get a deep-dive report of your clinical strengths.', icon: <Sparkles />, status: 'Coming Soon' },
            { title: 'Topic Weakness Radar', desc: 'Identify which medical concepts need more focus.', icon: <Search />, status: 'In Development' },
            { title: 'Global Leaderboard', desc: 'Compare your progress with students worldwide.', icon: <Award />, status: 'Beta' },
          ].map((f, i) => (
            <div key={i} className="feature-card glass">
              <div className="feature-status">{f.status}</div>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum Journey Section */}
      <section className="journey-section">
        <div className="section-header">
          <h2 className="section-title">Educational Journey</h2>
          <p className="section-desc">Select your year to begin exploring specialized medical content</p>
        </div>
        
        <div className="years-grid-premium">
          {curriculum.years.map((year, index) => (
            <Link key={year.year} to={`/dashboard/year/${year.year}`} className="year-card-premium glass-hover">
              <div className="year-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="year-info-box">
                <h3>{year.year}</h3>
                <p>{year.semesters.length} Semesters • {year.semesters.reduce((acc, s) => acc + s.subjects.length, 0)} Subjects</p>
              </div>
              <div className="year-badge-premium">
                {year.semesters.reduce((acc, s) => acc + s.total_ects_credits, 0)} ECTS
              </div>
              <div className="year-arrow-premium">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        .overview-container {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
          padding-bottom: 5rem;
          max-width: var(--container-max);
          margin: 0 auto;
        }

        /* Hero Styling */
        .premium-hero {
          position: relative;
          padding: 5rem 4.5rem;
          border-radius: 3.5rem;
          background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: var(--shadow-premium);
        }

        .hero-content {
          max-width: 650px;
          z-index: 10;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1.25rem;
          background: white;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 800;
          color: #10B981;
          box-shadow: 0 4px 15px rgba(0,0,0,0.04);
          margin-bottom: 2rem;
          border: 1px solid #F1F5F9;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.05em;
          margin-bottom: 1.5rem;
          color: #0F172A;
        }

        .text-gradient {
          background: linear-gradient(to right, #6366F1, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #475569;
          margin-bottom: 3rem;
          line-height: 1.6;
          font-weight: 500;
        }

        .search-bar-premium {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          padding-left: 1.5rem;
          border-radius: 1.5rem;
          gap: 1.25rem;
          background: white;
          border: 1px solid #F1F5F9;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }

        .search-bar-premium input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 1.1rem;
          font-weight: 600;
          outline: none;
          color: #1E293B;
        }

        .search-btn {
          background: #0F172A;
          color: white;
          padding: 1rem 2.5rem;
          border-radius: 1.25rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }

        .search-btn:hover { background: #1E293B; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

        .hero-visual {
          position: relative;
          width: 350px;
          height: 350px;
        }

        .floating-card {
          position: absolute;
          width: 64px;
          height: 64px;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: float 6s infinite ease-in-out;
        }

        .c1 { top: 0; right: 20%; animation-delay: 0s; }
        .c2 { bottom: 20%; left: 10%; animation-delay: 2s; }
        .c3 { top: 40%; right: 40%; animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(10deg); }
        }

        /* Stats Styling */
        .stats-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2rem;
        }

        .stat-card-premium {
          background: white;
          padding: 2.5rem;
          border-radius: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid #F1F5F9;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .stat-card-premium:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }

        .stat-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue { background: #EFF6FF; color: #3B82F6; }
        .stat-icon-wrapper.green { background: #ECFDF5; color: #10B981; }
        .stat-icon-wrapper.orange { background: #FFF7ED; color: #F59E0B; }
        .stat-icon-wrapper.purple { background: #FAF5FF; color: #8B5CF6; }

        .stat-details { display: flex; flex-direction: column; gap: 4px; }
        .stat-value { font-size: 2.25rem; font-weight: 900; color: #0F172A; line-height: 1; }
        .stat-label { font-size: 0.8rem; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Journey Styling */
        .journey-section { display: flex; flex-direction: column; gap: 3rem; }
        .section-header { text-align: left; }
        .section-title { font-size: 2.5rem; font-weight: 900; color: #0F172A; margin-bottom: 0.5rem; letter-spacing: -0.03em; }
        .section-desc { color: #64748B; font-weight: 600; font-size: 1.1rem; }

        .years-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .year-card-premium {
          background: white;
          padding: 3rem;
          border-radius: 3rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          text-decoration: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          border: 1px solid #F1F5F9;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .year-card-premium:hover {
          background: #0F172A;
          border-color: #0F172A;
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
        }

        .year-index {
          font-size: 4rem;
          font-weight: 950;
          color: #F1F5F9;
          line-height: 1;
          transition: color 0.3s;
        }

        .year-card-premium:hover .year-index { color: rgba(255,255,255,0.05); }

        .year-info-box { flex: 1; min-width: 0; }
        .year-info-box h3 { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem; transition: color 0.3s; }
        .year-card-premium:hover .year-info-box h3 { color: white; }

        .year-info-box p { font-size: 0.95rem; color: #64748B; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.3s; }
        .year-card-premium:hover .year-info-box p { color: rgba(255,255,255,0.6); }

        .year-badge-premium {
          padding: 0.5rem 1rem;
          background: #F8FAFC;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #6366F1;
          white-space: nowrap;
        }

        .year-arrow-premium {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
          transition: all 0.3s;
        }

        .year-card-premium:hover .year-arrow-premium {
          background: #6366F1;
          color: white;
          transform: translateX(5px);
        }

        @media (max-width: 1024px) {
          .premium-hero { flex-direction: column; text-align: center; padding: 4rem 2rem; border-radius: 2.5rem; }
          .hero-visual { display: none; }
          .hero-title { font-size: 3rem; }
          .hero-content { max-width: 100%; }
          .search-bar-premium { flex-direction: column; padding: 1.5rem; gap: 1rem; border-radius: 2rem; }
          .search-bar-premium input { width: 100%; text-align: center; }
          .search-btn { width: 100%; }
        }

        .new-exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 1.5rem;
        }
        .new-exam-card {
          background: white;
          padding: 2rem;
          border-radius: 2rem;
          border: 1px solid var(--border);
          text-decoration: none;
          position: relative;
          transition: all 0.3s ease;
        }
        .new-exam-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-premium);
          border-color: var(--primary);
        }
        .exam-tag {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--accent);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .new-exam-card h3 { font-size: 1.25rem; color: var(--text-main); margin-bottom: 0.5rem; margin-top: 1rem; }
        .new-exam-card p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
        .exam-footer { display: flex; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
        .exam-meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-dim); font-weight: 600; }

        .suggested-features { display: flex; flex-direction: column; gap: 2rem; }
        .features-carousel { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
        .feature-card {
          padding: 2.5rem;
          border-radius: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          background: white;
        }
        .feature-status {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--primary);
          text-transform: uppercase;
          background: var(--primary-light);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }
        .feature-icon { width: 48px; height: 48px; background: white; border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: var(--shadow-sm); }
        .feature-card h3 { font-size: 1.1rem; color: var(--text-main); }
        .feature-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }
      `}</style>
    </div>
  );
};

export default CurriculumOverview;
