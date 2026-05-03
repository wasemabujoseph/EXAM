import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        { role: 'assistant', content: `مرحباً ${userName || 'بك'}! أنا مرشدك الأكاديمي الذكي. كيف يمكنني مساعدتك اليوم في فهم أدائك أو تحسين مستواك؟ ✨` }
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
    const assistantMsg: Message = { role: 'assistant', content: '' };
    
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    try {
      let fullText = '';
      const context = {
        pageTitle: document.title,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString()
      };

      await aiApi.streamChat([...messages, userMsg], (chunk) => {
        fullText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullText };
          return updated;
        });
      }, { context });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'عذراً، واجهت مشكلة في الاتصال بالمحرك الذكي. حاول مجدداً لاحقاً.' };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const ChatWindow = (
    <div className={`${embedded ? 'w-full h-[600px]' : 'w-[420px] h-[650px] max-w-[calc(100vw-40px)]'} bg-white dark:bg-slate-900 rounded-[3rem] flex flex-col overflow-hidden animate-enter shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 relative`}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-brand-600/5 pointer-events-none" />
      
      {/* Header */}
      <div className="p-8 bg-indigo-luxury text-white flex items-center justify-between relative shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-lg border border-white/20">🤖</div>
          <div>
            <h4 className="font-black text-lg tracking-tight">مُرشد إمتحاني PRO</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">المحرك الذكي نشط</span>
            </div>
          </div>
        </div>
        {!embedded && (
          <button onClick={() => setIsOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center text-xl active:scale-95 border border-white/10">✕</button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 chat-scroll relative z-10">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-enter`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-medium leading-[1.8] shadow-sm relative ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 rounded-tl-none'
            }`}>
              <style>{`
                .chat-markdown h1, .chat-markdown h2, .chat-markdown h3 { font-weight: 900; margin-bottom: 0.5rem; color: currentColor; }
                .chat-markdown h3 { font-size: 1.1rem; }
                .chat-markdown p { margin-bottom: 0.75rem; }
                .chat-markdown ul { list-style-type: disc; margin-right: 1.5rem; margin-bottom: 0.75rem; }
                .chat-markdown table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: rgba(0,0,0,0.03); border-radius: 0.75rem; overflow: hidden; font-size: 0.75rem; }
                .chat-markdown th, .chat-markdown td { padding: 0.5rem; border: 1px solid rgba(0,0,0,0.05); text-align: right; }
                .chat-markdown th { background: rgba(0,0,0,0.05); }
              `}</style>
              <div className="chat-markdown" dir="rtl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end animate-pulse">
            <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-[1.5rem] rounded-tl-none flex gap-2">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i*200}ms` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-8 pb-4 flex flex-wrap gap-3 relative z-10">
          {[
            "ما هي نقاط قوتي؟",
            "كيف أحسن درجتي؟",
            "حلل أدائي"
          ].map(q => (
            <button 
              key={q} 
              onClick={() => { setInput(q); }}
              className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-8 bg-slate-50/80 dark:bg-[#0a0a0c]/80 border-t border-slate-100 dark:border-slate-800 relative z-10">
        <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="تحدث مع مرشدك الأكاديمي..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-800 dark:text-white placeholder:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20 active:scale-90 transition-all disabled:opacity-50 hover:bg-indigo-700"
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) return ChatWindow;

  return (
    <div className="fixed bottom-10 right-10 z-[1000] flex flex-col items-end gap-5" dir="rtl">
      {/* Chat Window */}
      {isOpen && ChatWindow}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 rounded-[2.5rem] bg-indigo-luxury text-white flex items-center justify-center text-4xl shadow-2xl shadow-indigo-600/30 hover:scale-110 active:scale-90 transition-all relative group animate-float border-2 border-white/10"
      >
        <div className="absolute inset-0 rounded-[2.5rem] bg-white animate-ping opacity-0 group-hover:opacity-10 transition-opacity"></div>
        {isOpen ? '✕' : (
          <div className="relative">
             🤖
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-indigo-600 rounded-full" />
          </div>
        )}
      </button>
    </div>
  );
};

export default AIGuide;
