import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { 
  FilePlus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Presentation, 
  FileCode,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Copy,
  FolderOpen,
  X,
  Loader2,
  Plus,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { formatSafeDate } from '../utils/robustHelpers';
import { getAcademicYears, getSubjectsByYear } from '../utils/curriculumHelpers';

const AdminMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    year: '',
    subject: '',
    type: 'pdf',
    tags: '',
    isVisibleToStudents: true,
    isProtected: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await api.listMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('This file is too large for direct upload. Please upload a smaller file or compress it.');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      setSelectedFile(file);
      setUploadError(null);

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'pdf' }));
      else if (['ppt', 'pptx'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'presentation', isProtected: false }));
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'image', isProtected: false }));
      else if (['json'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'exam', isProtected: true }));
      else setUploadForm(f => ({ ...f, type: 'pdf', isProtected: false }));

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file.');
      return;
    }
    if (!uploadForm.title || !uploadForm.subject) {
      setUploadError('Please fill in all required fields.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadWarnings([]);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const materialData = {
            ...uploadForm,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileBase64: base64,
            tags: uploadForm.tags.split(',').map(t => t.trim()).filter(t => t)
          };

          const timer = setInterval(() => {
            setUploadProgress(prev => prev < 90 ? prev + 10 : prev);
          }, 500);

          const response = await api.uploadMaterial(materialData);
          clearInterval(timer);
          setUploadProgress(100);
          
          if (response.warnings && response.warnings.length > 0) {
            setUploadWarnings(response.warnings);
          }
          
          loadMaterials();
          
          setTimeout(() => {
            if (!response.warnings || response.warnings.length === 0) {
              setShowUploadModal(false);
              resetUploadForm();
            }
            setIsUploading(false);
          }, 1500);
        } catch (err: any) {
          console.error('Upload failed', err);
          let errorMsg = 'Upload failed. Please try again.';
          if (err.message?.includes('DriveApp') || err.message?.includes('წვდომა უარყოფილია')) {
            errorMsg = 'Google Drive upload partially failed. Please check Drive sharing permissions or run Materials Sync.';
          } else if (err.message) {
            errorMsg = err.message;
          }
          setUploadError(errorMsg);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    }
  };

  const handleSyncFromDrive = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await api.syncMaterialsFromDrive();
      setSyncResult(result);
      loadMaterials();
    } catch (err: any) {
      console.error('Sync failed', err);
      alert('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      year: '',
      subject: '',
      type: 'pdf',
      tags: '',
      isVisibleToStudents: true,
      isProtected: false
    });
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setUploadWarnings([]);
    setUploadProgress(0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      await api.deleteMaterial(id);
      loadMaterials();
    } catch (err) {
      console.error('Failed to delete material', err);
    }
  };

  const toggleVisibility = async (material: any) => {
    try {
      await api.updateMaterialMetadata(material.id, { 
        isVisibleToStudents: material.isVisibleToStudents === 'TRUE' ? false : true 
      });
      loadMaterials();
    } catch (err) {
      console.error('Failed to update visibility', err);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-red-500" />;
      case 'presentation': return <Presentation size={20} className="text-orange-500" />;
      case 'image': return <ImageIcon size={20} className="text-blue-500" />;
      case 'exam': return <FileCode size={20} className="text-purple-500" />;
      default: return <FilePlus size={20} />;
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'All' || m.year.toString() === filterYear;
    const matchesType = filterType === 'All' || m.type === filterType;
    return matchesSearch && matchesYear && matchesType;
  });

  if (isLoading && materials.length === 0) {
    return <div className="page-loading"><Loader2 className="animate-spin" /> <span>Loading materials library...</span></div>;
  }

  return (
    <div className="admin-materials-page animate-fade-in">
      <header className="admin-header">
        <div className="header-left">
          <h1>Materials Library</h1>
          <p>Manage cloud-hosted learning resources for students.</p>
        </div>
        <div className="header-actions">
          <button className="sync-btn" onClick={() => setShowSyncModal(true)} disabled={isLoading || isSyncing}>
            {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            <span>Sync from Drive</span>
          </button>
          <button className="add-btn" onClick={() => setShowUploadModal(true)}>
            <Plus size={20} />
            <span>Add Material</span>
          </button>
        </div>
      </header>

      <div className="materials-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by title or subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={14} />
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="All">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
              <option value="6">Year 6</option>
            </select>
          </div>
          <div className="filter-item">
            <Filter size={14} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="pdf">PDFs</option>
              <option value="presentation">PowerPoints</option>
              <option value="image">Images</option>
              <option value="exam">Exam JSON</option>
            </select>
          </div>
        </div>
      </div>

      <div className="materials-grid">
        {filteredMaterials.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={48} />
            <h3>No materials found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredMaterials.map((m) => (
            <div key={m.id} className="material-admin-card">
              <div className="card-top">
                <div className="type-badge">
                  {getIcon(m.type)}
                  <span>{m.type.toUpperCase()}</span>
                </div>
                <div className="visibility-status">
                  {m.isVisibleToStudents === 'TRUE' ? (
                    <span className="status-badge visible"><Check size={12} /> Student Visible</span>
                  ) : (
                    <span className="status-badge hidden"><EyeOff size={12} /> Hidden</span>
                  )
                  }
                  {(m.isProtected === 'TRUE' || m.isProtected === true) && (
                    <span className="status-badge protected"><ShieldCheck size={12} /> Protected</span>
                  )}
                </div>
              </div>
              
              <div className="card-body">
                <h3 className="material-title">{m.title}</h3>
                <div className="material-meta">
                  <span>Year {m.year}</span>
                  <span className="separator">•</span>
                  <span>{m.subject}</span>
                </div>
                <div className="file-info">
                  <small>{m.sizeBytes ? (m.sizeBytes / 1024 / 1024).toFixed(2) : '0.00'} MB</small>
                  <small>{formatSafeDate(m.uploadedAt)}</small>
                </div>
              </div>

              <div className="card-actions">
                <a href={m.previewUrl} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Preview">
                  <Eye size={18} />
                </a>
                <a href={m.downloadUrl} className="icon-btn" title="Download">
                  <Check size={18} />
                </a>
                <button className="icon-btn" onClick={() => copyLink(m.previewUrl)} title="Copy Link">
                  <Copy size={18} />
                </button>
                <button className={`icon-btn ${m.isVisibleToStudents === 'TRUE' ? 'active' : ''}`} onClick={() => toggleVisibility(m)} title="Toggle Visibility">
                  {m.isVisibleToStudents === 'TRUE' ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button className="icon-btn delete" onClick={() => handleDelete(m.id)} title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay">
          <div className="upload-modal animate-pop-in">
            <div className="modal-header">
              <h2>Upload New Material</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}><X /></button>
            </div>

            <form onSubmit={handleUpload} className="upload-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g. Anatomy Lower Limb PDF" />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year *</label>
                    <select 
                      required
                      value={uploadForm.year} 
                      onChange={e => setUploadForm({...uploadForm, year: e.target.value, subject: ''})}
                    >
                      <option value="">Select Year...</option>
                      {getAcademicYears().map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <select 
                      required
                      disabled={!uploadForm.year}
                      value={uploadForm.subject} 
                      onChange={e => setUploadForm({...uploadForm, subject: e.target.value})}
                    >
                      <option value="">{uploadForm.year ? 'Select Subject...' : 'Choose Year First'}</option>
                      {getSubjectsByYear(uploadForm.year).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="Other / Custom">Other / Custom</option>
                    </select>
                  </div>
                </div>

                {uploadForm.subject === 'Other / Custom' && (
                  <div className="form-group">
                    <label>Custom Subject Name *</label>
                    <input 
                      type="text" 
                      required 
                      onChange={e => setUploadForm({...uploadForm, subject: e.target.value})} 
                      placeholder="Enter custom subject name..."
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Material Type</label>
                    <select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})}>
                      <option value="pdf">PDF Document</option>
                      <option value="presentation">PowerPoint / Slides</option>
                      <option value="image">Image / Diagram</option>
                      <option value="exam">Exam JSON</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={uploadForm.tags} 
                      onChange={e => setUploadForm({...uploadForm, tags: e.target.value})} 
                      placeholder="anatomy, bone, exam"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={uploadForm.description} 
                    onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                    placeholder="Brief details about this material..."
                    rows={2}
                  />
                </div>
                
                <div className="toggles-grid">
                  <label className="toggle-item">
                    <input 
                      type="checkbox" 
                      checked={uploadForm.isVisibleToStudents} 
                      onChange={e => setUploadForm({...uploadForm, isVisibleToStudents: e.target.checked})} 
                    />
                    <div className="toggle-txt">
                      <strong>Visible to Students</strong>
                      <span>Allow students to see this material.</span>
                    </div>
                  </label>
                  <label className="toggle-item">
                    <input 
                      type="checkbox" 
                      checked={uploadForm.isProtected} 
                      onChange={e => setUploadForm({...uploadForm, isProtected: e.target.checked})} 
                    />
                    <div className="toggle-txt">
                      <strong>Protected Content</strong>
                      <span>Enable watermark and disable copy/print.</span>
                    </div>
                  </label>
                </div>

                <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()}>
                  <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.json" />
                  {selectedFile ? (
                    <div className="file-selected">
                      <div className="file-icon-large">{getIcon(uploadForm.type)}</div>
                      <div className="file-info-text">
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <Upload size={32} />
                      <p>Click to select a file</p>
                      <span>Max size: 10MB</span>
                    </div>
                  )}
                </div>

                {uploadWarnings.length > 0 && (
                  <div className="upload-warning-msg">
                    <AlertTriangle size={24} className="shrink-0" />
                    <div>
                      <strong>Upload Complete with Warnings:</strong>
                      <ul>{uploadWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="upload-error">
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="modal-footer">
                <div className="admin-info-note">
                  <ShieldAlert size={18} className="shrink-0" />
                  <p><strong>Note:</strong> Protected mode discourages copying and leaking by adding personalized watermarks and browser-level restrictions. It cannot fully prevent photos taken with another device.</p>
                </div>
                <div className="footer-btns">
                  <button type="button" className="secondary-button" onClick={() => setShowUploadModal(false)}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={isUploading || !selectedFile || !uploadForm.year || !uploadForm.subject}>
                    {isUploading ? <><Loader2 className="animate-spin" size={18} /> {uploadProgress}%</> : 'Start Upload'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="modal-overlay">
          <div className="upload-modal sync-modal animate-pop-in">
            <div className="modal-header">
              <h2>Sync From Drive</h2>
              <button className="close-btn" onClick={() => setShowSyncModal(false)}><X /></button>
            </div>
            <div className="sync-body">
              {!syncResult ? (
                <div className="sync-prompt">
                  <div className="sync-icon-box"><RefreshCw size={40} /></div>
                  <h3>Full Library Sync</h3>
                  <p>This will scan your connected Google Drive folder, update titles, subjects, and sync any missing files to the system.</p>
                  <button className="run-sync-btn" onClick={handleSyncFromDrive} disabled={isSyncing}>
                    {isSyncing ? 'Syncing...' : 'Run Full Sync'}
                  </button>
                </div>
              ) : (
                <div className="sync-results">
                  <div className="success-icon-box"><Check size={40} /></div>
                  <h3>Sync Finished</h3>
                  <div className="stats-grid">
                    <div className="stat-item"><span className="stat-val">{syncResult.added}</span><span className="stat-lbl">Added</span></div>
                    <div className="stat-item"><span className="stat-val">{syncResult.updated}</span><span className="stat-lbl">Updated</span></div>
                    <div className="stat-item errors"><span className="stat-val">{syncResult.errors?.length || 0}</span><span className="stat-lbl">Errors</span></div>
                  </div>
                  {syncResult.errors?.length > 0 && (
                    <div className="error-log">
                      <h4>Error Logs:</h4>
                      <ul>{syncResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                  <button className="run-sync-btn" onClick={() => setShowSyncModal(false)}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-materials-page { display: flex; flex-direction: column; gap: 2rem; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; }
        .header-left h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 0.5rem; }
        .header-left p { color: var(--text-muted); font-weight: 600; }
        
        .materials-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; background: var(--surface); padding: 1rem 1.5rem; border-radius: var(--radius-xl); border: 1px solid var(--border); }
        .header-actions { display: flex; gap: 1rem; }
        .add-btn, .sync-btn { 
          display: flex; align-items: center; gap: 0.5rem; 
          height: 44px; padding: 0 1.25rem; border-radius: 10px; 
          font-weight: 800; transition: all 0.2s; 
        }
        .add-btn { background: var(--primary); color: white; }
        .add-btn:hover { background: var(--primary-dark); transform: translateY(-2px); }
        .sync-btn { background: var(--bg-soft); color: var(--text-soft); border: 1px solid var(--border); }
        .sync-btn:hover { background: var(--border); color: var(--text-strong); }
        .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: var(--bg-soft-fade); padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid var(--border-soft); }
        .search-box input { background: transparent; border: none; outline: none; width: 100%; color: var(--text-strong); font-weight: 600; }
        
        .filter-group { display: flex; gap: 1rem; }
        .filter-item { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-soft-fade); padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid var(--border-soft); }
        .filter-item select { background: transparent; border: none; outline: none; color: var(--text-strong); font-weight: 700; cursor: pointer; }

        .materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        
        .material-admin-card { background: var(--surface); border-radius: var(--radius-xl); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
        .material-admin-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
        
        .card-top { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-soft); }
        .type-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.05em; }
        
        .status-badge { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
        .status-badge.visible { background: var(--success-soft); color: var(--success); }
        .status-badge.hidden { background: var(--bg-soft-fade); color: var(--text-muted); }
        .status-badge.protected { background: #fff1f2; color: #e11d48; border: 1px solid #fda4af; }

        .card-body { padding: 1.25rem; flex: 1; }
        .material-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-strong); }
        .material-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-soft); font-weight: 700; margin-bottom: 1rem; }
        .separator { opacity: 0.3; }
        .file-info { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.75rem; font-weight: 600; }

        .card-actions { padding: 1rem 1.25rem; background: var(--bg-soft-fade); border-top: 1px solid var(--border-soft); display: flex; gap: 0.5rem; }
        .icon-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); color: var(--text-soft); transition: all 0.2s; }
        .icon-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-soft); }
        .icon-btn.delete:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }
        .icon-btn.active { color: var(--primary); border-color: var(--primary); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
        .upload-modal { background: var(--surface); width: 100%; max-width: 600px; border-radius: var(--radius-2xl); border: 1px solid var(--border); overflow: hidden; max-height: 90vh; display: flex; flex-direction: column; }
        
        .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { font-size: 1.25rem; font-weight: 800; }
        .close-btn { background: transparent; border: none; color: var(--text-soft); cursor: pointer; }

        .upload-form { padding: 2rem; overflow-y: auto; }
        .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 800; color: var(--text-soft); }
        .form-group input, .form-group textarea { background: var(--bg-soft-fade); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 12px; color: var(--text-strong); font-weight: 600; outline: none; }
        .form-group select { 
          width: 100%; height: 48px; background: var(--bg-soft-fade); 
          border: 1px solid var(--border-soft); border-radius: 10px; 
          padding: 0 1rem; color: var(--text-strong); font-weight: 600; 
        }
        .form-group select:disabled { opacity: 0.5; }
        .form-group input:focus { border-color: var(--primary); }
        .form-group textarea { min-height: 80px; resize: vertical; }

        .file-upload-zone { border: 2px dashed var(--border); border-radius: 16px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; background: var(--bg-soft-fade); margin-top: 1rem; }
        .file-upload-zone:hover { border-color: var(--primary); background: var(--primary-soft); }
        
        .toggles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .toggle-item { 
          display: flex; gap: 1rem; padding: 1rem; 
          background: var(--bg-soft-fade); border: 1px solid var(--border-soft); 
          border-radius: 12px; cursor: pointer; transition: all 0.2s; 
        }
        .toggle-item:hover { background: var(--bg-soft); border-color: var(--primary); }
        .toggle-txt { display: flex; flex-direction: column; }
        .toggle-txt strong { font-size: 0.85rem; color: var(--text-strong); }
        .toggle-txt span { font-size: 0.7rem; color: var(--text-muted); }
        .toggle-item input { width: 18px; height: 18px; margin-top: 2px; cursor: pointer; }

        .upload-prompt { text-align: center; color: var(--text-soft); }
        .upload-prompt p { font-weight: 800; margin: 1rem 0 0.25rem; color: var(--text-strong); }
        .upload-prompt span { font-size: 0.75rem; }

        .file-selected { width: 100%; display: flex; align-items: center; gap: 1.5rem; }
        .file-icon-large { width: 64px; height: 64px; background: var(--surface); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
        .file-info-text { flex: 1; display: flex; flex-direction: column; }
        .file-info-text strong { color: var(--text-strong); font-size: 0.95rem; }
        .file-info-text span { color: var(--text-muted); font-size: 0.8rem; }
        .modal-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; }

        .empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; color: var(--text-muted); text-align: center; }
        .empty-state h3 { margin: 1.5rem 0 0.5rem; color: var(--text-soft); }

        @media (max-width: 768px) {
          .materials-toolbar { flex-direction: column; align-items: stretch; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminMaterials;
