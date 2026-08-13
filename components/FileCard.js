import { Star, Share2, CheckSquare, Square, Image, Video, Music, FileText, File } from 'lucide-react';

const catConfig = {
  image:    { icon: Image,    color: '#f472b6', glow: 'rgba(244,114,182,0.3)',  label: 'IMG'  },
  video:    { icon: Video,    color: '#a78bfa', glow: 'rgba(167,139,250,0.3)',  label: 'VID'  },
  audio:    { icon: Music,    color: '#fbbf24', glow: 'rgba(251,191,36,0.3)',   label: 'AUD'  },
  pdf:      { icon: FileText, color: '#f87171', glow: 'rgba(248,113,113,0.3)',  label: 'PDF'  },
  document: { icon: FileText, color: '#60a5fa', glow: 'rgba(96,165,250,0.3)',   label: 'DOC'  },
  other:    { icon: File,     color: '#94a3b8', glow: 'rgba(148,163,184,0.3)',  label: 'FILE' },
};

const fmtSize = (b) => {
  if (!b) return '—';
  if (b < 1048576) return `${(b/1024).toFixed(1)}KB`;
  return `${(b/1048576).toFixed(1)}MB`;
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
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
        borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
        background: selected ? 'rgba(108,98,245,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? 'rgba(108,98,245,0.3)' : 'rgba(255,255,255,0.07)'}`,
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}}>
        <div onClick={e => { e.stopPropagation(); onSelect?.(file.id); }} style={{ color: selected ? '#6c62f5' : 'rgba(255,255,255,0.2)', cursor: 'pointer', flexShrink: 0 }}>
          {selected ? <CheckSquare size={15}/> : <Square size={15}/>}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, flexShrink: 0, boxShadow: `0 0 12px ${cfg.glow}` }}>
          <Icon size={16} color={cfg.color}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            {file.starred && <Star size={11} fill="#fbbf24" color="#fbbf24"/>}
            {file.share_token && <Share2 size={10} color="rgba(255,255,255,0.25)"/>}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{fmtDate(file.created_at)} · {fmtSize(file.size)}</p>
        </div>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25`, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>{cfg.label}</span>
      </div>
    );
  }

  return (
    <div onContextMenu={handleCtx} onClick={handleClick} className="file-card" style={{
      borderRadius: 18, overflow: 'hidden', cursor: 'pointer', position: 'relative',
      background: selected ? 'rgba(108,98,245,0.1)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${selected ? 'rgba(108,98,245,0.35)' : 'rgba(255,255,255,0.07)'}`,
      transition: 'all 0.25s ease',
      boxShadow: selected ? `0 0 0 2px rgba(108,98,245,0.3), 0 8px 32px rgba(0,0,0,0.4)` : '0 2px 12px rgba(0,0,0,0.2)',
    }}
    onMouseEnter={e => { if (!selected) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${cfg.color}40`; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 20px ${cfg.glow}`; }}}
    onMouseLeave={e => { if (!selected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)'; }}}>

      {/* Checkbox */}
      <div onClick={e => { e.stopPropagation(); onSelect?.(file.id); }} className="card-checkbox" style={{
        position: 'absolute', top: 10, left: 10, zIndex: 2,
        color: selected ? '#6c62f5' : 'rgba(255,255,255,0.4)',
        opacity: selected ? 1 : 0, transition: 'opacity 0.15s',
      }}>
        {selected ? <CheckSquare size={16}/> : <Square size={16}/>}
      </div>

      {/* Badges */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex', gap: 4 }}>
        {file.starred && <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={10} fill="#fbbf24" color="#fbbf24"/></div>}
        {file.share_token && <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={10} color="rgba(255,255,255,0.5)"/></div>}
      </div>

      {/* Icon area */}
      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: `radial-gradient(circle at 50% 60%, ${cfg.color}18, transparent 70%)` }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${cfg.glow}, transparent 65%)`, opacity: 0.6 }}/>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`, position: 'relative', zIndex: 1 }}>
          <Icon size={24} color={cfg.color}/>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }} title={file.name}>{file.name}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: cfg.color, fontWeight: 600 }}>{fmtSize(file.size)}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtDate(file.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
