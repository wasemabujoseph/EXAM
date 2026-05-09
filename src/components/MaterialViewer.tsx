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
  Image as ImageIcon,
  BookOpen,
  Lock
} from 'lucide-react';
import InternalPdfViewer from './viewers/InternalPdfViewer';
import InternalImageViewer from './viewers/InternalImageViewer';
import InternalExamMaterialViewer from './viewers/InternalExamMaterialViewer';
import BrandLogo from './BrandLogo';

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
          setError('Backend action missing. The secure internal viewer requires a backend update.');
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
    if (propOnClose) {
      propOnClose();
    } else {
      navigate(-1);
    }
  };

  const handleAdminDownload = () => {
    if (material?.downloadUrl) {
      window.open(material.downloadUrl, '_blank');
    }
  };

  const handleAdminOpenDrive = () => {
    if (material?.driveUrl) {
      window.open(material.driveUrl, '_blank');
    }
  };

  const handleStartExam = () => {
    if (material?.id) {
      navigate(`/dashboard/exam/material/${material.id}`);
    }
  };

  const handleUpdateMetadata = (updates: any) => {
    setMaterial((prev: any) => ({ ...prev, ...updates }));
  };

  const isProtected = material?.isProtected === 'TRUE' || material?.isProtected === true;

  const renderViewer = () => {
    if (isLoading && !error) return (
      <div className="viewer-loading-screen">
        <Loader2 className="animate-spin text-primary" size={64} />
        <div className="loading-text">
          <h3>Securing Connection</h3>
          <p>Preparing professional learning environment...</p>
        </div>
      </div>
    );

    if (isOutdatedBackend) {
      return (
        <div className="viewer-system-alert">
          <Server size={64} className="text-warning" />
          <h2>System Sync Required</h2>
          <p>The secure internal viewer requires a newer backend version (3.3.0+).</p>
          <div className="admin-only-tools">
             <button onClick={handleAdminOpenDrive} className="btn-outline">Open in Drive (Admin Fallback)</button>
          </div>
        </div>
      );
    }

    if (error) return (
      <div className="viewer-system-alert error">
        <AlertCircle size={64} className="text-danger" />
        <h2>Access Interrupted</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry Sync</button>
      </div>
    );

    if (!fileData) return (
      <div className="viewer-system-alert">
        <AlertCircle size={64} />
        <p>File content could not be retrieved from the server.</p>
      </div>
    );

    const isPdf = fileData.mimeType === 'application/pdf' || material?.previewStatus === 'converted';

    // Enhance fileData with metadata for internal viewers
    const enhancedFileData = {
      ...fileData,
      isProtected,
      fileName: material?.originalFilename || fileData.fileName,
      title: material?.title,
      year: material?.year,
      subject: material?.subject
    };

    if (isPdf) {
      return (
        <InternalPdfViewer 
          fileData={enhancedFileData}
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
          isProtected={isProtected}
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
      <div className="viewer-system-alert">
        <ShieldAlert size={64} className="text-warning" />
        <h3>Unsupported Format</h3>
        <p>Type <strong>{fileData.mimeType}</strong> is not supported by the internal secure viewer.</p>
      </div>
    );
  };

  const getMaterialIcon = () => {
    if (material?.type === 'pdf') return <FileText size={20} className="text-primary" />;
    if (material?.type === 'image') return <ImageIcon size={20} className="text-teal" />;
    if (material?.type === 'exam') return <BookOpen size={20} className="text-accent" />;
    return <FileText size={20} />;
  };

  return (
    <div className="material-viewer-pro-overlay animate-fade-in">
      <div className="pro-viewer-shell">
        <header className="pro-viewer-header">
          <div className="header-left">
            <button className="pro-back-btn" onClick={handleClose}>
              <ChevronLeft size={22} />
              <span className="desktop-only">Back</span>
            </button>
            <div className="material-identity">
              <div className="id-icon-box">
                {getMaterialIcon()}
              </div>
              <div className="id-text">
                <div className="title-row">
                  <h2 className="material-title-text">{material?.title || 'Loading Material...'}</h2>
                  {isProtected && <Lock size={14} className="text-warning" />}
                </div>
                <div className="meta-row">
                  {material?.year && <span className="meta-badge">{material.year}</span>}
                  {material?.subject && <span className="meta-badge subject">{material.subject}</span>}
                  {material?.type && <span className="meta-badge type">{material.type.toUpperCase()}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="header-right desktop-only">
             <div className="platform-branding flex items-center gap-2">
               <BrandLogo variant="compact" size="sm" showSubtitle={false} />
               <span className="brand-internal">Internal Viewer</span>
             </div>
          </div>
        </header>
        
        <main className="pro-viewer-content">
          {renderViewer()}
        </main>
      </div>

      <style>{`
        .material-viewer-pro-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg);
          z-index: 2100;
          display: flex;
          flex-direction: column;
        }

        .pro-viewer-shell {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .pro-viewer-header {
          height: 80px;
          background: var(--surface);
          border-bottom: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          box-shadow: var(--shadow-md);
          z-index: 10;
        }

        .header-left { display: flex; align-items: center; gap: 1.5rem; flex: 1; }

        .pro-back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-weight: 800;
          transition: all 0.2s;
          padding: 0.5rem;
          border-radius: var(--radius-lg);
        }
        .pro-back-btn:hover { background: var(--bg-soft); color: var(--primary); }

        .material-identity { display: flex; align-items: center; gap: 1rem; flex: 1; }
        .id-icon-box {
          width: 44px;
          height: 44px;
          background: var(--bg-soft);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        .id-text { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
        .title-row { display: flex; align-items: center; gap: 0.5rem; }
        .material-title-text { 
          font-size: 1.1rem; 
          font-weight: 900; 
          color: var(--text-strong); 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          max-width: 600px;
        }

        .meta-row { display: flex; align-items: center; gap: 0.5rem; }
        .meta-badge { 
          font-size: 0.65rem; 
          font-weight: 800; 
          background: var(--bg-soft); 
          color: var(--text-muted); 
          padding: 2px 8px; 
          border-radius: 4px; 
          text-transform: uppercase;
        }
        .meta-badge.subject { background: var(--primary-soft); color: var(--primary); }
        .meta-badge.type { background: var(--border); color: var(--text-strong); }

        .platform-branding { display: flex; align-items: center; gap: 0.25rem; font-weight: 900; font-size: 0.8rem; }
        .brand-med { color: var(--primary); }
        .brand-exam { color: var(--secondary); }
        .brand-internal { color: var(--text-soft); font-weight: 600; margin-left: 0.5rem; font-size: 0.7rem; opacity: 0.6; }

        .pro-viewer-content { flex: 1; overflow: hidden; position: relative; }

        .viewer-loading-screen, .viewer-system-alert {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          text-align: center;
          padding: 2rem;
        }
        .loading-text h3 { margin-bottom: 0.5rem; }
        .loading-text p { color: var(--text-soft); font-weight: 600; }

        .btn-primary { background: var(--primary); color: white; padding: 0.8rem 2rem; border-radius: 12px; font-weight: 800; }
        .btn-outline { border: 2px solid var(--border); color: var(--text); padding: 0.8rem 2rem; border-radius: 12px; font-weight: 800; }

        @media (max-width: 768px) {
          .pro-viewer-header { height: 72px; padding: 0 1rem; }
          .desktop-only { display: none; }
          .material-title-text { font-size: 1rem; max-width: 200px; }
          .id-icon-box { display: none; }
          .header-left { gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
};

export default MaterialViewer;
