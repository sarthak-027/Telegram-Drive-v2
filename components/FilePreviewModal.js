import { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

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
    fetch(`/api/files/download?id=${currentFile.id}`)
      .then(r => r.json()).then(d => { setUrl(d.url); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentFile?.id]);

  const cat = currentFile?.category;
  const isImage = cat === 'image';
  const isVideo = cat === 'video';
  const isAudio = cat === 'audio';
  const isPDF = cat === 'pdf';

  const fmtSize = (b) => { if (!b) return '—'; if (b < 1048576) return `${(b/1024).toFixed(1)} KB`; return `${(b/1048576).toFixed(1)} MB`; };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(250,248,245,0.95)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #ede8e0', background: 'white', flexShrink: 0, boxShadow: '0 1px 4px rgba(26,18,8,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={onClose} style={{ background: '#faf7f3', border: '1px solid #ede8e0', color: '#5c4f3a', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={15} />
          </button>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentFile?.name}</p>
            <p style={{ fontSize: 11, color: '#9c8b74', marginTop: 2 }}>{fmtSize(currentFile?.size)} · {currentFile?.category}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {isImage && <>
            <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.3, z - 0.2)); }} style={btnStyle}><ZoomOut size={14}/></button>
            <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.2)); }} style={btnStyle}><ZoomIn size={14}/></button>
            <button onClick={e => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }} style={btnStyle}><RotateCw size={14}/></button>
          </>}
          <button onClick={e => { e.stopPropagation(); onDownload?.(currentFile); }} style={{ ...btnStyle, background: 'linear-gradient(135deg, #e85d26, #f0833a)', color: 'white', border: 'none', fontWeight: 600 }}>
            <Download size={14}/> <span style={{ marginLeft: 4, fontSize: 12 }}>Download</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: 24 }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '2.5px solid #f0ebe3', borderTopColor: '#e85d26', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#9c8b74' }}>Loading preview…</p>
          </div>
        )}
        {!loading && url && isImage && (
          <img src={url} alt={currentFile.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.2s ease', borderRadius: 12, boxShadow: '0 20px 60px rgba(26,18,8,0.12)' }} />
        )}
        {!loading && url && isVideo && (
          <video controls src={url} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 16, outline: 'none', boxShadow: '0 20px 60px rgba(26,18,8,0.12)' }} autoPlay />
        )}
        {!loading && url && isAudio && (
          <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 24, border: '1px solid #ede8e0', boxShadow: '0 20px 60px rgba(26,18,8,0.08)' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎵</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1208', marginBottom: 4 }}>{currentFile.name}</p>
            <p style={{ fontSize: 13, color: '#9c8b74', marginBottom: 24 }}>{fmtSize(currentFile.size)}</p>
            <audio controls src={url} style={{ width: 320 }} autoPlay />
          </div>
        )}
        {!loading && url && isPDF && (
          <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12, boxShadow: '0 8px 32px rgba(26,18,8,0.1)' }} title={currentFile.name} />
        )}
        {!loading && !url && (
          <div style={{ textAlign: 'center', padding: 48, background: 'white', borderRadius: 24, border: '1px solid #ede8e0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📎</div>
            <p style={{ color: '#9c8b74', fontSize: 14, marginBottom: 20 }}>Preview not available for this file type.</p>
            <button onClick={() => onDownload?.(currentFile)} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #e85d26, #f0833a)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Download to View</button>
          </div>
        )}

        {currentIndex > 0 && (
          <button onClick={() => setCurrentIndex(i => i - 1)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', ...navBtn }}><ChevronLeft size={20}/></button>
        )}
        {currentIndex < allFiles.length - 1 && (
          <button onClick={() => setCurrentIndex(i => i + 1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', ...navBtn }}><ChevronRight size={20}/></button>
        )}
      </div>

      {allFiles.length > 1 && (
        <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: '#9c8b74', borderTop: '1px solid #f0ebe3', background: 'white', flexShrink: 0 }}>
          {currentIndex + 1} / {allFiles.length} · ← → to navigate · Esc to close
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const btnStyle = { background: '#faf7f3', border: '1px solid #ede8e0', color: '#5c4f3a', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 13, gap: 4, transition: 'all 0.15s' };
const navBtn = { background: 'white', border: '1px solid #ede8e0', color: '#5c4f3a', width: 40, height: 40, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(26,18,8,0.1)' };
