import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { api } from '../lib/api';
import { 
  BookOpen, 
  Play, 
  Trash2, 
  Download, 
  Clock, 
  Plus,
  Loader2,
  Cloud,
  FileQuestion
} from 'lucide-react';

const MyExams: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMyExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadExams();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete exam.');
    }
  };

  const handleExport = (exam: any) => {
    const blob = new Blob([JSON.stringify(exam, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Loading your cloud library...</span></div>;

  return (
    <div className="my-exams-page animate-fade-in">
      <header className="page-header-alt">
        <div className="header-info">
          <h1>My Cloud Exams</h1>
          <p>Managed assessments and private study materials.</p>
        </div>
        <button className="header-action-btn" onClick={() => navigate('/dashboard/generate')}>
          <Plus size={20} />
          <span>New Exam</span>
        </button>
      </header>

      {exams.length > 0 ? (
        <div className="exams-responsive-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="exam-cloud-card">
              <div className="card-top">
                <div className="exam-type-icon">
                  <Cloud size={24} />
                </div>
                <div className="exam-main-info">
                  <h3 className="text-ellipsis">{exam.title}</h3>
                  <span className="q-count">{(exam.examData?.questions || exam.questions || []).length} Questions</span>
                </div>
              </div>
              
              <div className="card-mid">
                <div className="meta-row">
                  <Clock size={14} />
                  <span>{new Date(exam.createdAt || exam.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-start"
                  onClick={() => navigate(`/dashboard/exam/my/${exam.id}`)}
                >
                  <Play size={18} fill="currentColor" />
                  <span>Start</span>
                </button>
                <div className="btn-group">
                  <button onClick={() => handleExport(exam)} title="Export JSON">
                    <Download size={18} />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} title="Delete" className="btn-delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-box">
          <div className="empty-icon-wrap">
            <FileQuestion size={48} />
          </div>
          <h2>Your library is empty</h2>
          <p>You haven't generated any exams yet. Start by pasting some MCQs!</p>
          <button className="primary-button" onClick={() => navigate('/dashboard/generate')}>
            Generate First Exam
          </button>
        </div>
      )}

      <style>{`
        .my-exams-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .page-header-alt {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          background: var(--surface); padding: 1.5rem 2rem; border-radius: var(--radius-xl);
          border: 1px solid var(--border);
        }
        .header-info h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .header-info p { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
        
        .header-action-btn {
          background: var(--primary); color: white;
          padding: 0 1.25rem; height: 44px; border-radius: var(--radius-lg);
          display: flex; align-items: center; gap: 0.5rem; font-weight: 800;
        }

        .exams-responsive-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
          gap: 1.5rem;
        }

        .exam-cloud-card {
          background: var(--surface); padding: 1.5rem;
          border-radius: var(--radius-2xl); border: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 1.25rem;
          transition: all 0.2s;
        }
        .exam-cloud-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }

        .card-top { display: flex; align-items: center; gap: 1rem; }
        .exam-type-icon {
          width: 48px; height: 48px; background: var(--bg-soft); color: var(--text-soft);
          border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
        }
        .exam-main-info h3 { font-size: 1.1rem; color: var(--text-strong); }
        .q-count { font-size: 0.75rem; font-weight: 800; color: var(--primary); text-transform: uppercase; }

        .card-mid { flex: 1; display: flex; flex-direction: column; }
        .meta-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

        .card-actions {
          display: flex; align-items: center; gap: 0.75rem;
          padding-top: 1rem; border-top: 1px solid var(--border);
        }
        .btn-start {
          flex: 1; background: var(--primary-soft); color: var(--primary);
          height: 40px; border-radius: var(--radius-md); font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .btn-start:hover { background: var(--primary); color: white; }
        
        .btn-group { display: flex; gap: 0.5rem; }
        .btn-group button {
          width: 44px; height: 40px; border-radius: var(--radius-md);
          background: var(--bg-soft); color: var(--text-soft);
          display: flex; align-items: center; justify-content: center;
        }
        .btn-group button:hover { color: var(--primary); background: var(--surface); border: 1px solid var(--primary); }
        .btn-group .btn-delete:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }

        @media (max-width: 480px) {
          .card-actions { flex-direction: column; align-items: stretch; }
          .btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .btn-group button { width: 100%; height: 44px; }
          .btn-start { height: 44px; }
        }

        .empty-state-box {
          background: var(--surface); padding: 4rem 2rem; border-radius: var(--radius-2xl);
          border: 1px dashed var(--border-strong); text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        }
        .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: var(--bg-soft); color: var(--text-soft); display: flex; align-items: center; justify-content: center; }
        .empty-state-box h2 { font-size: 1.5rem; }
        .empty-state-box p { color: var(--text-muted); max-width: 400px; font-weight: 600; }
        .primary-button { background: var(--primary); color: white; padding: 0 2rem; height: 48px; border-radius: var(--radius-lg); font-weight: 800; }

        @media (max-width: 640px) {
          .page-header-alt { flex-direction: column; align-items: flex-start; padding: 1.25rem; }
          .header-action-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default MyExams;
