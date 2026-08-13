import { useState } from 'react';
import { LayoutGrid, Image, Video, Music, FileText, File, Star, Trash2, HardDrive, LogOut, FolderPlus, Folder, FolderOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = [
  { id: 'all',      label: 'All Files',  icon: LayoutGrid, color: '#6c62f5' },
  { id: 'image',    label: 'Images',     icon: Image,      color: '#f472b6' },
  { id: 'video',    label: 'Videos',     icon: Video,      color: '#a78bfa' },
  { id: 'audio',    label: 'Audio',      icon: Music,      color: '#fbbf24' },
  { id: 'pdf',      label: 'PDFs',       icon: FileText,   color: '#f87171' },
  { id: 'document', label: 'Documents',  icon: FileText,   color: '#60a5fa' },
  { id: 'other',    label: 'Others',     icon: File,       color: '#94a3b8' },
];

const CATS = [
  { key: 'image',    color: '#f472b6' },
  { key: 'video',    color: '#a78bfa' },
  { key: 'audio',    color: '#fbbf24' },
  { key: 'pdf',      color: '#f87171' },
  { key: 'document', color: '#60a5fa' },
  { key: 'other',    color: '#94a3b8' },
];

const fmtSize = (b) => {
  if (!b) return '0 B';
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  if (b < 1073741824) return `${(b/1048576).toFixed(1)} MB`;
  return `${(b/1073741824).toFixed(2)} GB`;
};

export default function Sidebar({ user, activeCategory, activeView, activeFolder, onCategoryChange, onViewChange, onFolderChange, stats, onLogout, folders, onFoldersChange }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [creating, setCreating] = useState(false);

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newFolderName.trim() }) });
      const d = await res.json();
      onFoldersChange([...(folders || []), d.folder]);
      setNewFolderName(''); setShowNewFolder(false);
      toast.success('Folder created!');
    } catch { toast.error('Failed to create folder'); }
    setCreating(false);
  };

  const deleteFolder = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete folder? Files will be moved to root.')) return;
    await fetch(`/api/folders?id=${id}`, { method: 'DELETE' });
    onFoldersChange((folders || []).filter(f => f.id !== id));
    if (activeFolder === id) onCategoryChange('all');
    toast.success('Folder deleted');
  };

  const counts = stats?.byCategory || {};
  const total = stats?.total || 0;

  const NavItem = ({ label, icon: Icon, color, isActive, onClick, count }) => (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', borderRadius: 10, marginBottom: 2, border: 'none',
      background: isActive ? `${color}15` : 'transparent',
      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? `${color}20` : 'rgba(255,255,255,0.05)', transition: 'all 0.15s', boxShadow: isActive ? `0 0 10px ${color}40` : 'none' }}>
          <Icon size={13} color={isActive ? color : 'rgba(255,255,255,0.3)'}/>
        </div>
        <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}>{label}</span>
      </div>
      {count > 0 && (
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: isActive ? color : 'rgba(255,255,255,0.2)', background: isActive ? `${color}18` : 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 99 }}>{count}</span>
      )}
    </button>
  );

  return (
    <>
      <style>{`
        .folder-row:hover .folder-del { opacity: 1 !important; }
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
      `}</style>
      <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, background: '#0d0d12', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

        {/* Logo + User */}
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6c62f5, #9b8cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(108,98,245,0.45)', flexShrink: 0 }}>
              <HardDrive size={16} color="white"/>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>TeleDrive</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>∞ unlimited</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {user?.photo_url
              ? <img src={user.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: '2px solid rgba(108,98,245,0.5)' }}/>
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6c62f5, #9b8cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{user?.first_name?.[0]}</div>
            }
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name} {user?.last_name}</p>
              {user?.username && <p style={{ fontSize: 10, color: '#6c62f5', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '0 8px', marginBottom: 8 }}>Files</p>
          {categories.map(c => (
            <NavItem key={c.id} {...c}
              count={c.id === 'all' ? stats?.total : stats?.byCategory?.[c.id]}
              isActive={activeView === 'files' && activeCategory === c.id && !activeFolder}
              onClick={() => { onViewChange('files'); onCategoryChange(c.id); onFolderChange(null); }}
            />
          ))}

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.14em', padding: '0 8px', marginBottom: 8 }}>Quick Access</p>
            <NavItem label="Starred" icon={Star} color="#fbbf24" isActive={activeView === 'starred'} onClick={() => onViewChange('starred')}/>
            <NavItem label="Trash" icon={Trash2} color="#f87171" isActive={activeView === 'trash'} onClick={() => onViewChange('trash')}/>
          </div>

          {/* Folders */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Folders</p>
              <button onClick={() => setShowNewFolder(v => !v)} style={{ background: showNewFolder ? 'rgba(108,98,245,0.15)' : 'none', border: 'none', color: showNewFolder ? '#6c62f5' : 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '3px 6px', borderRadius: 6, display: 'flex', transition: 'all 0.15s' }}>
                <FolderPlus size={13}/>
              </button>
            </div>

            {showNewFolder && (
              <form onSubmit={createFolder} style={{ marginBottom: 10, padding: '0 4px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name…" autoFocus
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', minWidth: 0, transition: 'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(108,98,245,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button type="submit" disabled={creating} style={{ padding: '7px 12px', borderRadius: 8, background: '#6c62f5', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>+</button>
                </div>
              </form>
            )}

            {(folders || []).map(f => (
              <div key={f.id} className="folder-row" style={{ position: 'relative', marginBottom: 2 }}>
                <button onClick={() => { onViewChange('files'); onFolderChange(f.id); onCategoryChange('all'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: activeFolder === f.id ? 'rgba(108,98,245,0.15)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (activeFolder !== f.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (activeFolder !== f.id) e.currentTarget.style.background = 'transparent'; }}>
                  {activeFolder === f.id ? <FolderOpen size={13} color="#6c62f5"/> : <Folder size={13} color="rgba(255,255,255,0.25)"/>}
                  <span style={{ fontSize: 13, color: activeFolder === f.id ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: activeFolder === f.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                </button>
                <button onClick={e => deleteFolder(f.id, e)} className="folder-del" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 4, borderRadius: 4, opacity: 0, transition: 'opacity 0.15s' }}>
                  <X size={11}/>
                </button>
              </div>
            ))}
            {!(folders || []).length && !showNewFolder && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '4px 8px', lineHeight: 1.5 }}>No folders yet.</p>
            )}
          </div>
        </div>

        {/* Storage + Logout */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {stats && total > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Storage</span>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#6c62f5', fontWeight: 600 }}>{fmtSize(stats.totalSize)}</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
                {CATS.map(({ key, color }) => {
                  const pct = (counts[key] || 0) / Math.max(total, 1) * 100;
                  return pct > 0 ? <div key={key} style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }}/> : null;
                })}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                {CATS.map(({ key, color }) => {
                  const count = counts[key] || 0;
                  if (!count) return null;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 2, background: color }}/>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 10, background: 'none', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'none'; }}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
