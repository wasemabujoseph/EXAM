import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, X, Sparkles, MessageCircle } from 'lucide-react';

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
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const context = {
        pageTitle: document.title,
        pageUrl: window.location.href
      };

      const result = await api.aiChat(newMessages, context);
      if (result && result.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
      } else {
        throw new Error('Empty response from AI');
      }
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ I encountered an error connecting to the medical brain. Please ensure your API key is configured correctly.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Analyze my performance' },
    { label: 'How to improve my score?' },
    { label: 'Explain this page' }
  ];

  const ChatWindow = (
    <div className={`ai-chat-window ${embedded ? 'embedded' : 'floating'} ${isOpen ? 'is-open' : ''}`}>
      {/* Header - Premium Navy */}
      <div className="ai-header">
        <div className="ai-header-content">
          <div className="ai-status-container">
            <h4 className="ai-title">MEDEXAM AI PRO</h4>
            <div className="ai-status">
              <span className="ai-status-dot"></span>
              <span className="ai-status-text">Online & Expert</span>
            </div>
          </div>
          
          <div className="ai-bot-icon-container">
             <div className="ai-bot-icon-wrapper">
                <Bot size={36} />
                <div className="ai-ping-dot"></div>
             </div>
          </div>

          {!embedded && (
            <button onClick={() => setIsOpen(false)} className="ai-close-btn">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="ai-messages-area custom-scrollbar" dir="auto">
        {messages.map((m, i) => (
          <div key={i} className={`ai-message-wrapper ${m.role === 'user' ? 'user' : 'assistant'}`}>
            <div className="ai-message-bubble">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-loading-dots">
            <div className="ai-dot"></div>
            <div className="ai-dot delay-1"></div>
            <div className="ai-dot delay-2"></div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="ai-quick-actions">
        {quickActions.map((action, idx) => (
          <button key={idx} onClick={() => handleSend(action.label)} className="ai-action-btn">
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="ai-input-area">
        <div className="ai-input-wrapper">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your medical mentor (English only)..."
            dir="auto"
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="ai-send-btn">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .ai-chat-window {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 99999;
          font-family: 'Inter', sans-serif;
        }

        .ai-chat-window.floating {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 400px;
          height: 650px;
          border-radius: 2rem;
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
        }

        .ai-chat-window.floating.is-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .ai-chat-window.embedded {
          width: 100%;
          height: 600px;
          border-radius: 1.5rem;
        }

        .ai-header {
          background: #0F172A;
          padding: 1.5rem 2rem;
          color: white;
        }

        .ai-header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          position: relative;
        }

        .ai-status-container {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .ai-title {
          font-weight: 800;
          font-size: 1.25rem;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ai-status-text {
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .ai-status-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          box-shadow: 0 0 10px #10B981;
        }

        .ai-bot-icon-container {
          width: 52px;
          height: 52px;
          background: #1E293B;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-ping-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #F43F5E;
          border-radius: 50%;
          animation: ping 1.5s infinite;
        }

        .ai-close-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1E293B;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .ai-close-btn:hover { background: #EF4444; }

        .ai-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: #F8FAFC;
        }

        .ai-message-wrapper { display: flex; width: 100%; }
        .ai-message-wrapper.user { justify-content: flex-end; }
        .ai-message-wrapper.assistant { justify-content: flex-start; }

        .ai-message-bubble {
          max-width: 85%;
          padding: 1rem 1.25rem;
          border-radius: 1.25rem;
          font-size: 14px;
          line-height: 1.5;
        }

        .user .ai-message-bubble {
          background: #6366F1;
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .assistant .ai-message-bubble {
          background: white;
          color: #1E293B;
          border: 1px solid #E2E8F0;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .ai-quick-actions {
          padding: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
        }

        .ai-action-btn {
          padding: 6px 14px;
          background: white;
          color: #6366F1;
          border: 1px solid #E2E8F0;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-action-btn:hover {
          background: #6366F1;
          color: white;
          border-color: #6366F1;
        }

        .ai-input-area {
          padding: 1.25rem;
          background: white;
          border-top: 1px solid #F1F5F9;
        }

        .ai-input-wrapper {
          background: #F8FAFC;
          border-radius: 1rem;
          padding: 4px;
          display: flex;
          align-items: center;
          border: 1px solid #E2E8F0;
        }

        .ai-input-wrapper input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 1rem;
          font-size: 14px;
          background: transparent;
          color: #1E293B;
        }

        .ai-send-btn {
          width: 42px;
          height: 42px;
          background: #6366F1;
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .ai-send-btn:hover:not(:disabled) { transform: scale(1.05); background: #4F46E5; }
        .ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ai-toggle-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 64px;
          height: 64px;
          border-radius: 1.5rem;
          background: #0F172A;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(15,23,42,0.3);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .ai-toggle-btn:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(15,23,42,0.4); }
        .ai-toggle-btn.is-open { transform: scale(0.9); background: #EF4444; }

        .ai-online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: #10B981;
          border: 3px solid #0F172A;
          border-radius: 50%;
        }

        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }

        .ai-loading-dots {
          display: flex;
          gap: 4px;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: 1rem;
          width: fit-content;
          border: 1px solid #E2E8F0;
          margin-bottom: 1rem;
        }

        .ai-dot {
          width: 6px;
          height: 6px;
          background: #6366F1;
          border-radius: 50%;
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }

        .markdown-content strong { font-weight: 700; color: #4F46E5; }
        .markdown-content p { margin: 0 0 0.5rem 0; }
        .markdown-content p:last-child { margin-bottom: 0; }
      `}</style>

      {!embedded && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`ai-toggle-btn ${isOpen ? 'is-open' : ''}`}
        >
          {isOpen ? <X size={28} /> : (
            <div style={{ position: 'relative' }}>
              <MessageCircle size={32} />
              <div className="ai-online-indicator"></div>
            </div>
          )}
        </button>
      )}
      
      {ChatWindow}
    </>
  );
};

export default AIGuide;
