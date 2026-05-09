import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, X, Sparkles, MessageCircle, MoreHorizontal } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  userName?: string;
  embedded?: boolean;
  externalOpen?: boolean;
  onToggle?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const AIGuide: React.FC<Props> = ({ userName, embedded = false, externalOpen, onToggle, hideTrigger = false }) => {
  const [internalOpen, setInternalOpen] = useState(embedded);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const setIsOpen = (val: boolean) => {
    if (onToggle) onToggle(val);
    setInternalOpen(val);
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (embedded) setIsOpen(true);
  }, [embedded]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { 
          role: 'assistant', 
          content: `Welcome to **MEDEXAM AI PRO**, **${userName || 'Scholar'}**. I am your advanced clinical mentor. How can I assist you with your medical studies, exam strategies, or clinical concepts today?` 
        }
      ]);
    }
  }, [userName, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Create a temporary message for the AI response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const response = await fetch('/api/ai-chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: {
            pageTitle: document.title,
            pageUrl: window.location.href
          }
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 500 && errorData.error?.includes('OPENROUTER_API_KEY')) {
          throw new Error('AI backend is not configured. Please check OPENROUTER_API_KEY in Cloudflare.');
        }
        if (response.status === 401) {
          throw new Error('AI provider rejected the API key. Please check the OpenRouter key.');
        }
        throw new Error(errorData.error || `AI Guide could not connect (Status: ${response.status}).`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) throw new Error('Failed to initialize AI stream reader.');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        // Update the last message (the AI's response)
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'assistant', content: fullContent };
          return newMsgs;
        });
      }
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      let errorMsg = '⚠️ AI Guide could not connect. Please check your connection and try again.';
      
      if (err.name === 'AbortError') {
        errorMsg = '⚠️ AI request was stopped or timed out. Please try again.';
      } else if (err.message) {
        errorMsg = `⚠️ ${err.message}`;
      }

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          role: 'assistant', 
          content: errorMsg 
        };
        return newMsgs;
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Analyze performance' },
    { label: 'Improve my score' },
    { label: 'Explain this page' }
  ];

  const ChatWindow = (
    <div className={`ai-chat-window ${embedded ? 'embedded' : 'floating'} ${isOpen ? 'is-open' : ''}`}>
      <div className="ai-header-premium">
        <div className="ai-header-main">
          <div className="ai-identity">
            <div className="ai-avatar-wrap">
              <img src="/brand/medexam-logo-dark.svg" alt="AI" />
              <div className="ai-pulse-ring" />
            </div>
            <div className="ai-meta">
              <h3>MEDEXAM AI PRO</h3>
              <div className="ai-status-row">
                <span className="status-dot" />
                <span>Expert Mentor Online</span>
              </div>
            </div>
          </div>
          
          {!embedded && (
            <button onClick={() => setIsOpen(false)} className="ai-btn-close">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="ai-chat-body custom-scrollbar" dir="auto">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg-group ${m.role === 'user' ? 'is-user' : 'is-ai'}`}>
            <div className="ai-msg-bubble">
              <div className="markdown-render">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-typing-loader">
            <MoreHorizontal className="animate-pulse" />
            <span>AI is thinking...</span>
            <button onClick={handleStop} className="ai-btn-stop">Stop</button>
          </div>
        )}
      </div>

      <div className="ai-footer-controls">
        <div className="ai-suggestions">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => handleSend(action.label)} className="ai-suggest-chip">
              {action.label}
            </button>
          ))}
        </div>
        
        <div className="ai-input-compose">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your mentor..."
            dir="auto"
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="ai-btn-send">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .ai-chat-window {
          display: flex; flex-direction: column; background: var(--surface);
          border: 1px solid var(--border-soft); box-shadow: var(--shadow-premium);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2000; overflow: hidden;
        }

        .ai-chat-window.floating {
          position: fixed; bottom: 100px; right: 24px;
          width: 400px; height: min(700px, 75vh);
          border-radius: 2rem; opacity: 0;
          transform: translateY(30px) scale(0.95); pointer-events: none;
        }

        .ai-chat-window.floating.is-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
        .ai-chat-window.embedded { width: 100%; height: 600px; border-radius: 2rem; }

        .ai-header-premium { 
          background: linear-gradient(135deg, var(--primary-brand), #1e40af);
          color: white; padding: 1.25rem 1.5rem;
          position: relative; overflow: hidden;
        }
        .ai-header-premium::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: rotate-bg 10s linear infinite;
        }
        @keyframes rotate-bg { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .ai-header-main { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
        .ai-identity { display: flex; align-items: center; gap: 1rem; }
        
        .ai-avatar-wrap { position: relative; width: 48px; height: 48px; }
        .ai-avatar-wrap img { width: 100%; height: 100%; border-radius: 14px; object-fit: cover; border: 2px solid rgba(255,255,255,0.2); }
        .ai-pulse-ring {
          position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px;
          background: #10b981; border: 3px solid var(--primary-brand);
          border-radius: 50%; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .ai-meta h3 { font-size: 1.1rem; font-weight: 900; margin: 0; letter-spacing: -0.03em; }
        .ai-status-row { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.05em; }
        .status-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse-green 2s infinite; }
        @keyframes pulse-green { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

        .ai-btn-close { background: rgba(255,255,255,0.15); color: white; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
        .ai-btn-close:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }

        .ai-chat-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; background: var(--bg-soft-fade); }
        .ai-msg-group { display: flex; width: 100%; animation: slide-in-msg 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slide-in-msg { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .ai-msg-group.is-user { justify-content: flex-end; }
        
        .ai-msg-bubble { max-width: 85%; padding: 1rem 1.25rem; border-radius: 1.5rem; font-size: 0.95rem; line-height: 1.6; font-weight: 500; }
        .is-user .ai-msg-bubble { 
          background: var(--primary-brand); color: white; border-bottom-right-radius: 4px; 
          box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.3); 
        }
        .is-ai .ai-msg-bubble { 
          background: var(--surface); color: var(--text-main); 
          border: 1px solid var(--border-soft); border-bottom-left-radius: 4px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .ai-typing-loader { 
          display: flex; align-items: center; gap: 0.75rem; 
          background: var(--surface); padding: 0.75rem 1.25rem; border-radius: 1rem;
          color: var(--primary); font-weight: 800; font-size: 0.85rem; width: fit-content;
          border: 1px solid var(--border-soft); box-shadow: var(--shadow-sm);
        }
        .ai-btn-stop { background: var(--danger-soft); color: var(--danger); border: none; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; }
        .ai-btn-stop:hover { background: var(--danger); color: white; }

        .ai-footer-controls { padding: 1.5rem; background: var(--surface); border-top: 1px solid var(--border-soft); display: flex; flex-direction: column; gap: 1.25rem; }
        .ai-suggestions { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .ai-suggestions::-webkit-scrollbar { display: none; }
        
        .ai-suggest-chip {
          white-space: nowrap; padding: 8px 16px; background: var(--bg-soft); color: var(--primary);
          border: 1px solid var(--border-soft); border-radius: 12px; font-size: 0.8rem; font-weight: 800;
          transition: all 0.2s;
        }
        .ai-suggest-chip:hover { background: var(--primary); color: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2); }

        .ai-input-compose { 
          display: flex; align-items: center; gap: 0.75rem; background: var(--bg-soft); 
          padding: 6px 6px 6px 1.25rem; border-radius: 1.25rem; border: 1px solid var(--border-soft);
          transition: all 0.2s;
        }
        .ai-input-compose:focus-within { background: var(--surface); border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-soft-fade); }
        .ai-input-compose input { flex: 1; border: none; background: transparent; font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
        .ai-btn-send { 
          width: 44px; height: 44px; background: var(--primary-brand); color: white; 
          border-radius: 14px; display: flex; align-items: center; justify-content: center; 
          transition: all 0.2s; box-shadow: 0 8px 16px -4px rgba(var(--primary-rgb), 0.3);
        }
        .ai-btn-send:hover:not(:disabled) { transform: scale(1.05) translateY(-2px); box-shadow: 0 12px 20px -4px rgba(var(--primary-rgb), 0.4); }
        .ai-btn-send:disabled { opacity: 0.4; transform: none; box-shadow: none; }

        .ai-floating-trigger {
          position: fixed; bottom: 24px; right: 24px; width: 68px; height: 68px;
          border-radius: 1.75rem; background: var(--primary-brand); color: white;
          box-shadow: 0 15px 35px -5px rgba(var(--primary-rgb), 0.4); z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ai-floating-trigger:hover { transform: translateY(-6px) scale(1.05); box-shadow: 0 20px 40px -5px rgba(var(--primary-rgb), 0.5); }
        .ai-floating-trigger.is-open { background: var(--danger); transform: rotate(90deg) scale(0.9); box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4); }

        @media (max-width: 480px) {
          .ai-chat-window.floating { bottom: 0; right: 0; width: 100vw; height: 100vh; border-radius: 0; z-index: 3000; }
          .ai-header-premium { padding: 1rem 1.25rem; border-radius: 0; }
          .ai-avatar-wrap { width: 40px; height: 40px; }
          .ai-floating-trigger { bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 1.5rem; }
          .ai-footer-controls { padding: 1.25rem 1rem env(safe-area-inset-bottom, 1rem); }
        }
      `}</style>

      {!embedded && !hideTrigger && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`ai-floating-trigger ${isOpen ? 'is-open' : ''}`}
          style={{ display: hideTrigger ? 'none' : 'flex' }}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={32} />}
        </button>
      )}
      
      {ChatWindow}
    </>
  );
};

export default AIGuide;
