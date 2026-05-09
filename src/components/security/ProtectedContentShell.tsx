import React, { useState, useEffect, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { api } from '../../lib/api';
import { ShieldAlert, Lock, Info } from 'lucide-react';

interface ProtectedContentShellProps {
  children: React.ReactNode;
  isProtected: boolean;
  materialId?: string;
  examId?: string;
  attemptId?: string;
  title?: string;
}

const ProtectedContentShell: React.FC<ProtectedContentShellProps> = ({ 
  children, 
  isProtected, 
  materialId, 
  examId, 
  attemptId,
  title
}) => {
  const { user } = useVault();
  const [isBlurred, setIsBlurred] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const lastEventTime = useRef<number>(0);

  useEffect(() => {
    if (!isProtected) return;

    const logEvent = async (type: string) => {
      const now = Date.now();
      if (now - lastEventTime.current < 2000) return; // Throttle logs
      lastEventTime.current = now;
      
      try {
        await api.logSecurityEvent({
          eventType: type,
          page: window.location.pathname,
          materialId,
          examId,
          attemptId,
          userAgent: navigator.userAgent
        });
      } catch (err) {
        console.error('Failed to log security event', err);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
      setShowOverlay(true);
      logEvent('tab_blur');
    };

    const handleFocus = () => {
      setTimeout(() => {
        setIsBlurred(false);
        setShowOverlay(false);
      }, 500);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        setShowOverlay(true);
        logEvent('tab_hidden');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent('right_click_blocked');
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      
      // Allow typing in inputs
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || 
                      (e.target as HTMLElement).isContentEditable;

      if (isCmdOrCtrl) {
        if (['c', 'v', 'p', 's', 'u', 'a'].includes(key)) {
          // Block these even in inputs (except maybe Ctrl+V/A if we want to be nice, 
          // but the prompt says block common copy/print/save/text selection)
          e.preventDefault();
          logEvent(`shortcut_blocked_${key}`);
        }
        if (e.shiftKey && ['i', 'j', 'c'].includes(key)) {
          e.preventDefault();
          logEvent(`devtools_shortcut_blocked_${key}`);
        }
      }

      if (key === 'f12') {
        e.preventDefault();
        logEvent('f12_blocked');
      }
    };

    const handlePrint = (e: Event) => {
      e.preventDefault();
      logEvent('print_blocked');
      alert('Printing is disabled for protected content.');
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handlePrint);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handlePrint);
    };
  }, [isProtected, materialId, examId, attemptId]);

  if (!isProtected) return <>{children}</>;

  const watermarkText = `${user?.username || 'User'} • ${user?.email || 'MEDEXAM'} • MEDEXAM • ${new Date().toLocaleString()}`;

  return (
    <div className="protected-viewport-shell">
      <div className={`protected-content-container ${isBlurred ? 'blurred' : ''}`}>
        {children}
        
        {/* Ghost Watermark Overlay */}
        <div className="ghost-watermark-overlay">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="watermark-row">
              {[...Array(5)].map((_, j) => (
                <span key={j}>{watermarkText}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showOverlay && (
        <div className="security-pause-overlay animate-fade-in">
           <Lock size={48} className="lock-icon" />
           <h2>Protected Session Paused</h2>
           <p>Content is hidden while you are away. Return to the tab to continue.</p>
           <div className="security-badge">
             <ShieldAlert size={16} />
             <span>MEDEXAM Content Protection Active</span>
           </div>
        </div>
      )}

      <div className="protection-toast">
        <Info size={14} />
        <span>Content Protection Enabled: Copying and printing are disabled.</span>
      </div>

      <style>{`
        .protected-viewport-shell { position: relative; width: 100%; height: 100%; overflow: hidden; user-select: none; }
        
        .protected-content-container { 
          position: relative; 
          width: 100%; 
          height: 100%; 
          transition: filter 0.4s ease, opacity 0.4s ease; 
        }
        .protected-content-container.blurred { 
          filter: blur(15px) grayscale(1); 
          opacity: 0.5;
          pointer-events: none;
        }

        .ghost-watermark-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 100px;
          padding: 50px;
          opacity: 0.12;
          transform: rotate(-15deg) scale(1.5);
        }
        
        .watermark-row {
          display: flex;
          justify-content: space-around;
          white-space: nowrap;
          gap: 150px;
        }
        
        .watermark-row span {
          font-size: 0.9rem;
          font-weight: 900;
          color: var(--text-strong);
          letter-spacing: 0.05em;
        }

        .security-pause-overlay {
          position: absolute;
          inset: 0;
          z-index: 10000;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          text-align: center;
          padding: 2rem;
        }
        
        .lock-icon { margin-bottom: 1.5rem; color: var(--primary); animation: pulse 2s infinite; }
        .security-pause-overlay h2 { font-size: 1.75rem; font-weight: 900; margin-bottom: 0.5rem; }
        .security-pause-overlay p { color: rgba(255,255,255,0.7); font-weight: 600; margin-bottom: 2rem; }
        
        .security-badge { 
          display: flex; align-items: center; gap: 0.5rem; 
          background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; 
          border-radius: 99px; font-size: 0.75rem; font-weight: 800;
        }

        .protection-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 0.75rem 1.25rem;
          border-radius: 99px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: var(--shadow-xl);
          z-index: 10001;
          color: var(--text-soft);
          pointer-events: none;
          opacity: 0;
          animation: slideUpIn 0.5s forwards delay 1s;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slideUpIn {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ProtectedContentShell;
