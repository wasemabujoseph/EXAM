import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ShieldAlert,
  Settings,
  MoreVertical,
  Download
} from 'lucide-react';
import { formatSafeDate } from '../utils/robustHelpers';
import { getAcademicYears, getSubjectsByYear, normalizeAcademicYear } from '../utils/curriculumHelpers';

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
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Upload/Edit form state
  const [form, setForm] = useState({
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
  const [isReplacingFile, setIsReplacingFile] = useState(false);
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
        setUploadError('This file is too large ( > 10MB). Please compress it first.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);

      // Auto-detect type if not editing existing
      if (!editingMaterial) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext!)) setForm(f => ({ ...f, type: 'pdf' }));
        else if (['ppt', 'pptx'].includes(ext!)) setForm(f => ({ ...f, type: 'presentation' }));
        else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext!)) setForm(f => ({ ...f, type: 'image' }));
        else if (['json'].includes(ext!)) setForm(f => ({ ...f, type: 'exam', isProtected: true }));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file.');
      return;
    }
    if (!form.title || !form.year || !form.subject) {
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
            ...form,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileBase64: base64,
            tags: form.tags.split(',').map(t => t.trim()).filter(t => t)
          };

          const response = await api.uploadMaterial(materialData);
          setUploadProgress(100);
          
          if (response.warnings && response.warnings.length > 0) {
            setUploadWarnings(response.warnings);
          } else {
            setShowUploadModal(false);
            resetForm();
          }
          loadMaterials();
        } catch (err: any) {
          setUploadError(err.message || 'Upload failed.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    }
  };

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    
    setIsUploading(true);
    setUploadError(null);
    try {
      const updates = {
        title: form.title,
        description: form.description,
        year: form.year,
        subject: form.subject,
        type: form.type,
        tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
        isVisibleToStudents: form.isVisibleToStudents,
        isProtected: form.isProtected
      };
      
      await api.updateMaterialMetadata(editingMaterial.id, updates);
      
      // Handle file replacement if selected
      if (selectedFile && isReplacingFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await api.replaceMaterialFile({
            id: editingMaterial.id,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileBase64: base64
          });
          loadMaterials();
          setEditingMaterial(null);
          setIsReplacingFile(false);
          setIsUploading(false);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        loadMaterials();
        setEditingMaterial(null);
        setIsUploading(false);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Update failed.');
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
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
    setEditingMaterial(null);
    setIsReplacingFile(false);
    setUploadError(null);
    setUploadWarnings([]);
    setUploadProgress(0);
  };

  const handleEditClick = (m: any) => {
    setEditingMaterial(m);
    setForm({
      title: m.title,
      description: m.description || '',
      year: normalizeAcademicYear(m.year),
      subject: m.subject,
      type: m.type,
      tags: Array.isArray(m.tags) ? m.tags.join(', ') : '',
      isVisibleToStudents: m.isVisibleToStudents === 'TRUE' || m.isVisibleToStudents === true,
      isProtected: m.isProtected === 'TRUE' || m.isProtected === true
    });
    setIsReplacingFile(false);
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material? This will also remove the file from Google Drive.')) return;
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
    const matchesYear = filterYear === 'All' || normalizeAcademicYear(m.year) === filterYear;
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
          <p>Manage medical learning resources and practice exams.</p>
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
            placeholder="Search materials..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={14} />
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="All">All Years</option>
              {getAcademicYears().map(y => <option key={y} value={y}>{y}</option>)}
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
                    <span className="status-badge visible"><Check size={12} /> Visible</span>
                  ) : (
                    <span className="status-badge hidden"><EyeOff size={12} /> Hidden</span>
                  )}
                  {(m.isProtected === 'TRUE' || m.isProtected === true) && (
                    <span className="status-badge protected"><ShieldCheck size={12} /></span>
                  )}
                </div>
              </div>
              
              <div className="card-body">
                <h3 className="material-title">{m.title}</h3>
                <div className="material-meta">
                  <span className="year-pill">{m.year}</span>
                  <span className="subject-pill">{m.subject}</span>
                </div>
                <div className="file-info">
                  <small>{m.sizeBytes ? (m.sizeBytes / 1024 / 1024).toFixed(2) : '0.00'} MB</small>
                  <small>{formatSafeDate(m.uploadedAt)}</small>
                </div>
              </div>

              <div className="card-actions">
                <button className="icon-btn" onClick={() => handleEditClick(m)} title="Edit Settings">
                  <Settings size={18} />
                </button>
                <Link to={`/dashboard/materials/view/${m.id}`} className="icon-btn" title="View internally">
                  <Eye size={18} />
                </Link>
                <button className="icon-btn" onClick={() => window.open(m.driveUrl, '_blank')} title="Open in Drive">
                  <ExternalLink size={18} />
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

      {/* Upload/Edit Modal */}
      {(showUploadModal || editingMaterial) && (
        <div className="modal-overlay">
          <div className="upload-modal animate-pop-in">
            <div className="modal-header">
              <h2>{editingMaterial ? 'Edit Material Settings' : 'Upload New Material'}</h2>
              <button className="close-btn" onClick={resetForm}><X /></button>
            </div>

            <form onSubmit={editingMaterial ? handleUpdateMetadata : handleUpload} className="upload-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year *</label>
                    <select required value={form.year} onChange={e => setForm({...form, year: e.target.value, subject: ''})}>
                      <option value="">Select Year...</option>
                      {getAcademicYears().map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <select required disabled={!form.year} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                      <option value="">Choose Year First</option>
                      {getSubjectsByYear(form.year).map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="Custom">Other / Custom</option>
                    </select>
                  </div>
                </div>

                {form.subject === 'Custom' && (
                  <div className="form-group">
                    <label>Custom Subject Name *</label>
                    <input type="text" required onChange={e => setForm({...form, subject: e.target.value})} placeholder="Enter subject name..." />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Material Type</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="pdf">PDF Document</option>
                      <option value="presentation">PowerPoint / Slides</option>
                      <option value="image">Image / Diagram</option>
                      <option value="exam">Exam JSON</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tags (optional)</label>
                    <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="anatomy, basic, year5" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} />
                </div>
                
                <div className="toggles-grid">
                  <label className="toggle-item">
                    <input type="checkbox" checked={form.isVisibleToStudents} onChange={e => setForm({...form, isVisibleToStudents: e.target.checked})} />
                    <div className="toggle-txt"><strong>Visible to Students</strong><span>Shown in student library.</span></div>
                  </label>
                  <label className="toggle-item">
                    <input type="checkbox" checked={form.isProtected} onChange={e => setForm({...form, isProtected: e.target.checked})} />
                    <div className="toggle-txt"><strong>Protected Content</strong><span>Watermark + Disable Copy.</span></div>
                  </label>
                </div>

                {/* File Upload / Replace section */}
                {(!editingMaterial || isReplacingFile) ? (
                  <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
                    {selectedFile ? (
                      <div className="file-selected">
                        <Check size={24} className="text-success" />
                        <div className="file-info-text">
                          <strong>{selectedFile.name}</strong>
                          <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-prompt">
                        <Upload size={32} />
                        <p>{isReplacingFile ? 'Select replacement file' : 'Click to select file'}</p>
                        <span>Max 10MB</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="replace-file-banner">
                    <div className="banner-left">
                      <FileText size={20} />
                      <div className="banner-txt">
                        <strong>Current File</strong>
                        <span>{editingMaterial.originalFilename || 'Stored in Drive'}</span>
                      </div>
                    </div>
                    <button type="button" className="replace-btn" onClick={() => setIsReplacingFile(true)}>
                      Replace File
                    </button>
                  </div>
                )}

                {uploadWarnings.length > 0 && (
                  <div className="upload-warning-msg">
                    <AlertTriangle size={18} />
                    <div><strong>Note:</strong> {uploadWarnings[0]}</div>
                  </div>
                )}
              </div>

              {uploadError && <div className="upload-error"><AlertCircle size={14} /><span>{uploadError}</span></div>}

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>
                <button type="submit" className="primary-button" disabled={isUploading}>
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : (editingMaterial ? 'Save Changes' : 'Start Upload')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="modal-overlay">
          <div className="upload-modal sync-modal animate-pop-in">
            <div className="modal-header">
              <h2>Library Sync</h2>
              <button className="close-btn" onClick={() => setShowSyncModal(false)}><X /></button>
            </div>
            <div className="sync-body">
              {!syncResult ? (
                <div className="sync-prompt">
                  <RefreshCw size={40} className={isSyncing ? 'animate-spin' : ''} />
                  <p>Scan your Google Drive folder for new files and update database metadata.</p>
                  <button className="run-sync-btn" onClick={async () => {
                    setIsSyncing(true);
                    const res = await api.syncMaterialsFromDrive();
                    setSyncResult(res);
                    setIsSyncing(false);
                    loadMaterials();
                  }} disabled={isSyncing}>
                    {isSyncing ? 'Syncing...' : 'Start Full Sync'}
                  </button>
                </div>
              ) : (
                <div className="sync-results">
                  <Check size={40} className="text-success" />
                  <h3>Sync Finished</h3>
                  <div className="stats-grid">
                    <div><strong>{syncResult.added}</strong><span>Added</span></div>
                    <div><strong>{syncResult.skipped}</strong><span>Skipped</span></div>
                  </div>
                  <button className="run-sync-btn" onClick={() => { setSyncResult(null); setShowSyncModal(false); }}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-materials-page { display: flex; flex-direction: column; gap: 2rem; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; }
        .header-left h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; }
        .header-left p { color: var(--text-muted); font-weight: 600; }
        .header-actions { display: flex; gap: 1rem; }
        
        .add-btn, .sync-btn { 
          display: flex; align-items: center; gap: 0.5rem; 
          height: 48px; padding: 0 1.5rem; border-radius: 12px; font-weight: 800; 
        }
        .add-btn { background: var(--primary); color: white; }
        .sync-btn { background: var(--bg-soft); border: 1px solid var(--border); color: var(--text-soft); }

        .materials-toolbar { 
          display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; 
          background: var(--surface); padding: 1rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); 
        }
        .search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: var(--bg-soft-fade); padding: 0.6rem 1.25rem; border-radius: 99px; }
        .search-box input { background: transparent; border: none; outline: none; width: 100%; color: var(--text-strong); font-weight: 600; }
        
        .filter-group { display: flex; gap: 1rem; }
        .filter-item { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-soft-fade); padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid var(--border-soft); }
        .filter-item select { background: transparent; border: none; outline: none; color: var(--text-strong); font-weight: 700; }

        .materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .material-admin-card { background: var(--surface); border-radius: 1.5rem; border: 1px solid var(--border); transition: all 0.2s; }
        .material-admin-card:hover { transform: translateY(-4px); border-color: var(--primary); }
        
        .card-top { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-soft); }
        .type-badge { display: flex; align-items: center; gap: 0.5rem; font-size: 0.65rem; font-weight: 900; color: var(--text-muted); }
        .visibility-status { display: flex; gap: 0.5rem; }
        .status-badge { font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
        .status-badge.visible { background: var(--success-soft); color: var(--success); }
        .status-badge.hidden { background: var(--bg-soft); color: var(--text-muted); }
        .status-badge.protected { background: #fff1f2; color: #e11d48; border: 1px solid #fda4af; }

        .card-body { padding: 1.5rem; }
        .material-title { font-size: 1.15rem; font-weight: 800; color: var(--text-strong); margin-bottom: 0.75rem; }
        .material-meta { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .year-pill, .subject-pill { font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 99px; background: var(--bg-soft); color: var(--text-soft); }

        .card-actions { padding: 1rem 1.5rem; background: var(--bg-soft-fade); border-top: 1px solid var(--border-soft); display: flex; gap: 0.5rem; }
        .icon-btn { width: 38px; height: 38px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); color: var(--text-soft); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .icon-btn:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-soft); }
        .icon-btn.delete:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 20000; padding: 2rem; }
        .upload-modal { background: var(--surface); width: 100%; max-width: 650px; border-radius: 2rem; display: flex; flex-direction: column; max-height: 90vh; }
        .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .upload-form { padding: 2rem; overflow-y: auto; }
        .form-grid { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group label { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; display: block; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.8rem 1.25rem; border-radius: 12px; background: var(--bg-soft-fade); border: 1px solid var(--border); color: var(--text-strong); font-weight: 600; }
        
        .toggles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .toggle-item { display: flex; gap: 1rem; padding: 1rem; background: var(--bg-soft-fade); border-radius: 12px; border: 1px solid var(--border-soft); cursor: pointer; }
        .toggle-txt strong { font-size: 0.85rem; color: var(--text-strong); display: block; }
        .toggle-txt span { font-size: 0.7rem; color: var(--text-muted); }

        .file-upload-zone { border: 2px dashed var(--border); border-radius: 16px; padding: 2.5rem; text-align: center; background: var(--bg-soft-fade); cursor: pointer; transition: all 0.2s; }
        .file-upload-zone:hover { border-color: var(--primary); background: var(--primary-soft); }
        .upload-prompt p { font-weight: 800; margin: 0.5rem 0; color: var(--text-strong); }
        .file-selected { display: flex; align-items: center; gap: 1rem; text-align: left; }

        .replace-file-banner { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: var(--bg-soft); border-radius: 12px; border: 1px solid var(--border-soft); }
        .banner-left { display: flex; align-items: center; gap: 1rem; }
        .banner-txt strong { font-size: 0.85rem; color: var(--text-strong); display: block; }
        .banner-txt span { font-size: 0.75rem; color: var(--text-muted); }
        .replace-btn { font-size: 0.75rem; font-weight: 800; color: var(--primary); padding: 6px 12px; border-radius: 6px; background: var(--primary-soft); }

        .modal-footer { padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; }
        .primary-button { background: var(--primary); color: white; padding: 0 2rem; height: 48px; border-radius: 12px; font-weight: 800; }
        .secondary-button { background: var(--bg-soft); color: var(--text-soft); padding: 0 1.5rem; height: 48px; border-radius: 12px; font-weight: 800; }

        .sync-body { padding: 3rem; text-align: center; }
        .sync-prompt { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .run-sync-btn { background: var(--primary); color: white; padding: 0.75rem 2rem; border-radius: 12px; font-weight: 800; margin-top: 1.5rem; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0; }
        .stats-grid div { background: var(--bg-soft); padding: 1.5rem; border-radius: 12px; }
        .stats-grid strong { font-size: 2rem; display: block; color: var(--text-strong); }
        .stats-grid span { color: var(--text-muted); font-size: 0.8rem; font-weight: 700; }

        @media (max-width: 640px) {
          .materials-toolbar { flex-direction: column; align-items: stretch; }
          .form-row, .toggles-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminMaterials;
