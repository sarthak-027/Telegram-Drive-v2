import { useState } from 'react';
import { LayoutGrid, Image, Video, Music, FileText, File, Star, Trash2, HardDrive, LogOut, FolderPlus, Folder, FolderOpen, X, ChevronRight } from 'lucide-react';
import StorageChart from './StorageChart';
import toast from 'react-hot-toast';

const categories = [
  { id: 'all',      label: 'All Files',   icon: LayoutGrid, color: '#e85d26', bg: '#fff2ec' },
  { id: 'image',    label: 'Images',      icon: Image,      color: '#db2777', bg: '#fdf2f8' },
  { id: 'video',    label: 'Videos',      icon: Video,      color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'audio',    label: 'Audio',       icon: Music,      color: '#d97706', bg: '#fffbeb' },
  { id: 'pdf',      label: 'PDFs',        icon: FileText,   color: '#dc2626', bg: '#fef2f2' },
  { id: 'document', label: 'Documents',   icon: FileText,   color: '#2563eb', bg: '#eff6ff' },
  { id: 'other',    label: 'Others',      icon: File,       color: '#64748b', bg: '#f8fafc' },
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

  const NavBtn = ({ label, icon: Icon, color, bg, isActive, onClick, count }) => (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 10px', borderRadius: 10, marginBottom: 1,
      background: isActive ? bg : 'transparent',
      border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f7f3ee'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: isActive ? bg : '#f5f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
          <Icon size={14} color={isActive ? color : '#9c8b74'} />
        </div>
        <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? color : '#5c4f3a', transition: 'color 0.15s' }}>{label}</span>
      </div>
      {count > 0 && (
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: isActive ? color : '#9c8b74', background: isActive ? 'white' : '#f0ebe3', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>{count}</span>
      )}
    </button>
  );

  return (
    <aside style={{
      width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      background: 'white',
      borderRight: '1px solid #ede8e0',
      overflow: 'hidden',
    }}>
      {/* Logo + User */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f0ebe3', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #e85d26, #f0833a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(232,93,38,0.3)', flexShrink: 0 }}>
            <HardDrive size={16} color="white" />
          </div>
          <div>
            <p className="display" style={{ fontSize: 17, fontWeight: 700, color: '#1a1208', letterSpacing: '-0.3px', lineHeight: 1 }}>TeleDrive</p>
            <p style={{ fontSize: 10, color: '#9c8b74', marginTop: 1 }}>Unlimited Storage</p>
          </div>
        </div>

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 12, background: '#faf7f3', border: '1px solid #ede8e0' }}>
          {user?.photo_url
            ? <img src={user.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #e85d26, #f0833a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>{user?.first_name?.[0]}</div>
          }
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name} {user?.last_name}</p>
            {user?.username && <p style={{ fontSize: 11, color: '#e85d26', marginTop: 1 }}>@{user.username}</p>}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#c4b8a4', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 6px', marginBottom: 8 }}>Files</p>
        {categories.map(c => (
          <NavBtn key={c.id} {...c} count={c.id === 'all' ? stats?.total : stats?.byCategory?.[c.id]}
            isActive={activeView === 'files' && activeCategory === c.id && !activeFolder}
            onClick={() => { onViewChange('files'); onCategoryChange(c.id); onFolderChange(null); }}
          />
        ))}

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#c4b8a4', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 6px', marginBottom: 8 }}>Quick Access</p>
          <NavBtn label="Starred" icon={Star} color="#d97706" bg="#fffbeb" isActive={activeView === 'starred'} onClick={() => onViewChange('starred')} />
          <NavBtn label="Trash" icon={Trash2} color="#dc2626" bg="#fef2f2" isActive={activeView === 'trash'} onClick={() => onViewChange('trash')} />
        </div>

        {/* Folders */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#c4b8a4', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Folders</p>
            <button onClick={() => setShowNewFolder(v => !v)} style={{ background: showNewFolder ? '#fff2ec' : 'none', border: 'none', color: showNewFolder ? '#e85d26' : '#c4b8a4', cursor: 'pointer', padding: '3px 6px', borderRadius: 6, display: 'flex', transition: 'all 0.15s' }}>
              <FolderPlus size={13} />
            </button>
          </div>

          {showNewFolder && (
            <form onSubmit={createFolder} style={{ marginBottom: 10, padding: '0 2px' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name..." autoFocus
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: '#faf7f3', border: '1.5px solid #ede8e0', color: '#1a1208', fontSize: 12, fontFamily: 'inherit', outline: 'none', minWidth: 0 }}
                  onFocus={e => e.target.style.borderColor = '#e85d26'}
                  onBlur={e => e.target.style.borderColor = '#ede8e0'}
                />
                <button type="submit" disabled={creating} style={{ padding: '7px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #e85d26, #f0833a)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>+</button>
              </div>
            </form>
          )}

          {(folders || []).map(f => (
            <div key={f.id} className="folder-row" style={{ position: 'relative', marginBottom: 1 }}>
              <button onClick={() => { onViewChange('files'); onFolderChange(f.id); onCategoryChange('all'); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10,
                background: activeFolder === f.id ? '#fff2ec' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => { if (activeFolder !== f.id) e.currentTarget.style.background = '#f7f3ee'; }}
              onMouseLeave={e => { if (activeFolder !== f.id) e.currentTarget.style.background = 'transparent'; }}>
                {activeFolder === f.id ? <FolderOpen size={14} color="#e85d26" /> : <Folder size={14} color="#c4b8a4" />}
                <span style={{ fontSize: 13, color: activeFolder === f.id ? '#e85d26' : '#5c4f3a', fontWeight: activeFolder === f.id ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
              </button>
              <button onClick={e => deleteFolder(f.id, e)} className="folder-del" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#c4b8a4', cursor: 'pointer', padding: 4, borderRadius: 4, opacity: 0, transition: 'opacity 0.15s' }}>
                <X size={11} />
              </button>
            </div>
          ))}
          {!(folders || []).length && !showNewFolder && (
            <p style={{ fontSize: 11, color: '#c4b8a4', padding: '4px 8px', lineHeight: 1.5 }}>No folders. Click + to create one.</p>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #f0ebe3', flexShrink: 0 }}>
        <StorageChart stats={stats} />
        <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 10, marginTop: 8, background: 'none', border: 'none', color: '#9c8b74', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9c8b74'; e.currentTarget.style.background = 'none'; }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.folder-row:hover .folder-del { opacity: 1 !important; }` }} />
    </aside>
  );
}
