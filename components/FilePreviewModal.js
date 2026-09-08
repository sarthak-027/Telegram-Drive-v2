import { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, FileText, File } from 'lucide-react';

const NO_PREVIEW_TYPES = ['document', 'other'];

export default function FilePreviewModal({ file, onClose, onDownload, allFiles = [] }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(allFiles.findIndex(f => f.id === file?.id));
  const currentFile = allFiles[currentIndex] || file;

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(allFiles.length - 1, i + 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [allFiles.length]);

  useEffect(() => {
    if (!currentFile) return;
    setLoading(true); setUrl(null); setZoom(1); setRotation(0);
    // Use proxy URL directly — no CORS issues
    setUrl(`/api/files/proxy?id=${currentFile.id}`);
    setLoading(false);
  }, [currentFile?.id]);

  const cat = currentFile?.category;
  const isImage = cat === 'image';
  const isVideo = cat === 'video';
  const isAudio = cat === 'audio';
  const isPDF = cat === 'pdf';
  const noPreview = NO_PREVIEW_TYPES.includes(cat);

  const fmtSize = (b) => {
    if (!b) return '—';
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1048576).toFixed(1)} MB`;
  };

  const ext = currentFile?.name?.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(8,8,12,0.96)', backdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.03)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={15}/>
          </button>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFile?.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: 'JetBrains Mono, monospace' }}>
              {fmtSize(currentFile?.size)} · {currentFile?.category}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {isImage && <>
            <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.3, z - 0.25)); }} style={iconBtnStyle} title="Zoom out"><ZoomOut size={14}/></button>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace', minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(4, z + 0.25)); }} style={iconBtnStyle} title="Zoom in"><ZoomIn size={14}/></button>
            <button onClick={e => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }} style={iconBtnStyle} title="Rotate"><RotateCw size={14}/></button>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}/>
          </>}
          <button onClick={e => { e.stopPropagation(); onDownload?.(currentFile); }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 9, background: '#6c62f5', border: 'none', color: 'white',
            fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(108,98,245,0.4)',
          }}>
            <Download size={13}/> Download
          </button>
        </div>
      </div>

      {/* Content */}
      <div onClick={e => e.stopPropagation()} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative', padding: 24,
      }}>
        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(108,98,245,0.2)" strokeWidth="3"/>
              <circle cx="20" cy="20" r="16" fill="none" stroke="#6c62f5" strokeWidth="3" strokeDasharray="100" strokeDashoffset="75" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Loading preview…</p>
          </div>
        )}

        {/* Image */}
        {!loading && url && isImage && (
          <div style={{ overflow: 'auto', maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={url} alt={currentFile.name} style={{
              maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
              borderRadius: 12,
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}/>
          </div>
        )}

        {/* Video */}
        {!loading && url && isVideo && (
          <video controls src={url} autoPlay style={{
            maxWidth: '100%', maxHeight: '100%',
            borderRadius: 16, outline: 'none',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}/>
        )}

        {/* Audio */}
        {!loading && url && isAudio && (
          <div style={{
            textAlign: 'center', padding: '48px 56px',
            background: 'rgba(255,255,255,0.04)', borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 22, margin: '0 auto 24px',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
            }}>🎵</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{currentFile.name}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28, fontFamily: 'JetBrains Mono, monospace' }}>{fmtSize(currentFile.size)}</p>
            <audio controls src={url} autoPlay style={{ width: 320, accentColor: '#6c62f5' }}/>
          </div>
        )}

        {/* PDF — direct embed, no Google Docs */}
        {!loading && url && isPDF && (
          <iframe
            src={url}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
            title={currentFile.name}
          />
        )}

        {/* No preview available */}
        {!loading && (noPreview || (!isImage && !isVideo && !isAudio && !isPDF)) && (
          <div style={{
            textAlign: 'center', padding: '56px 64px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 22, margin: '0 auto 24px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <File size={36} color="rgba(255,255,255,0.3)"/>
            </div>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>.{ext}</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No preview available</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              This file type can't be previewed in the browser.<br/>Download it to open with the right app.
            </p>
            <button onClick={() => onDownload?.(currentFile)} style={{
              padding: '11px 28px', borderRadius: 10, background: '#6c62f5',
              border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer',
              fontSize: 14, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(108,98,245,0.4)',
            }}>
              <Download size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
              Download to View
            </button>
          </div>
        )}

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button onClick={() => setCurrentIndex(i => i - 1)} style={navBtnStyle('left')}>
            <ChevronLeft size={20}/>
          </button>
        )}
        {currentIndex < allFiles.length - 1 && (
          <button onClick={() => setCurrentIndex(i => i + 1)} style={navBtnStyle('right')}>
            <ChevronRight size={20}/>
          </button>
        )}
      </div>

      {/* Footer */}
      {allFiles.length > 1 && (
        <div style={{
          textAlign: 'center', padding: '10px 0', fontSize: 11,
          color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)', flexShrink: 0,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {currentIndex + 1} / {allFiles.length} · ← → navigate · Esc close
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const iconBtnStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.6)', width: 32, height: 32, borderRadius: 8,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};

const navBtnStyle = (side) => ({
  position: 'absolute', [side]: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.7)', width: 42, height: 42, borderRadius: 12,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'all 0.15s',
});
