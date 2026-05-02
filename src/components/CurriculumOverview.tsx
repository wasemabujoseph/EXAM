import React from 'react';
import { Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { getCurriculumStats } from '../utils/curriculumStats';
import { 
  Users, 
  BookOpen, 
  Award, 
  Clock, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

const CurriculumOverview: React.FC = () => {
  const stats = getCurriculumStats(curriculum);

  return (
    <div className="overview-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">MD Curriculum Exam Hub</h1>
          <p className="page-subtitle">Browse exams, PDFs, notes, credits, and subject resources by year and semester.</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalYears}</h3>
            <p>Years / Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalSemesters}</h3>
            <p>Total Semesters</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalSubjects}</h3>
            <p>Total Subjects</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalECTS}</h3>
            <p>Total ECTS</p>
          </div>
        </div>
      </section>

      <section className="years-section">
        <h2 className="section-title">Curriculum Journey</h2>
        <div className="years-grid">
          {curriculum.years.map((year, index) => (
            <Link key={year.year} to={`/dashboard/year/${year.year}`} className="year-card">
              <div className="year-number">0{index + 1}</div>
              <div className="year-content">
                <h3>{year.year}</h3>
                <p>{year.semesters.length} Semesters • {year.semesters.reduce((acc, s) => acc + s.subjects.length, 0)} Subjects</p>
                <div className="ects-badge">
                  {year.semesters.reduce((acc, s) => acc + s.total_ects_credits, 0)} ECTS Total
                </div>
              </div>
              <div className="year-arrow">
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
          gap: 3rem;
        }

        .page-header {
          margin-bottom: 0.5rem;
          animation: slideUp 0.6s ease-out;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          animation: slideUp 0.7s ease-out;
        }

        .stat-card {
          background: white;
          padding: 1.75rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border: 1px solid var(--border);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-light);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-icon.blue { background: #eef2ff; color: #4f46e5; }
        .stat-icon.green { background: #ecfdf5; color: #059669; }
        .stat-icon.orange { background: #fff7ed; color: #ea580c; }
        .stat-icon.purple { background: #faf5ff; color: #9333ea; }

        .stat-info h3 {
          font-size: 1.75rem;
          font-weight: 900;
          color: var(--text-main);
          line-height: 1;
          margin-bottom: 0.25rem;
          letter-spacing: -0.05em;
        }

        .stat-info p {
          font-size: 0.875rem;
          color: var(--text-dim);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .years-section {
          animation: slideUp 0.8s ease-out;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 900;
          color: var(--text-main);
          margin-bottom: 2rem;
          letter-spacing: -0.04em;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-title::after {
          content: '';
          height: 4px;
          flex: 1;
          background: linear-gradient(90deg, var(--border) 0%, transparent 100%);
          border-radius: 2px;
        }

        .years-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 2rem;
        }

        .year-card {
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          text-decoration: none;
        }

        .year-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-xl);
          transform: translateY(-5px) scale(1.02);
        }

        .year-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--primary-light) 0%, transparent 40%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .year-card:hover::before {
          opacity: 1;
        }

        .year-number {
          font-size: 6rem;
          font-weight: 950;
          color: var(--background);
          position: absolute;
          bottom: -20px;
          right: -10px;
          line-height: 1;
          opacity: 0.5;
          transition: all 0.4s;
          pointer-events: none;
        }

        .year-card:hover .year-number {
          color: var(--primary-light);
          transform: scale(1.1) rotate(-5deg);
        }

        .year-content {
          flex: 1;
          z-index: 1;
        }

        .year-content h3 {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-main);
          margin-bottom: 0.5rem;
          letter-spacing: -0.03em;
        }

        .year-content p {
          font-size: 1rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 1.25rem;
        }

        .ects-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 1rem;
          background: var(--surface);
          color: var(--primary);
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 800;
          border: 1px solid var(--primary-light);
          box-shadow: var(--shadow-sm);
        }

        .year-arrow {
          width: 44px;
          height: 44px;
          background: var(--background);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          transition: all 0.3s;
          z-index: 1;
        }

        .year-card:hover .year-arrow {
          background: var(--primary);
          color: white;
          transform: rotate(-45deg);
        }
      `}</style>
    </div>
  );
};

export default CurriculumOverview;
