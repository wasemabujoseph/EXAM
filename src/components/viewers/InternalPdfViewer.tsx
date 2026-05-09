import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  Layout
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

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
  };
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const PDF_PAGE_GAP = 20;

const InternalPdfViewer: React.FC<InternalPdfViewerProps> = ({ 
  fileData,
  adminActions
}) => {
  const { user } = useVault();
  const isAdmin = user?.role === 'admin';
  
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'continuous' | 'single'>('continuous');

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Load PDF document
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
        
        // Initial auto-fit
        if (containerRef.current) {
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 1 });
          const containerWidth = containerRef.current.clientWidth - 40;
          const initialScale = Math.min(containerWidth / viewport.width, 1.5);
          setScale(initialScale);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js Load Error:', err);
        setError(err.message || 'The PDF document could not be rendered.');
        setIsLoading(false);
      }
    };

    if (fileData?.base64) {
      loadPdf();
    }
  }, [fileData?.base64, renderKey]);

  // Page tracking with IntersectionObserver
  useEffect(() => {
    if (!pdf || viewMode !== 'continuous') return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            if (pageNum) setCurrentPage(pageNum);
          }
        });
      },
      { threshold: 0.3 }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) intersectionObserverRef.current?.observe(ref);
    });

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [pdf, viewMode, numPages, renderKey]);

  const scrollToPage = (pageNum: number) => {
    if (viewMode === 'continuous') {
      const pageEl = pageRefs.current[pageNum];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setCurrentPage(pageNum);
    }
  };

  const handleFitWidth = async () => {
    if (!pdf || !containerRef.current) return;
    const page = await pdf.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current.clientWidth - 40;
    setScale(containerWidth / viewport.width);
  };

  return (
    <div className="internal-pdf-viewer pro-theme">
      {/* Premium Toolbar */}
      <div className="viewer-toolbar-premium">
        <div className="toolbar-left">
          <button 
            className="tool-btn nav"
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="page-indicator">
            <span className="current">{currentPage}</span>
            <span className="divider">/</span>
            <span className="total">{numPages || '--'}</span>
          </div>

          <button 
            className="tool-btn nav"
            onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages || isLoading}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="toolbar-center">
          <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="tool-btn"><ZoomOut size={18} /></button>
          <div className="zoom-value" onClick={handleFitWidth}>{Math.round(scale * 100)}%</div>
          <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="tool-btn"><ZoomIn size={18} /></button>
          <div className="tool-divider" />
          <button onClick={handleFitWidth} className="tool-btn" title="Fit to Width"><Maximize size={18} /></button>
          <button 
            onClick={() => setViewMode(v => v === 'continuous' ? 'single' : 'continuous')} 
            className={`tool-btn ${viewMode === 'single' ? 'active' : ''}`}
            title="Toggle View Mode"
          >
            <Layout size={18} />
          </button>
        </div>

        <div className="toolbar-right">
          {fileData.isProtected && (
            <div className="protection-badge-subtle hide-mobile">
              <ShieldCheck size={14} />
              <span>Protected</span>
            </div>
          )}
          
          <button onClick={() => setShowDebug(!showDebug)} className={`tool-btn ${showDebug ? 'active' : ''}`} title="Diagnostics">
            <Info size={18} />
          </button>

          {isAdmin && (
            <div className="admin-tools-container">
              <button onClick={() => setShowAdminMenu(!showAdminMenu)} className={`tool-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}>
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
              <p>Preparing Document View...</p>
            </div>
          </div>
        ) : error ? (
          <div className="viewer-error-state">
            <AlertCircle size={48} className="icon-danger" />
            <h3>Unable to load PDF</h3>
            <p>{error}</p>
            <button onClick={() => setRenderKey(k => k + 1)} className="btn-primary-med">Retry</button>
          </div>
        ) : (
          <div className="pdf-scroll-content">
            {viewMode === 'continuous' ? (
              Array.from({ length: numPages }).map((_, i) => (
                <PdfPage 
                  key={`${renderKey}-${i + 1}`}
                  pdf={pdf}
                  pageNum={i + 1}
                  scale={scale}
                  ref={(el) => { pageRefs.current[i + 1] = el; }}
                />
              ))
            ) : (
              <PdfPage 
                key={`${renderKey}-${currentPage}`}
                pdf={pdf}
                pageNum={currentPage}
                scale={scale}
              />
            )}
          </div>
        )}

        {showDebug && isAdmin && (
          <div className="admin-debug-panel animate-slide-up">
            <div className="debug-header">
              <span>DIAGNOSTICS (ADMIN)</span>
              <button onClick={() => setShowDebug(false)}>&times;</button>
            </div>
            <div className="debug-content">
              <div>Scale: {scale.toFixed(2)}</div>
              <div>Mode: {viewMode}</div>
              <div>Worker: Bundled Local</div>
              <div>File: {fileData.fileName}</div>
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

        .tool-btn {
          width: 40px; height: 40px; border-radius: 10px;
          color: var(--text-muted); display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .tool-btn:hover:not(:disabled) { background: var(--primary-soft); color: var(--primary); }
        .tool-btn.active { background: var(--primary); color: white; }
        .tool-btn:disabled { opacity: 0.2; }

        .page-indicator {
          display: flex; align-items: center; gap: 0.4rem;
          font-weight: 800; font-size: 0.85rem;
          background: var(--bg-soft); padding: 0.25rem 0.75rem;
          border-radius: 8px; color: var(--text-strong);
        }

        .zoom-value { min-width: 50px; text-align: center; font-weight: 800; font-size: 0.8rem; cursor: pointer; }
        .tool-divider { width: 1px; height: 20px; background: var(--border); margin: 0 0.5rem; }

        .pdf-viewport-container {
          flex: 1; overflow: auto; background: var(--bg);
          padding: 2rem 1rem; display: flex; justify-content: center;
          -webkit-overflow-scrolling: touch;
        }

        .pdf-scroll-content {
          display: flex; flex-direction: column; align-items: center;
          gap: ${PDF_PAGE_GAP}px; width: fit-content;
        }

        .pdf-page-container {
          background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          border: 1px solid var(--border); line-height: 0;
          transition: transform 0.2s ease-out;
        }
        html[data-theme="dark"] .pdf-page-container {
          box-shadow: 0 10px 50px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.1);
        }

        .pdf-canvas { display: block; max-width: none; }

        @media (max-width: 768px) {
          .viewer-toolbar-premium { padding: 0 0.5rem; overflow-x: auto; justify-content: flex-start; gap: 0.5rem; }
          .toolbar-center { gap: 0.25rem; }
          .tool-divider, .hide-mobile { display: none; }
          .pdf-viewport-container { padding: 1rem 0; }
        }

        .admin-dropdown {
          position: absolute; top: 100%; right: 0; width: 220px;
          background: var(--surface-elevated); border: 1px solid var(--border);
          border-radius: 12px; box-shadow: var(--shadow-xl); padding: 0.5rem; z-index: 1000;
        }
        .dropdown-item {
          width: 100%; padding: 0.75rem; border-radius: 8px;
          display: flex; align-items: center; gap: 0.75rem;
          color: var(--text); font-size: 0.85rem; font-weight: 700;
        }
        .dropdown-item:hover { background: var(--primary-soft); color: var(--primary); }

        .admin-debug-panel {
          position: absolute; bottom: 1rem; right: 1rem; width: 300px;
          background: var(--surface-elevated); border: 1px solid var(--border);
          border-radius: 12px; padding: 1rem; z-index: 500;
        }
      `}</style>
    </div>
  );
};

