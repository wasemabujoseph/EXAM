import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  FileText, 
  Image as ImageIcon, 
  FileJson, 
  AlertCircle,
  Loader2,
  Lock,
  Calendar,
  BookOpen,
  ShieldCheck,
  Download,
  ExternalLink,
  Info
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { api } from '../lib/api';
import InternalPdfViewer from './viewers/InternalPdfViewer';
import InternalImageViewer from './viewers/InternalImageViewer';
import InternalExamMaterialViewer from './viewers/InternalExamMaterialViewer';
import ProtectedContentShell from './security/ProtectedContentShell';

const MaterialViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';

  const [material, setMaterial] = useState<any>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        // Fetch material metadata
        const mat = await api.getMaterialById(id);
        if (!mat) throw new Error('Material not found');
        setMaterial(mat);

        // Fetch file data (base64)
        const data = await api.getMaterialFileData(id);
        if (!data) throw new Error('Unable to retrieve file content');
        setFileData(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load material');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  if (isLoading) {
    return (
      <div className="material-viewer-loading-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p>Opening Secure Repository...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="material-viewer-error-screen container">
        <AlertCircle size={64} className="text-danger" />
        <h1>Material Unavailable</h1>
        <p>{error || 'This material could not be loaded.'}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          <ChevronLeft size={20} /> Go Back
        </button>
      </div>
    );
  }

  const handleAdminDownload = () => {
    if (!material?.driveUrl) return;
    window.open(material.driveUrl, '_blank');
  };

  const renderViewer = () => {
    const isPdf = material.type === 'PDF' || material.mimeType === 'application/pdf' || material.previewStatus === 'converted';
    const isImage = material.type === 'Image' || material.mimeType?.startsWith('image/');
    const isExam = material.type === 'Exam';

    const viewerProps = {
      fileData: {
        ...fileData,
        fileName: material.title,
        isProtected: material.isProtected === true
      },
      adminActions: isAdmin ? {
        onDownload: handleAdminDownload,
        onOpenDrive: () => material.driveUrl && window.open(material.driveUrl, '_blank')
      } : undefined
    };

    if (isPdf) return <InternalPdfViewer {...viewerProps} />;
    if (isImage) return <InternalImageViewer {...viewerProps} />;
    if (isExam) return <InternalExamMaterialViewer {...viewerProps} material={material} />;

    return (
      <div className="unsupported-viewer">
        <AlertCircle size={48} className="text-warning" />
        <h3>Unsupported File Type</h3>
        <p>This file format cannot be viewed internally yet.</p>
        {isAdmin && (
          <button onClick={handleAdminDownload} className="btn-primary">
            Download for Offline View
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="material-viewer-layout">
      {/* Premium Header */}
      <header className="material-viewer-header glass">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="back-btn" title="Back to Library">
            <ChevronLeft size={24} />
          </button>
          
          <div className="material-identity">
            <div className="title-row">
              <div className="type-icon">
                {material.type === 'PDF' ? <FileText size={20} /> : <ImageIcon size={20} />}
              </div>
              <h1 className="material-title">{material.title}</h1>
              {material.isProtected && (
                <div className="protected-badge-premium" title="Secure Content">
                  <Lock size={12} />
                  <span>PROTECTED</span>
                </div>
              )}
            </div>
            
            <div className="metadata-row">
              <span className="meta-item">
                <Calendar size={14} />
                <span>Academic Year {material.year}</span>
              </span>
              <span className="meta-divider" />
              <span className="meta-item">
                <BookOpen size={14} />
                <span>{material.subject}</span>
              </span>
              {isAdmin && (
                <>
                  <span className="meta-divider" />
                  <span className="meta-item admin-meta">
                    <ShieldCheck size={14} />
                    <span>Admin View</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* Student sees nothing here for security. Admin buttons are inside the internal viewer's toolbars */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="material-viewer-content">
        {material.isProtected ? (
          <ProtectedContentShell 
            isProtected={true} 
            title={material.title}
          >
            {renderViewer()}
          </ProtectedContentShell>
        ) : (
          renderViewer()
        )}
      </main>

      <style>{`
        .material-viewer-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: var(--bg);
          overflow: hidden;
        }

        .material-viewer-header {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          border-bottom: 1px solid var(--border);
          z-index: 1000;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          min-width: 0;
        }

        .back-btn {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: var(--bg-soft);
          color: var(--text-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border: 1px solid var(--border);
        }

        .back-btn:hover {
          background: var(--surface);
          color: var(--primary);
          transform: translateX(-2px);
          box-shadow: var(--shadow-md);
        }

        .material-identity {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .type-icon {
          color: var(--primary);
          display: flex;
          align-items: center;
        }

        .material-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-strong);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .protected-badge-premium {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--danger-soft);
          color: var(--danger);
          padding: 2px 10px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          border: 1px solid rgba(239, 68, 68, 0.2);
          flex-shrink: 0;
        }

        .metadata-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-soft);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .meta-divider {
          width: 4px;
          height: 4px;
          background: var(--border-strong);
          border-radius: 50%;
          opacity: 0.3;
        }

        .admin-meta {
          color: var(--primary);
        }

        .material-viewer-content {
          flex: 1;
          position: relative;
          background: var(--bg-soft);
          overflow: hidden;
        }

        .material-viewer-loading-screen, .material-viewer-error-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: var(--bg);
          gap: 1.5rem;
          padding: 2rem;
        }

        .material-viewer-loading-screen p {
          font-weight: 800;
          color: var(--text-strong);
          font-size: 1.2rem;
        }

        .material-viewer-error-screen h1 { margin-bottom: 0.5rem; }
        .material-viewer-error-screen p { color: var(--text-muted); max-width: 400px; margin-bottom: 1.5rem; }

        .unsupported-viewer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1.5rem;
          text-align: center;
          color: var(--text-strong);
        }

        /* Mobile Adjustments */
        @media (max-width: 600px) {
          .material-viewer-header {
            height: auto;
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .material-title { font-size: 1.1rem; }
          .metadata-row { flex-wrap: wrap; gap: 0.5rem 1rem; }
        }
      `}</style>
    </div>
  );
};

export default MaterialViewer;
