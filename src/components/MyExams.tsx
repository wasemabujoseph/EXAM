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
import { getQuestionCount, formatSafeDate } from '../utils/robustHelpers';

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
                  <span className="q-count">{getQuestionCount(exam)} Questions</span>
                </div>
              </div>
              
              <div className="card-mid">
                <div className="meta-row">
                  <Clock size={14} />
                  <span>{formatSafeDate(exam.createdAt || exam.date)}</span>
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
        .my-exams-page { display: flex; flex-direction: column; gap: 2rem; }

        .page-header-alt {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          background: var(--surface); padding: 2rem; border-radius: 2rem;
          border: 1px solid var(--border-soft);
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .header-info h1 { font-size: 1.75rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
        .header-info p { color: var(--text-muted); font-size: 0.95rem; font-weight: 600; }
        
        .header-action-btn {
          background: var(--primary); color: white;
          padding: 0 1.5rem; height: 48px; border-radius: 1rem;
          display: flex; align-items: center; gap: 0.75rem; font-weight: 800;
          box-shadow: 0 10px 15px -3px rgba(var(--primary-rgb), 0.3);
          transition: all 0.2s;
        }
        .header-action-btn:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(var(--primary-rgb), 0.4); }

        .exams-responsive-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
          gap: 1.5rem;
        }

        .exam-cloud-card {
          background: var(--surface); padding: 1.75rem;
          border-radius: 2rem; border: 1px solid var(--border-soft);
          display: flex; flex-direction: column; gap: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .exam-cloud-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: var(--primary-soft); }

        .card-top { display: flex; align-items: center; gap: 1.25rem; }
        .exam-type-icon {
          width: 56px; height: 56px; background: var(--bg-soft); color: var(--primary);
          border-radius: 1.25rem; display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }
        .exam-cloud-card:hover .exam-type-icon { background: var(--primary); color: white; transform: rotate(-5deg); }
        
        .exam-main-info h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-strong); margin-bottom: 0.25rem; }
        .q-count { font-size: 0.7rem; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; background: var(--primary-soft-fade); padding: 2px 8px; border-radius: 6px; }

        .card-mid { flex: 1; }
        .meta-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

        .card-actions {
          display: flex; align-items: center; gap: 1rem;
          padding-top: 1.25rem; border-top: 1px solid var(--border-soft);
        }
        .btn-start {
          flex: 1; background: var(--primary); color: white;
          height: 48px; border-radius: 1rem; font-weight: 900;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          transition: all 0.2s;
        }
        .btn-start:hover { transform: scale(1.02); }
        
        .btn-group { display: flex; gap: 0.75rem; }
        .btn-group button {
          width: 48px; height: 48px; border-radius: 1rem;
          background: var(--bg-soft); color: var(--text-soft);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .btn-group button:hover { color: var(--primary); background: var(--primary-soft-fade); }
        .btn-group .btn-delete:hover { color: var(--danger); background: var(--danger-soft-fade); }

        .empty-state-box {
          background: var(--surface); padding: 4rem 2rem; border-radius: 2.5rem;
          border: 1px dashed var(--border-strong); text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
        }
        .empty-icon-wrap { width: 80px; height: 80px; border-radius: 50%; background: var(--bg-soft); color: var(--text-soft); display: flex; align-items: center; justify-content: center; }
        .empty-state-box h2 { font-size: 1.5rem; font-weight: 800; }
        .empty-state-box p { color: var(--text-muted); max-width: 400px; font-weight: 600; }
        .primary-button { background: var(--primary); color: white; padding: 0 2.5rem; height: 52px; border-radius: 1rem; font-weight: 800; box-shadow: 0 10px 15px rgba(var(--primary-rgb), 0.2); }

        @media (max-width: 640px) {
          .page-header-alt { flex-direction: column; align-items: stretch; padding: 1.5rem; border-radius: 1.5rem; }
          .header-action-btn { width: 100%; justify-content: center; }
          .my-exams-page { gap: 1.5rem; }
          .exam-cloud-card { padding: 1.5rem; border-radius: 1.5rem; }
        }

        @media (max-width: 480px) {
          .card-actions { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .btn-group { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
          .btn-group button { width: 100%; }
          .exam-main-info h3 { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
};

export default MyExams;
