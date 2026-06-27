import { useState } from 'react';
import { X, Copy, Check, Link, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShareModal({ file, onClose, onUpdate }) {
  const [shareUrl, setShareUrl] = useState(file?.share_token ? `${window.location.origin}/share/${file.share_token}` : null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const createLink = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id }) });
      const d = await res.json();
      setShareUrl(d.url); onUpdate?.({ ...file, share_token: d.token });
      toast.success('Share link created!');
    } catch { toast.error('Failed'); }
    setLoading(false);
  };
  const removeLink = async () => {
    setLoading(true);
    try {
      await fetch('/api/files/share', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id }) });
      setShareUrl(null); onUpdate?.({ ...file, share_token: null });
      toast.success('Link removed');
    } catch { toast.error('Failed'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(250,248,245,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', border: '1px solid #ede8e0', borderRadius: 20, padding: 28, width: 440, boxShadow: '0 32px 80px rgba(26,18,8,0.14)', animation: 'fadeIn 0.18s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1208', fontFamily: "'Clash Display', sans-serif" }}>Share File</h3>
            <p style={{ fontSize: 12, color: '#9c8b74', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{file?.name}</p>
          </div>
          <button onClick={onClose} style={{ background: '#faf7f3', border: '1px solid #ede8e0', color: '#9c8b74', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={14}/></button>
        </div>
        {shareUrl ? (
          <>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>✓ Share link is active</p>
              <p style={{ fontSize: 11, color: '#4ade80' }}>Anyone with this link can download the file</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input readOnly value={shareUrl} style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: '#faf7f3', border: '1px solid #ede8e0', color: '#9c8b74', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
              <button onClick={copy} style={{ padding: '9px 14px', borderRadius: 10, background: copied ? '#f0fdf4' : '#faf7f3', border: `1px solid ${copied ? '#bbf7d0' : '#ede8e0'}`, color: copied ? '#16a34a' : '#5c4f3a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', fontWeight: 500, flexShrink: 0 }}>
                {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={removeLink} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              <Unlink size={13}/> Remove link
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#9c8b74', marginBottom: 24, lineHeight: 1.65 }}>Create a public link so anyone can download this file — no login required.</p>
            <button onClick={createLink} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #e85d26, #f0833a)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(232,93,38,0.25)' }}>
              <Link size={15}/> {loading ? 'Creating…' : 'Create Share Link'}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
