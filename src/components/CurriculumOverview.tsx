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
          gap: 2.5rem;
        }

        .page-header {
          margin-bottom: 0.5rem;
        }

        .page-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .page-subtitle {
          font-size: 1.125rem;
          color: var(--text-muted);
          max-width: 600px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: 1px solid var(--border);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-icon {
          width: 54px;
          height: 54px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue { background: #eff6ff; color: #2563eb; }
        .stat-icon.green { background: #ecfdf5; color: #059669; }
        .stat-icon.orange { background: #fff7ed; color: #ea580c; }
        .stat-icon.purple { background: #faf5ff; color: #9333ea; }

        .stat-info h3 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.2;
        }

        .stat-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1.5rem;
        }

        .years-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .year-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .year-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
          transform: scale(1.02);
        }

        .year-number {
          font-size: 3rem;
          font-weight: 900;
          color: #f1f5f9;
          position: absolute;
          top: -10px;
          right: -10px;
          line-height: 1;
        }

        .year-content {
          flex: 1;
          z-index: 1;
        }

        .year-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .year-content p {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
        }

        .ects-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid rgba(37, 99, 235, 0.1);
        }

        .year-arrow {
          color: #cbd5e1;
          transition: transform 0.2s, color 0.2s;
        }

        .year-card:hover .year-arrow {
          color: var(--primary);
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
};

export default CurriculumOverview;
