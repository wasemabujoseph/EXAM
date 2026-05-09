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
  const [liveTime, setLiveTime] = useState(new Date());
  const lastEventTime = useRef<number>(0);

  useEffect(() => {
    if (!isProtected) return;

    // Update live timestamp every second for the watermark
    const timeInterval = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);

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
      
      // Allow typing in inputs/textareas for legitimate use (notes, AI chat)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      if (isCmdOrCtrl) {
        // Block print, save, source, etc.
        if (['p', 's', 'u'].includes(key)) {
          e.preventDefault();
          logEvent(`shortcut_blocked_${key}`);
        }
        
        // Block Copy, Cut, Select All in protected mode
        if (['c', 'x', 'a'].includes(key)) {
          e.preventDefault();
          logEvent(`shortcut_blocked_${key}`);
        }

        // Block devtools shortcuts
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

    // Block text selection start
    const handleSelectStart = (e: Event) => {
      if (!isProtected) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      e.preventDefault();
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handlePrint);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handlePrint);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [isProtected, materialId, examId, attemptId]);

  if (!isProtected) return <>{children}</>;

  const formatTimestamp = (date: Date) => {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0') + ' ' + 
           String(date.getHours()).padStart(2, '0') + ':' + 
           String(date.getMinutes()).padStart(2, '0') + ':' + 
           String(date.getSeconds()).padStart(2, '0');
  };

  const watermarkText = `${user?.username || 'user'} • ${user?.email || 'medexam'} • MEDEXAM • ${formatTimestamp(liveTime)}`;

  return (
    <div className="protected-viewport-shell">
      <div className={`protected-content-container ${isBlurred ? 'blurred' : ''}`}>
        {children}
        
        {/* Ghost Watermark Overlay - High-density diagonal grid */}
        <div className="ghost-watermark-grid">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="watermark-row" style={{ transform: `translateX(${i % 2 === 0 ? '0' : '-50px'})` }}>
              {Array.from({ length: 6 }).map((_, j) => (
                <span key={j}>{watermarkText}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showOverlay && (
        <div className="security-pause-overlay animate-fade-in">
           <div className="pause-box">
             <Lock size={64} className="lock-icon" />
             <h2>Protected Exam Paused</h2>
             <p>Focus protection is active. Please return to this tab to continue your assessment.</p>
             <div className="security-indicator">
               <ShieldAlert size={18} />
               <span>SECURITY LOCKDOWN ACTIVE</span>
             </div>
           </div>
        </div>
      )}

      <div className="protection-alert-badge">
        <ShieldAlert size={14} />
        <span>Content Protected</span>
      </div>

      <style>{`
        .protected-viewport-shell { 
          position: relative; 
          width: 100%; 
          height: 100%; 
          overflow: hidden; 
          user-select: none !important; 
          -webkit-user-select: none !important;
        }
        
        .protected-content-container { 
          position: relative; 
          width: 100%; 
          height: 100%; 
          transition: filter 0.3s ease, opacity 0.3s ease; 
        }
        
        .protected-content-container.blurred { 
          filter: blur(25px) grayscale(1); 
          opacity: 0.3;
          pointer-events: none;
        }

        .ghost-watermark-grid {
          position: absolute;
          inset: -50%;
          pointer-events: none;
          z-index: 99999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          opacity: 0.08;
          transform: rotate(-25deg);
        }
        
        .watermark-row {
          display: flex;
          justify-content: space-around;
          white-space: nowrap;
          padding: 20px 0;
        }
        
        .watermark-row span {
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--text-strong);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .security-pause-overlay {
          position: absolute;
          inset: 0;
          z-index: 100000;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .pause-box {
          max-width: 450px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 3rem;
          border-radius: 2.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .lock-icon { color: var(--primary); animation: lockPulse 2s infinite; }
        @keyframes lockPulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        
        .security-indicator {
          display: flex; align-items: center; gap: 8px;
          background: #e11d48; color: white; padding: 8px 20px;
          border-radius: 99px; font-size: 0.7rem; font-weight: 900;
        }

        .protection-alert-badge {
          position: fixed; bottom: 1.5rem; right: 1.5rem;
          background: var(--surface); border: 1px solid var(--border);
          padding: 0.5rem 1rem; border-radius: 99px;
          display: flex; align-items: center; gap: 8px;
          font-size: 0.75rem; font-weight: 800; color: var(--danger);
          box-shadow: var(--shadow-lg); z-index: 100001;
          pointer-events: none;
        }

        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ProtectedContentShell;
