import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, X, MessageCircle, Sparkles } from 'lucide-react';

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
        { role: 'assistant', content: `مرحباً ${userName || 'بك'}! أنا مرشدك الأكاديمي الذكي "مُرشد إمتحاني". كيف يمكنني مساعدتك اليوم؟ ✨` }
      ]);
    }
  }, [userName, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        pageTitle: document.title,
        pageUrl: window.location.href
      };

      const result = await api.aiChat([...messages, userMsg], context);
      
      setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const ChatWindow = (
    <div className={`${embedded ? 'w-full h-full' : 'fixed bottom-24 right-6 w-96 h-[600px] z-50'} flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up`}>
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm">مُرشد إمتحاني PRO</h4>
            <span className="text-[10px] opacity-70">نشط الآن</span>
          </div>
        </div>
        {!embedded && (
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
            }`}>
              <div className="markdown-content" dir="rtl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="اسأل مرشدك الأكاديمي..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium"
            dir="rtl"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
      </div>

      <style>{`
        .markdown-content p { margin-bottom: 0.5rem; }
        .markdown-content ul { list-style-type: disc; padding-right: 1.25rem; margin-bottom: 0.5rem; }
        .markdown-content ol { list-style-type: decimal; padding-right: 1.25rem; margin-bottom: 0.5rem; }
        .markdown-content strong { font-weight: 800; }
      `}</style>
    </div>
  );

  if (embedded) return ChatWindow;

  return (
    <>
      {isOpen && ChatWindow}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-50 group"
      >
        {isOpen ? <X size={24} /> : (
          <div className="relative">
            <Bot size={28} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-indigo-600 rounded-full" />
            <div className="absolute -top-12 right-0 bg-white text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-indigo-100 pointer-events-none">
              مُرشد إمتحاني PRO
            </div>
          </div>
        )}
      </button>
    </>
  );
};

export default AIGuide;
