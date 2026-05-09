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
  enableWatermark?: boolean;
}

const ProtectedContentShell: React.FC<ProtectedContentShellProps> = ({ 
  children, 
  isProtected, 
  materialId, 
  examId, 
  attemptId,
  title,
  enableWatermark = true
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
      
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || 
                      (e.target as HTMLElement).isContentEditable;

      if (isCmdOrCtrl) {
        if (['c', 'v', 'p', 's', 'u', 'a'].includes(key)) {
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

  const watermarkText = `${user?.username || 'User'} • ${user?.email || 'MEDEXAM'} • MEDEXAM • ${new Date().toLocaleDateString()}`;

  return (
    <div className="protected-viewport-shell theme-aware">
      <div className={`protected-content-container ${isBlurred ? 'blurred' : ''}`}>
        {children}
        
        {/* Ghost Watermark Overlay */}
        {enableWatermark && (
          <div className="ghost-watermark-overlay">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="watermark-row">
                {[...Array(4)].map((_, j) => (
                  <span key={j}>{watermarkText}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showOverlay && (
        <div className="security-pause-overlay animate-fade-in">
           <Lock size={64} className="lock-icon" />
           <h2>Protected Session</h2>
           <p>Content is secured while inactive. Return to the tab to resume your study.</p>
           <div className="security-badge-pro">
             <ShieldAlert size={16} />
             <span>MEDEXAM Secure Protocol Active</span>
           </div>
        </div>
      )}

      <div className="protection-toast-pro">
        <Info size={14} />
        <span>Strict Content Protection Enabled</span>
      </div>

      <style>{`
        .protected-viewport-shell { position: relative; width: 100%; height: 100%; overflow: hidden; user-select: none; background: var(--bg); }
        
        .protected-content-container { 
          position: relative; 
          width: 100%; 
          height: 100%; 
          transition: filter 0.5s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .protected-content-container.blurred { 
          filter: blur(25px) grayscale(1); 
          opacity: 0.4;
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
          gap: 120px;
          padding: 80px;
          opacity: 0.08;
          transform: rotate(-20deg) scale(1.4);
        }
        
        .watermark-row {
          display: flex;
          justify-content: space-around;
          white-space: nowrap;
          gap: 200px;
        }
        
        .watermark-row span {
          font-size: 0.8rem;
          font-weight: 900;
          color: var(--text-strong);
          letter-spacing: 0.08em;
          font-family: 'Space Grotesk', sans-serif;
        }

        .security-pause-overlay {
          position: absolute;
          inset: 0;
          z-index: 10000;
          background: var(--bg-soft-fade);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-strong);
          text-align: center;
          padding: 3rem;
        }
        
        .lock-icon { margin-bottom: 2rem; color: var(--primary); animation: lockPulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
        .security-pause-overlay h2 { font-size: 2rem; font-weight: 900; margin-bottom: 0.75rem; letter-spacing: -0.03em; }
        .security-pause-overlay p { color: var(--text-muted); font-weight: 600; margin-bottom: 2.5rem; max-width: 400px; line-height: 1.6; }
        
        .security-badge-pro { 
          display: flex; align-items: center; gap: 0.6rem; 
          background: var(--primary-soft); color: var(--primary);
          padding: 0.6rem 1.25rem; 
          border-radius: 99px; font-size: 0.7rem; font-weight: 800;
          text-transform: uppercase;
          border: 1px solid var(--primary-soft);
        }

        .protection-toast-pro {
          position: fixed;
          bottom: 2.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface-elevated);
          border: 1px solid var(--border);
          padding: 0.75rem 1.5rem;
          border-radius: 99px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
          font-weight: 800;
          box-shadow: var(--shadow-xl);
          z-index: 10001;
          color: var(--text);
          pointer-events: none;
          opacity: 0;
          animation: slideUpInPro 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes lockPulse {
          0% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0px var(--primary-glow)); }
          50% { transform: scale(1.1); opacity: 0.8; filter: drop-shadow(0 0 20px var(--primary-glow)); }
          100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0px var(--primary-glow)); }
        }
        
        @keyframes slideUpInPro {
          from { transform: translate(-50%, 40px); opacity: 0; }
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
