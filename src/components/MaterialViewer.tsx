import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  ChevronLeft, 
  Download, 
  ExternalLink, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Presentation,
  Image as ImageIcon,
  FileCode,
  Maximize2,
  Play
} from 'lucide-react';
import ProtectedContentShell from './security/ProtectedContentShell';
import { formatSafeDate } from '../utils/robustHelpers';

const MaterialViewer: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) return;
      setIsLoading(true);
      try {
        const data = await api.getMaterialById(materialId);
        setMaterial(data);
      } catch (err: any) {
        console.error('Failed to load material', err);
        setError(err.message || 'Material not found or access denied.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterial();
  }, [materialId]);

  const handleStartExam = async () => {
    if (!material) return;
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
      alert('Could not load exam data.');
    }
  };

  if (isLoading) {
    return (
      <div className="viewer-loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Initializing Secure Viewer...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="viewer-error-container">
        <AlertCircle size={64} className="text-danger" />
        <h2>Unable to load material</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          Go Back
        </button>
      </div>
    );
  }

  const isProtected = material.isProtected === 'TRUE' || material.isProtected === true;
  const isImage = material.type === 'image';
  const isExam = material.type === 'exam';

  return (
    <div className="material-viewer-layout animate-fade-in">
      <header className="viewer-header">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ChevronLeft size={24} />
          </button>
          <div className="title-area">
            <div className="meta-row">
              <span className="type-badge">{material.type.toUpperCase()}</span>
              {isProtected && (
                <span className="protected-badge">
                  <ShieldCheck size={12} />
                  PROTECTED
                </span>
              )}
              <span className="path-meta">{material.year} • {material.subject}</span>
            </div>
            <h1>{material.title}</h1>
          </div>
        </div>
        
        <div className="header-right">
          {!isProtected && (
            <a href={material.downloadUrl} className="control-btn secondary" title="Download">
              <Download size={18} />
            </a>
          )}
          <a href={material.driveUrl} target="_blank" rel="noopener noreferrer" className="control-btn secondary" title="Open in Drive">
            <ExternalLink size={18} />
          </a>
        </div>
      </header>

      <main className="viewer-main-content">
        <ProtectedContentShell 
          isProtected={isProtected} 
          materialId={material.id}
          title={material.title}
        >
          <div className="viewer-display-area">
            {isExam ? (
              <div className="exam-preview-hero">
                <FileCode size={80} className="text-primary" />
                <h2>Practice Exam: {material.title}</h2>
                <p>This material is a structured medical examination. You can start the interactive exam mode below.</p>
                <div className="exam-stats-row">
                  <div className="stat-pill">
                    <strong>{material.examQuestionCount || '?'}</strong>
                    <span>Questions</span>
                  </div>
                  <div className="stat-pill">
                    <strong>{material.subject}</strong>
                    <span>Subject</span>
                  </div>
                </div>
                <button onClick={handleStartExam} className="start-exam-btn">
                  <Play size={20} fill="currentColor" />
                  <span>Start Secure Exam</span>
                </button>
              </div>
            ) : isImage ? (
              <div className="image-viewer-container">
                <img src={material.driveUrl} alt={material.title} className="viewer-image" />
              </div>
            ) : (
              <div className="iframe-viewer-wrapper">
                {iframeError ? (
                  <div className="iframe-fallback">
                    <AlertCircle size={48} />
                    <h3>Preview Unavailable</h3>
                    <p>We couldn't load the internal preview. Please open it directly in Google Drive.</p>
                    <a href={material.previewUrl} target="_blank" rel="noopener noreferrer" className="btn-fallback">
                      Open in Google Drive
                    </a>
                  </div>
                ) : (
                  <iframe 
                    src={material.previewUrl} 
                    className="viewer-iframe"
                    onLoad={() => setIframeError(false)}
                    onError={() => setIframeError(true)}
                    allow="autoplay"
                  />
                )}
              </div>
            )}
          </div>
        </ProtectedContentShell>
      </main>

      <style>{`
        .material-viewer-layout {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: var(--bg);
          display: flex;
          flex-direction: column;
        }

        .viewer-header {
          height: 72px;
          padding: 0 1.5rem;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .header-left { display: flex; align-items: center; gap: 1.25rem; min-width: 0; }
        .back-btn { 
          width: 44px; height: 44px; border-radius: 12px; 
          display: flex; align-items: center; justify-content: center; 
          background: var(--bg-soft); color: var(--text-soft); 
          transition: all 0.2s; 
        }
        .back-btn:hover { background: var(--border); color: var(--text-strong); }

        .title-area { min-width: 0; }
        .meta-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2px; }
        .type-badge { font-size: 0.65rem; font-weight: 900; background: var(--bg-soft); color: var(--text-soft); padding: 2px 6px; border-radius: 4px; }
        .protected-badge { 
          display: flex; align-items: center; gap: 3px; 
          font-size: 0.65rem; font-weight: 900; background: #fff1f2; color: #e11d48; 
          padding: 2px 6px; border-radius: 4px; border: 1px solid #fda4af; 
        }
        .path-meta { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }
        .title-area h1 { font-size: 1.1rem; font-weight: 800; color: var(--text-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .header-right { display: flex; gap: 0.75rem; }
        .control-btn { 
          width: 40px; height: 40px; border-radius: 10px; 
          display: flex; align-items: center; justify-content: center; 
          transition: all 0.2s; 
        }
        .control-btn.secondary { background: var(--bg-soft); color: var(--text-soft); border: 1px solid var(--border); }
        .control-btn:hover { background: var(--border); color: var(--text-strong); }

        .viewer-main-content { flex: 1; overflow: hidden; position: relative; }
        .viewer-display-area { width: 100%; height: 100%; background: #1e293b; display: flex; align-items: center; justify-content: center; }

        .iframe-viewer-wrapper { width: 100%; height: 100%; position: relative; }
        .viewer-iframe { width: 100%; height: 100%; border: none; }
        
        .image-viewer-container { width: 100%; height: 100%; padding: 2rem; display: flex; align-items: center; justify-content: center; overflow: auto; }
        .viewer-image { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: var(--shadow-2xl); }

        .exam-preview-hero { 
          max-width: 500px; padding: 3rem; background: var(--surface); 
          border-radius: var(--radius-2xl); border: 1px solid var(--border); 
          text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; 
        }
        .exam-preview-hero h2 { font-size: 1.5rem; font-weight: 900; color: var(--text-strong); }
        .exam-preview-hero p { color: var(--text-muted); font-weight: 500; line-height: 1.5; }
        
        .exam-stats-row { display: flex; gap: 1.5rem; }
        .stat-pill { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .stat-pill strong { font-size: 1.25rem; font-weight: 900; color: var(--primary); }
        .stat-pill span { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

        .start-exam-btn { 
          width: 100%; height: 52px; background: var(--primary); color: white; 
          border-radius: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem; 
          transition: all 0.2s; 
        }
        .start-exam-btn:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: var(--shadow-premium); }

        .iframe-fallback { text-align: center; color: white; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .btn-fallback { background: white; color: #1e293b; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 800; text-decoration: none; }

        .viewer-loading-container, .viewer-error-container { 
          position: fixed; inset: 0; background: var(--bg); z-index: 10001; 
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; 
        }
        .viewer-loading-container p { font-weight: 800; color: var(--text-soft); }
        .viewer-error-container h2 { font-weight: 900; color: var(--text-strong); }
        .viewer-error-container p { color: var(--text-muted); max-width: 300px; text-align: center; }
        .btn-back { background: var(--primary); color: white; padding: 0 1.5rem; height: 48px; border-radius: 12px; font-weight: 800; }

        @media (max-width: 640px) {
          .viewer-header { height: auto; padding: 1rem; flex-direction: column; gap: 1rem; align-items: flex-start; }
          .header-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
};

export default MaterialViewer;
