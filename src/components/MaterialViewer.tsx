import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  ShieldAlert,
  Server,
  RefreshCw,
  FileText,
  Calendar,
  BookOpen,
  Lock
} from 'lucide-react';
import InternalPdfViewer from './viewers/InternalPdfViewer';
import InternalImageViewer from './viewers/InternalImageViewer';
import InternalExamMaterialViewer from './viewers/InternalExamMaterialViewer';
import ProtectedContentShell from './security/ProtectedContentShell';

interface MaterialViewerProps {
  material?: any;
  onClose?: () => void;
}

const MaterialViewer: React.FC<MaterialViewerProps> = ({ material: propMaterial, onClose: propOnClose }) => {
  const { materialId: paramId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState<any>(propMaterial || null);
  const [fileData, setFileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOutdatedBackend, setIsOutdatedBackend] = useState(false);

  // 1. Fetch material metadata if only ID is provided via URL
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!propMaterial && paramId) {
        setIsLoading(true);
        try {
          const data = await api.getMaterialById(paramId);
          setMaterial(data);
        } catch (err: any) {
          setError(err.message || 'Material not found.');
          setIsLoading(false);
        }
      }
    };
    fetchMetadata();
  }, [propMaterial, paramId]);

  // 2. Fetch file bytes once metadata is available
  useEffect(() => {
    const fetchFileData = async () => {
      if (!material?.id) return;
      
      setIsLoading(true);
      setError(null);
      setIsOutdatedBackend(false);
      try {
        const data = await api.getMaterialFileData(material.id);
        setFileData(data);
      } catch (err: any) {
        console.error('Failed to fetch material file data:', err);
        if (err.message?.includes('Unknown action') || err.message?.includes('getMaterialFileData')) {
          setIsOutdatedBackend(true);
          setError('Backend version mismatch.');
        } else {
          setError(err.message || 'Unable to retrieve material content.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileData();
  }, [material?.id]);

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else navigate(-1);
  };

  const handleAdminDownload = () => {
    if (material?.downloadUrl) window.open(material.downloadUrl, '_blank');
  };

  const handleAdminOpenDrive = () => {
    if (material?.driveUrl) window.open(material.driveUrl, '_blank');
  };

  const handleStartExam = () => {
    if (material?.id) {
      navigate(`/dashboard/exam/material/${material.id}`, {
        state: {
          isProtected,
          securityMode: isProtected ? 'protected' : 'normal'
        }
      });
    }
  };

  const handleUpdateMetadata = (updates: any) => {
    setMaterial((prev: any) => ({ ...prev, ...updates }));
  };

  const isProtected = material?.isProtected === 'TRUE' || material?.isProtected === true;

  const renderViewerContent = () => {
    if (isLoading && !error) return (
      <div className="viewer-loading-state">
        <Loader2 className="animate-spin" size={48} />
        <h3>Securing Document</h3>
        <p>Establishing encrypted channel for material retrieval...</p>
      </div>
    );

    if (isOutdatedBackend) {
      return (
        <div className="viewer-error-panel">
          <Server size={64} className="icon-warning" />
          <h2>Infrastructure Update Required</h2>
          <p>This material requires Backend v3.3.0. Please contact your system administrator.</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="btn-retry-med">
              <RefreshCw size={16} /> Retry After Update
            </button>
          </div>
        </div>
      );
    }

    if (error) return (
      <div className="viewer-error-panel">
        <AlertCircle size={64} className="icon-danger" />
        <h2>Access Interrupted</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-retry-med">Retry Connection</button>
      </div>
    );

    if (!fileData) return null;

    const isPdf = fileData.mimeType === 'application/pdf' || material?.previewStatus === 'converted';

    if (isPdf) {
      return (
        <InternalPdfViewer 
          fileData={{...fileData, isProtected}}
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
          title={material?.title || 'Image'}
          adminActions={{
            onDownload: handleAdminDownload,
            onOpenDrive: handleAdminOpenDrive
          }}
        />
      );
    }

    if (material?.type === 'exam') {
      return (
        <InternalExamMaterialViewer 
          material={material} 
          onStartExam={handleStartExam}
          onUpdateMetadata={handleUpdateMetadata}
        />
      );
    }

    return (
      <div className="viewer-error-panel">
        <ShieldAlert size={64} />
        <h2>Format Not Supported</h2>
        <p>This file type ({fileData.mimeType}) is not optimized for internal viewing.</p>
      </div>
    );
  };

  return (
    <div className="material-viewer-full">
      <div className="viewer-layout">
        <header className="viewer-navbar">
          <div className="navbar-left">
            <button className="nav-back-btn" onClick={handleClose}>
              <ChevronLeft size={20} />
              <span>EXIT</span>
            </button>
            <div className="nav-divider" />
            <div className="nav-content">
              <div className="nav-title">
                <FileText size={16} className="title-icon" />
                <h1>{material?.title || 'Material Library'}</h1>
              </div>
              {material && (
                <div className="nav-meta-row">
                  <div className="meta-badge">
                    <Calendar size={12} />
                    <span>{material.year || 'Academic Year'}</span>
                  </div>
                  <div className="meta-badge">
                    <BookOpen size={12} />
                    <span>{material.subject || 'Subject'}</span>
                  </div>
                  {isProtected && (
                    <div className="meta-badge protected">
                      <Lock size={12} />
                      <span>PROTECTED</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="navbar-right">
            {/* Context-aware badges or status indicators */}
          </div>
        </header>
        
        <main className="viewer-workspace">
          <ProtectedContentShell 
            isProtected={isProtected} 
            materialId={material?.id}
            title={material?.title}
          >
            {renderViewerContent()}
          </ProtectedContentShell>
        </main>
      </div>

      <style>{`
        .material-viewer-full {
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease-out;
        }

        .viewer-layout {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .viewer-navbar {
          height: 72px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .navbar-left { display: flex; align-items: center; gap: 1.5rem; }
        
        .nav-back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: var(--bg-soft);
          transition: all 0.2s;
        }
        .nav-back-btn:hover { color: var(--primary); background: var(--primary-soft); transform: translateX(-4px); }

        .nav-divider { width: 1px; height: 32px; background: var(--border); }

        .nav-content { display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-title { display: flex; align-items: center; gap: 0.6rem; }
        .nav-title h1 { font-size: 1rem; font-weight: 900; color: var(--text-strong); }
        .title-icon { color: var(--primary); }

        .nav-meta-row { display: flex; align-items: center; gap: 0.75rem; }
        .meta-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-soft);
          background: var(--bg-soft-fade);
          padding: 0.15rem 0.6rem;
          border-radius: 4px;
        }
        .meta-badge.protected { color: var(--danger); background: var(--danger-soft); }

        .viewer-workspace { flex: 1; overflow: hidden; position: relative; }

        .viewer-loading-state, .viewer-error-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 2rem;
          background: var(--bg);
        }
        
        .viewer-loading-state h3 { font-size: 1.25rem; color: var(--text-strong); }
        .viewer-loading-state p { color: var(--text-soft); font-weight: 600; }

        .icon-warning { color: var(--warning); margin-bottom: 1rem; }
        .icon-danger { color: var(--danger); margin-bottom: 1rem; }
        
        .btn-retry-med {
          background: var(--primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 768px) {
          .viewer-navbar { height: 64px; padding: 0 1rem; }
          .nav-divider { display: none; }
          .nav-back-btn span { display: none; }
          .nav-meta-row { display: none; }
          .nav-title h1 { font-size: 0.85rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        }
      `}</style>
    </div>
  );
};

export default MaterialViewer;
