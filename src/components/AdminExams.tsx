import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Edit3, 
  Trash2, 
  Globe, 
  Lock, 
  Tag, 
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  FileJson
} from 'lucide-react';

const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [examMeta, setExamMeta] = useState({
    title: '',
    description: '',
    grade: '',
    subject: '',
    difficulty: 'medium',
    timeLimit: 30,
    isPublic: true
  });

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const data = await api.adminGetAllExams();
      setExams(data);
    } catch (err) {
      console.error('Failed to load exams', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleParse = () => {
    // Basic MCQ Parser logic
    const questions: any[] = [];
    const blocks = rawText.split(/\d+\.\s/).filter(b => b.trim());
    
    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 3) return;

      const questionText = lines[0];
      const options: any[] = [];
      let correctAnswer = '';

      lines.slice(1).forEach(line => {
        const match = line.match(/^([A-D])\)\s*(.*)/i);
        if (match) {
          options.push({ id: match[1].toUpperCase(), text: match[2] });
        } else if (line.toLowerCase().startsWith('answer:')) {
          correctAnswer = line.split(':')[1].trim().toUpperCase();
        }
      });

      if (options.length > 0) {
        questions.push({
          id: idx + 1,
          question: questionText,
          options,
          correctAnswer: correctAnswer || options[0].id,
          explanation: ''
        });
      }
    });

    setParsedQuestions(questions);
    setIsParsing(false);
  };

  const handleSaveExam = async () => {
    if (!examMeta.title || parsedQuestions.length === 0) {
      alert('Please provide a title and at least one question.');
      return;
    }

    try {
      await api.saveExam({
        ...examMeta,
        examData: { questions: parsedQuestions },
        status: 'published'
      });
      setShowAddModal(false);
      setParsedQuestions([]);
      setRawText('');
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Failed to save exam');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam? This cannot be undone.')) return;
    try {
      await api.deleteExam(id);
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exam Inventory</h1>
          <p className="text-slate-500 font-medium">Manage public repository and curriculum assessments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Create New Exam
        </button>
      </div>

      {/* Exam List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${exam.is_public === 'TRUE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {exam.is_public === 'TRUE' ? <Globe size={24} /> : <Lock size={24} />}
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                <button 
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{exam.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{exam.description || 'No description provided.'}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{exam.subject}</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{exam.grade}</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full flex items-center gap-1">
                <Clock size={12} /> {exam.time_limit_minutes}m
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
              <span>{new Date(exam.created_at).toLocaleDateString()}</span>
              <span className="uppercase tracking-widest text-indigo-500">{exam.difficulty}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-2 rounded-xl text-white">
                  <FileJson size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create Public Exam</h2>
                  <p className="text-sm text-slate-500 font-medium">Define metadata and parse MCQ content</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Meta Data */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Exam Metadata</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Exam Title</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder="e.g. Final Anatomy Quiz"
                        value={examMeta.title}
                        onChange={(e) => setExamMeta({...examMeta, title: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Subject</label>
                        <input className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Biology" value={examMeta.subject} onChange={(e) => setExamMeta({...examMeta, subject: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Grade / Year</label>
                        <input className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Year 1" value={examMeta.grade} onChange={(e) => setExamMeta({...examMeta, grade: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Time Limit (mins)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" value={examMeta.timeLimit} onChange={(e) => setExamMeta({...examMeta, timeLimit: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Difficulty</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600" value={examMeta.difficulty} onChange={(e) => setExamMeta({...examMeta, difficulty: e.target.value})}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <Globe className="text-emerald-600" size={20} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-900">Publish to Repository</p>
                        <p className="text-xs text-emerald-600 font-medium">Make this exam visible to all students</p>
                      </div>
                      <input type="checkbox" checked={examMeta.isPublic} onChange={(e) => setExamMeta({...examMeta, isPublic: e.target.checked})} className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 border-none bg-white" />
                    </div>
                  </div>
                </div>

                {/* Parser */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Question Content</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500">PASTE TEXT BELOW (MCQ Format)</span>
                        <button 
                          onClick={handleParse}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors"
                        >
                          AUTO PARSE
                        </button>
                      </div>
                      <textarea 
                        className="w-full h-48 bg-transparent border-none focus:ring-0 text-slate-300 font-mono text-sm leading-relaxed resize-none"
                        placeholder="1. What is the powerhouse of the cell?&#10;A) Nucleus&#10;B) Mitochondria&#10;C) Ribosome&#10;D) Golgi&#10;Answer: B"
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                      />
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 min-h-[140px]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Parsed Result</span>
                        <span className="text-indigo-600 font-bold text-sm">{parsedQuestions.length} Questions</span>
                      </div>
                      <div className="space-y-3">
                        {parsedQuestions.slice(0, 3).map((q, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100 text-xs font-medium text-slate-600">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="truncate">{q.question}</span>
                          </div>
                        ))}
                        {parsedQuestions.length > 3 && <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">... and {parsedQuestions.length - 3} more</p>}
                        {parsedQuestions.length === 0 && (
                          <div className="flex flex-col items-center justify-center pt-4 text-slate-400 opacity-50">
                            <AlertCircle size={32} />
                            <p className="text-[10px] font-bold uppercase mt-2">No content parsed</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveExam}
                className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExams;
