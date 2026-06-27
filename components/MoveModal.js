import { useState, useEffect } from 'react';
import { X, Folder, FolderOpen, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MoveModal({ file, onConfirm, onClose }) {
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  useEffect(() => { fetch('/api/folders').then(r => r.json()).then(d => setFolders(d.folders || [])); }, []);
  const createAndMove = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newFolderName.trim() }) });
      const d = await res.json();
      onConfirm(d.folder.id, d.folder.name);
    } catch { toast.error('Failed to create folder'); }
    setCreating(false);
  };
  const fbtn = (active) => ({ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 4, background: active ? '#fff7f3' : '#faf7f3', border: `1.5px solid ${active ? '#ffd4bc' : '#ede8e0'}`, color: active ? '#e85d26' : '#5c4f3a', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left', fontWeight: active ? 600 : 500 });
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(250,248,245,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', border: '1px solid #ede8e0', borderRadius: 20, padding: 24, width: 380, boxShadow: '0 32px 80px rgba(26,18,8,0.14)', animation: 'fadeIn 0.18s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1208', fontFamily: "'Clash Display', sans-serif" }}>Move to Folder</h3>
          <button onClick={onClose} style={{ background: '#faf7f3', border: '1px solid #ede8e0', color: '#9c8b74', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
        </div>
        <button onClick={() => onConfirm('root', 'Root')} style={fbtn(file?.folder === 'root')}><FolderOpen size={15}/> Root (no folder)</button>
        {folders.map(f => (
          <button key={f.id} onClick={() => onConfirm(f.id, f.name)} style={fbtn(file?.folder === f.id)}><Folder size={15}/> {f.name}</button>
        ))}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ebe3' }}>
          <p style={{ fontSize: 11, color: '#c4b8a4', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Folder</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createAndMove()} placeholder="Folder name…"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 9, background: '#faf7f3', border: '1.5px solid #ede8e0', color: '#1a1208', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#e85d26'}
              onBlur={e => e.target.style.borderColor = '#ede8e0'}
            />
            <button onClick={createAndMove} disabled={!newFolderName.trim() || creating} style={{ padding: '8px 14px', borderRadius: 9, background: 'linear-gradient(135deg, #e85d26, #f0833a)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 10px rgba(232,93,38,0.2)' }}><Plus size={14}/></button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
