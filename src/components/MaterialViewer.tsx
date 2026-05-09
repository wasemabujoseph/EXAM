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
  Play,
  Settings
} from 'lucide-react';
import ProtectedContentShell from './security/ProtectedContentShell';
import { formatSafeDate } from '../utils/robustHelpers';
import InternalPdfViewer from './viewers/InternalPdfViewer';
import InternalImageViewer from './viewers/InternalImageViewer';
import InternalExamMaterialViewer from './viewers/InternalExamMaterialViewer';
import { useVault } from '../context/VaultContext';

const MaterialViewer: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const { user } = useVault();
  
  const [material, setMaterial] = useState<any>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterialAndFile = async () => {
      if (!materialId) return;
      setIsLoading(true);
      setError(null);
      try {
        // 1. Get Metadata
        const meta = await api.getMaterialById(materialId);
        setMaterial(meta);

        // 2. If it's an exam, we don't need base64 yet (InternalExamMaterialViewer fetches it as string)
        if (meta.type !== 'exam') {
          const file = await api.getMaterialFileData(materialId);
          setFileData(file);
        }
      } catch (err: any) {
        console.error('Failed to load material', err);
        let msg = err.message || 'Material not found or access denied.';
        if (msg.includes('Unknown action: getMaterialFileData')) {
          msg = 'Backend is outdated (Missing getMaterialFileData). Please redeploy Apps Script with the latest Code.gs as a new version.';
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterialAndFile();
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

  const handleAdminDownload = () => {
    if (!material) return;
    window.open(material.downloadUrl, '_blank');
  };

  const handleAdminOpenDrive = () => {
    if (!material) return;
    window.open(material.driveUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="viewer-loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Initializing Secure Internal Viewer...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="viewer-error-container">
        <AlertCircle size={64} className="text-danger" />
        <h2>Unable to load material</h2>
        <p className="error-message-text">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          Go Back
        </button>
      </div>
    );
  }

  const isProtected = material.isProtected === 'TRUE' || material.isProtected === true;

  const renderViewer = () => {
    if (material.type === 'exam') {
      return (
        <InternalExamMaterialViewer 
          material={material} 
          onStartExam={handleStartExam}
          onUpdateMetadata={(updates) => setMaterial({ ...material, ...updates })}
        />
      );
    }

    if (!fileData) return (
      <div className="viewer-error">
        <AlertCircle size={48} />
        <p>File content could not be retrieved.</p>
      </div>
    );

    const isPdf = fileData.mimeType === 'application/pdf' || material.previewStatus === 'converted';

    if (isPdf) {
      return (
        <InternalPdfViewer 
          base64Data={fileData.base64} 
          fileName={fileData.fileName}
          isProtected={isProtected}
          adminActions={{
            onDownload: handleAdminDownload,
            onOpenDrive: handleAdminOpenDrive
          }}
        />
      );
    }

    if (fileData.mimeType.startsWith('image/')) {
      return (
        <InternalImageViewer 
          base64Data={fileData.base64} 
          mimeType={fileData.mimeType} 
          title={material.title}
          adminActions={{
            onDownload: handleAdminDownload,
            onOpenDrive: handleAdminOpenDrive
          }}
        />
      );
    }

    return (
      <div className="unsupported-viewer">
        <AlertCircle size={64} />
        <h3>Unsupported Preview Format</h3>
        <p>Internal preview is not available for this file type ({fileData.mimeType}).</p>
        <div className="fallback-actions">
           <a href={material.driveUrl} target="_blank" rel="noopener noreferrer" className="btn-fallback">
             View in Google Drive
           </a>
        </div>
      </div>
    );
  };

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
          {/* Admin Tools Placeholder */}
        </div>
      </header>

      <main className="viewer-main-content">
        <ProtectedContentShell 
          isProtected={isProtected} 
          materialId={material.id}
          title={material.title}
        >
          {renderViewer()}
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

        .viewer-main-content { flex: 1; overflow: hidden; position: relative; }

        .unsupported-viewer, .viewer-error {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
          background: var(--bg);
        }
        
        .btn-fallback {
          background: var(--primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .viewer-loading-container, .viewer-error-container { 
          position: fixed; inset: 0; background: var(--bg); z-index: 10001; 
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; 
        }
        .viewer-loading-container p { font-weight: 800; color: var(--text-soft); }
        .viewer-error-container h2 { font-weight: 900; color: var(--text-strong); }
        .viewer-error-container p.error-message-text { color: var(--text-danger); max-width: 500px; text-align: center; font-weight: 700; background: var(--danger-soft); padding: 1rem; border-radius: 12px; border: 1px solid var(--danger); }
        .btn-back { background: var(--primary); color: white; padding: 0 1.5rem; height: 48px; border-radius: 12px; font-weight: 800; }

        @media (max-width: 640px) {
          .viewer-header { height: auto; padding: 1rem; flex-direction: column; gap: 1rem; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default MaterialViewer;
