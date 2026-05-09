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
  Maximize2,
  Minimize2,
  Layout
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import ProtectedContentShell from '../security/ProtectedContentShell';

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
    title?: string;
    year?: string;
    subject?: string;
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        
        // Initial fit width for mobile
        if (window.innerWidth < 768) {
          setScale(1.0);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js Internal Error:', err);
        setError('Failed to initialize the PDF renderer. Please check the document format.');
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
        console.error('Render error:', e);
      }
    };
    renderPage();
  }, [pdf, currentPage, scale, renderKey]);

  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 40; // padding
    setScale(containerWidth / (canvasRef.current?.width || 800) * scale * 0.95);
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

  const viewerContent = (
    <div className={`internal-pdf-viewer theme-aware ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="viewer-toolbar-premium">
        <div className="toolbar-left">
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage <= 1 || isLoading} 
              className="p-btn"
              title="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="page-indicator">
              <span className="current">{currentPage}</span>
              <span className="separator">of</span>
              <span className="total">{numPages || '--'}</span>
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} 
              disabled={currentPage >= numPages || isLoading} 
              className="p-btn"
              title="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="toolbar-center desktop-only">
          <div className="zoom-controls">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="z-btn"><ZoomOut size={16} /></button>
            <span className="zoom-val">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="z-btn"><ZoomIn size={16} /></button>
            <div className="z-divider" />
            <button onClick={handleFitWidth} className="z-btn fit" title="Fit to Width"><Layout size={16} /></button>
          </div>
        </div>

        <div className="toolbar-right">
          <button onClick={toggleFullscreen} className="icon-btn desktop-only" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <button onClick={() => setShowDebug(!showDebug)} className={`icon-btn ${showDebug ? 'active' : ''}`} title="Diagnostics">
            <Info size={18} />
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

      <div className="pdf-scroller">
        {isLoading ? (
          <div className="loading-state">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p>Loading document...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={48} className="text-danger" />
            <h3>Unable to display PDF</h3>
            <p className="err-msg">{error}</p>
            <button onClick={() => setRenderKey(k => k + 1)} className="retry-btn">
              <RefreshCw size={14} />
              <span>Retry Rendering</span>
            </button>
          </div>
        ) : (
          <div className="canvas-frame">
            <canvas ref={canvasRef} onContextMenu={e => e.preventDefault()} />
          </div>
        )}

        {showDebug && isAdmin && (
          <div className="diag-panel animate-slide-up">
            <div className="diag-header">
              <ShieldAlert size={14} />
              <span>Diagnostic System</span>
              <button className="close-diag" onClick={() => setShowDebug(false)}>×</button>
            </div>
            <div className="diag-grid">
              <div className="diag-item"><span>File:</span> {fileData.fileName}</div>
              <div className="diag-item"><span>Status:</span> {fileData.pdfHeaderValid ? 'VALID' : 'INVALID'}</div>
              <div className="diag-item"><span>Size:</span> {fileData.byteLength || fileData.sizeBytes} bytes</div>
              <div className="diag-item"><span>Engine:</span> PDF.js v{pdfjsLib.version}</div>
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

        .pagination-controls {
          display: flex;
          align-items: center;
          background: var(--bg-soft);
          border-radius: var(--radius-md);
          padding: 2px;
          border: 1px solid var(--border);
        }

        .p-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .p-btn:hover:not(:disabled) { background: var(--surface); color: var(--primary); }
        .p-btn:disabled { opacity: 0.3; }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .page-indicator .separator { color: var(--text-soft); font-weight: 500; font-size: 0.7rem; }
        .page-indicator .total { color: var(--text-muted); }

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
          border: 1px solid transparent;
        }
        .icon-btn:hover { background: var(--bg-soft); color: var(--text); border-color: var(--border); }
        .icon-btn.active { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }

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

        .pdf-scroller {
          flex: 1;
          overflow: auto;
          background: var(--bg);
          padding: 2rem;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .canvas-frame {
          background: white;
          box-shadow: var(--shadow-xl);
          border-radius: 2px;
          transition: transform 0.2s ease-out;
        }
        html[data-theme="dark"] .canvas-frame {
          box-shadow: 0 0 0 1px var(--border), var(--shadow-xl);
        }

        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          height: 100%;
          color: var(--text-muted);
        }

        .err-msg { font-size: 0.9rem; color: var(--text-soft); max-width: 300px; text-align: center; }
        .retry-btn {
          margin-top: 1rem;
          background: var(--primary);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .diag-panel {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          width: 320px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1rem;
          box-shadow: var(--shadow-xl);
          z-index: 500;
        }
        .diag-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }
        .close-diag { margin-left: auto; font-size: 1.2rem; line-height: 1; color: var(--text-soft); }
        .diag-grid { display: flex; flex-direction: column; gap: 0.4rem; }
        .diag-item { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; }
        .diag-item span { color: var(--text-soft); }

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .pdf-scroller { padding: 1rem 0.5rem; }
          .viewer-toolbar-premium { padding: 0 0.5rem; }
          .pagination-controls { gap: 0; }
          .page-indicator { padding: 0 0.4rem; font-size: 0.75rem; }
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

  if (fileData.isProtected) {
    return (
      <ProtectedContentShell 
        materialId={fileData.fileName} 
        isProtected={true}
        enableWatermark={true}
      >
        {viewerContent}
      </ProtectedContentShell>
    );
  }

  return viewerContent;
};

export default InternalPdfViewer;
