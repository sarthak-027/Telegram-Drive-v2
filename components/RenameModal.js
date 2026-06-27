import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function RenameModal({ file, onConfirm, onClose }) {
  const [name, setName] = useState(file?.name || '');
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    const dotIdx = name.lastIndexOf('.');
    if (dotIdx > 0) inputRef.current?.setSelectionRange(0, dotIdx);
    else inputRef.current?.select();
  }, []);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(250,248,245,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', border: '1px solid #ede8e0', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 32px 80px rgba(26,18,8,0.14)', animation: 'fadeIn 0.18s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1208', fontFamily: "'Clash Display', sans-serif" }}>Rename File</h3>
          <button onClick={onClose} style={{ background: '#faf7f3', border: '1px solid #ede8e0', color: '#9c8b74', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (name.trim()) onConfirm(name.trim()); }}>
          <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 11, background: '#faf7f3', border: '1.5px solid #ede8e0', color: '#1a1208', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 18, transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#e85d26'}
            onBlur={e => e.target.style.borderColor = '#ede8e0'}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, background: '#faf7f3', border: '1px solid #ede8e0', color: '#5c4f3a', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={!name.trim()} style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #e85d26, #f0833a)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(232,93,38,0.25)' }}>Rename</button>
          </div>
        </form>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
