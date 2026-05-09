import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Search, 
  Filter, 
  FileText, 
  Image as ImageIcon, 
  Presentation, 
  FileCode,
  Download,
  Eye,
  Loader2,
  FolderOpen,
  Play,
  Calendar,
  Layers,
  Star,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { formatSafeDate } from '../utils/robustHelpers';

const LearningMaterials: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await api.listMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={24} className="text-red-500" />;
      case 'presentation': return <Presentation size={24} className="text-orange-500" />;
      case 'image': return <ImageIcon size={24} className="text-blue-500" />;
      case 'exam': return <FileCode size={24} className="text-purple-500" />;
      default: return <FileText size={24} />;
    }
  };

  const handleView = (material: any) => {
    navigate(`/dashboard/materials/view/${material.id}`);
  };

  const handleStartExam = async (material: any) => {
    try {
      const response = await api.getMaterialContent(material.id);
      const examData = JSON.parse(response.content);
      
      const exam = {
        id: material.id,
        title: material.title,
        questions: examData.questions || [],
        timeLimit: examData.timeLimit || examData.time_limit_minutes || 0
      };
      
      navigate(`/dashboard/exam/material/${material.id}`, { state: { exam } });
    } catch (err) {
      console.error('Failed to start exam', err);
      alert('Could not load exam data. Please try again.');
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = filterYear === 'All' || m.year.toString() === filterYear;
    const matchesType = filterType === 'All' || m.type === filterType;
    return matchesSearch && matchesYear && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  const recentlyAdded = [...materials].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 4);
  const practiceExams = materials.filter(m => m.type === 'exam').slice(0, 4);

  if (isLoading && materials.length === 0) {
    return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Fetching learning resources...</span></div>;
  }

  return (
    <div className="learning-materials-page animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Learning Materials</h1>
          <p>Access high-quality medical resources, presentations, and mock exams.</p>
        </div>
      </header>

      <section className="smart-sections">
        <div className="smart-grid">
           <div className="smart-card recent">
              <div className="smart-card-header">
                <Clock size={18} />
                <h3>Recently Added</h3>
              </div>
              <div className="smart-list">
                {recentlyAdded.map(m => (
                  <div key={m.id} className="smart-item" onClick={() => handleView(m)}>
                    <div className="smart-item-icon">{getIcon(m.type)}</div>
                    <div className="smart-item-info">
                      <h4>{m.title}</h4>
                      <span>{m.subject} • Year {m.year}</span>
                    </div>
                  </div>
                ))}
                {recentlyAdded.length === 0 && <p className="empty-txt">No recent uploads</p>}
              </div>
           </div>

           <div className="smart-card exams">
              <div className="smart-card-header">
                <Star size={18} />
                <h3>Practice Exams</h3>
              </div>
              <div className="smart-list">
                {practiceExams.map(m => (
                  <div key={m.id} className="smart-item" onClick={() => handleStartExam(m)}>
                    <div className="smart-item-icon"><FileCode size={20} className="text-purple-500" /></div>
                    <div className="smart-item-info">
                      <h4>{m.title}</h4>
                      <span>{m.examQuestionCount} Questions • {m.subject}</span>
                    </div>
                    <Play size={14} className="play-icon" />
                  </div>
                ))}
                {practiceExams.length === 0 && <p className="empty-txt">No practice exams yet</p>}
              </div>
           </div>
        </div>
      </section>

      <div className="materials-controls">
        <div className="search-bar">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search resources, subjects, topics..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-row">
           <div className="filter-pill">
              <Calendar size={16} />
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="All">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
                <option value="6">Year 6</option>
              </select>
           </div>
           <div className="filter-pill">
              <Layers size={16} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">All Types</option>
                <option value="pdf">PDFs</option>
                <option value="presentation">PowerPoints</option>
                <option value="image">Images</option>
                <option value="exam">Exams</option>
              </select>
           </div>
           <div className="filter-pill">
              <Filter size={16} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Alphabetical</option>
              </select>
           </div>
        </div>
      </div>

      <div className="materials-explorer">
        {filteredMaterials.length === 0 ? (
          <div className="empty-explorer">
            <FolderOpen size={64} />
            <h2>No resources found</h2>
            <p>We couldn't find any materials matching your criteria.</p>
          </div>
        ) : (
          <div className="materials-responsive-grid">
            {filteredMaterials.map(m => (
              <div key={m.id} className="student-material-card">
                <div className="card-media">
                   {m.type === 'image' && m.thumbnailUrl ? (
                     <img src={m.thumbnailUrl} alt={m.title} className="material-thumb" />
                   ) : (
                     <div className={`material-icon-bg ${m.type}`}>
                       {getIcon(m.type)}
                     </div>
                   )}
                   <div className="card-type-overlay">{m.type}</div>
                   {(m.isProtected === 'TRUE' || m.isProtected === true) && (
                     <div className="protected-overlay">
                       <ShieldCheck size={14} />
                       <span>PROTECTED</span>
                     </div>
                   )}
                </div>
                
                <div className="card-content">
                  <div className="card-header-row">
                    <span className="subject-tag">{m.subject}</span>
                    <span className="year-tag">Y{m.year}</span>
                  </div>
                  <h3>{m.title}</h3>
                  <p className="description-text">{m.description || 'No description provided.'}</p>
                  
                  <div className="card-footer">
                    <div className="file-meta">
                      <span>{(m.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                      <span className="sep">•</span>
                      <span>{formatSafeDate(m.uploadedAt)}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    {m.type === 'exam' ? (
                      <button className="action-btn primary" onClick={() => handleStartExam(m)}>
                        <Play size={16} fill="currentColor" />
                        <span>Start Exam</span>
                      </button>
                    ) : (
                      <button className="action-btn primary" onClick={() => handleView(m)}>
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    )}
                    <a href={m.downloadUrl} className="action-btn secondary" title="Download">
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .learning-materials-page { display: flex; flex-direction: column; gap: 2.5rem; padding-bottom: 5rem; }
        
        .page-header h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-muted); font-size: 1.1rem; font-weight: 600; max-width: 600px; }

        .smart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .smart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 1.5rem; box-shadow: var(--shadow-sm); }
        .smart-card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: var(--primary); }
        .smart-card-header h3 { font-size: 1.1rem; font-weight: 800; color: var(--text-strong); }
        
        .smart-list { display: flex; flex-direction: column; gap: 1rem; }
        .smart-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 12px; background: var(--bg-soft-fade); cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .smart-item:hover { background: var(--surface); border-color: var(--primary); transform: translateX(8px); box-shadow: var(--shadow-sm); }
        .smart-item-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--surface); border-radius: 10px; }
        .smart-item-info h4 { font-size: 0.9rem; font-weight: 800; color: var(--text-strong); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .smart-item-info span { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }
        .play-icon { margin-left: auto; color: var(--primary); opacity: 0.6; }
        .empty-txt { color: var(--text-muted); font-size: 0.85rem; font-style: italic; padding: 1rem; text-align: center; }

        .materials-controls { display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: -1px; z-index: 50; background: var(--bg); padding: 1rem 0; }
        .search-bar { display: flex; align-items: center; gap: 1rem; background: var(--surface); padding: 0.85rem 1.5rem; border-radius: 99px; border: 1px solid var(--border); box-shadow: var(--shadow-md); }
        .search-bar input { flex: 1; background: transparent; border: none; outline: none; font-size: 1.1rem; font-weight: 600; color: var(--text-strong); }
        
        .filter-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .filter-pill { display: flex; align-items: center; gap: 0.5rem; background: var(--surface); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 99px; font-weight: 700; color: var(--text-soft); }
        .filter-pill select { background: transparent; border: none; outline: none; color: inherit; font-weight: 800; cursor: pointer; }

        .materials-responsive-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
        
        .student-material-card { background: var(--surface); border-radius: var(--radius-2xl); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .student-material-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-2xl); border-color: var(--primary); }
        
        .card-media { height: 160px; background: var(--bg-soft); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .material-thumb { width: 100%; height: 100%; object-fit: cover; }
        .material-icon-bg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
        .material-icon-bg.pdf { background: var(--danger-soft-fade); }
        .material-icon-bg.presentation { background: var(--warning-soft-fade); }
        .material-icon-bg.image { background: var(--primary-soft-fade); }
        .material-icon-bg.exam { background: var(--accent-soft-fade); }
        .card-type-overlay { position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        .protected-overlay { 
          position: absolute; top: 12px; right: 12px; 
          background: rgba(225, 29, 72, 0.9); backdrop-filter: blur(4px); 
          color: white; padding: 4px 10px; border-radius: 6px; 
          font-size: 0.65rem; font-weight: 900; 
          display: flex; align-items: center; gap: 4px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .card-content { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
        .card-header-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
        .subject-tag { background: var(--primary-soft); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
        .year-tag { background: var(--bg-soft); color: var(--text-soft); padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
        
        .student-material-card h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-strong); line-height: 1.3; }
        .description-text { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        .card-footer { margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-soft); margin-bottom: 1.25rem; }
        .file-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
        .sep { opacity: 0.3; }

        .card-actions { display: grid; grid-template-columns: 1fr 48px; gap: 0.75rem; }
        .action-btn { height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 800; transition: all 0.2s; }
        .action-btn.primary { background: var(--primary); color: white; flex: 1; }
        .action-btn.primary:hover { background: var(--primary-dark); transform: scale(1.02); }
        .action-btn.secondary { background: var(--bg-soft); color: var(--text-soft); border: 1px solid var(--border); }
        .action-btn.secondary:hover { background: var(--border); color: var(--text-strong); }

        .empty-explorer { padding: 8rem 2rem; text-align: center; color: var(--text-muted); }
        .empty-explorer h2 { margin: 2rem 0 0.5rem; color: var(--text-soft); }

        @media (max-width: 1024px) {
          .smart-grid { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 640px) {
          .page-header h1 { font-size: 2rem; }
          .materials-responsive-grid { grid-template-columns: 1fr; }
          .filter-row { gap: 0.5rem; }
          .filter-pill { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
};

export default LearningMaterials;
