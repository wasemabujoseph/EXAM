import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
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
  Layout,
  ScrollText,
  Copy
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import ProtectedContentShell from '../security/ProtectedContentShell';

// Set worker source to the locally bundled Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

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

// Single Page Component for Continuous Scroll
const PdfPage: React.FC<{ 
  pdf: any; 
  pageNumber: number; 
  scale: number; 
  renderKey: number;
}> = ({ pdf, pageNumber, scale, renderKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;
      try {
        setIsLoading(true);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
        canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;
        
        await page.render({ canvasContext: context, viewport }).promise;
        setIsLoading(false);
      } catch (e) {
        console.error(`Render error for page ${pageNumber}:`, e);
      }
    };
    renderPage();
  }, [pdf, pageNumber, scale, renderKey]);

  return (
    <div className="pdf-page-wrapper">
      {isLoading && <div className="page-skeleton" />}
      <canvas ref={canvasRef} onContextMenu={e => e.preventDefault()} />
      <div className="page-number-label">Page {pageNumber}</div>
    </div>
  );
};

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
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

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

        const loadingTask = pdfjsLib.getDocument({ data } as any);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        
        // Mobile-friendly initial scale
        if (window.innerWidth < 768) {
          setScale(0.9);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js Error:', err);
        setError('Document loading failed. The file may be corrupt or incompatible.');
        setIsLoading(false);
      }
    };

    if (fileData?.base64) {
      loadPdf();
    }
  }, [fileData?.base64, renderKey]);

  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const padding = window.innerWidth < 768 ? 20 : 60;
    const containerWidth = containerRef.current.clientWidth - padding;
    // Estimate scale based on standard A4-ish width if no canvas exists yet
    const baseWidth = 800; 
    setScale(containerWidth / baseWidth);
    setShowZoomMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

  const viewerContent = (
    <div className={`internal-pdf-viewer theme-aware ${isFullscreen ? 'fullscreen' : ''} v-mode-${viewMode}`} ref={containerRef}>
      <div className="viewer-toolbar-premium">
        <div className="toolbar-left">
          {viewMode === 'single' ? (
            <div className="pagination-controls">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage <= 1 || isLoading} 
                className="p-btn"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="page-indicator">
                <span className="current">{currentPage}</span>
                <span className="separator">/</span>
                <span className="total">{numPages || '--'}</span>
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} 
                disabled={currentPage >= numPages || isLoading} 
                className="p-btn"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="scroll-indicator-pro">
              <ScrollText size={16} />
              <span>{numPages} Pages</span>
            </div>
          )}
        </div>

        <div className="toolbar-center">
          <div className="zoom-selector-wrapper">
            <button 
              className="zoom-trigger-pro" 
              onClick={() => setShowZoomMenu(!showZoomMenu)}
            >
              <span>{Math.round(scale * 100)}%</span>
              <Layout size={14} />
            </button>
            
            {showZoomMenu && (
              <div className="zoom-menu animate-pop-in">
                <button onClick={handleFitWidth} className="z-menu-item fit">Fit Width</button>
                <div className="z-menu-divider" />
                {zoomLevels.map(z => (
                  <button 
                    key={z} 
                    onClick={() => { setScale(z); setShowZoomMenu(false); }} 
                    className={`z-menu-item ${scale === z ? 'active' : ''}`}
                  >
                    {z * 100}%
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          <button 
            onClick={() => setViewMode(viewMode === 'single' ? 'continuous' : 'single')} 
            className={`icon-btn ${viewMode === 'continuous' ? 'active' : ''}`}
            title={viewMode === 'single' ? "Switch to Continuous View" : "Switch to Single Page View"}
          >
            {viewMode === 'single' ? <Copy size={18} /> : <ScrollText size={18} />}
          </button>

          <button onClick={toggleFullscreen} className="icon-btn desktop-only" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {isAdmin && (
            <div className="admin-dropdown-wrapper">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={`icon-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}
              >
                <MoreVertical size={18} />
              </button>
              
              {showAdminMenu && (
                <div className="admin-menu animate-pop-in">
                  <div className="menu-header">ADMIN TOOLS</div>
                  <button onClick={() => { adminActions?.onDownload?.(); setShowAdminMenu(false); }} className="menu-item">
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                  <button onClick={() => { adminActions?.onOpenDrive?.(); setShowAdminMenu(false); }} className="menu-item">
                    <ExternalLink size={16} />
                    <span>Open in Drive</span>
                  </button>
                  <button onClick={() => { setShowDebug(!showDebug); setShowAdminMenu(false); }} className="menu-item">
                    <Info size={16} />
                    <span>Diagnostics</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pdf-scroller-main" ref={scrollerRef}>
        {isLoading ? (
          <div className="loading-state-pro">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p>Rendering pages...</p>
          </div>
        ) : error ? (
          <div className="error-state-pro">
            <AlertCircle size={48} className="text-danger" />
            <h3>Document Error</h3>
            <p>{error}</p>
            <button onClick={() => setRenderKey(k => k + 1)} className="retry-btn">
              <RefreshCw size={14} />
              <span>Reload Engine</span>
            </button>
          </div>
        ) : viewMode === 'single' ? (
          <div className="single-page-frame">
             <PdfPage 
                pdf={pdf} 
                pageNumber={currentPage} 
                scale={scale} 
                renderKey={renderKey} 
             />
          </div>
        ) : (
          <div className="continuous-view-frame">
            {Array.from({ length: numPages }, (_, i) => (
              <PdfPage 
                key={i + 1} 
                pdf={pdf} 
                pageNumber={i + 1} 
                scale={scale} 
                renderKey={renderKey} 
              />
            ))}
          </div>
        )}

        {showDebug && isAdmin && (
          <div className="diag-panel-pro animate-slide-up">
            <div className="diag-header">
              <ShieldAlert size={14} />
              <span>DEBUG INFO</span>
              <button onClick={() => setShowDebug(false)}>×</button>
            </div>
            <div className="diag-grid">
              <div className="diag-item"><span>File:</span> {fileData.fileName}</div>
              <div className="diag-item"><span>Pages:</span> {numPages}</div>
              <div className="diag-item"><span>View:</span> {viewMode.toUpperCase()}</div>
              <div className="diag-item"><span>Scale:</span> {scale.toFixed(2)}</div>
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
          height: 60px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }

        .pagination-controls, .scroll-indicator-pro {
          display: flex;
          align-items: center;
          background: var(--bg-soft);
          border-radius: 99px;
          padding: 4px;
          border: 1px solid var(--border);
          gap: 4px;
        }
        .scroll-indicator-pro { padding: 4px 12px; font-size: 0.75rem; font-weight: 800; color: var(--primary); }

        .p-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .p-btn:hover:not(:disabled) { background: var(--surface); color: var(--primary); }
        .p-btn:disabled { opacity: 0.2; }

        .page-indicator { display: flex; align-items: center; gap: 4px; padding: 0 8px; font-size: 0.8rem; font-weight: 800; }
        .page-indicator .separator { opacity: 0.4; }

        .zoom-selector-wrapper { position: relative; }
        .zoom-trigger-pro {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-soft);
          padding: 6px 14px;
          border-radius: 99px;
          border: 1px solid var(--border);
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text);
        }
        .zoom-trigger-pro:hover { border-color: var(--primary); color: var(--primary); }

        .zoom-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: 140px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          padding: 6px;
          z-index: 1000;
        }
        .z-menu-item {
          width: 100%;
          text-align: center;
          padding: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }
        .z-menu-item:hover { background: var(--bg-soft); color: var(--primary); }
        .z-menu-item.active { background: var(--primary-soft); color: var(--primary); }
        .z-menu-divider { height: 1px; background: var(--border); margin: 4px 0; }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .icon-btn:hover { background: var(--bg-soft); color: var(--primary); }
        .icon-btn.active { background: var(--primary-soft); color: var(--primary); border: 1px solid var(--primary-soft); }

        .pdf-scroller-main {
          flex: 1;
          overflow: auto;
          background: var(--bg);
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          scroll-behavior: smooth;
        }

        .pdf-page-wrapper {
          margin-bottom: 2rem;
          background: white;
          box-shadow: var(--shadow-lg);
          position: relative;
          border: 1px solid rgba(0,0,0,0.1);
        }
        html[data-theme="dark"] .pdf-page-wrapper {
          border-color: var(--border);
          box-shadow: 0 0 0 1px var(--border), var(--shadow-xl);
        }

        .page-number-label {
          position: absolute;
          top: 0;
          right: calc(100% + 10px);
          background: var(--surface);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-soft);
          border: 1px solid var(--border);
          white-space: nowrap;
        }

        .page-skeleton {
          width: 100%;
          aspect-ratio: 1 / 1.4;
          background: var(--bg-soft);
          animation: pulse 2s infinite;
        }

        .admin-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 180px;
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 6px;
          z-index: 1000;
        }
        .menu-header { font-size: 0.6rem; font-weight: 900; color: var(--text-soft); padding: 8px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
        .menu-item {
          width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px;
          font-size: 0.8rem; font-weight: 700; border-radius: var(--radius-md);
        }
        .menu-item:hover { background: var(--bg-soft); color: var(--primary); }

        @media (max-width: 768px) {
          .pdf-scroller-main { padding: 1rem 0.5rem; }
          .page-number-label { display: none; }
          .desktop-only { display: none; }
          .viewer-toolbar-premium { padding: 0 0.5rem; }
          .zoom-trigger-pro { padding: 5px 10px; font-size: 0.75rem; }
          .pdf-page-wrapper { margin-bottom: 1rem; width: 100% !important; overflow: hidden; }
          .pdf-page-wrapper canvas { width: 100% !important; height: auto !important; }
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
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
