import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';
import { 
  ChevronLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  Loader2,
  Sparkles,
  RotateCcw,
  Send,
  StopCircle,
  Trash2,
  MessageSquare,
  X,
  ListX,
  Repeat
} from 'lucide-react';

interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIChatState {
  isOpen: boolean;
  isStreaming: boolean;
  error: string | null;
  messages: AIChatMessage[];
  inputValue: string;
}

const ReviewAttempt: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');
  
  // Per-question AI chat state
  const [aiChats, setAiChats] = useState<Record<number, AIChatState>>({});
  const abortControllers = useRef<Record<number, AbortController>>({});

  useEffect(() => {
    const loadAttempt = async () => {
      setIsLoading(true);
      try {
        if (attemptId) {
          const data = await api.getAttemptReview(attemptId);
          setAttempt(data);
        }
      } catch (err) {
        console.error('Failed to load attempt review', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttempt();
    
    // Cleanup abort controllers on unmount
    return () => {
      Object.values(abortControllers.current).forEach(ac => ac.abort());
    };
  }, [attemptId]);

  const handleAIStream = async (q: any, index: number, userAns: string[], userMsg?: string) => {
    const isInitial = !userMsg;
    
    // Initialize or update state
    setAiChats(prev => ({
      ...prev,
      [index]: {
        isOpen: true,
        isStreaming: true,
        error: null,
        messages: isInitial 
          ? [{ role: 'assistant', content: '' }] 
          : [...(prev[index]?.messages || []), { role: 'user', content: userMsg }, { role: 'assistant', content: '' }],
        inputValue: ''
      }
    }));

    // Setup AbortController
    if (abortControllers.current[index]) abortControllers.current[index].abort();
    const ac = new AbortController();
    abortControllers.current[index] = ac;

    try {
      const qAnswers = q.answers || q.correct_answers || (q.correctAnswer ? [q.correctAnswer] : []) || (typeof q.answer !== 'undefined' ? [q.options[q.answer]?.id || q.answer] : []);
      
      const payload = {
        question: q.text || q.question || '',
        options: q.options || [],
        correctAnswer: Array.isArray(qAnswers) ? qAnswers.join(',') : String(qAnswers),
        selectedAnswer: userAns.join(','),
        examTitle: attempt?.examTitle,
        chatHistory: isInitial ? [] : aiChats[index]?.messages || [],
        userMessage: userMsg || '',
        mode: isInitial ? 'initial' : 'followup'
      };

      const response = await fetch('/api/ai-insight-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ac.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        setAiChats(prev => {
          const chat = prev[index];
          if (!chat) return prev;
          const newMessages = [...chat.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = fullContent;
          }
          return { ...prev, [index]: { ...chat, messages: newMessages } };
        });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Streaming Error:', err);
      setAiChats(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          isStreaming: false,
          error: 'AI Insight could not load. Please try again.'
        }
      }));
    } finally {
      setAiChats(prev => ({
        ...prev,
        [index]: { ...prev[index], isStreaming: false }
      }));
      delete abortControllers.current[index];
    }
  };

  const handleStopStreaming = (index: number) => {
    if (abortControllers.current[index]) {
      abortControllers.current[index].abort();
    }
  };

  const handleClearChat = (index: number) => {
    setAiChats(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const handleSendMessage = (q: any, index: number, userAns: string[]) => {
    const chat = aiChats[index];
    if (!chat || !chat.inputValue.trim() || chat.isStreaming) return;
    handleAIStream(q, index, userAns, chat.inputValue.trim());
  };

  // Robust answer detection helpers
  const getCorrectAnswer = (q: any): string[] => {
    if (!q) return [];
    const possibleFields = [
      q.answers, 
      q.correct_answers, 
      q.correctAnswer, 
      q.correct_answer, 
      q.correct, 
      q.answer
    ];
    
    for (const field of possibleFields) {
      if (field !== undefined && field !== null) {
        if (Array.isArray(field)) return field.map(String);
        if (typeof field === 'string') return field.split(',').map(s => s.trim());
        if (typeof field === 'number') {
          // If it's a number, it might be an index in q.options
          if (q.options && q.options[field]) return [String(q.options[field].id)];
          return [String(field)];
        }
      }
    }
    return [];
  };

  const getSelectedAnswer = (q: any, index: number, att: any): string[] => {
    if (!att || !att.answers) return [];
    
    // Try by index first
    let ans = att.answers[index];
    
    // Try by question ID if index didn't work
    if ((ans === undefined || ans === null) && q?.id) {
      ans = att.answers[q.id];
    }

    if (ans === undefined || ans === null) return [];
    if (Array.isArray(ans)) return ans.map(String);
    if (typeof ans === 'string') return ans.split(',').map(s => s.trim());
    return [String(ans)];
  };

  const isQuestionCorrect = (q: any, index: number, att: any): boolean => {
    const selected = getSelectedAnswer(q, index, att);
    const correct = getCorrectAnswer(q);
    
    if (selected.length === 0) return false; // No answer selected is wrong
    if (selected.length !== correct.length) return false;
    
    const sortedSelected = [...selected].sort();
    const sortedCorrect = [...correct].sort();
    
    return sortedSelected.every((val, i) => val === sortedCorrect[i]);
  };

  const getWrongQuestions = (att: any) => {
    if (!att) return [];
    const qs = att.questionsSnapshot || att.questions || [];
    return qs.filter((q: any, i: number) => !isQuestionCorrect(q, i, att));
  };

  const renderChatBox = (q: any, index: number, userAns: string[]) => {
    const chat = aiChats[index];
    if (!chat || !chat.isOpen) return null;

    return (
      <div className="ai-chat-box animate-slide-up">
        <div className="chat-header">
          <div className="chat-header-info">
            <Sparkles size={16} className="text-primary" />
            <span>AI Insight Chat</span>
          </div>
          <div className="chat-header-actions">
            <button className="chat-clear-btn" onClick={() => handleClearChat(index)} title="Clear Chat">
              <Trash2 size={16} />
            </button>
            <button className="chat-close-btn" onClick={() => setAiChats(prev => ({ ...prev, [index]: { ...prev[index], isOpen: false } }))}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {chat.messages.map((msg, midx) => (
            <div key={midx} className={`chat-message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === 'assistant' ? <Sparkles size={14} /> : <MessageSquare size={14} />}
              </div>
              <div className="message-content markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content || (chat.isStreaming && midx === chat.messages.length - 1 ? '...' : '')}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {chat.error && (
            <div className="chat-error-msg">
              <AlertCircle size={16} />
              <span>{chat.error}</span>
              <button onClick={() => handleAIStream(q, index, userAns)} className="retry-btn">Retry</button>
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder="Ask about this question..."
            value={chat.inputValue}
            onChange={(e) => setAiChats(prev => ({ ...prev, [index]: { ...prev[index], inputValue: e.target.value } }))}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(q, index, userAns)}
            disabled={chat.isStreaming}
          />
          {chat.isStreaming ? (
            <button className="chat-stop-btn" onClick={() => handleStopStreaming(index)}>
              <StopCircle size={20} />
            </button>
          ) : (
            <button className="chat-send-btn" onClick={() => handleSendMessage(q, index, userAns)} disabled={!chat.inputValue.trim()}>
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleRedoFull = () => {
    const qs = attempt.questionsSnapshot || attempt.questions || [];
    navigate(`/dashboard/exam/cloud/${attempt.examId}`, { 
      state: { 
        redoMode: 'full',
        exam: { id: attempt.examId, title: attempt.examTitle, questions: qs } 
      } 
    });
  };

  const handleRedoWrong = () => {
    const wrongQs = getWrongQuestions(attempt);
    if (wrongQs.length === 0) return;
    
    navigate(`/dashboard/exam/cloud/${attempt.examId}`, { 
      state: { 
        redoMode: 'wrong-only',
        wrongQuestions: wrongQs,
        exam: { id: attempt.examId, title: attempt.examTitle } 
      } 
    });
  };

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Loading performance report...</span></div>;
  if (!attempt) return <div className="page-error"><AlertCircle size={48} /> <h2>Review data not found</h2><Link to="/dashboard/history">Return to Completed Exams</Link></div>;

  const questions = attempt.questionsSnapshot || attempt.questions || [];
  const wrongQuestions = getWrongQuestions(attempt);
  
  // Calculate stats robustly
  const totalQs = questions.length || attempt.totalQuestions || attempt.total || 0;
  const correctCount = questions.reduce((acc: number, q: any, i: number) => acc + (isQuestionCorrect(q, i, attempt) ? 1 : 0), 0);
  const calculatedPercent = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;
  
  const scorePercent = !isNaN(attempt.percent) ? attempt.percent : calculatedPercent;
  const timeSpentMin = attempt.durationSeconds ? Math.round(attempt.durationSeconds / 60) : (attempt.timeMs ? Math.round(attempt.timeMs / 1000 / 60) : null);

  const filteredQuestions = reviewFilter === 'wrong' ? questions.filter((q: any, i: number) => !isQuestionCorrect(q, i, attempt)) : questions;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "Attempt date unavailable";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Attempt date unavailable";
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="review-page animate-fade-in">
      <header className="review-header">
        <Link to="/dashboard/history" className="back-link-nav">
          <ChevronLeft size={20} /> Back to Completed Exams
        </Link>
        <div className="review-title-section">
          <h1>{attempt.examTitle}</h1>
          <p>Attempted on {formatDate(attempt.createdAt || attempt.date)}</p>
        </div>

        <div className="review-stats-summary">
          <div className="summary-card">
            <div className="summary-icon score"><TrendingUp size={20} /></div>
            <div className="summary-val">
              <span className="val-main">{scorePercent}%</span>
              <span className="val-label">Accuracy</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon qcount"><CheckCircle size={20} /></div>
            <div className="summary-val">
              <span className="val-main">{correctCount}/{totalQs}</span>
              <span className="val-label">Correct</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon time"><Clock size={20} /></div>
            <div className="summary-val">
              <span className="val-main">{timeSpentMin !== null ? `${timeSpentMin}m` : 'Not recorded'}</span>
              <span className="val-label">Duration</span>
            </div>
          </div>
        </div>

        <div className="review-actions-container">
           <div className="review-actions">
              <button className="btn-action-redo-full" onClick={handleRedoFull} title="Redo the entire exam from scratch">
                <RotateCcw size={18} /> 
                <span>Redo Full</span>
              </button>
              
              <button 
                className={`btn-action-review-wrong ${reviewFilter === 'wrong' ? 'active' : ''}`} 
                onClick={() => setReviewFilter(reviewFilter === 'wrong' ? 'all' : 'wrong')}
                disabled={wrongQuestions.length === 0}
                title={wrongQuestions.length === 0 ? "No wrong answers to review" : "Filter to see only incorrect answers"}
              >
                {reviewFilter === 'wrong' ? <ListX size={18} /> : <AlertCircle size={18} />}
                <span>{reviewFilter === 'wrong' ? 'Show All Questions' : `Review Wrong Answers (${wrongQuestions.length})`}</span>
              </button>
              
              <button 
                className="btn-action-redo-wrong" 
                onClick={handleRedoWrong}
                disabled={wrongQuestions.length === 0}
                title={wrongQuestions.length === 0 ? "No wrong answers to redo" : "Start a new exam with only these mistakes"}
              >
                <Repeat size={18} /> 
                <span>Redo Wrongs Only ({wrongQuestions.length})</span>
              </button>
           </div>
        </div>
      </header>

      {reviewFilter === 'wrong' && (
        <div className="filter-badge-row">
          <div className="filter-badge">
            <AlertCircle size={14} />
            Showing Wrong Answers Only
            <button onClick={() => setReviewFilter('all')} className="clear-filter-x"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="review-list-stack">
        {filteredQuestions.length === 0 && reviewFilter === 'wrong' ? (
          <div className="empty-wrong-state">
            <CheckCircle size={48} className="text-success" />
            <h3>Great job!</h3>
            <p>You did not miss any questions in this attempt.</p>
            <button className="btn-action-outline" onClick={() => setReviewFilter('all')}>Show All Questions</button>
          </div>
        ) : filteredQuestions.map((q: any, index: number) => {
          // Find original index for question numbering if filtered
          const originalIndex = questions.indexOf(q);
          const userAns = getSelectedAnswer(q, originalIndex, attempt);
          const qAnswers = getCorrectAnswer(q);
          const isCorrect = isQuestionCorrect(q, originalIndex, attempt);
          const chat = aiChats[originalIndex];

          return (
            <div key={index} className={`review-q-card ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="review-q-header">
                <div className="q-status-badge">
                  {isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  <span>Question {originalIndex + 1}</span>
                </div>
                <button 
                  className={`ai-btn ${chat?.messages.length > 0 ? 'has-data' : ''} ${chat?.isStreaming ? 'is-loading' : ''}`}
                  onClick={() => chat?.isOpen ? setAiChats(prev => ({ ...prev, [originalIndex]: { ...prev[originalIndex], isOpen: false } })) : handleAIStream(q, originalIndex, userAns)}
                  disabled={chat?.isStreaming}
                >
                  {chat?.isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>{chat?.isStreaming ? 'Generating...' : (chat?.isOpen ? 'Close Insight' : (chat?.messages.length > 0 ? 'AI Insight Ready' : 'AI Insight'))}</span>
                </button>
              </div>

              <div className="review-q-body">
                <p className="q-text-large text-wrap-safe">{q.text}</p>
                
                <div className="review-options-list">
                  {q.options.map((opt: any) => {
                    const isUserChoice = userAns.includes(opt.id);
                    const isCorrectChoice = Array.isArray(qAnswers) ? qAnswers.includes(opt.id) : qAnswers === opt.id;
                    
                    let state = '';
                    if (isCorrectChoice) state = 'correct';
                    else if (isUserChoice) state = 'wrong';

                    return (
                      <div key={opt.id} className={`review-opt-item ${state}`}>
                        <span className="opt-marker">{opt.id}</span>
                        <span className="opt-text">{opt.text}</span>
                        <div className="opt-icon-wrap">
                           {isCorrectChoice && <CheckCircle size={18} />}
                           {isUserChoice && !isCorrectChoice && <XCircle size={18} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {renderChatBox(q, originalIndex, userAns)}

                {(!chat?.isOpen && (chat?.messages.length > 0 || q.explanation)) && (
                  <div className="explanation-area">
                    <div className="exp-header">
                       <HelpCircle size={16} /> 
                       <span>{chat?.messages.length > 0 ? 'AI Detailed Explanation' : 'Explanation'}</span>
                    </div>
                    <div className="exp-content markdown-body" dir="auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {(chat?.messages[0]?.role === 'assistant' ? chat.messages[0].content : null) || q.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .review-page { display: flex; flex-direction: column; gap: 3rem; }

        .review-header {
          background: var(--surface); padding: 2.5rem; border-radius: var(--radius-2xl);
          border: 1px solid var(--border); box-shadow: var(--shadow-premium);
          display: flex; flex-direction: column; gap: 2rem;
        }

        .back-link-nav { display: flex; align-items: center; gap: 0.5rem; color: var(--text-soft); font-weight: 700; font-size: 0.9rem; text-decoration: none; }
        .back-link-nav:hover { color: var(--primary); }

        .review-title-section h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
        .review-title-section p { color: var(--text-muted); font-weight: 600; }

        .review-stats-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .summary-card {
          background: var(--bg-soft); padding: 1.25rem; border-radius: var(--radius-xl);
          display: flex; align-items: center; gap: 1rem; border: 1px solid var(--border);
        }
        .summary-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .summary-icon.score { background: var(--primary-soft); color: var(--primary); }
        .summary-icon.qcount { background: var(--success-soft); color: var(--success); }
        .summary-icon.time { background: var(--accent-soft); color: var(--accent); }
        .summary-val { display: flex; flex-direction: column; }
        .val-main { font-size: 1.25rem; font-weight: 900; color: var(--text-strong); }
        .val-label { font-size: 0.7rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; }

        .review-actions-container { display: flex; width: 100%; }
        .review-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; width: 100%; }
        
        .btn-action-redo-full { 
          flex: 1; min-width: 140px; background: var(--surface); color: var(--text-strong); 
          border: 2px solid var(--border); height: 48px; border-radius: var(--radius-lg); 
          font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          transition: all 0.2s;
        }
        .btn-action-redo-full:hover { border-color: var(--primary); color: var(--primary); }

        .btn-action-review-wrong { 
          flex: 1; min-width: 220px; background: var(--warning-soft); color: var(--warning-text); 
          border: 1px solid var(--warning); height: 48px; border-radius: var(--radius-lg); 
          font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          transition: all 0.2s;
        }
        .btn-action-review-wrong:hover:not(:disabled) { background: var(--warning); color: white; }
        .btn-action-review-wrong.active { background: var(--primary); color: white; border-color: var(--primary); }
        .btn-action-review-wrong:disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-soft); color: var(--text-muted); border-color: var(--border); }

        .btn-action-redo-wrong { 
          flex: 1; min-width: 220px; background: var(--primary-soft); color: var(--primary); 
          border: 1px solid var(--primary); height: 48px; border-radius: var(--radius-lg); 
          font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          transition: all 0.2s;
        }
        .btn-action-redo-wrong:hover:not(:disabled) { background: var(--primary); color: white; }
        .btn-action-redo-wrong:disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-soft); color: var(--text-muted); border-color: var(--border); }

        .filter-badge-row { margin-bottom: -1rem; display: flex; }
        .filter-badge {
          background: var(--primary-soft); color: var(--primary); padding: 0.5rem 1rem;
          border-radius: 99px; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;
          border: 1px solid var(--primary);
        }
        .clear-filter-x { background: transparent; color: var(--primary); padding: 2px; border-radius: 50%; display: flex; }
        .clear-filter-x:hover { background: var(--primary); color: white; }

        .empty-wrong-state {
          background: var(--surface); border-radius: var(--radius-2xl); border: 1px solid var(--border);
          padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center;
        }
        .empty-wrong-state h3 { font-size: 1.5rem; font-weight: 800; }
        .empty-wrong-state p { color: var(--text-soft); font-weight: 600; }
        .btn-action-outline { margin-top: 1rem; padding: 0.75rem 2rem; border-radius: var(--radius-lg); border: 2px solid var(--primary); color: var(--primary); font-weight: 800; background: transparent; }

        .text-success { color: var(--success); }

        .review-list-stack { display: flex; flex-direction: column; gap: 2rem; }
        .review-q-card {
          background: var(--surface); border-radius: var(--radius-2xl);
          border: 1px solid var(--border); overflow: hidden;
          display: flex; flex-direction: column;
        }
        .review-q-card.is-correct { border-left: 8px solid var(--success); }
        .review-q-card.is-wrong { border-left: 8px solid var(--danger); }

        .review-q-header {
          padding: 1.5rem 2rem; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .q-status-badge { display: flex; align-items: center; gap: 1rem; font-weight: 800; color: var(--text-soft); }
        .is-correct .q-status-badge { color: var(--success); }
        .is-wrong .q-status-badge { color: var(--danger); }

        .ai-btn {
          background: var(--primary-soft); color: var(--primary);
          padding: 0 1.25rem; height: 38px; border-radius: 99px;
          display: flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 0.85rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer; border: 1px solid transparent;
        }
        .ai-btn:hover:not(:disabled) { background: var(--primary); color: white; transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .ai-btn.has-data { background: var(--success-soft); color: var(--success); border-color: var(--success); }
        .ai-btn.has-data:hover:not(:disabled) { background: var(--success); color: white; }
        .ai-btn.is-loading { opacity: 0.8; cursor: wait; }

        .review-q-body { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        .q-text-large { font-size: 1.25rem; font-weight: 700; color: var(--text-strong); line-height: 1.5; }

        .review-options-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .review-opt-item {
          display: flex; align-items: center; gap: 1.25rem;
          padding: 1rem 1.5rem; border-radius: var(--radius-xl);
          background: var(--bg-soft); border: 1px solid var(--border);
        }
        .review-opt-item.correct { background: var(--success-soft); border-color: var(--success); color: var(--success-text); }
        .review-opt-item.wrong { background: var(--danger-soft); border-color: var(--danger); color: var(--danger-text); }

        .opt-marker {
          width: 28px; height: 28px; flex-shrink: 0;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.8rem;
        }
        .review-opt-item.correct .opt-marker { background: var(--success); color: white; border-color: var(--success); }
        .review-opt-item.wrong .opt-marker { background: var(--danger); color: white; border-color: var(--danger); }
        
        .opt-text { flex: 1; font-weight: 600; }
        .opt-icon-wrap { width: 24px; display: flex; justify-content: flex-end; }

        .explanation-area {
          background: var(--bg-soft); padding: 1.5rem; border-radius: var(--radius-xl);
          border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1rem;
        }
        .exp-header { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; color: var(--primary); font-size: 0.85rem; text-transform: uppercase; }
        .exp-content { font-size: 0.95rem; color: var(--text-main); line-height: 1.7; }

        /* AI Chat Box Styles */
        .ai-chat-box {
          background: var(--surface-muted); border: 1px solid var(--border);
          border-radius: var(--radius-xl); margin-top: 1.5rem; overflow: hidden;
          display: flex; flex-direction: column; box-shadow: var(--shadow-sm);
        }
        .chat-header {
          padding: 0.75rem 1.25rem; background: var(--surface); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .chat-header-info { display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 0.85rem; }
        .chat-header-actions { display: flex; gap: 0.5rem; }
        .chat-header-actions button { background: transparent; color: var(--text-soft); }
        .chat-header-actions button:hover { color: var(--primary); }
        .chat-close-btn:hover { color: var(--danger) !important; }

        .chat-messages {
          max-height: 400px; overflow-y: auto; padding: 1.25rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .chat-message { display: flex; gap: 1rem; align-items: flex-start; }
        .message-icon { 
          width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .chat-message.assistant .message-icon { background: var(--primary-soft); color: var(--primary); }
        .chat-message.user .message-icon { background: var(--accent-soft); color: var(--accent); }
        
        .message-content { flex: 1; font-size: 0.95rem; line-height: 1.6; }
        
        .chat-error-msg {
          padding: 1rem; background: var(--danger-soft); color: var(--danger);
          border-radius: var(--radius-lg); font-weight: 700; font-size: 0.85rem;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .retry-btn { text-decoration: underline; background: transparent; color: var(--danger); font-weight: 800; }

        .chat-input-area {
          padding: 1rem 1.25rem; background: var(--surface); border-top: 1px solid var(--border);
          display: flex; gap: 0.75rem; align-items: center;
        }
        .chat-input-area input {
          flex: 1; height: 40px; background: var(--bg-soft); border: 1px solid var(--border);
          padding: 0 1rem; border-radius: 99px; font-size: 0.9rem;
        }
        .chat-send-btn { color: var(--primary); background: transparent; }
        .chat-send-btn:disabled { color: var(--text-muted); opacity: 0.5; }
        .chat-stop-btn { color: var(--danger); background: transparent; }

        @media (max-width: 768px) {
          .review-header { padding: 1.25rem; gap: 1.25rem; }
          .review-stats-summary { grid-template-columns: 1fr; gap: 0.75rem; }
          .review-actions { flex-direction: column; }
          .review-actions button { width: 100%; height: 44px; font-size: 0.9rem; }
          .review-q-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .ai-btn { width: 100%; justify-content: center; }
          .review-q-body { padding: 1.25rem; }
          .q-text-large { font-size: 1.1rem; }
          .chat-messages { max-height: 300px; }
        }
      `}</style>
    </div>
  );
};

export default ReviewAttempt;
