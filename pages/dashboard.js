import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Search, Grid, List, RefreshCw, SortAsc, SortDesc, Trash2, X, CloudUpload } from 'lucide-react';
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

  const viewTitle = activeView === 'trash' ? 'Trash' : activeView === 'starred' ? 'Starred' : activeFolder
    ? (folders.find(f => f.id === activeFolder)?.name || 'Folder')
    : { all: 'All Files', image: 'Images', video: 'Videos', audio: 'Audio', pdf: 'PDFs', document: 'Documents', other: 'Others' }[activeCategory];

  const emptyIcon = activeView === 'trash' ? '🗑️' : activeView === 'starred' ? '⭐' : search ? '🔍' : '☁️';
  const emptyTitle = activeView === 'trash' ? 'Trash is empty' : activeView === 'starred' ? 'No starred files' : search ? `No results for "${search}"` : 'Nothing here yet';
  const emptyDesc = activeView === 'trash' ? 'Deleted files appear here' : activeView === 'starred' ? 'Star files to pin them here' : 'Drop your first file to get started';

  return (
    <>
      <Head>
        <title>TeleDrive — {viewTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0c0f; color: #e2e2e8; font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton { background: linear-gradient(90deg,#16161e 25%,#1e1e28 50%,#16161e 75%); background-size:400px 100%; animation:shimmer 1.4s ease infinite; border-radius:18px; }
        .file-card:hover .card-checkbox { opacity:1 !important; }
        .search-wrap input:focus { border-color: rgba(108,98,245,0.5) !important; background: rgba(108,98,245,0.05) !important; }
        .upload-btn:hover { background: #7c72f7 !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,98,245,0.45) !important; }
        .icon-btn:hover { background: rgba(255,255,255,0.09) !important; color: rgba(255,255,255,0.8) !important; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0c0c0f' }}>
        <Sidebar user={user} activeCategory={activeCategory} activeView={activeView} activeFolder={activeFolder}
          onCategoryChange={setActiveCategory} onViewChange={setActiveView} onFolderChange={setActiveFolder}
          stats={stats} onLogout={handleLogout} folders={folders} onFoldersChange={setFolders}/>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <header style={{ padding: '0 28px', height: 62, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,12,15,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>{viewTitle}</h1>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1, fontFamily: 'JetBrains Mono, monospace' }}>
                {loading ? 'loading…' : `${files.length} file${files.length !== 1 ? 's' : ''}${selected.size > 0 ? ` · ${selected.size} selected` : ''}`}
              </p>
            </div>

            {selected.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)' }}>
                <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>{selected.size} selected</span>
                {activeView === 'trash'
                  ? <button onClick={handleBulkDelete} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}><Trash2 size={11}/> Delete Forever</button>
                  : <button onClick={handleBulkTrash} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.2)', color:'#f87171', cursor:'pointer', fontSize:12, fontFamily:'inherit', fontWeight:600 }}><Trash2 size={11}/> Trash</button>
                }
                <button onClick={() => setSelected(new Set())} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', display:'flex', padding:2 }}><X size={13}/></button>
              </div>
            )}

            <div className="search-wrap" style={{ position: 'relative' }}>
              <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.22)', pointerEvents:'none' }}/>
              <input type="text" placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft:34, paddingRight:14, paddingTop:8, paddingBottom:8, borderRadius:10, fontSize:13, outline:'none', width:220, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#e2e2e8', fontFamily:'inherit', transition:'all 0.2s' }}/>
            </div>

            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
              <button onClick={() => setSortOrder(o => o==='desc'?'asc':'desc')} className="icon-btn" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', width:34, height:34, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Sort">
                {sortOrder==='desc' ? <SortDesc size={14}/> : <SortAsc size={14}/>}
              </button>
              <button onClick={() => setView(v => v==='grid'?'list':'grid')} className="icon-btn" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', width:34, height:34, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="View">
                {view==='grid' ? <List size={14}/> : <Grid size={14}/>}
              </button>
              <button onClick={fetchFiles} className="icon-btn" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', width:34, height:34, borderRadius:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Refresh">
                <RefreshCw size={13} style={{ animation: loading?'spin 1s linear infinite':'none' }}/>
              </button>
              {activeView !== 'trash' && (
                <button onClick={() => setShowUpload(v => !v)} className="upload-btn" style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:10, background: showUpload?'rgba(255,255,255,0.07)':'#6c62f5', border:'none', color:'white', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'inherit', transition:'all 0.2s', boxShadow: showUpload?'none':'0 4px 16px rgba(108,98,245,0.35)' }}>
                  <CloudUpload size={14}/>{showUpload ? 'Close' : 'Upload'}
                </button>
              )}
            </div>
          </header>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }} onClick={() => { setContextMenu(null); setSelected(new Set()); }}>

            {showUpload && activeView !== 'trash' && (
              <div style={{ marginBottom:24, animation:'fadeUp 0.2s ease' }} onClick={e => e.stopPropagation()}>
                <UploadZone onUploadComplete={() => fetchFiles()}/>
              </div>
            )}

            {activeView === 'trash' && files.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderRadius:12, background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.14)', marginBottom:20 }}>
                <p style={{ fontSize:13, color:'#f87171' }}>Files in trash are permanently deleted after 30 days.</p>
                <button onClick={handleBulkDelete} disabled={!selected.size} style={{ fontSize:12, color:'#f87171', background:'none', border:'none', cursor: selected.size?'pointer':'not-allowed', opacity: selected.size?1:0.4, fontFamily:'inherit', fontWeight:600 }}>Empty selected</button>
              </div>
            )}

            {loading && (
              <div style={{ display:'grid', gridTemplateColumns: view==='grid'?'repeat(auto-fill, minmax(175px,1fr))':'1fr', gap: view==='grid'?16:8 }}>
                {[...Array(12)].map((_,i) => <div key={i} className="skeleton" style={{ height: view==='grid'?190:58 }}/>)}
              </div>
            )}

            {!loading && files.length === 0 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 0', textAlign:'center', animation:'fadeUp 0.4s ease' }}>
                <div style={{ width:68, height:68, borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, marginBottom:18 }}>{emptyIcon}</div>
                <h3 style={{ fontSize:18, fontWeight:600, color:'#fff', marginBottom:8 }}>{emptyTitle}</h3>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.3)', marginBottom:28, maxWidth:280, lineHeight:1.6 }}>{emptyDesc}</p>
                {activeView==='files' && !search && (
                  <button onClick={() => setShowUpload(true)} style={{ padding:'10px 24px', borderRadius:10, background:'#6c62f5', border:'none', color:'white', fontWeight:600, cursor:'pointer', fontSize:14, fontFamily:'inherit', boxShadow:'0 4px 16px rgba(108,98,245,0.35)' }}>Upload a file</button>
                )}
              </div>
            )}

            {!loading && files.length > 0 && (
              view === 'grid'
                ? <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(175px,1fr))', gap:14 }} onClick={e => e.stopPropagation()}>
                    {files.map((f,i) => (
                      <div key={f.id} style={{ animation:`fadeUp 0.3s ${Math.min(i,8)*0.04}s ease both` }}>
                        <FileCard file={f} view="grid" selected={selected.has(f.id)} onSelect={toggleSelect} onClick={() => setPreviewFile(f)} onContextMenu={(e,file) => { e.preventDefault(); setContextMenu({ x:e.clientX, y:e.clientY, file }); }}/>
                      </div>
                    ))}
                  </div>
                : <div style={{ display:'flex', flexDirection:'column', gap:6 }} onClick={e => e.stopPropagation()}>
                    {files.map((f,i) => (
                      <div key={f.id} style={{ animation:`fadeUp 0.3s ${Math.min(i,8)*0.03}s ease both` }}>
                        <FileCard file={f} view="list" selected={selected.has(f.id)} onSelect={toggleSelect} onClick={() => setPreviewFile(f)} onContextMenu={(e,file) => { e.preventDefault(); setContextMenu({ x:e.clientX, y:e.clientY, file }); }}/>
                      </div>
                    ))}
                  </div>
            )}
          </div>
        </main>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} isTrashView={activeView==='trash'}
          onClose={() => setContextMenu(null)} onPreview={() => setPreviewFile(contextMenu.file)}
          onDownload={() => handleDownload(contextMenu.file)} onRename={() => setRenameFile(contextMenu.file)}
          onStar={() => handleStar(contextMenu.file)} onTrash={() => handleTrash(contextMenu.file)}
          onRestore={() => handleRestore(contextMenu.file)} onDeleteForever={() => handleDeleteForever(contextMenu.file)}
          onShare={() => setShareFile(contextMenu.file)} onMove={() => setMoveFile(contextMenu.file)}/>
      )}
      {previewFile && <FilePreviewModal file={previewFile} allFiles={files} onClose={() => setPreviewFile(null)} onDownload={handleDownload}/>}
      {renameFile && <RenameModal file={renameFile} onClose={() => setRenameFile(null)} onConfirm={name => handleRename(renameFile, name)}/>}
      {moveFile && <MoveModal file={moveFile} onClose={() => setMoveFile(null)} onConfirm={(folderId, folderName) => handleMove(moveFile, folderId, folderName)}/>}
      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} onUpdate={updated => setFiles(prev => prev.map(f => f.id===updated.id?updated:f))}/>}
    </>
  );
}

export async function getServerSideProps({ req }) {
  const cookies = Object.fromEntries((req.headers.cookie||'').split(';').map(c => { const [k,...v]=c.trim().split('='); return [k,v.join('=')]; }));
  const { getUserFromRequest } = await import('../lib/auth');
  const user = await getUserFromRequest({ cookies });
  if (!user) return { redirect: { destination: '/', permanent: false } };
  return { props: { initialUser: user } };
}
