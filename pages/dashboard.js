import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Search, Grid, List, Upload, RefreshCw, SortAsc, SortDesc, Trash2, X, CloudUpload } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import FileCard from '../components/FileCard';
import UploadZone from '../components/UploadZone';
import ContextMenu from '../components/ContextMenu';
import FilePreviewModal from '../components/FilePreviewModal';
import RenameModal from '../components/RenameModal';
import MoveModal from '../components/MoveModal';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';

export default function Dashboard({ initialUser }) {
  const router = useRouter();
  const [user] = useState(initialUser);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeView, setActiveView] = useState('files');
  const [activeFolder, setActiveFolder] = useState(null);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [renameFile, setRenameFile] = useState(null);
  const [moveFile, setMoveFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: 'created_at', order: sortOrder });
      if (activeView === 'trash') params.set('view', 'trash');
      else if (activeView === 'starred') params.set('view', 'starred');
      else {
        if (activeCategory !== 'all') params.set('category', activeCategory);
        if (activeFolder) params.set('folder', activeFolder);
      }
      if (search) params.set('search', search);
      const res = await fetch(`/api/files/list?${params}`);
      if (res.status === 401) { router.push('/'); return; }
      const data = await res.json();
      setFiles(data.files || []); setStats(data.stats); setSelected(new Set());
    } catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  }, [activeCategory, activeView, activeFolder, search, sortOrder]);

  useEffect(() => { const t = setTimeout(fetchFiles, search ? 350 : 0); return () => clearTimeout(t); }, [fetchFiles]);
  useEffect(() => { fetch('/api/folders').then(r => r.json()).then(d => setFolders(d.folders || [])); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected.size > 0) handleBulkTrash();
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); setSelected(new Set(files.map(f => f.id))); }
      if (e.key === 'Escape') { setSelected(new Set()); setContextMenu(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); setShowUpload(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, files]);

  const toggleSelect = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleDownload = async (file) => {
    try {
      const res = await fetch(`/api/files/download?id=${file.id}`);
      const d = await res.json();
      const a = document.createElement('a'); a.href = d.url; a.download = file.name; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { toast.error('Download failed'); }
  };

  const handleRename = async (file, newName) => {
    try {
      const res = await fetch('/api/files/rename', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id, name: newName }) });
      const d = await res.json();
      setFiles(prev => prev.map(f => f.id === file.id ? d.file : f));
      toast.success('Renamed!');
    } catch { toast.error('Rename failed'); }
    setRenameFile(null);
  };

  const handleStar = async (file) => {
    try {
      const res = await fetch('/api/files/star', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id, starred: !file.starred }) });
      const d = await res.json();
      setFiles(prev => prev.map(f => f.id === file.id ? d.file : f));
      toast.success(d.file.starred ? '⭐ Starred!' : 'Unstarred');
    } catch { toast.error('Failed'); }
  };

  const handleTrash = async (file) => {
    try {
      await fetch('/api/files/trash', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id, trashed: true }) });
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('Moved to Trash');
    } catch { toast.error('Failed'); }
  };

  const handleRestore = async (file) => {
    try {
      await fetch('/api/files/trash', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id, trashed: false }) });
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('Restored!');
    } catch { toast.error('Failed'); }
  };

  const handleDeleteForever = async (file) => {
    if (!confirm(`Permanently delete "${file.name}"?`)) return;
    try {
      await fetch(`/api/files/delete?id=${file.id}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('Deleted forever');
    } catch { toast.error('Failed'); }
  };

  const handleMove = async (file, folderId, folderName) => {
    try {
      await fetch('/api/files/move', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id, folder: folderId }) });
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success(`Moved to "${folderName}"`);
    } catch { toast.error('Move failed'); }
    setMoveFile(null);
  };

  const handleBulkTrash = async () => {
    for (const id of selected) { const f = files.find(x => x.id === id); if (f) await handleTrash(f); }
    setSelected(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selected.size} file(s)?`)) return;
    try {
      await fetch('/api/files/bulk-delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [...selected] }) });
      setFiles(prev => prev.filter(f => !selected.has(f.id)));
      setSelected(new Set());
      toast.success(`${selected.size} files deleted`);
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  const viewTitle = activeView === 'trash' ? 'Trash' : activeView === 'starred' ? 'Starred Files' : activeFolder ? (folders.find(f => f.id === activeFolder)?.name || 'Folder') : { all: 'All Files', image: 'Images', video: 'Videos', audio: 'Audio', pdf: 'PDFs', document: 'Documents', other: 'Others' }[activeCategory];

  const emptyIcon = activeView === 'trash' ? '🗑️' : activeView === 'starred' ? '⭐' : search ? '🔍' : '☁️';
  const emptyTitle = activeView === 'trash' ? 'Trash is empty' : activeView === 'starred' ? 'No starred files' : search ? `No results for "${search}"` : 'No files here yet';
  const emptyDesc = activeView === 'trash' ? 'Deleted files will appear here' : activeView === 'starred' ? 'Star important files to find them quickly' : 'Upload your first file to get started';

  return (
    <>
      <Head>
        <title>TeleDrive — {viewTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Bricolage+Grotesque:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#faf8f5', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        <Sidebar user={user} activeCategory={activeCategory} activeView={activeView} activeFolder={activeFolder}
          onCategoryChange={setActiveCategory} onViewChange={setActiveView} onFolderChange={setActiveFolder}
          stats={stats} onLogout={handleLogout} folders={folders} onFoldersChange={setFolders} />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <header style={{ padding: '0 28px', height: 64, borderBottom: '1px solid #ede8e0', background: 'white', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, boxShadow: '0 1px 0 #f0ebe3' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1208', letterSpacing: '-0.4px', fontFamily: "'Clash Display', sans-serif" }}>{viewTitle}</h1>
            </div>

            {selected.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 10, background: '#fff7f3', border: '1px solid #ffd4bc' }}>
                <span style={{ fontSize: 12, color: '#e85d26', fontWeight: 600 }}>{selected.size} selected</span>
                {activeView === 'trash'
                  ? <button onClick={handleBulkDelete} style={dangerBtnStyle}><Trash2 size={12}/> Delete Forever</button>
                  : <button onClick={handleBulkTrash} style={dangerBtnStyle}><Trash2 size={12}/> Move to Trash</button>
                }
                <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: '#c4b8a4', cursor: 'pointer', display: 'flex', padding: 2 }}><X size={14}/></button>
              </div>
            )}

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#c4b8a4', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 11, fontSize: 13, outline: 'none', width: 220, background: '#faf7f3', border: '1.5px solid #ede8e0', color: '#1a1208', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#e85d26'}
                onBlur={e => e.target.style.borderColor = '#ede8e0'}
              />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} style={iconBtnStyle} title="Sort">
                {sortOrder === 'desc' ? <SortDesc size={16}/> : <SortAsc size={16}/>}
              </button>
              <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={iconBtnStyle} title="View">
                {view === 'grid' ? <List size={16}/> : <Grid size={16}/>}
              </button>
              <button onClick={fetchFiles} style={iconBtnStyle} title="Refresh">
                <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              {activeView !== 'trash' && (
                <button onClick={() => setShowUpload(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 11,
                  background: showUpload ? '#1a1208' : 'linear-gradient(135deg, #e85d26, #f0833a)',
                  border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(232,93,38,0.3)', transition: 'all 0.15s',
                }}>
                  <CloudUpload size={15}/> {showUpload ? 'Close' : 'Upload'}
                </button>
              )}
            </div>
          </header>

          {/* Shortcut bar */}
          <div style={{ padding: '7px 28px', background: '#faf8f5', borderBottom: '1px solid #f0ebe3', display: 'flex', gap: 20, flexShrink: 0 }}>
            {[['Ctrl+A','Select all'],['Del','Trash selected'],['Ctrl+U','Upload'],['Esc','Deselect'],['Right-click','More options']].map(([k,v]) => (
              <span key={k} style={{ fontSize: 11, color: '#c4b8a4' }}>
                <kbd style={{ background: 'white', border: '1px solid #ede8e0', padding: '1px 6px', borderRadius: 5, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#9c8b74', marginRight: 5, boxShadow: '0 1px 2px rgba(26,18,8,0.06)' }}>{k}</kbd>{v}
              </span>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#c4b8a4' }}>{files.length} file{files.length !== 1 ? 's' : ''}{selected.size > 0 ? ` · ${selected.size} selected` : ''}</span>
          </div>

          {/* Main content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 28 }} onClick={() => { setContextMenu(null); setSelected(new Set()); }}>

            {showUpload && activeView !== 'trash' && (
              <div style={{ marginBottom: 24, animation: 'fadeUp 0.25s ease' }} onClick={e => e.stopPropagation()}>
                <UploadZone onUploadComplete={(f) => { setFiles(prev => [f, ...prev]); fetchFiles(); }} />
              </div>
            )}

            {activeView === 'trash' && files.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#dc2626' }}>🗑 Files in trash are permanently deleted after 30 days.</p>
                <button onClick={handleBulkDelete} disabled={!selected.size} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: selected.size ? 'pointer' : 'not-allowed', opacity: selected.size ? 1 : 0.4, fontFamily: 'inherit', fontWeight: 600 }}>
                  Empty selected
                </button>
              </div>
            )}

            {loading && (
              <div style={{ display: 'grid', gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(170px, 1fr))' : '1fr', gap: view === 'grid' ? 14 : 8 }}>
                {[...Array(12)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: 16, height: view === 'grid' ? 168 : 58 }} />)}
              </div>
            )}

            {!loading && files.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'white', border: '1px solid #ede8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 20, boxShadow: '0 8px 24px rgba(26,18,8,0.06)' }}>{emptyIcon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1208', marginBottom: 8, fontFamily: "'Clash Display', sans-serif" }}>{emptyTitle}</h3>
                <p style={{ fontSize: 14, color: '#9c8b74', marginBottom: 24, maxWidth: 320, lineHeight: 1.6 }}>{emptyDesc}</p>
                {activeView === 'files' && !search && (
                  <button onClick={() => setShowUpload(true)} style={{ padding: '11px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #e85d26, #f0833a)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(232,93,38,0.25)' }}>
                    Upload Your First File
                  </button>
                )}
              </div>
            )}

            {!loading && files.length > 0 && (
              view === 'grid'
                ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }} onClick={e => e.stopPropagation()}>
                    {files.map((f, i) => (
                      <div key={f.id} style={{ animation: `fadeUp 0.3s ${Math.min(i, 8) * 0.04}s ease both` }}>
                        <FileCard file={f} view="grid" selected={selected.has(f.id)}
                          onSelect={toggleSelect} onClick={() => setPreviewFile(f)}
                          onContextMenu={(e, file) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file }); }} />
                      </div>
                    ))}
                  </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {files.map((f, i) => (
                      <div key={f.id} style={{ animation: `fadeUp 0.3s ${Math.min(i, 8) * 0.03}s ease both` }}>
                        <FileCard file={f} view="list" selected={selected.has(f.id)}
                          onSelect={toggleSelect} onClick={() => setPreviewFile(f)}
                          onContextMenu={(e, file) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file }); }} />
                      </div>
                    ))}
                  </div>
            )}
          </div>
        </main>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} isTrashView={activeView === 'trash'}
          onClose={() => setContextMenu(null)} onPreview={() => setPreviewFile(contextMenu.file)}
          onDownload={() => handleDownload(contextMenu.file)} onRename={() => setRenameFile(contextMenu.file)}
          onStar={() => handleStar(contextMenu.file)} onTrash={() => handleTrash(contextMenu.file)}
          onRestore={() => handleRestore(contextMenu.file)} onDeleteForever={() => handleDeleteForever(contextMenu.file)}
          onShare={() => setShareFile(contextMenu.file)} onMove={() => setMoveFile(contextMenu.file)} />
      )}
      {previewFile && <FilePreviewModal file={previewFile} allFiles={files} onClose={() => setPreviewFile(null)} onDownload={handleDownload} />}
      {renameFile && <RenameModal file={renameFile} onClose={() => setRenameFile(null)} onConfirm={(name) => handleRename(renameFile, name)} />}
      {moveFile && <MoveModal file={moveFile} onClose={() => setMoveFile(null)} onConfirm={(folderId, folderName) => handleMove(moveFile, folderId, folderName)} />}
      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} onUpdate={(updated) => setFiles(prev => prev.map(f => f.id === updated.id ? updated : f))} />}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .file-card:hover .card-checkbox{opacity:1!important}`}</style>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => { const [k,...v]=c.trim().split('='); return [k,v.join('=')]; }));
  const { getUserFromRequest } = await import('../lib/auth');
  const user = await getUserFromRequest({ cookies });
  if (!user) return { redirect: { destination: '/', permanent: false } };
  return { props: { initialUser: user } };
}

const iconBtnStyle = { background: 'white', border: '1px solid #ede8e0', color: '#9c8b74', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(26,18,8,0.06)' };
const dangerBtnStyle = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 };
