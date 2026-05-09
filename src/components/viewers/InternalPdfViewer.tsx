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
  const [scale, setScale] = useState(1.0); // Initial scale, will be updated by auto-fit
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isInitialFitDone, setIsInitialFitDone] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Function to calculate fit-to-width scale
  const calculateFitScale = useCallback(async (pdfDoc: any, pageNum: number) => {
    if (!containerRef.current || !pdfDoc) return 1.0;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      
      // Available width with safe margins (16px total)
      const containerWidth = containerRef.current.clientWidth - (window.innerWidth < 768 ? 16 : 80);
      const newScale = containerWidth / viewport.width;
      
      // Clamp scale between 0.3 and 3.0
      return Math.min(Math.max(newScale, 0.3), 3.0);
    } catch (e) {
      return 1.0;
    }
  }, []);

  // Handle PDF loading
  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setPdf(null);
      setIsInitialFitDone(false);
      
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
        const fitScale = await calculateFitScale(pdfDoc, 1);
        setScale(fitScale);
        setIsInitialFitDone(true);
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
  }, [fileData?.base64, renderKey, calculateFitScale]);

  // Handle Page Rendering
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current || !isInitialFitDone) return;
      
      // Cancel previous render task if active
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      try {
        const page = await pdf.getPage(currentPage);
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Set display dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      } catch (e: any) {
        if (e.name !== 'RenderingCancelledException') {
          console.error('Page render error:', e);
        }
      }
    };

    renderPage();
  }, [pdf, currentPage, scale, renderKey, isInitialFitDone]);

  // Resize Observer for dynamic scaling
  useEffect(() => {
    if (!containerRef.current || !pdf) return;

    const handleResize = async () => {
      // Only auto-fit if we haven't manually zoomed significantly or if we're on mobile
      if (window.innerWidth < 768) {
        const fitScale = await calculateFitScale(pdf, currentPage);
        setScale(fitScale);
      }
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pdf, currentPage, calculateFitScale]);

  const handleManualFit = async () => {
    const fitScale = await calculateFitScale(pdf, currentPage);
    setScale(fitScale);
  };

  return (
    <div className="internal-pdf-viewer pro-theme">
      {/* Premium Toolbar */}
      <div className="viewer-toolbar-premium">
        <div className="toolbar-left">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage <= 1 || isLoading} 
            className="tool-btn"
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
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="toolbar-center">
          <div className="zoom-controls">
            <button onClick={() => setScale(s => Math.max(0.3, s - 0.2))} className="tool-btn">
              <ZoomOut size={18} />
            </button>
            <div className="zoom-value" onClick={handleManualFit}>
              {Math.round(scale * 100)}%
            </div>
            <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="tool-btn">
              <ZoomIn size={18} />
            </button>
          </div>
          <div className="tool-divider" />
          <button onClick={handleManualFit} className="tool-btn fit-btn" title="Fit to Width">
            <Maximize size={18} />
          </button>
        </div>

        <div className="toolbar-right">
          {fileData.isProtected && (
            <div className="protection-badge-subtle hide-mobile">
              <ShieldCheck size={14} />
              <span>Protected</span>
            </div>
          )}
          
          <button onClick={() => setShowDebug(!showDebug)} className={`tool-btn ${showDebug ? 'active' : ''}`}>
            <Info size={18} />
          </button>

          {isAdmin && (
            <div className="admin-tools-container">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)} 
                className={`tool-btn admin-trigger ${showAdminMenu ? 'active' : ''}`}
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
              <p>Preparing High-Quality View...</p>
            </div>
          </div>
        ) : error ? (
          <div className="viewer-error-state">
            <div className="error-icon-bg">
              <AlertCircle size={48} />
            </div>
            <h3>Unable to load PDF</h3>
            <p>This document could not be rendered. It might be corrupted or restricted.</p>
            <div className="error-actions">
              <button onClick={() => setRenderKey(k => k + 1)} className="btn-primary-med">
                <RefreshCw size={16} /> Retry
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
              <div className="title">DIAGNOSTICS</div>
              <button onClick={() => setShowDebug(false)} className="close-btn">&times;</button>
            </div>
            <div className="debug-grid">
              <div className="grid-item"><span>File</span>{fileData.fileName}</div>
              <div className="grid-item"><span>Scale</span>{scale.toFixed(2)}</div>
              <div className="grid-item"><span>DPR</span>{window.devicePixelRatio}</div>
              <div className="grid-item"><span>Mode</span>{window.innerWidth < 768 ? 'Mobile (Auto-Fit)' : 'Desktop'}</div>
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
          flex-shrink: 0;
        }

        .toolbar-left, .toolbar-center, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tool-btn {
          width: 40px; /* Accessible touch target */
          height: 40px;
          border-radius: 10px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .tool-btn:hover:not(:disabled) { background: var(--primary-soft); color: var(--primary); }
        .tool-btn:active:not(:disabled) { transform: scale(0.95); }
        .tool-btn:disabled { opacity: 0.2; }
        .tool-btn.active { background: var(--primary); color: white; }

        .zoom-controls { display: flex; align-items: center; }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 800;
          font-size: 0.85rem;
          background: var(--bg-soft);
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          color: var(--text-strong);
        }

        .zoom-value {
          font-size: 0.8rem;
          font-weight: 800;
          min-width: 55px;
          text-align: center;
          cursor: pointer;
          color: var(--text-strong);
        }

        .tool-divider { width: 1px; height: 24px; background: var(--border); margin: 0 0.25rem; }

        .pdf-viewport-container {
          flex: 1;
          overflow: auto;
          position: relative;
          background: var(--bg);
          display: flex;
          justify-content: center;
          padding: 2rem 0; /* Vertical padding only, let width be handled by auto-fit */
          -webkit-overflow-scrolling: touch;
        }

        .pdf-scroll-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: fit-content;
          margin: 0 auto;
        }

        .pdf-page-shadow {
          background: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border);
          line-height: 0; /* Remove baseline gap */
        }
        html[data-theme="dark"] .pdf-page-shadow {
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .pdf-render-canvas {
          display: block;
          user-select: none;
        }

        /* Responsive Fixes */
        @media (max-width: 768px) {
          .viewer-toolbar-premium {
            padding: 0 0.5rem;
            gap: 0.25rem;
            overflow-x: auto;
            justify-content: flex-start;
          }
          
          .toolbar-center { gap: 0.25rem; }
          .tool-divider, .hide-mobile { display: none; }
          
          .page-indicator { padding: 0.2rem 0.5rem; font-size: 0.75rem; min-width: 60px; }
          .zoom-value { min-width: 45px; font-size: 0.75rem; }
          
          .pdf-viewport-container { padding: 1rem 0; }
          
          .tool-btn { width: 36px; height: 36px; }
        }

        /* Small screen specific toolbar wrapping/scrolling */
        @media (max-width: 480px) {
          .viewer-toolbar-premium {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .viewer-toolbar-premium::-webkit-scrollbar { display: none; }
          
          .toolbar-right { margin-left: auto; }
        }

        /* PLACEHOLDER & LOADING */
        .viewer-placeholder { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 800px; gap: 2rem; padding: 2rem; }
        .skeleton-page { width: 100%; aspect-ratio: 1 / 1.414; background: var(--surface); border-radius: 8px; box-shadow: var(--shadow-md); }
        .loading-status { display: flex; align-items: center; gap: 1rem; color: var(--text-soft); font-weight: 700; }

        /* DEBUG & ERRORS */
        .admin-debug-panel { position: absolute; bottom: 1rem; left: 1rem; right: 1rem; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; z-index: 500; backdrop-filter: blur(10px); max-width: 500px; }
        .debug-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; font-weight: 900; font-size: 0.7rem; color: var(--secondary); }
        .debug-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .grid-item span { display: block; font-size: 0.6rem; font-weight: 900; color: var(--text-soft); text-transform: uppercase; }
        .grid-item { font-size: 0.8rem; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
