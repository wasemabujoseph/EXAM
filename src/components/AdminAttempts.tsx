import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Search, 
  User, 
  ExternalLink,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatSafeDate } from '../utils/robustHelpers';

const AdminAttempts: React.FC = () => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const data = await api.adminGetAllAttempts();
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load attempts', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttempts();
  }, []);

  const filteredAttempts = attempts.filter(a => 
    a.username.toLowerCase().includes(search.toLowerCase()) || 
    a.exam_id.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Syncing submission logs...</span></div>;

  return (
    <div className="admin-attempts-page animate-fade-in">
      <header className="admin-view-header">
        <div className="header-txt">
          <h1>Attempt Audit</h1>
          <p>Global monitoring of all student submissions and score distributions.</p>
        </div>
      </header>

      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by student name or exam ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-attempts-list-container">
        {/* Desktop Table */}
        <div className="admin-table-responsive">
          <table className="admin-table-premium">
            <thead>
              <tr>
                <th>Student & Exam</th>
                <th>Performance</th>
                <th>Session Mode</th>
                <th>Timestamp</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="student-profile-mini">
                      <User size={16} className="text-soft" />
                      <div className="student-meta">
                        <span className="student-name">{a.username}</span>
                        <span className="exam-id-tag">{a.exam_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="score-stack">
                      <span className={`score-pct ${parseInt(a.percentage || 0) >= 60 ? 'pass' : 'fail'}`}>{a.percentage || 0}%</span>
                      <span className="score-raw">{a.score || 0}/{a.total_questions || 0} Qs</span>
                    </div>
                  </td>
                  <td>
                    <span className={`mode-pill ${a.mode === 'retry_wrong' ? 'is-retry' : 'is-normal'}`}>
                      {a.mode || 'standard'}
                    </span>
                  </td>
                  <td>
                    <div className="time-stack">
                       <span>{formatSafeDate(a.created_at || a.createdAt)}</span>
                       <small>{a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</small>
                    </div>
                  </td>
                  <td className="text-right">
                    <Link to={`/dashboard/review/${a.id}`} className="btn-audit-review">
                       <ExternalLink size={16} />
                       <span>Review</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stack */}
        <div className="admin-attempts-mobile-stack">
           {filteredAttempts.map((a) => (
             <div key={a.id} className="attempt-mobile-card">
                <div className="card-header-row">
                   <div className="student-box">
                      <User size={14} />
                      <strong>{a.username}</strong>
                   </div>
                   <span className={`score-pct-small ${parseInt(a.percentage || 0) >= 60 ? 'pass' : 'fail'}`}>{a.percentage || 0}%</span>
                </div>
                <div className="card-body-row">
                   <div className="exam-detail">
                      <span className="label">Exam ID</span>
                      <span className="value">{a.exam_id}</span>
                   </div>
                   <div className="exam-detail">
                      <span className="label">Mode</span>
                      <span className="value capitalize">{a.mode || 'standard'}</span>
                   </div>
                </div>
                <div className="card-footer-row">
                   <div className="time-info"><Calendar size={12} /> {formatSafeDate(a.created_at || a.createdAt)}</div>
                   <Link to={`/dashboard/review/${a.id}`} className="btn-mob-review">View Session</Link>
                </div>
             </div>
           ))}
        </div>
      </div>

      <style>{`
        .admin-attempts-page { display: flex; flex-direction: column; gap: 2.5rem; }

        .admin-search-wrap { position: relative; display: flex; align-items: center; max-width: 600px; }
        .admin-search-wrap svg { position: absolute; left: 1rem; color: var(--text-soft); }
        .admin-search-wrap input { width: 100%; height: 48px; padding: 0 1rem 0 3rem; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text-strong); font-weight: 700; }

        .admin-table-premium { width: 100%; border-collapse: separate; border-spacing: 0; }
        .admin-table-premium th { padding: 1rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; border-bottom: 2px solid var(--border); }
        .admin-table-premium td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-soft); vertical-align: middle; }

        .student-profile-mini { display: flex; align-items: center; gap: 0.75rem; }
        .student-meta { display: flex; flex-direction: column; }
        .student-name { font-weight: 800; color: var(--text-strong); }
        .exam-id-tag { font-size: 0.65rem; color: var(--text-muted); font-family: monospace; }

        .score-stack { display: flex; flex-direction: column; }
        .score-pct { font-size: 1.1rem; font-weight: 900; }
        .score-pct.pass { color: var(--success); }
        .score-pct.fail { color: var(--danger); }
        .score-raw { font-size: 0.7rem; font-weight: 800; color: var(--text-soft); }

        .mode-pill { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
        .mode-pill.is-retry { background: var(--warning-soft); color: var(--warning); }
        .mode-pill.is-normal { background: var(--bg-soft); color: var(--text-soft); }

        .time-stack { display: flex; flex-direction: column; font-size: 0.8rem; font-weight: 700; color: var(--text-soft); }
        .time-stack small { font-size: 0.7rem; color: var(--text-muted); }

        .btn-audit-review { display: flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 800; font-size: 0.85rem; text-decoration: none; }
        .btn-audit-review:hover { text-decoration: underline; }

        .admin-attempts-mobile-stack { display: none; flex-direction: column; gap: 1rem; }
        .attempt-mobile-card { background: var(--surface); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem; }
        .card-header-row { display: flex; justify-content: space-between; align-items: center; }
        .student-box { display: flex; align-items: center; gap: 0.5rem; color: var(--text-strong); }
        .score-pct-small { font-weight: 900; font-size: 1rem; }
        .score-pct-small.pass { color: var(--success); }
        .score-pct-small.fail { color: var(--danger); }
        
        .card-body-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .exam-detail { display: flex; flex-direction: column; gap: 2px; }
        .exam-detail .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .exam-detail .value { font-size: 0.8rem; font-weight: 700; color: var(--text-soft); }

        .card-footer-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-soft); padding-top: 1rem; }
        .time-info { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
        .btn-mob-review { color: var(--primary); font-weight: 800; font-size: 0.85rem; text-decoration: none; }

        @media (max-width: 768px) {
          .admin-table-responsive { display: none; }
          .admin-attempts-mobile-stack { display: flex; }
        }
      `}</style>
    </div>
  );
};

export default AdminAttempts;
