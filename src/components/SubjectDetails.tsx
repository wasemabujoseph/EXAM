import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { 
  ChevronRight, 
  HelpCircle, 
  FileText, 
  StickyNote, 
  ExternalLink,
  Layers,
  ArrowLeft
} from 'lucide-react';

const SubjectDetails: React.FC = () => {
  const { yearId, semesterId, subjectName } = useParams<{ 
    yearId: string; 
    semesterId: string; 
    subjectName: string; 
  }>();

  const yearData = curriculum.years.find(y => y.year === yearId);
  const semesterData = yearData?.semesters.find(s => s.semester === semesterId);
  const subjectData = semesterData?.subjects.find(s => s.name === subjectName);

  const [activeTab, setActiveTab] = useState<'exams' | 'pdf' | 'note'>('exams');

  if (!subjectData) {
    return <div>Subject not found</div>;
  }

  const resources = subjectData.sub[activeTab];

  return (
    <div className="subject-details animate-fade-in">
      <header className="details-header">
        <div className="breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <ChevronRight size={14} />
          <Link to={`/dashboard/year/${encodeURIComponent(yearId!)}`}>{yearId}</Link>
          <ChevronRight size={14} />
          <span>{subjectName}</span>
        </div>
        
        <div className="title-row">
          <Link to={`/dashboard/year/${encodeURIComponent(yearId!)}`} className="back-link">
            <ArrowLeft size={20} />
          </Link>
          <h1>{subjectData.name}</h1>
          <span className="ects-tag">{subjectData.ects_credits} ECTS</span>
        </div>
        <p className="semester-info">{semesterId} • {yearId}</p>
      </header>

      <div className="details-grid">
        <section className="main-info">
          {subjectData.components && (
            <div className="components-section">
              <h2 className="section-title"><Layers size={20} /> Subject Components</h2>
              <div className="components-table">
                {subjectData.components.map(c => (
                  <div key={c.name} className="component-row">
                    <span className="comp-name">{c.name}</span>
                    <span className="comp-ects">{c.ects_credits} ECTS</span>
                  </div>
                ))}
                <div className="component-row total">
                  <span>Total ECTS</span>
                  <span>{subjectData.ects_credits} ECTS</span>
                </div>
              </div>
            </div>
          )}

          <div className="resources-section">
            <h2 className="section-title">Resources</h2>
            <div className="resource-tabs">
              <button 
                className={`res-tab ${activeTab === 'exams' ? 'active' : ''}`}
                onClick={() => setActiveTab('exams')}
              >
                <HelpCircle size={18} />
                <span>Exams</span>
                <span className="count">{subjectData.sub.exams.length}</span>
              </button>
              <button 
                className={`res-tab ${activeTab === 'pdf' ? 'active' : ''}`}
                onClick={() => setActiveTab('pdf')}
              >
                <FileText size={18} />
                <span>PDFs</span>
                <span className="count">{subjectData.sub.pdf.length}</span>
              </button>
              <button 
                className={`res-tab ${activeTab === 'note' ? 'active' : ''}`}
                onClick={() => setActiveTab('note')}
              >
                <StickyNote size={18} />
                <span>Notes</span>
                <span className="count">{subjectData.sub.note.length}</span>
              </button>
            </div>

            <div className="resources-list">
              {resources.length > 0 ? (
                resources.map((res, i) => (
                  <div key={i} className="resource-item">
                    <div className="res-icon">
                      {activeTab === 'exams' && <HelpCircle size={20} />}
                      {activeTab === 'pdf' && <FileText size={20} />}
                      {activeTab === 'note' && <StickyNote size={20} />}
                    </div>
                    <div className="res-content">
                      <h3>{res.title}</h3>
                      <p>Added: {res.year}</p>
                    </div>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="download-btn">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    {activeTab === 'exams' && <HelpCircle size={48} />}
                    {activeTab === 'pdf' && <FileText size={48} />}
                    {activeTab === 'note' && <StickyNote size={48} />}
                  </div>
                  <h3>No {activeTab} available yet</h3>
                  <p>Resources for this subject are currently being updated.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="details-sidebar">
          <div className="info-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="sidebar-btn primary">Enroll for Exam</button>
              <button className="sidebar-btn">Download Syllabus</button>
              <button className="sidebar-btn">View Schedule</button>
            </div>
          </div>

          <div className="info-card">
            <h3>Quick Summary</h3>
            <div className="summary-list">
              <div className="summary-item">
                <span>Year</span>
                <strong>{yearId}</strong>
              </div>
              <div className="summary-item">
                <span>Semester</span>
                <strong>{semesterId}</strong>
              </div>
              <div className="summary-item">
                <span>Credits</span>
                <strong>{subjectData.ects_credits} ECTS</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .subject-details {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .details-header {
          margin-bottom: 1rem;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .back-link {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .back-link:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .details-header h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.025em;
        }

        .ects-tag {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.375rem 1rem;
          border-radius: 2rem;
        }

        .semester-info {
          margin-top: 0.5rem;
          margin-left: 3.25rem;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }

        .main-info {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1.25rem;
        }

        .components-section {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .components-table {
          display: flex;
          flex-direction: column;
        }

        .component-row {
          display: flex;
          justify-content: space-between;
          padding: 0.875rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.9375rem;
        }

        .component-row:last-child { border-bottom: none; }
        .component-row.total { 
          font-weight: 700; 
          color: var(--primary); 
          padding-top: 1rem;
          border-top: 2px solid var(--border);
        }

        .comp-name { color: #475569; font-weight: 500; }
        .comp-ects { font-weight: 600; }

        .resources-section {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          min-height: 400px;
        }

        .resource-tabs {
          display: flex;
          gap: 0.5rem;
          background: #f8fafc;
          padding: 0.375rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .res-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem;
          border-radius: 0.5rem;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .res-tab.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .res-tab .count {
          font-size: 0.75rem;
          background: #f1f5f9;
          padding: 0.1rem 0.4rem;
          border-radius: 0.25rem;
          color: #94a3b8;
        }

        .res-tab.active .count {
          background: var(--primary-light);
          color: var(--primary);
        }

        .resource-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
        }

        .resource-item:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .res-icon {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .res-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .res-content p {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .download-btn {
          margin-left: auto;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .download-btn:hover { color: var(--primary); }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #94a3b8;
        }

        .empty-icon {
          margin-bottom: 1.5rem;
          color: #e2e8f0;
        }

        .empty-state h3 {
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .details-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .info-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1.25rem;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sidebar-btn {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: white;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .sidebar-btn.primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .sidebar-btn:hover {
          background: #f8fafc;
          transform: translateY(-1px);
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .summary-item span { color: var(--text-muted); }
        .summary-item strong { color: var(--text-main); }

        @media (max-width: 768px) {
          .details-grid { grid-template-columns: 1fr; }
          .details-header h1 { font-size: 1.75rem; }
          .title-row { align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default SubjectDetails;
