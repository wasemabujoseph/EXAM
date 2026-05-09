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

// FAILSAFE WORKER - Using Legacy Compatibility Build
const PDFJS_VERSION = '5.6.205'; 
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.min.js`;

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
  const [useLegacyMode, setUseLegacyMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPdf = async (retryWithLegacy = false) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const pureBase64 = fileData.base64.includes(',') ? fileData.base64.split(',')[1] : fileData.base64;
        const binaryString = window.atob(pureBase64.trim());
        const data = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          data[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjs.getDocument({ 
          data,
          disableWorker: retryWithLegacy || useLegacyMode 
        } as any);

        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF Load Error:', err);
        
        // AUTO-RETRY WITH LEGACY MODE IF WORKER FAILS
        if (!retryWithLegacy && !useLegacyMode) {
          console.warn('Worker failed, retrying with Legacy Compatibility Mode...');
          setUseLegacyMode(true);
          loadPdf(true);
          return;
        }

        setError(err.message || 'Initialization failed.');
        setIsLoading(false);
      }
    };

    if (fileData?.base64) {
      loadPdf();
    }
  }, [fileData?.base64, renderKey, useLegacyMode]);

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

  return (
    <div className="internal-pdf-viewer pro-theme">
      <div className="viewer-toolbar">
        <div className="toolbar-section">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="toolbar-btn"><ChevronLeft /></button>
          <span className="page-info">{currentPage} / {numPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="toolbar-btn"><ChevronRight /></button>
        </div>

        <div className="toolbar-section">
          <button onClick={() => setScale(s => s - 0.2)} className="toolbar-btn"><ZoomOut size={18} /></button>
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => s + 0.2)} className="toolbar-btn"><ZoomIn size={18} /></button>
        </div>

        <div className="toolbar-section">
          <button onClick={() => setShowDebug(!showDebug)} className="toolbar-btn debug"><Info size={18} /></button>
          {isAdmin && adminActions?.onOpenDrive && (
            <button onClick={adminActions.onOpenDrive} className="toolbar-btn admin"><ExternalLink size={18} /></button>
          )}
        </div>
      </div>

      <div className="pdf-canvas-container">
        {isLoading ? (
          <div className="v-state"><Loader2 className="animate-spin" size={48} /><p>Bypassing Restrictions...</p></div>
        ) : error ? (
          <div className="v-state error">
            <AlertCircle size={64} className="text-danger" />
            <h2>Document Load Blocked</h2>
            <p className="err-txt">{error}</p>
            <div className="error-actions">
              <button onClick={() => { setUseLegacyMode(true); setRenderKey(k => k + 1); }} className="btn-legacy">
                Force Compatibility Mode
              </button>
              <button onClick={() => setRenderKey(k => k + 1)} className="btn-retry">
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="canvas-wrapper"><canvas ref={canvasRef} onContextMenu={e => e.preventDefault()} /></div>
        )}

        {showDebug && (
          <div className="diag-overlay">
            <h4>Security & Health (v3.3.1)</h4>
            <div className="diag-row"><span>File:</span> {fileData.fileName}</div>
            <div className="diag-row"><span>Mode:</span> {useLegacyMode ? 'COMPATIBILITY' : 'WORKER'}</div>
            <div className="diag-row"><span>Bytes:</span> {fileData.byteLength || 'ERR'}</div>
            <button className="close-diag" onClick={() => setShowDebug(false)}>CLOSE</button>
          </div>
        )}
      </div>

      <style>{`
        .pro-theme .viewer-toolbar { background: #1e1b4b !important; }
        .internal-pdf-viewer { display: flex; flex-direction: column; height: 100%; width: 100%; background: #0f172a; position: relative; }
        .viewer-toolbar { height: 50px; display: flex; align-items: center; justify-content: center; gap: 2rem; color: white; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .toolbar-section { display: flex; align-items: center; gap: 0.5rem; }
        .toolbar-btn { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: 0.2s; color: rgba(255,255,255,0.7); }
        .toolbar-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .toolbar-btn.debug { color: #facc15; }
        .toolbar-btn.admin { color: #38bdf8; }
        .page-info, .zoom-info { font-size: 0.75rem; font-weight: 800; min-width: 60px; text-align: center; }
        .pdf-canvas-container { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 2rem; background: #020617; position: relative; }
        .canvas-wrapper { background: white; box-shadow: 0 20px 50px rgba(0,0,0,0.7); }
        .v-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: white; }
        .err-txt { color: #94a3b8; font-size: 0.8rem; margin-bottom: 1.5rem; text-align: center; }
        .error-actions { display: flex; gap: 1rem; }
        .btn-legacy { background: #4f46e5; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 800; font-size: 0.8rem; }
        .btn-retry { background: #1e293b; color: white; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
        .diag-overlay { position: absolute; top: 1rem; right: 1rem; width: 260px; background: rgba(15,23,42,0.95); border: 1px solid #312e81; padding: 1.25rem; border-radius: 12px; color: white; z-index: 500; }
        .diag-overlay h4 { font-size: 0.75rem; color: #facc15; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
        .diag-row { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 0.4rem; font-weight: 700; }
        .diag-row span:first-child { color: rgba(255,255,255,0.5); }
        .close-diag { width: 100%; margin-top: 1rem; background: #312e81; font-size: 0.7rem; font-weight: 800; padding: 6px; border-radius: 6px; }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
