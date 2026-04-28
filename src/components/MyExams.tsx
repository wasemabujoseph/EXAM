import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { 
  BookOpen, 
  Play, 
  Trash2, 
  Download, 
  Clock, 
  Plus,
  Search,
  FileJson
} from 'lucide-react';

const MyExams: React.FC = () => {
  const { vault, updateVault } = useVault();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (!vault || !confirm('Are you sure you want to delete this exam?')) return;
    
    const newVault = {
      ...vault,
      myExams: vault.myExams.filter(e => e.id !== id)
    };
    await updateVault(newVault);
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

  const myExams = vault?.myExams || [];

  return (
    <div className="my-exams-container animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">My Private Exams</h1>
        <p className="page-subtitle">Encrypted exams saved on this device</p>
        <button className="add-btn" onClick={() => navigate('/dashboard/generate')}>
          <Plus size={20} />
          Create New Exam
        </button>
      </header>

      {myExams.length > 0 ? (
        <div className="exams-grid">
          {myExams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="exam-card-head">
                <div className="exam-icon">
                  <FileJson size={24} />
                </div>
                <div className="exam-info">
                  <h3>{exam.title}</h3>
                  <p>{exam.questions.length} Questions</p>
                </div>
              </div>
              
              <div className="exam-card-body">
                <div className="meta-item">
                  <Clock size={14} />
                  <span>Added: {new Date(exam.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="exam-card-actions">
                <button 
                  className="action-btn start"
                  onClick={() => navigate(`/dashboard/exam/my/${exam.id}`)}
                  title="Start Exam"
                >
                  <Play size={18} />
                  Start
                </button>
                <button 
                  className="action-btn"
                  onClick={() => handleExport(exam)}
                  title="Export JSON"
                >
                  <Download size={18} />
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDelete(exam.id)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <BookOpen size={64} />
          <h2>No private exams yet</h2>
          <p>Generate your first exam from pasted text or import a JSON file.</p>
          <button className="primary-btn" onClick={() => navigate('/dashboard/generate')}>
            <Plus size={20} />
            Generate Now
          </button>
        </div>
      )}

      <style>{`
        .my-exams-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .page-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
        }
        .add-btn {
          position: absolute;
          right: 0;
          top: 0;
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-btn:hover { background: var(--primary-hover); transform: translateY(-1px); }

        .exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .exam-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.2s;
        }
        .exam-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
        .exam-card-head {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .exam-icon {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .exam-info h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .exam-info p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .exam-card-body {
          flex: 1;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .exam-card-actions {
          display: flex;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .action-btn {
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover { background: #f8fafc; color: var(--primary); border-color: var(--primary); }
        .action-btn.start {
          flex: 1;
          width: auto;
          background: var(--primary-light);
          color: var(--primary);
          border: none;
          font-weight: 700;
          gap: 0.5rem;
        }
        .action-btn.start:hover { background: var(--primary); color: white; }
        .action-btn.delete:hover { color: var(--danger); border-color: var(--danger); }

        .empty-state {
          padding: 5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          color: #94a3b8;
        }
        .primary-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default MyExams;
