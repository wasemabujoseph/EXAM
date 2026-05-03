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
          content: `مرحباً **${userName || 'بك'}**! أنا مُرشدك الأكاديمي الذكي. كيف يمكنني مساعدتك اليوم في فهم أدائك أو تحسين مستواك؟ ✨` 
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
    <div className={`
      ${embedded ? 'w-full h-full relative' : 'fixed bottom-24 right-6 w-[420px] h-[700px] z-[1000]'} 
      flex flex-col bg-[#F8FAFC] rounded-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.1)] 
      border border-white overflow-hidden animate-in fade-in zoom-in duration-300
    `}>
      {/* Header - Navy Dark */}
      <div className="bg-[#1E1B4B] p-8 text-white relative">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col items-end flex-1 pr-4">
            <h4 className="font-black text-2xl tracking-tight mb-1 text-right w-full">مُرشد إمتحاني PRO</h4>
            <div className="flex items-center gap-2 justify-end w-full">
              <span className="text-[12px] font-bold text-slate-400">المحرك الذكي نشط</span>
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></span>
            </div>
          </div>
          
          <div className="w-16 h-16 bg-[#2D2A5A] border-2 border-slate-600/30 rounded-2xl flex items-center justify-center shadow-lg">
             <div className="relative">
                <Bot size={36} className="text-white" strokeWidth={1.5} />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
             </div>
          </div>

          {!embedded && (
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute -top-4 -left-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar"
        dir="rtl"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-4`}>
            <div className={`
              max-w-[90%] p-6 rounded-[2rem] text-[15px] leading-relaxed shadow-sm
              ${m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-[#1E293B] rounded-tl-none border border-slate-100'}
            `}>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1.5">
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-2 flex flex-wrap gap-2 justify-center" dir="rtl">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(action.label)}
            className="px-4 py-2 bg-[#F1F5F9] text-indigo-600 rounded-full text-[13px] font-bold border border-white hover:bg-indigo-50 transition-colors shadow-sm"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-transparent">
        <div className="relative bg-white rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-2 flex items-center">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="تحدث مع مرشدك الأكاديمي..."
            className="flex-1 bg-transparent px-6 py-4 text-[15px] font-medium text-slate-600 outline-none placeholder:text-slate-300"
            dir="rtl"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-[#A5B4FC] text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .markdown-content strong { font-weight: 800; }
        .markdown-content p { margin: 0; }
      `}</style>
    </div>
  );

  if (embedded) return ChatWindow;

  return (
    <>
      {isOpen && ChatWindow}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 w-16 h-16 rounded-[1.8rem] shadow-[0_15px_35px_rgba(30,27,75,0.25)] 
          flex items-center justify-center z-[1001] transition-all duration-500
          ${isOpen 
            ? 'bg-white text-[#1E1B4B] rotate-90 scale-90' 
            : 'bg-[#1E1B4B] text-white hover:scale-110 hover:-translate-y-2'}
        `}
      >
        {isOpen ? <X size={28} /> : (
          <div className="relative group">
            <Bot size={34} strokeWidth={1.5} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-[3px] border-[#1E1B4B] rounded-full"></div>
          </div>
        )}
      </button>
    </>
  );
};

export default AIGuide;
