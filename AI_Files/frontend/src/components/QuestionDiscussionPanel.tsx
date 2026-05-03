
import React, { useState, useEffect, useRef } from 'react';
import { useQuestionDiscussion } from '../hooks/useQuestionDiscussion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  resultId: string;
  questionId: string;
  questionNumber: number;
  isOpen: boolean;
  onClose: () => void;
}



const QuestionDiscussionPanel: React.FC<Props> = ({ resultId, questionId, questionNumber, isOpen, onClose }) => {
  const { messages, loading, error, isExplained, fetchExplanation, sendMessage, resetError } = useQuestionDiscussion(resultId, questionId);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isExplained && !loading && !error) {
      fetchExplanation();
    }
  }, [isOpen, isExplained, loading, error, fetchExplanation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputValue.trim() || loading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="mt-8 animate-enter-up border-t-2 border-indigo-100 dark:border-indigo-900/50 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs animate-pulse">
            ✨
          </div>
          <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-400">مناقشة السؤال {questionNumber} مع الذكاء الاصطناعي</h3>
        </div>
        <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">إغلاق النقاش ×</button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[300px] max-h-[600px] shadow-inner">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!isExplained && loading && (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-500 animate-pulse">جاري تحليل السؤال وتوليد الشرح الأكاديمي...</p>
            </div>
          )}

          {error && (
            <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl text-center">
              <p className="text-rose-600 dark:text-rose-400 font-bold mb-4">{error}</p>
              <button 
                onClick={isExplained ? () => resetError() : fetchExplanation}
                className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-500/20 hover:scale-105 transition-transform"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] p-5 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm' 
                  : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/10'
              }`}>
                <style>{`
                  .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 900; margin-bottom: 0.5rem; color: currentColor; }
                  .markdown-content h3 { font-size: 1.1rem; }
                  .markdown-content p { margin-bottom: 0.75rem; }
                  .markdown-content ul { list-style-type: disc; margin-right: 1.5rem; margin-bottom: 0.75rem; }
                  .markdown-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: rgba(255,255,255,0.05); border-radius: 0.75rem; overflow: hidden; }
                  .markdown-content th, .markdown-content td { padding: 0.75rem; border: 1px solid rgba(255,255,255,0.1); text-align: right; }
                  .markdown-content th { background: rgba(255,255,255,0.1); }
                `}</style>
                <div className="markdown-content text-sm leading-[1.8] font-medium text-right" dir="rtl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اسأل سؤالاً إضافياً حول هذا الموضوع..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              disabled={loading || !isExplained}
            />
            <button
              onClick={handleSend}
              disabled={loading || !isExplained || !inputValue.trim()}
              className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all transition-transform"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-xl">←</span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-2 opacity-40 grayscale">
         <span className="text-[10px] font-black uppercase tracking-widest">AI Educator Contextual Mode</span>
         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
};

export default QuestionDiscussionPanel;
