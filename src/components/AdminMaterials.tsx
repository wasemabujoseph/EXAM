import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { 
  FilePlus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Presentation, 
  FileCode,
  Download,
  Loader2,
  X,
  Upload,
  Check,
  AlertCircle,
  Copy,
  FolderOpen
} from 'lucide-react';
import { formatSafeDate } from '../utils/robustHelpers';

const AdminMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    year: '1',
    subject: '',
    type: 'pdf',
    tags: '',
    isVisibleToStudents: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

      // Auto-detect type
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'pdf' }));
      else if (['ppt', 'pptx'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'presentation' }));
      else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'image' }));
      else if (['json'].includes(ext!)) setUploadForm(f => ({ ...f, type: 'exam' }));

      // Preview for images
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
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          await api.uploadMaterial({
            ...uploadForm,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
            fileBase64: base64,
            tags: uploadForm.tags.split(',').map(t => t.trim()).filter(t => t)
          });
          setShowUploadModal(false);
          resetUploadForm();
          loadMaterials();
        } catch (err: any) {
          setUploadError(err.message || 'Could not upload material. Please try again.');
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

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      year: '1',
      subject: '',
      type: 'pdf',
      tags: '',
      isVisibleToStudents: true
    });
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
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

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could add a toast here
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
      <header className="admin-view-header">
        <div className="header-txt">
          <h1>Materials Library</h1>
          <p>Manage learning resources, PDFs, and exam JSONs.</p>
        </div>
        <button className="primary-button" onClick={() => setShowUploadModal(true)}>
          <FilePlus size={18} />
          <span>Upload Material</span>
        </button>
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
                    <span className="status-badge hidden"><Eye size={12} /> Hidden</span>
                  )
                  }
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
                  <small>{(m.sizeBytes / 1024 / 1024).toFixed(2)} MB</small>
                  <small>{formatSafeDate(m.uploadedAt)}</small>
                </div>
              </div>

              <div className="card-actions">
                <a href={m.previewUrl} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Preview">
                  <Eye size={18} />
                </a>
                <a href={m.downloadUrl} className="icon-btn" title="Download">
                  <Download size={18} />
                </a>
                <button className="icon-btn" onClick={() => copyLink(m.previewUrl)} title="Copy Link">
                  <Copy size={18} />
                </button>
                <button className={`icon-btn ${m.isVisibleToStudents === 'TRUE' ? 'active' : ''}`} onClick={() => toggleVisibility(m)} title="Toggle Visibility">
                  {m.isVisibleToStudents === 'TRUE' ? <Eye size={18} /> : <Eye size={18} style={{opacity: 0.4}} />}
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
                  <input 
                    type="text" 
                    required 
                    value={uploadForm.title} 
                    onChange={e => setUploadForm({...uploadForm, title: e.target.value})} 
                    placeholder="e.g. Anatomy Lower Limb PDF"
                  />
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <input 
                    type="text" 
                    required 
                    value={uploadForm.subject} 
                    onChange={e => setUploadForm({...uploadForm, subject: e.target.value})} 
                    placeholder="e.g. Anatomy"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select value={uploadForm.year} onChange={e => setUploadForm({...uploadForm, year: e.target.value})}>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5</option>
                      <option value="6">Year 6</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Material Type</label>
                    <select value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})}>
                      <option value="pdf">PDF Document</option>
                      <option value="presentation">PowerPoint / Slides</option>
                      <option value="image">Image / Diagram</option>
                      <option value="exam">Exam JSON</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={uploadForm.description} 
                    onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                    placeholder="Brief details about this material..."
                  />
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
                
                <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()}>
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.json"
                  />
                  {selectedFile ? (
                    <div className="file-selected">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="upload-preview-img" />
                      ) : (
                        <div className="file-icon-large">
                           {getIcon(uploadForm.type)}
                        </div>
                      )}
                      <div className="file-info-text">
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button type="button" className="change-file-btn" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Change</button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <Upload size={32} />
                      <p>Drag and drop or click to select a file</p>
                      <span>Max size: 10MB</span>
                    </div>
                  )}
                </div>

                <div className="form-group toggle-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={uploadForm.isVisibleToStudents} 
                      onChange={e => setUploadForm({...uploadForm, isVisibleToStudents: e.target.checked})} 
                    />
                    <span>Visible to Students immediately</span>
                  </label>
                </div>
              </div>

              {uploadError && (
                <div className="upload-error">
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={isUploading || !selectedFile}>
                  {isUploading ? <><Loader2 className="animate-spin" size={18} /> Uploading...</> : 'Start Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-materials-page { display: flex; flex-direction: column; gap: 2rem; }
        
        .admin-view-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .header-txt h1 { font-size: 2.25rem; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 0.5rem; }
        .header-txt p { color: var(--text-muted); font-weight: 600; }

        .materials-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; background: var(--surface); padding: 1rem 1.5rem; border-radius: var(--radius-xl); border: 1px solid var(--border); }
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
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label { font-size: 0.85rem; font-weight: 800; color: var(--text-soft); }
        .form-group input, .form-group select, .form-group textarea { background: var(--bg-soft-fade); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 12px; color: var(--text-strong); font-weight: 600; outline: none; }
        .form-group input:focus { border-color: var(--primary); }
        .form-group textarea { min-height: 80px; resize: vertical; }

        .file-upload-zone { border: 2px dashed var(--border); border-radius: 16px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; background: var(--bg-soft-fade); }
        .file-upload-zone:hover { border-color: var(--primary); background: var(--primary-soft); }
        
        .upload-prompt { text-align: center; color: var(--text-soft); }
        .upload-prompt p { font-weight: 800; margin: 1rem 0 0.25rem; color: var(--text-strong); }
        .upload-prompt span { font-size: 0.75rem; }

        .file-selected { width: 100%; display: flex; align-items: center; gap: 1.5rem; }
        .upload-preview-img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); }
        .file-icon-large { width: 64px; height: 64px; background: var(--surface); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
        .file-info-text { flex: 1; display: flex; flex-direction: column; }
        .file-info-text strong { color: var(--text-strong); font-size: 0.95rem; }
        .file-info-text span { color: var(--text-muted); font-size: 0.8rem; }
        .change-file-btn { background: var(--surface); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; cursor: pointer; }

        .checkbox-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-weight: 700; color: var(--text-strong); }
        .checkbox-label input { width: 18px; height: 18px; cursor: pointer; }

        .upload-error { background: var(--danger-soft); color: var(--danger); padding: 0.75rem 1rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; font-weight: 700; }

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
