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

  if (!yearData) return <div className="page-error"><h2>Year not found</h2><Link to="/dashboard">Back to Dashboard</Link></div>;

  const filteredSemesters = yearData.semesters.filter(s => 
    selectedSemester === 'all' || s.semester === selectedSemester
  );

  return (
    <div className="year-view-page animate-fade-in">
      <header className="page-header-alt">
        <div className="header-info">
          <div className="breadcrumb-nav">
             <Link to="/dashboard">Dashboard</Link>
             <ChevronRight size={14} />
             <span>{yearData.year}</span>
          </div>
          <h1>{yearData.year} Curriculum</h1>
          <p>Explore specialized subjects and resources for this academic year.</p>
        </div>
      </header>

      <div className="view-controls-bar">
        <div className="search-input-wrap">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search subjects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-select-wrap">
          <Filter size={18} />
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="all">All Semesters</option>
            {yearData.semesters.map(s => (
              <option key={s.semester} value={s.semester}>{s.semester}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="semester-list-stack">
        {filteredSemesters.map((semester) => {
          const filteredSubjects = semester.subjects.filter(sub => 
            sub.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredSubjects.length === 0 && searchQuery !== '') return null;

          return (
            <section key={semester.semester} className="semester-group">
              <div className="semester-group-header">
                <h2>{semester.semester}</h2>
                <span className="ects-total-pill">{semester.total_ects_credits} ECTS Total</span>
              </div>
              
              <div className="subjects-responsive-grid">
                {filteredSubjects.map((subject) => (
                  <div key={subject.name} className="subject-item-card">
                    <div className="sub-card-top">
                      <div className="sub-icon-box">
                        {subject.components ? <Layers size={18} /> : <BookOpen size={18} />}
                      </div>
                      <div className="sub-title-box">
                        <h3 className="text-ellipsis">{subject.name}</h3>
                        <span className="sub-ects">{subject.ects_credits} ECTS</span>
                      </div>
                    </div>

                    <div className="sub-resources-preview">
                       <div className={`res-icon ${subject.sub.exams.length > 0 ? 'available' : ''}`} title="Exams">
                         <HelpCircle size={14} />
                       </div>
                       <div className={`res-icon ${subject.sub.pdf.length > 0 ? 'available' : ''}`} title="PDFs">
                         <FileText size={14} />
                       </div>
                       <div className={`res-icon ${subject.sub.note.length > 0 ? 'available' : ''}`} title="Notes">
                         <StickyNote size={14} />
                       </div>
                    </div>

                    <Link 
                      to={`/dashboard/subject/${encodeURIComponent(yearData.year)}/${encodeURIComponent(semester.semester)}/${encodeURIComponent(subject.name)}`}
                      className="btn-view-subject"
                    >
                      Explore Subject
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <style>{`
        .year-view-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .breadcrumb-nav { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-soft); margin-bottom: 0.5rem; }
        .breadcrumb-nav a { color: inherit; text-decoration: none; }
        .breadcrumb-nav a:hover { color: var(--primary); }

        .view-controls-bar {
          display: grid; grid-template-columns: 1fr 240px; gap: 1rem;
        }

        .search-input-wrap, .filter-select-wrap {
          position: relative; display: flex; align-items: center;
        }
        .search-input-wrap svg, .filter-select-wrap svg { position: absolute; left: 1rem; color: var(--text-soft); pointer-events: none; }
        
        .search-input-wrap input, .filter-select-wrap select {
          width: 100%; padding: 0 1rem 0 3rem; height: 48px;
          border-radius: var(--radius-lg); border: 1px solid var(--border);
          background: var(--surface); color: var(--text-strong); font-weight: 600;
        }

        .semester-list-stack { display: flex; flex-direction: column; gap: 4rem; }
        .semester-group-header {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 1rem; border-bottom: 2px solid var(--border); margin-bottom: 2rem;
        }
        .semester-group-header h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-strong); }
        .ects-total-pill { background: var(--primary-soft); color: var(--primary); padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; }

        .subjects-responsive-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          gap: 1.5rem;
        }

        .subject-item-card {
          background: var(--surface); padding: 1.5rem;
          border-radius: var(--radius-2xl); border: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 1.5rem;
          transition: all 0.2s;
        }
        .subject-item-card:hover { transform: translateY(-4px); border-color: var(--primary); box-shadow: var(--shadow-md); }

        .sub-card-top { display: flex; gap: 1rem; }
        .sub-icon-box {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--bg-soft); color: var(--text-soft);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sub-title-box { display: flex; flex-direction: column; min-width: 0; }
        .sub-title-box h3 { font-size: 1rem; color: var(--text-strong); margin-bottom: 2px; }
        .sub-ects { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }

        .sub-resources-preview { display: flex; gap: 0.5rem; }
        .res-icon {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--bg-soft); color: var(--text-soft-fade);
          display: flex; align-items: center; justify-content: center;
        }
        .res-icon.available { background: var(--primary-soft); color: var(--primary); }

        .btn-view-subject {
          width: 100%; height: 44px; border-radius: var(--radius-lg);
          background: var(--bg-soft); color: var(--text-strong);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.9rem; transition: all 0.2s;
        }
        .btn-view-subject:hover { background: var(--primary); color: white; border-color: var(--primary); }

        @media (max-width: 768px) {
          .view-controls-bar { grid-template-columns: 1fr; }
          .semester-group-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
          .semester-list-stack { gap: 3rem; }
        }

        @media (max-width: 480px) {
          .page-header-alt { padding: 1.25rem; }
          .semester-group-header h2 { font-size: 1.25rem; }
          .subject-item-card { padding: 1.25rem; gap: 1rem; }
          .sub-card-top { gap: 0.75rem; }
          .sub-title-box h3 { font-size: 0.95rem; }
        }
      `}</style>
    </div>
  );
};

export default YearView;
