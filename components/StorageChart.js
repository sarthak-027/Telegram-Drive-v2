const CATS = [
  { key: 'image',    label: 'Images',    color: '#db2777' },
  { key: 'video',    label: 'Videos',    color: '#7c3aed' },
  { key: 'audio',    label: 'Audio',     color: '#d97706' },
  { key: 'pdf',      label: 'PDFs',      color: '#dc2626' },
  { key: 'document', label: 'Documents', color: '#2563eb' },
  { key: 'other',    label: 'Others',    color: '#94a3b8' },
];

const fmt = (b) => {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};

export default function StorageChart({ stats }) {
  if (!stats) return null;
  const counts = stats.byCategory || {};

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#c4b8a4', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Storage</p>
        <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#e85d26', fontWeight: 600 }}>{fmt(stats.totalSize)}</span>
      </div>

      {/* Segmented bar */}
      <div style={{ height: 6, borderRadius: 99, display: 'flex', overflow: 'hidden', marginBottom: 10, background: '#f0ebe3' }}>
        {CATS.map(({ key, color }) => {
          const pct = (counts[key] || 0) / Math.max(stats.total, 1) * 100;
          return pct > 0 ? <div key={key} style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }} /> : null;
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CATS.map(({ key, label, color }) => {
          const count = counts[key] || 0;
          if (!count) return null;
          const pct = Math.round(count / Math.max(stats.total, 1) * 100);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: '#9c8b74' }}>{label}</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#c4b8a4', fontWeight: 500 }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0ebe3', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#c4b8a4' }}>Total files</span>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#1a1208', fontWeight: 600 }}>{stats.total}</span>
      </div>
    </div>
  );
}
