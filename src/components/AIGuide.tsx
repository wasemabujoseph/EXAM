import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, X, Sparkles } from 'lucide-react';

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
          content: `مرحباً **${userName || 'بك'}**! أنا مُرشدك الأكاديمي الذكي. يمكنني مساعدتك في شرح الدروس، تلخيص المفاهيم، أو التخطيط لجدولك الدراسي. كيف يمكنني دعمك اليوم؟ 🚀` 
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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = {
        pageTitle: document.title,
        pageUrl: window.location.href,
        apiKey: import.meta.env.VITE_OPENROUTER_API_KEY // Pass key from frontend if available
      };

      const result = await api.aiChat([...messages, userMsg], context);
      setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ عذراً، واجهت مشكلة في الاتصال. تأكد من إعداد مفتاح الـ API بشكل صحيح في ملف الـ .env.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const ChatWindow = (
    <div className={`
      ${embedded ? 'w-full h-full relative' : 'fixed bottom-24 right-6 w-[400px] h-[650px] z-[1000]'} 
      flex flex-col bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] 
      border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300
    `}>
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(circle,white_1px,transparent_1px)] [background-size:20px_20px] rotate-12"></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner group transition-transform hover:scale-110">
              <Sparkles className="text-yellow-300" size={24} />
            </div>
            <div>
              <h4 className="font-black text-lg tracking-tight">مُرشد إمتحاني AI</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">بروتوكول ذكاء نشط</span>
              </div>
            </div>
          </div>
          {!embedded && (
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar"
        dir="rtl"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
            <div className={`
              max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm
              ${m.role === 'user' 
                ? 'bg-white text-slate-700 rounded-tr-none border border-slate-100' 
                : 'bg-indigo-600 text-white rounded-tl-none font-medium'}
            `}>
              <div className="markdown-content prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end animate-pulse">
            <div className="bg-indigo-600/10 p-4 rounded-2xl rounded-tl-none border border-indigo-100 flex gap-1.5">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative group">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="اسألني أي شيء عن دراستك..."
            className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold transition-all outline-none pr-14 shadow-inner"
            dir="rtl"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute left-2 top-2 bottom-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-indigo-500/30"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
        <p className="text-[9px] text-center mt-3 text-slate-400 font-bold uppercase tracking-tighter">
          يعمل بواسطة GPT-120B • الإجابات قد تحتاج لمراجعة بشرية
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .markdown-content strong { font-weight: 900; color: inherit; }
        .markdown-content p { margin: 0; }
        .markdown-content ul { padding-right: 1.25rem; margin: 0.5rem 0; list-style-type: circle; }
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
          fixed bottom-6 right-6 w-16 h-16 rounded-[2rem] shadow-[0_10px_30px_rgba(79,70,229,0.4)] 
          flex items-center justify-center z-[1001] transition-all duration-500
          ${isOpen 
            ? 'bg-white text-indigo-600 rotate-90 scale-90' 
            : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white hover:scale-110 hover:-translate-y-2'}
        `}
      >
        {isOpen ? <X size={28} /> : (
          <div className="relative group">
            <Bot size={32} strokeWidth={2.5} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-4 border-white rounded-full animate-pulse shadow-sm"></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-24 right-0 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none translate-y-4 group-hover:translate-y-0">
              <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-slate-900 rotate-45"></div>
              مُرشدك الذكي PRO نشط الآن
            </div>
          </div>
        )}
      </button>
    </>
  );
};

export default AIGuide;
