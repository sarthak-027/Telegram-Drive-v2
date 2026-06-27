import { Star, Share2, CheckSquare, Square, Image, Video, Music, FileText, File } from 'lucide-react';

const catConfig = {
  image:    { icon: Image,    color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', label: 'Image'    },
  video:    { icon: Video,    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Video'    },
  audio:    { icon: Music,    color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Audio'    },
  pdf:      { icon: FileText, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'PDF'      },
  document: { icon: FileText, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Document' },
  other:    { icon: File,     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: 'File'     },
};

const fmtSize = (b) => {
  if (!b) return '—';
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function FileCard({ file, view = 'grid', selected, onSelect, onContextMenu, onClick }) {
  const cfg = catConfig[file.category] || catConfig.other;
  const Icon = cfg.icon;

  const handleCtx = (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(e, file); };
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) { onSelect?.(file.id); return; }
    onClick?.(file);
  };

  if (view === 'list') {
    return (
      <div onContextMenu={handleCtx} onClick={handleClick} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
        background: selected ? '#fff7f3' : 'white',
        border: `1px solid ${selected ? '#ffd4bc' : '#f0ebe3'}`,
        boxShadow: selected ? '0 0 0 2px rgba(232,93,38,0.1)' : 'none',
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = '#faf7f3'; e.currentTarget.style.borderColor = '#e8e0d4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,18,8,0.06)'; } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#f0ebe3'; e.currentTarget.style.boxShadow = 'none'; } }}>
        <div onClick={e => { e.stopPropagation(); onSelect?.(file.id); }} style={{ color: selected ? '#e85d26' : '#c4b8a4', cursor: 'pointer', flexShrink: 0, transition: 'color 0.15s' }}>
          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
          <Icon size={16} color={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            {file.starred && <Star size={12} fill="#d97706" color="#d97706" />}
            {file.share_token && <Share2 size={11} color="#c4b8a4" />}
          </div>
          <p style={{ fontSize: 11, color: '#9c8b74', marginTop: 2 }}>{fmtDate(file.created_at)} · {fmtSize(file.size)}</p>
        </div>
        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 600, flexShrink: 0 }}>{cfg.label}</span>
      </div>
    );
  }

  return (
    <div onContextMenu={handleCtx} onClick={handleClick} className="file-card" style={{
      borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
      background: 'white', border: `1.5px solid ${selected ? '#ffd4bc' : '#f0ebe3'}`,
      boxShadow: selected ? '0 0 0 3px rgba(232,93,38,0.12), 0 4px 16px rgba(26,18,8,0.06)' : '0 2px 8px rgba(26,18,8,0.04)',
      transition: 'all 0.2s ease', position: 'relative',
      transform: selected ? 'scale(0.97)' : 'scale(1)',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(26,18,8,0.1)'; e.currentTarget.style.borderColor = '#e8e0d4'; } }}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,18,8,0.04)'; e.currentTarget.style.borderColor = '#f0ebe3'; } }}>

      {/* Checkbox */}
      <div onClick={e => { e.stopPropagation(); onSelect?.(file.id); }} className="card-checkbox" style={{
        position: 'absolute', top: 8, left: 8, zIndex: 2,
        color: selected ? '#e85d26' : '#c4b8a4',
        opacity: selected ? 1 : 0, transition: 'opacity 0.15s',
      }}>
        {selected ? <CheckSquare size={17} /> : <Square size={17} />}
      </div>

      {/* Badges */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 4 }}>
        {file.starred && <div style={{ width: 22, height: 22, borderRadius: 6, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}><Star size={11} fill="#d97706" color="#d97706" /></div>}
        {file.share_token && <div style={{ width: 22, height: 22, borderRadius: 6, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}><Share2 size={11} color="#9c8b74" /></div>}
      </div>

      {/* Icon area */}
      <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${cfg.bg}, white)` }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${cfg.color}25`, border: `1px solid ${cfg.border}` }}>
          <Icon size={24} color={cfg.color} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }} title={file.name}>{file.name}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#9c8b74', fontWeight: 500 }}>{fmtSize(file.size)}</span>
          <span style={{ fontSize: 10, color: '#c4b8a4' }}>{fmtDate(file.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
