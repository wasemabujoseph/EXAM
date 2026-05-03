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

const CurriculumOverview: React.FC = () => {
  const stats = getCurriculumStats(curriculum);

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
          { label: 'Academic Years', value: stats.totalYears, icon: <GraduationCap />, color: 'blue' },
          { label: 'Semesters', value: stats.totalSemesters, icon: <Clock />, color: 'green' },
          { label: 'Total Subjects', value: stats.totalSubjects, icon: <BookOpen />, color: 'orange' },
          { label: 'ECTS Credits', value: stats.totalECTS, icon: <Award />, color: 'purple' },
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
      `}</style>
    </div>
  );
};

export default CurriculumOverview;
