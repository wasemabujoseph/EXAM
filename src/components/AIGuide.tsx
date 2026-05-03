import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, X, Sparkles, ArrowLeft } from 'lucide-react';

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
          content: `مرحباً **${userName || 'Waseem'}**! أنا مُرشدك الأكاديمي الذكي. كيف يمكنني مساعدتك اليوم في فهم أدائك أو تحسين مستواك؟ ✨` 
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

    try {
      const context = {
        pageTitle: document.title,
        pageUrl: window.location.href,
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY
      };

      const result = await api.aiChat([...messages, userMsg], context);
      setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ عذراً، واجهت مشكلة في الاتصال. يرجى التأكد من إعداد مفتاح الـ API.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'ما هي نقاط قوتي؟' },
    { label: 'كيف أحسن درجتي؟' },
    { label: 'حلل أدائي' }
  ];

  const ChatWindow = (
    <div className={`ai-chat-window ${embedded ? 'embedded' : 'floating'} ${isOpen ? 'is-open' : ''}`}>
      {/* Header - Navy Dark */}
      <div className="ai-header">
        <div className="ai-header-content">
          <div className="ai-status-container">
            <h4 className="ai-title">مُرشد إمتحاني PRO</h4>
            <div className="ai-status">
              <span className="ai-status-text">المحرك الذكي نشط</span>
              <span className="ai-status-dot"></span>
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
      <div ref={scrollRef} className="ai-messages-area custom-scrollbar" dir="rtl">
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
          <div className="ai-loading-dots" dir="rtl">
            <div className="ai-dot"></div>
            <div className="ai-dot delay-1"></div>
            <div className="ai-dot delay-2"></div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="ai-quick-actions" dir="rtl">
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
            placeholder="تحدث مع مرشدك الأكاديمي..."
            dir="rtl"
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="ai-send-btn">
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        /* AI Mentor Styles - Aggressive Scope */
        .ai-chat-window {
          display: flex;
          flex-direction: column;
          background: #F8FAFC;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.8);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 99999;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .ai-chat-window.floating {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 420px;
          height: 700px;
          border-radius: 40px;
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
          height: 100%;
          border-radius: 20px;
        }

        .ai-header {
          background: #1E1B4B;
          padding: 2rem;
          color: white;
        }

        .ai-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .ai-status-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex: 1;
          padding-right: 1rem;
        }

        .ai-title {
          font-weight: 900;
          font-size: 1.5rem;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .ai-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-status-text {
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
        }

        .ai-status-dot {
          width: 10px;
          height: 10px;
          background: #34D399;
          border-radius: 50%;
          box-shadow: 0 0 8px #34D399;
        }

        .ai-bot-icon-container {
          width: 64px;
          height: 64px;
          background: #2D2A5A;
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-bot-icon-wrapper {
          position: relative;
        }

        .ai-ping-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: #F43F5E;
          border-radius: 50%;
          animation: ping 1.5s infinite;
        }

        .ai-close-btn {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ai-message-wrapper {
          display: flex;
          width: 100%;
        }

        .ai-message-wrapper.user { justify-content: flex-start; }
        .ai-message-wrapper.assistant { justify-content: flex-end; }

        .ai-message-bubble {
          max-width: 90%;
          padding: 1.25rem;
          border-radius: 2rem;
          font-size: 15px;
          line-height: 1.6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .user .ai-message-bubble {
          background: #4F46E5;
          color: white;
          border-top-right-radius: 4px;
        }

        .assistant .ai-message-bubble {
          background: white;
          color: #1E293B;
          border: 1px solid #F1F5F9;
          border-top-left-radius: 4px;
        }

        .ai-quick-actions {
          padding: 0.5rem 1.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .ai-action-btn {
          padding: 8px 16px;
          background: #F1F5F9;
          color: #4F46E5;
          border: 1px solid white;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-action-btn:hover {
          background: #E0E7FF;
        }

        .ai-input-area {
          padding: 2rem;
        }

        .ai-input-wrapper {
          background: white;
          border-radius: 2.5rem;
          padding: 6px;
          display: flex;
          align-items: center;
          border: 1px solid #F1F5F9;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .ai-input-wrapper input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 1.5rem;
          font-size: 15px;
          font-weight: 500;
          color: #475569;
        }

        .ai-send-btn {
          width: 56px;
          height: 56px;
          background: #A5B4FC;
          border: none;
          border-radius: 18px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .ai-send-btn:hover { transform: scale(1.05); }

        .ai-toggle-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 64px;
          height: 64px;
          border-radius: 2rem;
          background: #1E1B4B;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 15px 35px rgba(30,27,75,0.3);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ai-toggle-btn:hover {
          transform: translateY(-4px) scale(1.05);
        }

        .ai-toggle-btn.is-open {
          background: white;
          color: #1E1B4B;
          transform: rotate(90deg) scale(0.9);
        }

        .ai-bot-icon-main {
          position: relative;
        }

        .ai-online-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #34D399;
          border: 3px solid #1E1B4B;
          border-radius: 50%;
        }

        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .ai-loading-dots {
          display: flex;
          gap: 4px;
          padding: 1rem;
          background: white;
          border-radius: 1rem;
          width: fit-content;
          border: 1px solid #F1F5F9;
        }

        .ai-dot {
          width: 8px;
          height: 8px;
          background: #A5B4FC;
          border-radius: 50%;
          animation: bounce 1s infinite;
        }

        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }

        .markdown-content strong { font-weight: 800; }
        .markdown-content p { margin: 0; }
      `}</style>

      {!embedded && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`ai-toggle-btn ${isOpen ? 'is-open' : ''}`}
        >
          {isOpen ? <X size={28} /> : (
            <div className="ai-bot-icon-main">
              <Bot size={34} strokeWidth={1.5} />
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
