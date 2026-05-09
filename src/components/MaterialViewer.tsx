import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  AlertCircle, 
  Loader2, 
  ChevronLeft, 
  Download, 
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw
} from 'lucide-react';
import InternalPdfViewer from './viewers/InternalPdfViewer';
import InternalImageViewer from './viewers/InternalImageViewer';
import InternalExamMaterialViewer from './viewers/InternalExamMaterialViewer';

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
        console.log('📡 Fetching material file data for:', material.id);
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
      <div className="viewer-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Establishing Secure Connection...</p>
      </div>
    );

    if (isOutdatedBackend) {
      return (
        <div className="viewer-error deployment-alert">
          <Server size={64} className="text-warning" />
          <h2>Backend Update Required</h2>
          <p>The secure internal viewer requires a newer version of the Google Apps Script backend.</p>
          
          <div className="deployment-steps">
            <h4>Instructions for Admin:</h4>
            <ol>
              <li>Go to your Google Apps Script editor.</li>
              <li>Deploy the latest <code>Code.gs</code> content.</li>
              <li>Select <strong>Deploy {'>'} New Deployment</strong>.</li>
              <li>Ensure the version is <strong>3.3.0</strong> or higher.</li>
            </ol>
          </div>

          <div className="admin-only-fallback">
            <p className="admin-note">Students cannot see this. Admin fallback options:</p>
            <div className="fallback-btns">
              <button onClick={handleAdminOpenDrive} className="btn-outline">
                <ExternalLink size={16} /> Open in Drive
              </button>
              <button onClick={() => window.location.reload()} className="btn-retry">
                <RefreshCw size={16} /> Retry After Update
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (error) return (
      <div className="viewer-error">
        <AlertCircle size={48} className="text-danger" />
        <h2>Unable to load material</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">Retry Handshake</button>
      </div>
    );

    if (!fileData) return (
      <div className="viewer-error">
        <AlertCircle size={48} />
        <p>File content could not be retrieved.</p>
      </div>
    );

    const isPdf = fileData.mimeType === 'application/pdf' || material?.previewStatus === 'converted';

    if (isPdf) {
      return (
        <InternalPdfViewer 
          fileData={fileData}
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
      <div className="viewer-error">
        <ShieldAlert size={48} />
        <p>This file type ({fileData.mimeType}) is not supported by the internal viewer.</p>
        <div className="unsupported-actions">
           <button onClick={handleAdminOpenDrive} className="btn-outline">Open Original File</button>
        </div>
      </div>
    );
  };

  return (
    <div className="material-viewer-overlay animate-fade-in">
      <div className="viewer-container">
        <header className="viewer-header">
          <button className="back-btn" onClick={handleClose}>
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <div className="viewer-title">
            <h2>{material?.title || 'Loading...'}</h2>
            {material && <span className="badge">{material.type.toUpperCase()}</span>}
          </div>
          <div className="header-spacer" />
        </header>
        
        <main className="viewer-main">
          {renderViewer()}
        </main>
      </div>

      <style>{`
        .material-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0f172a;
          z-index: 2000;
          display: flex;
          flex-direction: column;
        }

        .viewer-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .viewer-header {
          height: 64px;
          background: #1e293b;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          gap: 2rem;
          color: white;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255,255,255,0.7);
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .back-btn:hover { color: white; transform: translateX(-4px); }

        .viewer-title { display: flex; align-items: center; gap: 1rem; }
        .viewer-title h2 { font-size: 1.1rem; font-weight: 900; letter-spacing: -0.02em; }
        .badge { background: var(--primary); font-size: 0.7rem; font-weight: 900; padding: 2px 8px; border-radius: 4px; }

        .viewer-main { flex: 1; overflow: hidden; position: relative; }

        .viewer-loading, .viewer-error {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          color: white;
          text-align: center;
          padding: 2rem;
        }
        
        .deployment-alert { background: rgba(245, 158, 11, 0.05); }
        .deployment-steps { 
          text-align: left; 
          background: rgba(0,0,0,0.2); 
          padding: 1.5rem; 
          border-radius: 12px; 
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 500px;
          margin: 1rem 0;
        }
        .deployment-steps h4 { margin-bottom: 0.75rem; color: #fbbf24; }
        .deployment-steps ol { padding-left: 1.25rem; font-size: 0.9rem; color: rgba(255,255,255,0.8); }
        .deployment-steps li { margin-bottom: 0.5rem; }

        .admin-only-fallback { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px dashed rgba(255,255,255,0.1); }
        .admin-note { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; }
        .fallback-btns { display: flex; gap: 1rem; }

        .btn-retry, .retry-btn { background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
        .btn-outline { border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }

        .unsupported-actions { margin-top: 1rem; }

        @media (max-width: 640px) {
          .viewer-header { gap: 1rem; padding: 0 1rem; }
          .viewer-title h2 { font-size: 0.9rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .back-btn span { display: none; }
        }
      `}</style>
    </div>
  );
};

export default MaterialViewer;