// Sub-component for individual page rendering with lazy loading support
const PdfPage = React.forwardRef<HTMLDivElement, { pdf: any, pageNum: number, scale: number }>(({ pdf, pageNum, scale }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (ref && 'current' in ref && ref.current) {
      observer.observe(ref.current as Element);
    } else if (typeof ref === 'function') {
        // Handle callback ref if needed, but for simplicity we'll use a local div for observation
    }

    return () => observer.disconnect();
  }, [pdf, pageNum]);

  useEffect(() => {
    if (!isVisible || !pdf || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        
        if (renderTaskRef.current) renderTaskRef.current.cancel();
        renderTaskRef.current = page.render({ canvasContext: context, viewport });
        await renderTaskRef.current.promise;
      } catch (e: any) {
        if (e.name !== 'RenderingCancelledException') console.error(e);
      }
    };

    renderPage();
  }, [pdf, pageNum, scale, isVisible]);

  return (
    <div 
      className="pdf-page-container" 
      ref={ref} 
      data-page-number={pageNum}
      style={{
        minHeight: isVisible ? 'auto' : '500px', // Placeholder height
        width: 'fit-content'
      }}
    >
      <canvas ref={canvasRef} className="pdf-canvas" onContextMenu={e => e.preventDefault()} />
    </div>
  );
});

export default InternalPdfViewer;
