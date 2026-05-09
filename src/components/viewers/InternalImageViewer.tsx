import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCw,
  Download,
  ExternalLink,
  Loader2
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

  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.1));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  const reset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="internal-image-viewer">
      {/* Toolbar */}
      <div className="image-toolbar">
        <div className="toolbar-section">
          <button onClick={zoomOut} className="toolbar-btn" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-text">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="toolbar-btn" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <button onClick={reset} className="toolbar-btn" title="Reset View">
            <Maximize size={18} />
          </button>
          <button onClick={rotate} className="toolbar-btn" title="Rotate">
            <RotateCw size={18} />
          </button>
        </div>

        {isAdmin && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-section admin-tools">
              {adminActions?.onDownload && (
                <button onClick={adminActions.onDownload} className="toolbar-btn admin" title="Download Original">
                  <Download size={18} />
                </button>
              )}
              {adminActions?.onOpenDrive && (
                <button onClick={adminActions.onOpenDrive} className="toolbar-btn admin" title="Open in Drive">
                  <ExternalLink size={18} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Image Area */}
      <div className="image-display-container">
        {!isLoaded && (
          <div className="image-loading">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
        <div 
          className="image-wrapper"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out'
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
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
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
          background: #0f172a;
          position: relative;
          overflow: hidden;
        }

        .image-toolbar {
          height: 56px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem;
          gap: 1rem;
          color: white;
          z-index: 10;
          flex-shrink: 0;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toolbar-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          transition: all 0.2s;
        }

        .toolbar-btn:hover {
          background: rgba(255,255,255,0.15);
          color: white;
        }

        .toolbar-btn.admin {
          color: #38bdf8;
        }

        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,0.1);
        }

        .zoom-text {
          font-size: 0.8rem;
          font-weight: 800;
          min-width: 45px;
          text-align: center;
          color: rgba(255,255,255,0.6);
        }

        .image-display-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
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
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        @media (max-width: 640px) {
          .image-toolbar { height: auto; padding: 0.75rem; flex-wrap: wrap; }
          .zoom-text, .toolbar-divider { display: none; }
        }
      `}</style>
    </div>
  );
};

export default InternalImageViewer;
