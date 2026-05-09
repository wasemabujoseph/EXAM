import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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
  ShieldAlert
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

// Set up worker correctly for Vite
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to convert base64 to Uint8Array safely
  const base64ToUint8Array = (base64: string) => {
    try {
      const binaryString = window.atob(base64);
      const length = binaryString.length;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error('Base64 decoding failed', e);
      return null;
    }
  };

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      const { base64, fileName, mimeType, sizeBytes, byteLength, pdfHeaderValid } = fileData;

      console.group(`📄 Loading PDF: ${fileName}`);
      console.log('MIME Type:', mimeType);
      console.log('Size (Bytes):', sizeBytes);
      console.log('Byte Length:', byteLength);
      console.log('PDF Header Valid:', pdfHeaderValid);
      
      try {
        const data = base64ToUint8Array(base64);
        if (!data) throw new Error('Could not decode PDF data.');

        // Log first 20 bytes for debugging
        const header = Array.from(data.slice(0, 20)).map(b => String.fromCharCode(b)).join('');
        console.log('First 20 bytes:', JSON.stringify(header));

        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        
        console.log('✅ PDF successfully parsed');
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('❌ PDF.js Loading Error:', err);
        setError('Failed to load PDF document.');
        setIsLoading(false);
      } finally {
        console.groupEnd();
      }
    };

    if (fileData?.base64) {
      loadPdf();
    }
  }, [fileData?.base64]);

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

  const isProtected = fileData.isProtected;

  return (
    <div className="internal-pdf-viewer">
      {/* Toolbar */}
      <div className="viewer-toolbar">
        <div className="toolbar-section">
          <button onClick={prevPage} disabled={currentPage <= 1 || isLoading} className="toolbar-btn">
            <ChevronLeft size={20} />
          </button>
          <span className="page-info">
            {isLoading ? '...' : `Page ${currentPage} of ${numPages}`}
          </span>
          <button onClick={nextPage} disabled={currentPage >= numPages || isLoading} className="toolbar-btn">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-section">
          <button onClick={zoomOut} disabled={isLoading} className="toolbar-btn">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={isLoading} className="toolbar-btn">
            <ZoomIn size={18} />
          </button>
          <button onClick={resetZoom} disabled={isLoading} className="toolbar-btn">
            <Maximize size={18} />
          </button>
        </div>

        {isAdmin && (
          <>
            <div className="toolbar-divider" />
            <div className="toolbar-section admin-tools">
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                className={`toolbar-btn admin ${showDebug ? 'active' : ''}`}
                title="View Diagnostic Details"
              >
                <Info size={18} />
              </button>
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
            <p>Decrypting Secure Content...</p>
          </div>
        ) : error ? (
          <div className="viewer-state error">
            <AlertCircle size={64} className="text-danger" />
            <h3>Unable to load document</h3>
            <p className="error-text">{error}</p>
            
            {isAdmin && (
              <div className="admin-fallback-actions">
                <button onClick={() => window.location.reload()} className="btn-retry">
                  Retry Handshake
                </button>
                <button onClick={adminActions?.onOpenDrive} className="btn-outline">
                  Open Original in Drive
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="canvas-wrapper animate-fade-in">
            <canvas 
              ref={canvasRef} 
              onContextMenu={(e) => e.preventDefault()}
              className={isProtected ? 'no-select' : ''}
            />
          </div>
        )}

        {/* Admin Debug Overlay */}
        {isAdmin && showDebug && (
          <div className="admin-debug-overlay animate-pop-in">
            <div className="debug-header">
              <ShieldAlert size={16} />
              <span>Diagnostic Inspector</span>
            </div>
            <div className="debug-content">
              <div className="debug-row"><span>File:</span> <span>{fileData.fileName}</span></div>
              <div className="debug-row"><span>MIME:</span> <span>{fileData.mimeType}</span></div>
              <div className="debug-row"><span>Size:</span> <span>{fileData.sizeBytes} bytes</span></div>
              <div className="debug-row"><span>Header:</span> <span className={fileData.pdfHeaderValid ? 'text-success' : 'text-danger'}>{fileData.pdfHeaderValid ? 'VALID PDF' : 'INVALID HEADER'}</span></div>
              <div className="debug-row"><span>Protected:</span> <span>{isProtected ? 'YES' : 'NO'}</span></div>
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
          background: #1e293b;
          overflow: hidden;
          position: relative;
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
          z-index: 100;
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
        .toolbar-btn.active { background: var(--primary); color: white; }
        .toolbar-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .toolbar-btn.admin { color: #38bdf8; }

        .page-info, .zoom-info { font-size: 0.8rem; font-weight: 700; min-width: 80px; text-align: center; color: rgba(255,255,255,0.9); }

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
          height: fit-content;
        }

        .viewer-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          color: white;
          font-weight: 700;
          text-align: center;
        }
        
        .error-text { color: rgba(255,255,255,0.6); max-width: 300px; }

        .admin-fallback-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-retry { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 800; }
        .btn-outline { border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 800; }

        .admin-debug-overlay {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 280px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1rem;
          color: white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          z-index: 50;
        }
        
        .debug-header { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 900; color: #38bdf8; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
        .debug-content { display: flex; flex-direction: column; gap: 0.4rem; }
        .debug-row { display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; }
        .debug-row span:first-child { color: rgba(255,255,255,0.5); }
        .text-success { color: #22c55e; }
        .text-danger { color: #ef4444; }

        .no-select {
          user-select: none;
          -webkit-user-select: none;
        }

        @media (max-width: 640px) {
          .viewer-toolbar { height: auto; padding: 0.75rem; flex-wrap: wrap; }
          .page-info, .zoom-info { min-width: auto; font-size: 0.7rem; }
          .toolbar-divider { display: none; }
          .admin-debug-overlay { width: calc(100% - 2rem); right: 1rem; top: 70px; }
        }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
