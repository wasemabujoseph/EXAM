import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  BookOpen, 
  Layers,
  FileText,
  HelpCircle,
  StickyNote
} from 'lucide-react';

const YearView: React.FC = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const yearData = curriculum.years.find(y => y.year === yearId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  if (!yearData) {
    return <div>Year not found</div>;
  }

  const filteredSemesters = yearData.semesters.filter(s => 
    selectedSemester === 'all' || s.semester === selectedSemester
  );

  return (
    <div className="year-view animate-fade-in">
      <header className="year-header">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <ChevronRight size={14} />
          <span>{yearData.year}</span>
        </div>
        <h1 className="year-title">{yearData.year} Curriculum</h1>
        <div className="year-controls">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Filter size={18} />
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="all">All Semesters</option>
              {yearData.semesters.map(s => (
                <option key={s.semester} value={s.semester}>{s.semester}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="semesters-stack">
        {filteredSemesters.map((semester) => {
          const filteredSubjects = semester.subjects.filter(sub => 
            sub.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredSubjects.length === 0 && searchQuery !== '') return null;

          return (
            <section key={semester.semester} className="semester-block">
              <div className="semester-header">
                <h2>{semester.semester}</h2>
                <span className="semester-ects">{semester.total_ects_credits} ECTS Total</span>
              </div>
              
              <div className="subjects-grid">
                {filteredSubjects.map((subject) => (
                  <div key={subject.name} className="subject-card">
                    <div className="subject-info">
                      <div className="subject-type-icon">
                        {subject.components ? <Layers size={18} /> : <BookOpen size={18} />}
                      </div>
                      <div>
                        <h3>{subject.name}</h3>
                        <p className="ects-label">{subject.ects_credits} ECTS</p>
                      </div>
                    </div>

                    {subject.components && (
                      <div className="components-list">
                        {subject.components.map(c => (
                          <span key={c.name} className="component-tag">{c.name} ({c.ects_credits})</span>
                        ))}
                      </div>
                    )}

                    <div className="resource-previews">
                      <div className={`res-dot ${subject.sub.exams.length > 0 ? 'active' : ''}`} title="Exams">
                        <HelpCircle size={14} />
                      </div>
                      <div className={`res-dot ${subject.sub.pdf.length > 0 ? 'active' : ''}`} title="PDFs">
                        <FileText size={14} />
                      </div>
                      <div className={`res-dot ${subject.sub.note.length > 0 ? 'active' : ''}`} title="Notes">
                        <StickyNote size={14} />
                      </div>
                    </div>

                    <Link 
                      to={`/dashboard/subject/${encodeURIComponent(yearData.year)}/${encodeURIComponent(semester.semester)}/${encodeURIComponent(subject.name)}`}
                      className="view-btn"
                    >
                      View Subject
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <style>{`
        .year-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .breadcrumb a:hover { color: var(--primary); }

        .year-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 1.5rem;
        }

        .year-controls {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .search-box svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .filter-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-group svg {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
          pointer-events: none;
        }

        .filter-group select {
          padding: 0.75rem 2.5rem 0.75rem 3rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          font-size: 0.875rem;
          font-weight: 600;
          appearance: none;
          cursor: pointer;
        }

        .semesters-stack {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .semester-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--border);
        }

        .semester-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .semester-ects {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .subject-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.2s;
        }

        .subject-card:hover {
          box-shadow: var(--shadow);
          border-color: var(--primary);
        }

        .subject-info {
          display: flex;
          gap: 1rem;
        }

        .subject-type-icon {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .subject-info h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.3;
          margin-bottom: 0.25rem;
        }

        .ects-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .components-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .component-tag {
          font-size: 0.7rem;
          padding: 0.1rem 0.4rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          color: #64748b;
        }

        .resource-previews {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        .res-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .res-dot.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .view-btn {
          width: 100%;
          padding: 0.625rem;
          text-align: center;
          background: white;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-main);
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default YearView;
