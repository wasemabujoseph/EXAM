import React, { useState, useEffect } from 'react';
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
  FileCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api';
import { normalizeAcademicYear } from '../utils/curriculumHelpers';

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
  const [subjectMaterials, setSubjectMaterials] = useState<any[]>([]);
  const [subjectExams, setSubjectExams] = useState<any[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);

  useEffect(() => {
    const fetchSubjectData = async () => {
      if (!subjectName || !yearId) return;
      setIsMaterialsLoading(true);
      try {
        const [allMaterials, allExams] = await Promise.all([
          api.listMaterials(),
          api.getPublicExams()
        ]);

        const normalizedCurrentYear = normalizeAcademicYear(yearId);
        
        const filteredMaterials = allMaterials.filter((m: any) => 
          m.subject.toLowerCase() === subjectName.toLowerCase() && 
          normalizeAcademicYear(m.year) === normalizedCurrentYear
        );

        const filteredExams = allExams.filter((e: any) => 
          e.subject.toLowerCase() === subjectName.toLowerCase() && 
          normalizeAcademicYear(e.grade || e.year) === normalizedCurrentYear
        );

        setSubjectMaterials(filteredMaterials);
        setSubjectExams(filteredExams);
      } catch (err) {
        console.error('Failed to fetch subject data', err);
      } finally {
        setIsMaterialsLoading(false);
      }
    };
    fetchSubjectData();
  }, [yearId, subjectName]);

  const handleStartCurriculumExam = () => {
    if (!subjectData) return;
    const exam = {
      id: `${yearId}|${semesterId}|${subjectName}`,
      title: subjectData.name,
      questions: subjectData.sub.exams.flatMap(e => e.questions || [])
    };
    navigate(`/dashboard/exam/curriculum/${encodeURIComponent(exam.id)}`, { state: { exam } });
  };

  const handleStartPublicExam = (exam: any) => {
    navigate(`/dashboard/exam/${exam.id}`);
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
          {/* Subject Structure */}
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

          {/* Official Subject Exams */}
          <section className="details-section-card">
            <div className="section-card-header">
              <ShieldCheck size={20} className="header-icon" />
              <h2>Official Assessments</h2>
            </div>
            <div className="official-exams-list">
              {subjectExams.length > 0 ? (
                <div className="exams-mini-grid">
                  {subjectExams.map(exam => (
                    <div key={exam.id} className="mini-exam-card">
                      <div className="mini-exam-info">
                        <h3>{exam.title}</h3>
                        <span>{exam.difficulty.toUpperCase()} • {exam.time_limit_minutes} MINS</span>
                      </div>
                      <button onClick={() => handleStartPublicExam(exam)} className="mini-start-btn">
                        <Play size={16} fill="currentColor" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-mini-state">
                  <p>No official assessments published for this subject yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Learning Materials Section */}
          <section className="details-section-card">
            <div className="section-card-header">
              <Info size={20} className="header-icon" />
              <h2>Academic Resources</h2>
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
                      <p>Reference: {res.year}</p>
                    </div>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="res-item-action">
                      {activeTab === 'exams' ? <Play size={18} /> : <ExternalLink size={18} />}
                    </a>
                  </div>
                ))
              ) : (
                <div className="empty-resources-view">
                   <p>Curriculum materials are currently under review.</p>
                </div>
              )}
            </div>
          </section>

          {/* Cloud Library Resources */}
          <section className="details-section-card">
            <div className="section-card-header">
              <FileCode size={20} className="header-icon" />
              <h2>Cloud Materials</h2>
              <Link to="/dashboard/materials" className="view-all-link">View Library</Link>
            </div>
            <div className="cloud-materials-list">
              {isMaterialsLoading ? (
                <div className="materials-loading">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Scanning cloud database...</span>
                </div>
              ) : subjectMaterials.length > 0 ? (
                <div className="materials-mini-grid">
                  {subjectMaterials.map(m => (
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
                       <Link to={`/dashboard/materials/view/${m.id}`} className="mini-action">
                         <ChevronRight size={20} />
                       </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-mini-state">
                  <p>No additional cloud materials for this subject yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="details-sidebar-col">
          <div className="sidebar-action-card">
            <h3>Practice Mode</h3>
            <p>Generate a mock exam from curriculum-based questions.</p>
            <button className="btn-primary-action" onClick={handleStartCurriculumExam}>
              <Play size={18} fill="currentColor" />
              <span>Start Quick Practice</span>
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
              <div className="snapshot-row">
                <span className="label">Validation</span>
                <span className="value"><CheckCircle2 size={14} className="text-success" /> Verified</span>
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
        .subject-title-wrap h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.02em; }
        .ects-large-badge { background: var(--primary-soft); color: var(--primary); padding: 6px 16px; border-radius: 99px; font-weight: 800; font-size: 0.85rem; }
        .sub-header-meta { margin-left: 3.5rem; color: var(--text-muted); font-weight: 700; }

        .details-main-layout { display: grid; grid-template-columns: 1fr 320px; gap: 3rem; }
        .details-section-card { background: var(--surface); border: 1px solid var(--border); border-radius: 2rem; margin-bottom: 2.5rem; overflow: hidden; }
        .section-card-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-soft); display: flex; align-items: center; gap: 1rem; }
        .section-card-header h2 { font-size: 1.2rem; font-weight: 800; color: var(--text-strong); }
        .header-icon { color: var(--primary); }

        .components-responsive-table { padding: 1.5rem 2rem; }
        .comp-row-item { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border-soft); font-weight: 700; color: var(--text-soft); }
        .comp-row-item.total-row { border-bottom: none; color: var(--primary); font-size: 1.1rem; padding-top: 1.5rem; }

        .official-exams-list { padding: 1.5rem 2rem; }
        .exams-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mini-exam-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-soft-fade); border-radius: 16px; border: 1px solid var(--border-soft); transition: all 0.2s; }
        .mini-exam-card:hover { border-color: var(--primary); background: var(--surface); transform: translateY(-2px); }
        .mini-exam-info h3 { font-size: 0.9rem; font-weight: 800; color: var(--text-strong); }
        .mini-exam-info span { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); }
        .mini-start-btn { margin-left: auto; width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; }

        .resource-tabs-nav { display: flex; gap: 0.5rem; padding: 1rem 2rem; background: var(--bg-soft-fade); }
        .tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; border-radius: 12px; font-weight: 800; color: var(--text-soft); }
        .tab-btn.active { background: var(--surface); color: var(--primary); box-shadow: var(--shadow-sm); border: 1px solid var(--border-soft); }
        .tab-badge { font-size: 0.7rem; background: var(--bg-soft); padding: 2px 8px; border-radius: 6px; }

        .resource-items-list { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .res-card-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.25rem; border-radius: 14px; border: 1px solid var(--border-soft); transition: all 0.2s; }
        .res-card-item:hover { border-color: var(--primary); transform: translateX(5px); }
        .res-item-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--bg-soft); color: var(--text-soft); display: flex; align-items: center; justify-content: center; }
        .res-item-info h3 { font-size: 0.95rem; font-weight: 800; color: var(--text-strong); }
        .res-item-info p { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
        .res-item-action { margin-left: auto; color: var(--text-muted); }

        .cloud-materials-list { padding: 1.5rem 2rem; }
        .materials-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .mini-material-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--bg-soft-fade); border-radius: 14px; border: 1px solid var(--border-soft); transition: all 0.2s; }
        .mini-material-card:hover { border-color: var(--primary); background: var(--surface); transform: translateY(-2px); }
        .mini-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--surface); }
        .mini-icon.pdf { color: #ef4444; }
        .mini-icon.presentation { color: #f59e0b; }
        .mini-icon.image { color: #3b82f6; }
        .mini-icon.exam { color: #8b5cf6; }
        .mini-info h4 { font-size: 0.85rem; font-weight: 800; color: var(--text-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
        .mini-info span { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); }
        .view-all-link { margin-left: auto; font-size: 0.85rem; font-weight: 800; color: var(--primary); text-decoration: none; }

        .details-sidebar-col { display: flex; flex-direction: column; gap: 2rem; }
        .sidebar-action-card, .sidebar-info-card { background: var(--surface); border: 1px solid var(--border); border-radius: 2rem; padding: 2rem; }
        .btn-primary-action { width: 100%; height: 56px; border-radius: 16px; background: var(--primary); color: white; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; box-shadow: 0 10px 20px var(--primary-soft); transition: all 0.2s; }
        .btn-primary-action:hover { transform: translateY(-2px); box-shadow: 0 15px 30px var(--primary-soft); }

        .snapshot-list { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }
        .snapshot-row { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; }
        .snapshot-row .label { color: var(--text-muted); }
        .snapshot-row .value { color: var(--text-strong); }

        .empty-mini-state { text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 700; padding: 2rem; }
        .materials-loading { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; color: var(--text-soft); font-weight: 800; }

        @media (max-width: 1024px) {
          .details-main-layout { grid-template-columns: 1fr; }
          .exams-mini-grid, .materials-mini-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default SubjectDetails;
