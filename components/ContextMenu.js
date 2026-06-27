import { useEffect, useRef } from 'react';
import { Eye, Download, Star, StarOff, Pencil, FolderInput, Share2, Trash2, RotateCcw, Trash } from 'lucide-react';

export default function ContextMenu({ x, y, file, onClose, onPreview, onDownload, onRename, onStar, onTrash, onRestore, onDeleteForever, onShare, onMove, isTrashView }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, []);

  const mw = 200, mh = 280;
  const left = x + mw > window.innerWidth ? x - mw : x;
  const top = y + mh > window.innerHeight ? y - mh : y;

  const Item = ({ icon: Icon, label, onClick, danger, color, divider }) => (
    <>
      {divider && <div style={{ height: 1, background: '#f0ebe3', margin: '4px 6px' }} />}
      <button onClick={() => { onClick(); onClose(); }} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
        color: danger ? '#dc2626' : color || '#5c4f3a', fontSize: 13,
        fontFamily: 'inherit', textAlign: 'left', borderRadius: 8, transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? '#fef2f2' : '#faf7f3'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <Icon size={14} /> {label}
      </button>
    </>
  );

  return (
    <div ref={ref} style={{
      position: 'fixed', left, top, zIndex: 2000,
      background: 'white', border: '1px solid #ede8e0',
      borderRadius: 14, padding: '6px', minWidth: 200,
      boxShadow: '0 16px 48px rgba(26,18,8,0.14), 0 4px 12px rgba(26,18,8,0.08)',
      animation: 'pop 0.15s ease',
    }}>
      {isTrashView ? <>
        <Item icon={RotateCcw} label="Restore" onClick={onRestore} color="#2d9e6b" />
        <Item icon={Trash} label="Delete Forever" onClick={onDeleteForever} danger divider />
      </> : <>
        <Item icon={Eye} label="Preview" onClick={onPreview} />
        <Item icon={Download} label="Download" onClick={onDownload} />
        <Item icon={file?.starred ? StarOff : Star} label={file?.starred ? 'Remove Star' : 'Add to Starred'} onClick={onStar} color="#d97706" divider />
        <Item icon={Pencil} label="Rename" onClick={onRename} />
        <Item icon={FolderInput} label="Move to Folder" onClick={onMove} />
        <Item icon={Share2} label="Share Link" onClick={onShare} />
        <Item icon={Trash2} label="Move to Trash" onClick={onTrash} danger divider />
      </>}
      <style>{`@keyframes pop{from{opacity:0;transform:scale(0.94) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}
