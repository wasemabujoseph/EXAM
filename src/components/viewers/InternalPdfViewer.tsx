import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface InternalPdfViewerProps {
  base64Data: string;
  fileName: string;
  isProtected?: boolean;
  adminActions?: {
    onDownload?: () => void;
    onOpenDrive?: () => void;
  };
}

const InternalPdfViewer: React.FC<InternalPdfViewerProps> = ({ 
  base64Data, 
  fileName,
  isProtected = false,
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const loadingTask = pdfjs.getDocument({ data: atob(base64Data) });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document.');
        setIsLoading(false);
      }
    };

    if (base64Data) {
      loadPdf();
    }
  }, [base64Data]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;

      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
        };

        // In some versions of pdfjs-dist, it requires 'canvas' explicitly in type but works without it, 
        // or requires it. Using 'any' to bypass strict type check for the object literal if needed.
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.5);

  return (
    <div className="internal-pdf-viewer">
      {/* Toolbar */}
      <div className="viewer-toolbar">
        <div className="toolbar-section">
          <button onClick={prevPage} disabled={currentPage <= 1} className="toolbar-btn">
            <ChevronLeft size={20} />
          </button>
          <span className="page-info">
            Page {currentPage} of {numPages}
          </span>
          <button onClick={nextPage} disabled={currentPage >= numPages} className="toolbar-btn">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <button onClick={zoomOut} className="toolbar-btn">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="toolbar-btn">
            <ZoomIn size={18} />
          </button>
          <button onClick={resetZoom} className="toolbar-btn">
            <Maximize size={18} />
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

      {/* PDF Area */}
      <div className="pdf-canvas-container" ref={containerRef}>
        {isLoading ? (
          <div className="viewer-state">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p>Decrypting PDF content...</p>
          </div>
        ) : error ? (
          <div className="viewer-state error">
            <AlertCircle size={48} className="text-danger" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="canvas-wrapper">
            <canvas 
              ref={canvasRef} 
              onContextMenu={(e) => e.preventDefault()}
              className={isProtected ? 'no-select' : ''}
            />
          </div>
        )}
      </div>

      <style>{`
        .internal-pdf-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #1e293b;
          overflow: hidden;
        }

        .viewer-toolbar {
          height: 56px;
          background: #0f172a;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem;
          gap: 1rem;
          color: white;
          z-index: 10;
        }

        .toolbar-section { display: flex; align-items: center; gap: 0.75rem; }
        .toolbar-divider { width: 1px; height: 24px; background: rgba(255,255,255,0.1); }

        .toolbar-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.7);
          transition: all 0.2s;
        }
        .toolbar-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: white; }
        .toolbar-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .toolbar-btn.admin { color: #38bdf8; }

        .page-info, .zoom-info { font-size: 0.8rem; font-weight: 700; min-width: 80px; text-align: center; }

        .pdf-canvas-container {
          flex: 1;
          overflow: auto;
          display: flex;
          justify-content: center;
          padding: 2rem;
          background: #334155;
          position: relative;
        }

        .canvas-wrapper {
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          background: white;
        }

        .viewer-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          color: white;
          font-weight: 700;
        }

        .no-select {
          user-select: none;
          -webkit-user-select: none;
        }

        @media (max-width: 640px) {
          .viewer-toolbar { height: auto; padding: 0.75rem; flex-wrap: wrap; }
          .page-info, .zoom-info { min-width: auto; font-size: 0.7rem; }
          .toolbar-divider { display: none; }
        }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
