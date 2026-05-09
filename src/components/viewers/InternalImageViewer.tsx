import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCw,
  Download,
  ExternalLink,
  Loader2,
  MoreVertical,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface InternalImageViewerProps {
  base64Data: string;
  mimeType: string;
  title: string;
  isProtected?: boolean;
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const InternalImageViewer: React.FC<InternalImageViewerProps> = ({ 
  base64Data, 
  mimeType, 
  title,
  isProtected,
  adminActions 
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.1));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const reset = () => {
    setScale(1);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`internal-image-viewer theme-aware ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      {/* Toolbar */}
      <div className="image-toolbar-premium">
        <div className="toolbar-section">
          <div className="zoom-controls">
            <button onClick={zoomOut} className="z-btn" title="Zoom Out"><ZoomOut size={16} /></button>
            <span className="zoom-val">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="z-btn" title="Zoom In"><ZoomIn size={16} /></button>
            <div className="z-divider" />
            <button onClick={reset} className="z-btn fit" title="Reset View"><Maximize size={16} /></button>
          </div>
        </div>

        <div className="toolbar-section">
          <button onClick={rotate} className="icon-btn" title="Rotate Image">
            <RotateCw size={18} />
          </button>
          
          <button onClick={toggleFullscreen} className="icon-btn desktop-only" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {isAdmin && (
            <div className="admin-dropdown-wrapper">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={`icon-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}
                title="Admin Tools"
              >
                <MoreVertical size={18} />
              </button>
              
              {showAdminMenu && (
                <div className="admin-menu animate-pop-in">
                  <div className="menu-header">Admin Tools</div>
                  <button onClick={() => { adminActions?.onDownload?.(); setShowAdminMenu(false); }} className="menu-item">
                    <Download size={16} />
                    <span>Download Original</span>
                  </button>
                  <button onClick={() => { adminActions?.onOpenDrive?.(); setShowAdminMenu(false); }} className="menu-item">
                    <ExternalLink size={16} />
                    <span>Open in Drive</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Area */}
      <div className="image-display-container">
        {!isLoaded && (
          <div className="image-loading">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p>Processing image...</p>
          </div>
        )}
        <div 
          className="image-wrapper"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <img 
            src={imageUrl} 
            alt={title} 
            onLoad={() => setIsLoaded(true)}
            style={{ 
              display: isLoaded ? 'block' : 'none',
              maxWidth: '90vw',
              maxHeight: '80vh',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: '2px',
              border: '1px solid var(--border)'
            }} 
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
          color: var(--text);
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
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--bg-soft);
          padding: 2px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .z-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .z-btn:hover { background: var(--surface); color: var(--primary); }
        .z-divider { width: 1px; height: 16px; background: var(--border); margin: 0 2px; }
        .zoom-val { font-size: 0.75rem; font-weight: 800; min-width: 45px; text-align: center; }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .icon-btn:hover { background: var(--bg-soft); color: var(--text); }

        .admin-dropdown-wrapper { position: relative; }
        .admin-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 200px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 0.5rem;
          z-index: 1000;
        }
        .menu-header {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-soft);
          text-transform: uppercase;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 0.25rem;
        }
        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          color: var(--text);
          transition: all 0.2s;
        }
        .menu-item:hover { background: var(--bg-soft); color: var(--primary); }

        .image-display-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          background: var(--bg);
          padding: 2rem;
          position: relative;
        }

        .image-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
        }

        .image-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          z-index: 1;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .image-display-container { padding: 1rem; }
          .zoom-val { font-size: 0.7rem; min-width: 35px; }
        }

        .animate-pop-in {
          animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default InternalImageViewer;
