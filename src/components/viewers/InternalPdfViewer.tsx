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
  AlertCircle,
  Info,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

// Failsafe Worker: Use CDN that matches the package version
const PDFJS_VERSION = '5.6.205'; 
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

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

  // Robust Base64 to Uint8Array
  const base64ToUint8Array = (base64: string) => {
    try {
      // Remove any data URI prefix if present
      const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const binaryString = window.atob(pureBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error('Base64 decoding failed:', e);
      return null;
    }
  };

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      const { base64, fileName } = fileData;
      console.group(`📄 PDF Load Attempt: ${fileName}`);
      
      try {
        const data = base64ToUint8Array(base64);
        if (!data || data.length === 0) {
          throw new Error('Decoded data is empty or invalid.');
        }

        // Verify PDF Header locally
        const header = String.fromCharCode(...data.slice(0, 5));
        console.log('PDF Header Check:', header);
        if (!header.startsWith('%PDF')) {
          console.warn('Invalid PDF header detected in stream.');
          // We still try to load, but this is a red flag
        }

        const loadingTask = pdfjs.getDocument({ 
          data,
          isEvalSupported: false, // Security hardening
          useSystemFonts: true
        });
        
        const pdfDoc = await loadingTask.promise;
        console.log('✅ PDF.js successfully parsed the document');
        
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('❌ PDF.js Critical Error:', err);
        setError(err.message || 'The PDF structure is corrupted or invalid.');
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
        const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
        canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

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
                title="Diagnostic Inspector"
              >
                <Info size={18} />
              </button>
              {adminActions?.onDownload && (
                <button onClick={adminActions.onDownload} className="toolbar-btn admin" title="Download">
                  <Download size={18} />
                </button>
              )}
              {adminActions?.onOpenDrive && (
                <button onClick={adminActions.onOpenDrive} className="toolbar-btn admin" title="Drive">
                  <ExternalLink size={18} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

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
                  <RefreshCw size={16} /> Retry Handshake
                </button>
                <button onClick={adminActions?.onOpenDrive} className="btn-outline">
                   Open in Drive
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

        {/* Diagnostic Inspector */}
        {isAdmin && showDebug && (
          <div className="admin-debug-overlay animate-pop-in">
            <div className="debug-header">
              <ShieldAlert size={16} />
              <span>Diagnostic Inspector</span>
            </div>
            <div className="debug-content">
              <div className="debug-row"><span>File:</span> <span>{fileData.fileName}</span></div>
              <div className="debug-row"><span>MIME:</span> <span>{fileData.mimeType}</span></div>
              <div className="debug-row"><span>Backend Size:</span> <span>{fileData.sizeBytes} B</span></div>
              <div className="debug-row"><span>Received Size:</span> <span>{fileData.byteLength || 'N/A'} B</span></div>
              <div className="debug-row"><span>Header (Backend):</span> <span className={fileData.pdfHeaderValid ? 'text-success' : 'text-danger'}>{fileData.pdfHeaderValid ? 'VALID' : 'INVALID'}</span></div>
              <div className="debug-row"><span>Protected:</span> <span>{isProtected ? 'YES' : 'NO'}</span></div>
              <div className="debug-row" style={{ marginTop: '0.5rem', borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                <span>Worker:</span> <span style={{ fontSize: '0.6rem' }}>CDN/v{PDFJS_VERSION}</span>
              </div>
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
          text-align: center;
          padding: 2rem;
        }
        
        .error-text { color: rgba(255,255,255,0.6); max-width: 300px; font-size: 0.9rem; }

        .admin-fallback-actions { display: flex; gap: 1rem; margin-top: 1rem; }
        .btn-retry { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
        .btn-outline { border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 800; }

        .admin-debug-overlay {
          position: absolute; top: 1rem; right: 1rem; width: 280px;
          background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          padding: 1rem; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 50;
        }
        
        .debug-header { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 900; color: #38bdf8; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
        .debug-content { display: flex; flex-direction: column; gap: 0.4rem; }
        .debug-row { display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; }
        .debug-row span:first-child { color: rgba(255,255,255,0.5); }
        .text-success { color: #22c55e; }
        .text-danger { color: #ef4444; }

        .no-select { user-select: none; -webkit-user-select: none; }

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
