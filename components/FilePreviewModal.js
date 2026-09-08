import { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, File } from 'lucide-react';

const NO_PREVIEW = ['document', 'other'];

export default function FilePreviewModal({ file, onClose, onDownload, allFiles = [] }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(allFiles.findIndex(f => f.id === file?.id));
  const currentFile = allFiles[currentIndex] || file;

  // Derive proxy URL directly — no fetch needed, no loading state
  const proxyUrl = currentFile ? `/api/files/proxy?id=${currentFile.id}` : null;

  const cat = currentFile?.category;
  const isImage = cat === 'image';
  const isVideo = cat === 'video';
  const isAudio = cat === 'audio';
  const isPDF = cat === 'pdf';
  const noPreview = NO_PREVIEW.includes(cat);

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [allFiles.length, currentIndex]);

  const prev = () => { setCurrentIndex(i => Math.max(0, i - 1)); resetView(); };
  const next = () => { setCurrentIndex(i => Math.min(allFiles.length - 1, i + 1)); resetView(); };
  const resetView = () => { setZoom(1); setRotation(0); };

  const fmtSize = (b) => {
    if (!b) return '—';
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1048576).toFixed(1)} MB`;
  };

  const ext = currentFile?.name?.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(6,6,10,0.97)', backdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <div onClick={e => e.stopPropagation()} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.03)', flexShrink: 0, gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={onClose} style={iconBtn}><X size={15}/></button>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40vw' }}>{currentFile?.name}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: 'monospace' }}>{fmtSize(currentFile?.size)} · {cat}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {isImage && (
            <>
              <button onClick={e => { e.stopPropagation(); setZoom(z => Math.max(0.25, z - 0.25)); }} style={iconBtn} title="Zoom out"><ZoomOut size={14}/></button>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', minWidth: 32, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={e => { e.stopPropagation(); setZoom(z => Math.min(5, z + 0.25)); }} style={iconBtn} title="Zoom in"><ZoomIn size={14}/></button>
              <button onClick={e => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }} style={iconBtn} title="Rotate"><RotateCw size={14}/></button>
              <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }}/>
            </>
          )}
          <button onClick={e => { e.stopPropagation(); onDownload?.(currentFile); }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 9, background: '#6c62f5', border: 'none', color: 'white',
            fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}>
            <Download size={13}/> Download
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div onClick={e => e.stopPropagation()} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
        // No padding for PDF/video so they fill the space
        padding: (isPDF || isVideo) ? 0 : 24,
      }}>

        {/* IMAGE — fit to screen, zoom from 1x */}
        {isImage && proxyUrl && (
          <div style={{
            width: '100%', height: '100%',
            overflow: zoom > 1 ? 'auto' : 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src={proxyUrl}
              alt={currentFile.name}
              style={{
                // Fit to screen at zoom=1, allow overflow when zoomed
                maxWidth: zoom === 1 ? '100%' : 'none',
                maxHeight: zoom === 1 ? '100%' : 'none',
                width: zoom === 1 ? 'auto' : `${zoom * 100}%`,
                objectFit: 'contain',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease',
                borderRadius: zoom === 1 ? 8 : 0,
                display: 'block',
              }}
            />
          </div>
        )}

        {/* VIDEO — fit to screen, no auto-download on mobile */}
        {isVideo && proxyUrl && (
          <video
            controls
            playsInline          // prevents auto-fullscreen on iOS
            preload="metadata"   // prevents auto-download on mobile
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              outline: 'none', background: '#000',
            }}
          >
            {/* Source tag instead of src attr — prevents mobile auto-download */}
            <source src={proxyUrl} type={currentFile.mime_type || 'video/mp4'}/>
          </video>
        )}

        {/* AUDIO */}
        {isAudio && proxyUrl && (
          <div style={{
            textAlign: 'center', padding: '48px 56px',
            background: 'rgba(255,255,255,0.04)', borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎵</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{currentFile.name}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24, fontFamily: 'monospace' }}>{fmtSize(currentFile.size)}</p>
            <audio
              controls
              preload="metadata"
              style={{ width: '100%', maxWidth: 320 }}
            >
              <source src={proxyUrl} type={currentFile.mime_type || 'audio/mpeg'}/>
            </audio>
          </div>
        )}

        {/* PDF — fill entire content area, fit to screen */}
        {isPDF && proxyUrl && (
          <iframe
            src={proxyUrl}
            title={currentFile.name}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}

        {/* No preview */}
        {(noPreview || (!isImage && !isVideo && !isAudio && !isPDF)) && (
          <div style={{ textAlign: 'center', padding: '48px 56px', background: 'rgba(255,255,255,0.03)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <File size={32} color="rgba(255,255,255,0.3)"/>
            </div>
            <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>.{ext}</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>No preview available</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This file type can't be previewed in the browser.<br/>Download it to open with the right app.</p>
            <button onClick={() => onDownload?.(currentFile)} style={{ padding: '10px 24px', borderRadius: 10, background: '#6c62f5', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
              Download to View
            </button>
          </div>
        )}

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button onClick={prev} style={navBtn('left')}><ChevronLeft size={20}/></button>
        )}
        {currentIndex < allFiles.length - 1 && (
          <button onClick={next} style={navBtn('right')}><ChevronRight size={20}/></button>
        )}
      </div>

      {/* Footer */}
      {allFiles.length > 1 && (
        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', flexShrink: 0, fontFamily: 'monospace' }}>
          {currentIndex + 1} / {allFiles.length} · ← → navigate · Esc close
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.6)', width: 32, height: 32, borderRadius: 8,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};

const navBtn = (side) => ({
  position: 'absolute', [side]: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.7)', width: 40, height: 40, borderRadius: 12,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
});
