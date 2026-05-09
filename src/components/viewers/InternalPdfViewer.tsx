import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
  MoreVertical,
  Download,
  ExternalLink,
  ShieldCheck
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
  const [renderKey, setRenderKey] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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
        setError(err.message || 'The PDF document could not be rendered.');
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
      } catch (e) {
        console.error('Page render error:', e);
      }
    };
    renderPage();
  }, [pdf, currentPage, scale, renderKey]);

  const handleFitWidth = () => {
    if (!containerRef.current || !pdf) return;
    const containerWidth = containerRef.current.clientWidth - 80; // 40px padding each side
    pdf.getPage(currentPage).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      const newScale = containerWidth / viewport.width;
      setScale(Math.min(Math.max(newScale, 0.5), 2.5));
    });
  };

  return (
    <div className="internal-pdf-viewer">
      {/* Premium Toolbar */}
      <div className="viewer-toolbar-premium">
        <div className="toolbar-left">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage <= 1 || isLoading} 
            className="tool-btn"
            title="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="page-indicator">
            <span className="current">{currentPage}</span>
            <span className="divider">/</span>
            <span className="total">{numPages || '--'}</span>
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} 
            disabled={currentPage >= numPages || isLoading} 
            className="tool-btn"
            title="Next Page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="toolbar-center">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="tool-btn" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <div className="zoom-value" onClick={handleFitWidth}>
            {Math.round(scale * 100)}%
          </div>
          <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))} className="tool-btn" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <div className="tool-divider" />
          <button onClick={handleFitWidth} className="tool-btn" title="Fit to Width">
            <Maximize size={18} />
          </button>
        </div>

        <div className="toolbar-right">
          {fileData.isProtected && (
            <div className="protection-badge-subtle" title="Secure Material">
              <ShieldCheck size={14} />
              <span>Protected</span>
            </div>
          )}
          
          <button onClick={() => setShowDebug(!showDebug)} className={`tool-btn ${showDebug ? 'active' : ''}`} title="Diagnostics">
            <Info size={18} />
          </button>

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

      <div className="pdf-viewport-container" ref={containerRef}>
        {isLoading ? (
          <div className="viewer-placeholder">
            <div className="skeleton-page animate-pulse" />
            <div className="loading-status">
              <Loader2 className="animate-spin" size={32} />
              <p>Optimizing Professional View...</p>
            </div>
          </div>
        ) : error ? (
          <div className="viewer-error-state">
            <div className="error-icon-bg">
              <AlertCircle size={48} />
            </div>
            <h3>Unable to load PDF</h3>
            <p>This document could not be displayed securely. Please try again or contact support.</p>
            <div className="error-actions">
              <button onClick={() => setRenderKey(k => k + 1)} className="btn-primary-med">
                <RefreshCw size={16} /> Retry View
              </button>
            </div>
          </div>
        ) : (
          <div className="pdf-scroll-area">
            <div className="pdf-page-shadow">
              <canvas 
                ref={canvasRef} 
                onContextMenu={e => e.preventDefault()} 
                className="pdf-render-canvas"
              />
            </div>
          </div>
        )}

        {showDebug && (
          <div className="admin-debug-panel animate-slide-up">
            <div className="debug-header">
              <div className="title">TECHNICAL DIAGNOSTICS (ADMIN)</div>
              <button onClick={() => setShowDebug(false)} className="close-btn">&times;</button>
            </div>
            <div className="debug-grid">
              <div className="grid-item"><span>File Name</span>{fileData.fileName}</div>
              <div className="grid-item"><span>MIME Type</span>{fileData.mimeType}</div>
              <div className="grid-item"><span>Size</span>{(fileData.sizeBytes / 1024 / 1024).toFixed(2)} MB</div>
              <div className="grid-item"><span>Worker</span>Bundled Vite Asset</div>
              <div className="grid-item"><span>Backend Signature</span>{fileData.pdfHeaderValid ? 'VALID PDF' : 'INVALID/UNKNOWN'}</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .internal-pdf-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: var(--bg-soft);
          color: var(--text);
          position: relative;
          overflow: hidden;
        }

        /* PREMIUM TOOLBAR */
        .viewer-toolbar-premium {
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

        .toolbar-left, .toolbar-center, .toolbar-right {
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
        .tool-btn:hover:not(:disabled) {
          background: var(--primary-soft);
          color: var(--primary);
        }
        .tool-btn:disabled { opacity: 0.3; }
        .tool-btn.active { background: var(--primary); color: white; }
        .tool-btn.admin-trigger { color: var(--secondary); }
        .tool-btn.admin-trigger.active { background: var(--secondary); color: white; }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 800;
          font-size: 0.85rem;
          background: var(--bg-soft);
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          color: var(--text-strong);
        }
        .page-indicator .divider { opacity: 0.3; font-weight: 400; }
        .page-indicator .total { color: var(--text-soft); }

        .zoom-value {
          font-size: 0.8rem;
          font-weight: 800;
          min-width: 50px;
          text-align: center;
          cursor: pointer;
          color: var(--text-strong);
        }

        .tool-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
          margin: 0 0.25rem;
        }

        .protection-badge-subtle {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.6rem;
          background: var(--success-soft-fade);
          border: 1px solid var(--success-soft);
          color: var(--success);
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        /* VIEWPORT AREA */
        .pdf-viewport-container {
          flex: 1;
          overflow: auto;
          position: relative;
          background: var(--bg);
          padding: 3rem 1.5rem;
          display: flex;
          justify-content: center;
          scroll-behavior: smooth;
        }

        .pdf-scroll-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: fit-content;
          max-width: 100%;
        }

        .pdf-page-shadow {
          background: white;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease-out;
          border: 1px solid var(--border);
        }
        html[data-theme="dark"] .pdf-page-shadow {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .pdf-render-canvas {
          display: block;
          max-width: 100%;
        }

        /* PLACEHOLDER & LOADING */
        .viewer-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 800px;
          gap: 2rem;
        }
        .skeleton-page {
          width: 100%;
          aspect-ratio: 1 / 1.414;
          background: var(--surface);
          border-radius: 4px;
          box-shadow: var(--shadow-md);
        }
        .loading-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-soft);
          font-weight: 700;
        }

        /* ERROR STATE */
        .viewer-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          max-width: 400px;
          margin-top: -5vh;
        }
        .error-icon-bg {
          width: 80px;
          height: 80px;
          background: var(--danger-soft);
          color: var(--danger);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .viewer-error-state h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .viewer-error-state p { color: var(--text-soft); margin-bottom: 2rem; font-weight: 600; }
        
        .btn-primary-med {
          background: var(--primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px var(--primary-soft);
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

        /* DEBUG PANEL */
        .admin-debug-panel {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow-2xl);
          padding: 1.5rem;
          z-index: 500;
          backdrop-filter: blur(10px);
        }
        .debug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }
        .debug-header .title { font-weight: 900; font-size: 0.75rem; color: var(--secondary); letter-spacing: 0.05em; }
        .debug-header .close-btn { font-size: 1.5rem; color: var(--text-soft); cursor: pointer; }

        .debug-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .grid-item span {
          display: block;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--text-soft);
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }
        .grid-item { font-size: 0.85rem; font-weight: 700; color: var(--text-strong); word-break: break-all; }

        @media (max-width: 768px) {
          .pdf-viewport-container { padding: 1rem 0.5rem; }
          .toolbar-center { display: none; } /* Hide zoom on small mobile to save space */
          .page-indicator { font-size: 0.75rem; padding: 0.2rem 0.5rem; }
          .tool-btn { width: 32px; height: 32px; }
        }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
