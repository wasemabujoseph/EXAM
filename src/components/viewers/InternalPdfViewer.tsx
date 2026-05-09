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

// FORCE UPDATE v2 - CDN WORKER
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
  const [showDebug, setShowDebug] = useState(true); // Default to ON for troubleshooting
  const [renderKey, setRenderKey] = useState(0);

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

        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'PDF structure failure.');
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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="internal-pdf-viewer purple-theme">
      <div className="viewer-toolbar">
        <div className="toolbar-section">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="toolbar-btn"><ChevronLeft /></button>
          <span className="page-info">P. {currentPage} / {numPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages} className="toolbar-btn"><ChevronRight /></button>
        </div>

        <div className="toolbar-section">
          <button onClick={() => setScale(s => s - 0.2)} className="toolbar-btn"><ZoomOut size={18} /></button>
          <span className="zoom-info">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => s + 0.2)} className="toolbar-btn"><ZoomIn size={18} /></button>
        </div>

        <div className="toolbar-section debug-tools">
          <button onClick={() => setShowDebug(!showDebug)} className="toolbar-btn debug"><Info size={18} /></button>
          {isAdmin && adminActions?.onOpenDrive && (
            <button onClick={adminActions.onOpenDrive} className="toolbar-btn admin"><ExternalLink size={18} /></button>
          )}
        </div>
      </div>

      <div className="pdf-canvas-container">
        {isLoading ? (
          <div className="v-state"><Loader2 className="animate-spin" size={40} /><p>NEW BUILD LOADING...</p></div>
        ) : error ? (
          <div className="v-state error">
            <AlertCircle size={64} color="#ef4444" />
            <h2 style={{color:'white'}}>V3.3.0 SYSTEM ERROR</h2>
            <p className="err-txt">{error}</p>
            <button onClick={() => setRenderKey(k => k + 1)} className="force-btn">FORCE RE-DECODE</button>
          </div>
        ) : (
          <div className="canvas-wrapper"><canvas ref={canvasRef} /></div>
        )}

        {showDebug && (
          <div className="diag-overlay">
            <h4>System Diagnostics (v3.3.0)</h4>
            <div className="diag-row"><span>File:</span> {fileData.fileName}</div>
            <div className="diag-row"><span>Backend PDF:</span> {fileData.pdfHeaderValid ? 'VALID' : 'INVALID'}</div>
            <div className="diag-row"><span>Size:</span> {fileData.byteLength || 'ERR'} bytes</div>
            <button className="close-diag" onClick={() => setShowDebug(false)}>DISMISS</button>
          </div>
        )}
      </div>

      <style>{`
        .purple-theme .viewer-toolbar { background: #4c1d95 !important; } /* DEEP PURPLE TOOLBAR */
        .internal-pdf-viewer { display: flex; flex-direction: column; height: 100%; background: #0f172a; position: relative; }
        .viewer-toolbar { height: 50px; display: flex; align-items: center; justify-content: center; gap: 2rem; color: white; padding: 0 1rem; border-bottom: 2px solid rgba(255,255,255,0.1); }
        .toolbar-section { display: flex; align-items: center; gap: 0.5rem; }
        .toolbar-btn { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: 0.2s; color: rgba(255,255,255,0.8); }
        .toolbar-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .toolbar-btn.debug { color: #facc15; }
        .toolbar-btn.admin { color: #38bdf8; }
        .page-info, .zoom-info { font-size: 0.75rem; font-weight: 800; min-width: 60px; text-align: center; }
        .pdf-canvas-container { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 2rem; background: #1e293b; position: relative; }
        .canvas-wrapper { background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .v-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: white; }
        .err-txt { color: #94a3b8; font-size: 0.8rem; max-width: 300px; text-align: center; }
        .force-btn { background: #8b5cf6; color: white; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 800; font-size: 0.75rem; margin-top: 1rem; }
        .diag-overlay { position: absolute; top: 1rem; right: 1rem; width: 250px; background: rgba(0,0,0,0.9); border: 1px solid #4c1d95; padding: 1rem; border-radius: 12px; color: white; z-index: 500; font-family: monospace; }
        .diag-overlay h4 { font-size: 0.7rem; color: #facc15; margin-bottom: 0.5rem; border-bottom: 1px solid #4c1d95; padding-bottom: 0.5rem; }
        .diag-row { display: flex; justify-content: space-between; font-size: 0.65rem; margin-bottom: 0.3rem; }
        .close-diag { width: 100%; margin-top: 0.5rem; background: #4c1d95; font-size: 0.6rem; font-weight: 800; padding: 4px; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default InternalPdfViewer;
