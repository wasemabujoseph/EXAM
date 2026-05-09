import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCw,
  Download,
  ExternalLink,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface InternalImageViewerProps {
  base64Data: string;
  mimeType: string;
  title: string;
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const InternalImageViewer: React.FC<InternalImageViewerProps> = ({ 
  base64Data, 
  mimeType, 
  title,
  adminActions 
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.1));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const reset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="internal-image-viewer pro-theme">
      {/* Premium Toolbar */}
      <div className="image-toolbar-premium">
        <div className="toolbar-section">
          <button onClick={zoomOut} className="tool-btn" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-value">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="tool-btn" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <div className="tool-divider" />
          <button onClick={reset} className="tool-btn" title="Reset View">
            <Maximize size={18} />
          </button>
          <button onClick={rotate} className="tool-btn" title="Rotate">
            <RotateCw size={18} />
          </button>
        </div>

        <div className="toolbar-section">
          {isAdmin && (
            <div className="admin-tools-container">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={`tool-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}
                title="Admin Tools"
              >
                <MoreVertical size={18} />
              </button>
              
              {showAdminMenu && (
                <div className="admin-dropdown animate-pop-in">
                  <div className="dropdown-header">ADMIN TOOLS</div>
                  {adminActions?.onDownload && (
                    <button onClick={() => { adminActions.onDownload!(); setShowAdminMenu(false); }} className="dropdown-item">
                      <Download size={16} />
                      <span>Download Original</span>
                    </button>
                  )}
                  {adminActions?.onOpenDrive && (
                    <button onClick={() => { adminActions.onOpenDrive!(); setShowAdminMenu(false); }} className="dropdown-item">
                      <ExternalLink size={16} />
                      <span>Open in Drive</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Area */}
      <div className="image-viewport-container">
        {!isLoaded && (
          <div className="image-placeholder">
            <Loader2 className="animate-spin" size={32} />
            <p>Processing High-Resolution Image...</p>
          </div>
        )}
        <div 
          className="image-render-wrapper"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <img 
            src={imageUrl} 
            alt={title} 
            onLoad={() => setIsLoaded(true)}
            className="pro-rendered-image"
            style={{ display: isLoaded ? 'block' : 'none' }} 
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>

      <style>{`
        .internal-image-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: var(--bg-soft);
          position: relative;
          overflow: hidden;
        }

        .image-toolbar-premium {
          height: 56px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          box-shadow: var(--shadow-sm);
          z-index: 100;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tool-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .tool-btn:hover {
          background: var(--primary-soft);
          color: var(--primary);
        }
        .tool-btn.admin-trigger { color: var(--secondary); }
        .tool-btn.admin-trigger.active { background: var(--secondary); color: white; }

        .zoom-value {
          font-size: 0.8rem;
          font-weight: 800;
          min-width: 50px;
          text-align: center;
          color: var(--text-strong);
        }

        .tool-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
          margin: 0 0.5rem;
        }

        .image-viewport-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          padding: 2rem;
          background: var(--bg);
        }

        .image-render-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
        }

        .pro-rendered-image {
          max-width: 90vw;
          max-height: 80vh;
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--border);
          background: white; /* Base for transparent images */
        }
        html[data-theme="dark"] .pro-rendered-image {
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          border-color: rgba(255,255,255,0.1);
          background: #1e293b;
        }

        .image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-soft);
          font-weight: 700;
        }

        /* ADMIN DROPDOWN */
        .admin-tools-container { position: relative; }
        .admin-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-xl);
          padding: 0.5rem;
          z-index: 1000;
        }
        .dropdown-header {
          padding: 0.5rem 0.75rem;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--text-soft);
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--border);
          margin-bottom: 0.5rem;
        }
        .dropdown-item {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text);
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s;
        }
        .dropdown-item:hover {
          background: var(--primary-soft);
          color: var(--primary);
        }

        @media (max-width: 640px) {
          .image-toolbar-premium { gap: 0.5rem; }
          .zoom-value, .tool-divider { display: none; }
        }
      `}</style>
    </div>
  );
};

export default InternalImageViewer;
