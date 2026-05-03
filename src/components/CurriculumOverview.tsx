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
  Zap
} from 'lucide-react';

const CurriculumOverview: React.FC = () => {
  const stats = getCurriculumStats(curriculum);

  return (
    <div className="overview-container animate-fade-in">
      {/* Premium Hero Section */}
      <section className="premium-hero glass">
        <div className="hero-content">
          <div className="hero-badge animate-slide-up">
            <Sparkles size={14} className="text-amber-400" />
            <span>نظام التعلم الذكي نشط الآن</span>
          </div>
          <h1 className="hero-title animate-slide-up">
            مرحباً بك في <span className="text-gradient">EXAM CLOUD</span>
          </h1>
          <p className="hero-subtitle animate-slide-up">
            استكشف المناهج الدراسية، الاختبارات، والمصادر التعليمية المصممة خصيصاً لنجاحك الأكاديمي.
          </p>
          
          <div className="hero-actions animate-slide-up">
            <div className="search-bar-premium glass">
              <Search size={20} className="text-dim" />
              <input type="text" placeholder="ابحث عن مادة، سنة، أو موضوع..." dir="rtl" />
              <button className="search-btn">بحث</button>
            </div>
          </div>
        </div>
        
        <div className="hero-visual animate-fade-in">
          <div className="floating-card c1 glass"><Zap className="text-blue-400" /></div>
          <div className="floating-card c2 glass"><Award className="text-amber-400" /></div>
          <div className="floating-card c3 glass"><BookOpen className="text-indigo-400" /></div>
        </div>
      </section>

      {/* Stats Grid - Premium Soft UI */}
      <section className="stats-grid-premium">
        {[
          { label: 'سنة دراسية', value: stats.totalYears, icon: <GraduationCap />, color: 'blue' },
          { label: 'فصل دراسي', value: stats.totalSemesters, icon: <Clock />, color: 'green' },
          { label: 'مادة تعليمية', value: stats.totalSubjects, icon: <BookOpen />, color: 'orange' },
          { label: 'نقطة معتمدة', value: stats.totalECTS, icon: <Award />, color: 'purple' },
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
          <h2 className="section-title">رحلتك التعليمية</h2>
          <p className="section-desc">اختر سنتك الدراسية للبدء في استكشاف المحتوى</p>
        </div>
        
        <div className="years-grid-premium">
          {curriculum.years.map((year, index) => (
            <Link key={year.year} to={`/dashboard/year/${year.year}`} className="year-card-premium glass-hover">
              <div className="year-index">0{index + 1}</div>
              <div className="year-info-box">
                <h3>{year.year}</h3>
                <p>{year.semesters.length} فصول • {year.semesters.reduce((acc, s) => acc + s.subjects.length, 0)} مواد</p>
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
          gap: 4rem;
          padding-bottom: 5rem;
        }

        /* Hero Styling */
        .premium-hero {
          position: relative;
          padding: 5rem 4rem;
          border-radius: 3rem;
          background: linear-gradient(135deg, hsla(var(--p-h), 80%, 97%, 0.8) 0%, hsla(var(--p-h), 80%, 99%, 0.8) 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          border: 1px solid white;
        }

        .hero-content {
          max-width: 600px;
          z-index: 10;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--primary);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 950;
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin-bottom: 1.5rem;
          color: var(--text-main);
        }

        .text-gradient {
          background: linear-gradient(to right, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-muted);
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .search-bar-premium {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          padding-right: 1.5rem;
          border-radius: 1.5rem;
          gap: 1rem;
          background: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
        }

        .search-bar-premium input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 1rem;
          font-weight: 600;
          outline: none;
        }

        .search-btn {
          background: var(--primary);
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 1rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .search-btn:hover { transform: scale(1.05); }

        .hero-visual {
          position: relative;
          width: 300px;
          height: 300px;
        }

        .floating-card {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 6s infinite ease-in-out;
        }

        .c1 { top: 10%; right: 10%; animation-delay: 0s; }
        .c2 { bottom: 20%; left: 0%; animation-delay: 2s; }
        .c3 { top: 50%; right: 40%; animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }

        /* Stats Styling */
        .stats-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2rem;
        }

        .stat-card-premium {
          background: white;
          padding: 2rem;
          border-radius: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: var(--shadow-premium);
          border: 1px solid #f8fafc;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .stat-card-premium:hover { transform: translateY(-10px); }

        .stat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue { background: #eef2ff; color: #6366f1; }
        .stat-icon-wrapper.green { background: #ecfdf5; color: #10b981; }
        .stat-icon-wrapper.orange { background: #fff7ed; color: #f59e0b; }
        .stat-icon-wrapper.purple { background: #faf5ff; color: #8b5cf6; }

        .stat-details {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 900;
          color: var(--text-main);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Journey Styling */
        .journey-section {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .section-header {
          text-align: right;
        }

        .section-title {
          font-size: 2.25rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin-bottom: 0.5rem;
        }

        .section-desc {
          color: var(--text-muted);
          font-weight: 600;
        }

        .years-grid-premium {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .year-card-premium {
          background: white;
          padding: 2.5rem;
          border-radius: 2.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          text-decoration: none;
          box-shadow: var(--shadow-premium);
          border: 1px solid #f1f5f9;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .year-card-premium:hover {
          background: var(--primary);
          border-color: var(--primary);
          transform: scale(1.02);
        }

        .year-index {
          font-size: 3rem;
          font-weight: 950;
          color: #f1f5f9;
          transition: color 0.3s;
        }

        .year-card-premium:hover .year-index { color: rgba(255,255,255,0.2); }

        .year-info-box h3 {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text-main);
          transition: color 0.3s;
        }

        .year-card-premium:hover .year-info-box h3 { color: white; }

        .year-info-box p {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 600;
          transition: color 0.3s;
        }

        .year-card-premium:hover .year-info-box p { color: rgba(255,255,255,0.8); }

        .year-badge-premium {
          margin-right: auto;
          padding: 0.4rem 1rem;
          background: #f8fafc;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--primary);
        }

        .year-arrow-premium {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          transition: all 0.3s;
        }

        .year-card-premium:hover .year-arrow-premium {
          background: white;
          color: var(--primary);
          transform: translateX(5px);
        }

        @media (max-width: 1024px) {
          .premium-hero {
            flex-direction: column;
            text-align: center;
            padding: 4rem 2rem;
          }
          .hero-visual { display: none; }
          .hero-title { font-size: 2.5rem; }
          .section-header { text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default CurriculumOverview;
