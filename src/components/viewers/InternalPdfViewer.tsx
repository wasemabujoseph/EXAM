import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Info,
  ShieldAlert,
  RefreshCw,
  MoreVertical,
  Settings
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

// Set worker source to the locally bundled Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

if (import.meta.env.DEV) {
  console.log("PDF.js worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);
}

interface InternalPdfViewerProps {
  fileData: {
    base64: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    byteLength?: number;
    pdfHeaderValid?: boolean;
    isProtected?: boolean;
  };
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const InternalPdfViewer: React.FC<InternalPdfViewerProps> = ({ 
  fileData,
  adminActions
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setPdf(null);
      
      try {
        const pureBase64 = fileData.base64.includes(',') ? fileData.base64.split(',')[1] : fileData.base64;
        const binaryString = window.atob(pureBase64.trim());
        const data = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          data[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ 
          data,
          disableWorker: false 
        } as any);

        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js Internal Error:', err);
        setError(err.message || 'The document could not be rendered internally. Please check the source file.');
        setIsLoading(false);
      }
    };

    if (fileData?.base64) {
      loadPdf();
    }
  }, [fileData?.base64, renderKey]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;
      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
        canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;
        
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (e) {}
    };
    renderPage();
  }, [pdf, currentPage, scale, renderKey]);

  const fitToWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40; // padding
      pdf?.getPage(currentPage).then((page: any) => {
        const viewport = page.getViewport({ scale: 1 });
        const newScale = containerWidth / viewport.width;
        setScale(newScale);
      });
    }
  };

  return (
    <div className="internal-pdf-viewer themed-viewer" ref={containerRef}>
      <div className="viewer-toolbar-premium glass">
        <div className="toolbar-left">
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage <= 1 || isLoading} 
              className="toolbar-action-btn"
              title="Previous Page"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="page-counter">
              <span className="current">{currentPage}</span>
              <span className="separator">of</span>
              <span className="total">{numPages || '--'}</span>
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} 
              disabled={currentPage >= numPages || isLoading} 
              className="toolbar-action-btn"
              title="Next Page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="toolbar-center">
          <div className="zoom-controls">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="toolbar-action-btn" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <div className="zoom-value" onClick={fitToWidth}>
              {Math.round(scale * 100)}%
            </div>
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="toolbar-action-btn" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <div className="toolbar-divider" />
            <button onClick={fitToWidth} className="toolbar-action-btn" title="Fit to Width">
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
            onClick={() => setRenderKey(k => k + 1)} 
            className="toolbar-action-btn"
            title="Refresh Display"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="pdf-workspace">
        {isLoading ? (
          <div className="viewer-state-loading">
            <div className="medical-loader">
              <Loader2 className="animate-spin text-primary" size={48} />
              <div className="loader-pulse"></div>
            </div>
            <p className="loading-text">Preparing Secure Learning Material...</p>
            <div className="loading-subtext">Initializing internal PDF engine (v3.3.2)</div>
          </div>
        ) : error ? (
          <div className="viewer-state-error">
            <div className="error-icon-wrapper">
              <AlertCircle size={48} />
            </div>
            <h3>Unable to load PDF</h3>
            <p className="error-description">{error}</p>
            <div className="error-actions">
              <button onClick={() => setRenderKey(k => k + 1)} className="btn-primary-small">
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="pdf-canvas-container">
            <div className="canvas-shadow-wrapper">
              <canvas ref={canvasRef} onContextMenu={e => e.preventDefault()} />
            </div>
          </div>
        )}

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
              <div className="inspector-row"><span>PDF Valid</span> <strong className={fileData.pdfHeaderValid ? 'text-success' : 'text-danger'}>{fileData.pdfHeaderValid ? 'YES' : 'NO'}</strong></div>
              <div className="inspector-row"><span>Worker</span> <strong>Bundled Asset</strong></div>
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

        .toolbar-left, .toolbar-center, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .pagination-controls, .zoom-controls {
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

        .page-counter, .zoom-value {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0 1rem;
          color: var(--text-strong);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .page-counter .separator {
          color: var(--text-soft);
          font-weight: 500;
        }

        .zoom-value {
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

        .admin-tools-wrapper {
          position: relative;
        }

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

        .pdf-workspace {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          position: relative;
        }

        .pdf-canvas-container {
          width: fit-content;
          display: flex;
          justify-content: center;
        }

        .canvas-shadow-wrapper {
          background: white;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
          transition: transform 0.2s ease;
        }

        /* Loading & Error States */
        .viewer-state-loading, .viewer-state-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin: auto;
          gap: 1.5rem;
        }

        .loading-text { font-weight: 800; color: var(--text-strong); font-size: 1.1rem; }
        .loading-subtext { color: var(--text-soft); font-size: 0.85rem; font-family: monospace; }
        
        .error-icon-wrapper { color: var(--danger); }
        .error-description { color: var(--text-muted); max-width: 400px; margin-bottom: 1rem; }

        .btn-primary-small {
          background: var(--primary);
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-lg);
          font-weight: 800;
          font-size: 0.85rem;
          gap: 0.5rem;
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

        .inspector-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .inspector-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }

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

        /* Force Desktop density on phones */
        @media (max-width: 600px) {
          .viewer-toolbar-premium {
            padding: 0 0.5rem;
            margin: 0.5rem;
            height: auto;
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
          }
          .toolbar-left, .toolbar-center, .toolbar-right {
            width: 100%;
            justify-content: center;
          }
          .page-counter, .zoom-value {
            min-width: auto;
            padding: 0 0.5rem;
          }
          .pdf-workspace {
            padding: 1rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
