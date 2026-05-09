import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { curriculum } from '../data/curriculum';
import { 
  ChevronRight, 
  HelpCircle, 
  FileText, 
  StickyNote, 
  ExternalLink,
  Layers,
  ArrowLeft,
  Play,
  Download,
  Info,
  Loader2,
  Presentation,
  Image as ImageIcon,
  FileCode
} from 'lucide-react';
import { api } from '../lib/api';

const SubjectDetails: React.FC = () => {
  const { yearId, semesterId, subjectName } = useParams<{ 
    yearId: string; 
    semesterId: string; 
    subjectName: string; 
  }>();
  const navigate = useNavigate();

  const yearData = curriculum.years.find(y => y.year === yearId);
  const semesterData = yearData?.semesters.find(s => s.semester === semesterId);
  const subjectData = semesterData?.subjects.find(s => s.name === subjectName);

  const [activeTab, setActiveTab] = useState<'exams' | 'pdf' | 'note'>('exams');
  const [subjectMaterials, setSubjectMaterials] = React.useState<any[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchSubjectMaterials = async () => {
      setIsMaterialsLoading(true);
      try {
        const allMaterials = await api.listMaterials();
        const filtered = allMaterials.filter((m: any) => 
          m.subject.toLowerCase() === subjectName?.toLowerCase() && 
          m.year.toString() === yearId?.toString()
        );
        setSubjectMaterials(filtered);
      } catch (err) {
        console.error('Failed to fetch subject materials', err);
      } finally {
        setIsMaterialsLoading(false);
      }
    };
    fetchSubjectMaterials();
  }, [yearId, subjectName]);

  const handleStartExam = () => {
    if (!subjectData) return;
    const exam = {
      id: `${yearId}|${semesterId}|${subjectName}`,
      title: subjectData.name,
      questions: subjectData.sub.exams.flatMap(e => e.questions || [])
    };
    navigate(`/dashboard/exam/curriculum/${encodeURIComponent(exam.id)}`, { state: { exam } });
  };

  if (!subjectData) return <div className="page-error"><h2>Subject not found</h2><Link to="/dashboard">Back to Dashboard</Link></div>;

  const resources = subjectData.sub[activeTab];

  return (
    <div className="subject-details-page animate-fade-in">
      <header className="page-header-alt">
        <div className="header-info">
          <div className="breadcrumb-nav">
             <Link to="/dashboard">Dashboard</Link>
             <ChevronRight size={14} />
             <Link to={`/dashboard/year/${encodeURIComponent(yearId!)}`}>{yearId}</Link>
             <ChevronRight size={14} />
             <span>{subjectName}</span>
          </div>
          <div className="subject-title-wrap">
            <Link to={`/dashboard/year/${encodeURIComponent(yearId!)}`} className="btn-back-circle">
              <ArrowLeft size={20} />
            </Link>
            <h1>{subjectData.name}</h1>
            <span className="ects-large-badge">{subjectData.ects_credits} ECTS</span>
          </div>
          <p className="sub-header-meta">{semesterId} • {yearId}</p>
        </div>
      </header>

      <div className="details-main-layout">
        <div className="details-content-col">
          {/* Components Section */}
          {subjectData.components && (
            <section className="details-section-card">
              <div className="section-card-header">
                <Layers size={20} className="header-icon" />
                <h2>Subject Structure</h2>
              </div>
              <div className="components-responsive-table">
                {subjectData.components.map(c => (
                  <div key={c.name} className="comp-row-item">
                    <span className="comp-name-txt">{c.name}</span>
                    <span className="comp-ects-txt">{c.ects_credits} ECTS</span>
                  </div>
                ))}
                <div className="comp-row-item total-row">
                  <span>Cumulative Credits</span>
                  <span>{subjectData.ects_credits} ECTS</span>
                </div>
              </div>
            </section>
          )}

          {/* Resources Section */}
          <section className="details-section-card">
            <div className="section-card-header">
              <Info size={20} className="header-icon" />
              <h2>Learning Materials</h2>
            </div>
            
            <div className="resource-tabs-nav">
              <button className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
                <HelpCircle size={18} />
                <span>Exams</span>
                <span className="tab-badge">{subjectData.sub.exams.length}</span>
              </button>
              <button className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`} onClick={() => setActiveTab('pdf')}>
                <FileText size={18} />
                <span>PDFs</span>
                <span className="tab-badge">{subjectData.sub.pdf.length}</span>
              </button>
              <button className={`tab-btn ${activeTab === 'note' ? 'active' : ''}`} onClick={() => setActiveTab('note')}>
                <StickyNote size={18} />
                <span>Notes</span>
                <span className="tab-badge">{subjectData.sub.note.length}</span>
              </button>
            </div>

            <div className="resource-items-list">
              {resources.length > 0 ? (
                resources.map((res, i) => (
                  <div key={i} className="res-card-item">
                    <div className="res-item-icon">
                      {activeTab === 'exams' && <HelpCircle size={20} />}
                      {activeTab === 'pdf' && <FileText size={20} />}
                      {activeTab === 'note' && <StickyNote size={20} />}
                    </div>
                    <div className="res-item-info">
                      <h3>{res.title}</h3>
                      <p>Resource Year: {res.year}</p>
                    </div>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="res-item-action">
                      {activeTab === 'exams' ? <Play size={18} /> : <ExternalLink size={18} />}
                    </a>
                  </div>
                ))
              ) : (
                <div className="empty-resources-view">
                   <div className="empty-icon-box">
                    {activeTab === 'exams' && <HelpCircle size={48} />}
                    {activeTab === 'pdf' && <FileText size={48} />}
                    {activeTab === 'note' && <StickyNote size={48} />}
                   </div>
                   <h3>No {activeTab} indexed</h3>
                   <p>Materials for this subject are currently being processed by the MEDEXAM team.</p>
                </div>
              )}
            </div>
          </section>

          {/* New Cloud Materials Section */}
          <section className="details-section-card cloud-materials-section">
            <div className="section-card-header">
              <Layers size={20} className="header-icon" />
              <h2>Cloud Resources</h2>
              <Link to="/dashboard/materials" className="view-all-link">View All</Link>
            </div>
            <div className="cloud-materials-list">
              {isMaterialsLoading ? (
                <div className="materials-loading">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Scanning cloud library...</span>
                </div>
              ) : subjectMaterials.length > 0 ? (
                <div className="materials-mini-grid">
                  {subjectMaterials.slice(0, 6).map(m => (
                    <div key={m.id} className="mini-material-card">
                       <div className={`mini-icon ${m.type}`}>
                         {m.type === 'pdf' && <FileText size={18} />}
                         {m.type === 'presentation' && <Presentation size={18} />}
                         {m.type === 'image' && <ImageIcon size={18} />}
                         {m.type === 'exam' && <FileCode size={18} />}
                       </div>
                       <div className="mini-info">
                         <h4>{m.title}</h4>
                         <span>{m.type.toUpperCase()}</span>
                       </div>
                       <a href={m.previewUrl} target="_blank" rel="noopener noreferrer" className="mini-action">
                         <ExternalLink size={16} />
                       </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-cloud-state">
                  <p>No extra cloud materials for this subject yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="details-sidebar-col">
          <div className="sidebar-action-card">
            <h3>Start Assessment</h3>
            <p>Ready to test your knowledge in {subjectData.name}?</p>
            <button className="btn-primary-action" onClick={handleStartExam}>
              <Play size={18} fill="currentColor" />
              <span>Take Mock Exam</span>
            </button>
          </div>

          <div className="sidebar-info-card">
            <h3>Subject Snapshot</h3>
            <div className="snapshot-list">
              <div className="snapshot-row">
                <span className="label">Academic Year</span>
                <span className="value">{yearId}</span>
              </div>
              <div className="snapshot-row">
                <span className="label">Semester</span>
                <span className="value">{semesterId}</span>
              </div>
              <div className="snapshot-row">
                <span className="label">Total Credits</span>
                <span className="value">{subjectData.ects_credits} ECTS</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        .subject-details-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .breadcrumb-nav { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-soft); margin-bottom: 1rem; }
        .breadcrumb-nav a { color: inherit; text-decoration: none; }
        .breadcrumb-nav a:hover { color: var(--primary); }

        .subject-title-wrap { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
        .btn-back-circle { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-soft); color: var(--text-soft); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-back-circle:hover { background: var(--primary-soft); color: var(--primary); }
        .subject-title-wrap h1 { font-size: clamp(1.5rem, 4vw, 2.25rem); flex: 1; }
        .ects-large-badge { background: var(--primary-soft); color: var(--primary); padding: 6px 16px; border-radius: 99px; font-weight: 800; font-size: 0.9rem; }
        .sub-header-meta { margin-left: 3.5rem; color: var(--text-muted); font-weight: 600; }

        .details-main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; }

        .details-section-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); display: flex; flex-direction: column; margin-bottom: 2rem; }
        .section-card-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; }
        .section-card-header h2 { font-size: 1.25rem; }
        .header-icon { color: var(--primary); }

        .components-responsive-table { padding: 1.5rem 2rem; display: flex; flex-direction: column; }
        .comp-row-item { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border-soft); font-weight: 600; }
        .comp-row-item.total-row { border-bottom: none; padding-top: 1.5rem; color: var(--primary); font-weight: 800; font-size: 1.1rem; }
        .comp-name-txt { color: var(--text-soft); }

        .resource-tabs-nav { display: flex; gap: 0.5rem; padding: 1rem 2rem; background: var(--bg-soft-fade); }
        .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; border-radius: var(--radius-lg); font-weight: 800; color: var(--text-soft); }
        .tab-btn.active { background: var(--surface); color: var(--primary); box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .tab-badge { font-size: 0.7rem; background: var(--bg-soft); padding: 2px 8px; border-radius: 6px; }
        .active .tab-badge { background: var(--primary-soft); }

        .resource-items-list { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .res-card-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: var(--radius-xl); border: 1px solid var(--border); transition: all 0.2s; }
        .res-card-item:hover { border-color: var(--primary); background: var(--primary-soft-fade); transform: translateX(8px); }
        .res-item-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--bg-soft); color: var(--text-soft); display: flex; align-items: center; justify-content: center; }
        .res-item-info h3 { font-size: 1rem; color: var(--text-strong); }
        .res-item-info p { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
        .res-item-action { margin-left: auto; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-soft); }
        .res-item-action:hover { background: var(--primary); color: white; }

        .empty-resources-view { padding: 4rem 2rem; text-align: center; color: var(--text-soft); display: flex; flex-direction: column; align-items: center; gap: 1rem; }

        .details-sidebar-col { display: flex; flex-direction: column; gap: 2rem; }
        .sidebar-action-card, .sidebar-info-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 2rem; }
        .sidebar-action-card h3, .sidebar-info-card h3 { font-size: 1.1rem; margin-bottom: 1rem; }
        .sidebar-action-card p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; font-weight: 500; }
        .btn-primary-action { width: 100%; height: 52px; border-radius: var(--radius-xl); background: var(--primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; box-shadow: var(--shadow-md); }
        .btn-primary-action:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        .snapshot-list { display: flex; flex-direction: column; gap: 1rem; }
        .snapshot-row { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600; }
        .snapshot-row .label { color: var(--text-muted); }
        .snapshot-row .value { color: var(--text-strong); }

        @media (max-width: 1024px) {
          .details-main-layout { grid-template-columns: 1fr; }
          .sub-header-meta { margin-left: 0; margin-top: 0.5rem; }
        }

        @media (max-width: 640px) {
          .resource-tabs-nav { padding: 0.5rem; gap: 4px; overflow-x: auto; }
          .tab-btn { min-width: 100px; padding: 0 1rem; }
          .tab-btn span:not(.tab-badge) { display: none; }
          .tab-btn.active span:not(.tab-badge) { display: inline; }
        }

        @media (max-width: 480px) {
          .subject-title-wrap { gap: 0.75rem; }
          .subject-title-wrap h1 { font-size: 1.25rem; }
          .ects-large-badge { font-size: 0.75rem; padding: 4px 10px; }
          .details-section-card { border-radius: var(--radius-xl); }
          .section-card-header { padding: 1rem 1.25rem; }
          .resource-items-list { padding: 1rem 1.25rem; }
          .res-card-item { padding: 0.75rem; gap: 0.75rem; }
          .res-item-info h3 { font-size: 0.9rem; }
          .components-responsive-table { padding: 1rem 1.25rem; }
        }

        .view-all-link { margin-left: auto; font-size: 0.85rem; font-weight: 800; color: var(--primary); text-decoration: none; }
        .view-all-link:hover { text-decoration: underline; }
        
        .cloud-materials-list { padding: 1.5rem 2rem; }
        .materials-loading { display: flex; align-items: center; gap: 1rem; color: var(--text-soft); font-weight: 700; padding: 1rem; }
        .materials-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mini-material-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-soft-fade); border-radius: 12px; border: 1px solid var(--border-soft); transition: all 0.2s; }
        .mini-material-card:hover { border-color: var(--primary); background: var(--surface); transform: translateY(-2px); }
        .mini-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--surface); color: var(--text-soft); }
        .mini-icon.pdf { color: #ef4444; }
        .mini-icon.presentation { color: #f59e0b; }
        .mini-icon.image { color: #3b82f6; }
        .mini-icon.exam { color: #8b5cf6; }
        .mini-info h4 { font-size: 0.85rem; font-weight: 800; color: var(--text-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        .mini-info span { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .mini-action { margin-left: auto; color: var(--text-muted); }
        .mini-action:hover { color: var(--primary); }
        .empty-cloud-state { text-align: center; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; padding: 1rem; }

        @media (max-width: 640px) {
          .materials-mini-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default SubjectDetails;
