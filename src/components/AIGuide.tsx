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
}

const AIGuide: React.FC<Props> = ({ userName, embedded = false }) => {
  const [isOpen, setIsOpen] = useState(embedded);
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
              <img src="/brand/medexam-icon.svg" alt="AI" />
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
          border: 1px solid var(--border); box-shadow: var(--shadow-premium);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: var(--z-modal); overflow: hidden;
        }

        .ai-chat-window.floating {
          position: fixed; bottom: 100px; right: 24px;
          width: clamp(320px, 90vw, 400px); height: min(700px, 80vh);
          border-radius: var(--radius-2xl); opacity: 0;
          transform: translateY(20px) scale(0.95); pointer-events: none;
        }

        .ai-chat-window.floating.is-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
        .ai-chat-window.embedded { width: 100%; height: 600px; border-radius: var(--radius-2xl); }

        .ai-header-premium { background: var(--primary-brand); color: white; padding: 1.5rem; }
        .ai-header-main { display: flex; align-items: center; justify-content: space-between; }
        .ai-identity { display: flex; align-items: center; gap: 1rem; }
        
        .ai-avatar-wrap { position: relative; width: 44px; height: 44px; }
        .ai-avatar-wrap img { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; }
        .ai-pulse-ring {
          position: absolute; -1px; right: -1px; width: 12px; height: 12px;
          background: var(--success); border: 2px solid var(--primary-brand);
          border-radius: 50%;
        }

        .ai-meta h3 { font-size: 1rem; font-weight: 800; margin: 0; letter-spacing: -0.01em; }
        .ai-status-row { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; }
        .status-dot { width: 6px; height: 6px; background: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success); }

        .ai-btn-close { background: rgba(0,0,0,0.2); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        .ai-chat-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; background: var(--bg-soft-fade); }
        .ai-msg-group { display: flex; width: 100%; }
        .ai-msg-group.is-user { justify-content: flex-end; }
        
        .ai-msg-bubble { max-width: 85%; padding: 1rem 1.25rem; border-radius: 1.25rem; font-size: 0.9rem; line-height: 1.6; }
        .is-user .ai-msg-bubble { background: var(--primary-brand); color: white; border-bottom-right-radius: 4px; box-shadow: var(--shadow-md); }
        .is-ai .ai-msg-bubble { background: var(--surface); color: var(--text-main); border: 1px solid var(--border); border-bottom-left-radius: 4px; }

        .ai-typing-loader { display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 700; font-size: 0.8rem; }
        .ai-btn-stop { margin-left: 0.5rem; background: var(--danger-soft); color: var(--danger); border: 1px solid var(--danger); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; cursor: pointer; }
        .ai-btn-stop:hover { background: var(--danger); color: white; }

        .ai-footer-controls { padding: 1.25rem; background: var(--surface); border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 1rem; }
        .ai-suggestions { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 4px; }
        .ai-suggest-chip {
          white-space: nowrap; padding: 6px 14px; background: var(--bg-soft); color: var(--primary);
          border: 1px solid var(--border); border-radius: 99px; font-size: 0.75rem; font-weight: 700;
        }
        .ai-suggest-chip:hover { background: var(--primary); color: white; border-color: var(--primary); }

        .ai-input-compose { display: flex; align-items: center; gap: 0.75rem; background: var(--bg-soft); padding: 6px; border-radius: 1rem; border: 1px solid var(--border); }
        .ai-input-compose input { flex: 1; border: none; background: transparent; padding: 0 0.75rem; font-size: 0.9rem; color: var(--text-main); }
        .ai-btn-send { width: 40px; height: 40px; background: var(--primary-brand); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        .ai-btn-send:hover:not(:disabled) { transform: scale(1.05); filter: brightness(1.1); }
        .ai-btn-send:disabled { opacity: 0.4; }

        .ai-floating-trigger {
          position: fixed; bottom: 24px; right: 24px; width: 64px; height: 64px;
          border-radius: 1.5rem; background: var(--primary-brand); color: white;
          box-shadow: var(--shadow-xl); z-index: var(--z-modal);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ai-floating-trigger:hover { transform: translateY(-4px); box-shadow: var(--shadow-premium); }
        .ai-floating-trigger.is-open { background: var(--danger); transform: rotate(90deg) scale(0.9); }

        @media (max-width: 480px) {
          .ai-chat-window.floating { bottom: 0; right: 0; width: 100%; height: 100%; border-radius: 0; }
          .ai-floating-trigger { bottom: 90px; right: 16px; width: 56px; height: 56px; }
        }
      `}</style>

      {!embedded && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`ai-floating-trigger ${isOpen ? 'is-open' : ''}`}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={32} />}
        </button>
      )}
      
      {ChatWindow}
    </>
  );
};

export default AIGuide;
