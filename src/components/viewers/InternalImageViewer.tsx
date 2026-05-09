import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  ExternalLink,
  RefreshCw,
  Settings,
  Info,
  ShieldAlert
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface InternalImageViewerProps {
  fileData: {
    base64: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    isProtected?: boolean;
  };
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const InternalImageViewer: React.FC<InternalImageViewerProps> = ({ 
  fileData,
  adminActions
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  
  const [scale, setScale] = useState(1);
  const [showDebug, setShowDebug] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <div className="internal-image-viewer themed-viewer">
      <div className="viewer-toolbar-premium glass">
        <div className="toolbar-left">
          <div className="zoom-controls">
            <button onClick={zoomOut} className="toolbar-action-btn" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <div className="zoom-value" onClick={resetZoom}>
              {Math.round(scale * 100)}%
            </div>
            <button onClick={zoomIn} className="toolbar-action-btn" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <div className="toolbar-divider" />
            <button onClick={resetZoom} className="toolbar-action-btn" title="Reset Zoom">
              <Maximize size={18} />
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {isAdmin && (
            <div className="admin-tools-wrapper">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={`toolbar-action-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}
                title="Admin Tools"
              >
                <Settings size={18} />
              </button>
              
              {showAdminMenu && (
                <div className="admin-dropdown-menu animate-pop-in">
                  <div className="menu-header">Admin Control Panel</div>
                  {adminActions?.onDownload && (
                    <button onClick={adminActions.onDownload} className="menu-item">
                      <Download size={16} /> <span>Download Original</span>
                    </button>
                  )}
                  {adminActions?.onOpenDrive && (
                    <button onClick={adminActions.onOpenDrive} className="menu-item">
                      <ExternalLink size={16} /> <span>Open in Google Drive</span>
                    </button>
                  )}
                  <button onClick={() => setShowDebug(!showDebug)} className="menu-item">
                    <Info size={16} /> <span>Diagnostic Inspector</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => setScale(1)} 
            className="toolbar-action-btn"
            title="Refresh View"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="image-workspace">
        <div className="image-canvas-container" style={{ transform: `scale(${scale})` }}>
          <img 
            src={fileData.base64.startsWith('data:') ? fileData.base64 : `data:${fileData.mimeType};base64,${fileData.base64}`} 
            alt={fileData.fileName}
            className="viewer-image"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {showDebug && isAdmin && (
          <div className="admin-diagnostic-inspector glass animate-pop-in">
            <div className="inspector-header">
              <ShieldAlert size={16} />
              <span>Diagnostic Inspector (Admin)</span>
            </div>
            <div className="inspector-content">
              <div className="inspector-row"><span>Filename</span> <strong>{fileData.fileName}</strong></div>
              <div className="inspector-row"><span>Type</span> <strong>{fileData.mimeType}</strong></div>
              <div className="inspector-row"><span>Size</span> <strong>{(fileData.sizeBytes / 1024 / 1024).toFixed(2)} MB</strong></div>
            </div>
            <button className="inspector-close" onClick={() => setShowDebug(false)}>Close Inspector</button>
          </div>
        )}
      </div>

      <style>{`
        .themed-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: var(--bg-soft);
          position: relative;
          overflow: hidden;
        }

        .viewer-toolbar-premium {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          margin: 0.75rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          z-index: 100;
          box-shadow: var(--shadow-lg);
        }

        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          background: var(--surface-muted);
          padding: 4px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }

        .toolbar-action-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
          background: transparent;
          min-height: auto;
        }

        .toolbar-action-btn:hover:not(:disabled) {
          background: var(--surface-elevated);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .toolbar-action-btn.active {
          background: var(--primary);
          color: white;
        }

        .zoom-value {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0 1rem;
          color: var(--text-strong);
          min-width: 60px;
          justify-content: center;
          cursor: pointer;
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
          margin: 0 4px;
        }

        .admin-tools-wrapper { position: relative; }

        .admin-dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 240px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          padding: 8px;
          z-index: 200;
        }

        .menu-header {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-soft);
          padding: 8px 12px;
          font-weight: 800;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          color: var(--text);
          text-align: left;
          background: transparent;
          min-height: auto;
        }

        .menu-item:hover {
          background: var(--bg-soft);
          color: var(--primary);
        }

        .image-workspace {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .image-canvas-container {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          justify-content: center;
          align-items: center;
          max-width: 100%;
          max-height: 100%;
        }

        .viewer-image {
          max-width: 100%;
          max-height: calc(100vh - 180px);
          object-fit: contain;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
          background: white;
        }

        .admin-diagnostic-inspector {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          width: 300px;
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--primary-soft);
          z-index: 150;
        }

        .inspector-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary);
          font-weight: 800;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .inspector-content { display: flex; flex-direction: column; gap: 0.5rem; }
        .inspector-row { display: flex; justify-content: space-between; font-size: 0.75rem; }
        .inspector-row span { color: var(--text-soft); }
        .inspector-row strong { color: var(--text-strong); }
        .inspector-close {
          width: 100%;
          margin-top: 1rem;
          background: var(--bg-soft);
          color: var(--text);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 6px;
          border-radius: var(--radius-md);
        }

        @media (max-width: 600px) {
          .viewer-toolbar-premium { padding: 0.75rem; height: auto; flex-direction: column; gap: 0.5rem; }
          .toolbar-left, .toolbar-right { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default InternalImageViewer;
