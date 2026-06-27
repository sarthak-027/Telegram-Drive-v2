import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Loader, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function UploadZone({ onUploadComplete }) {
  const [uploads, setUploads] = useState([]);

  const uploadFile = async (file) => {
    const id = Date.now() + Math.random();
    setUploads(prev => [...prev, { id, name: file.name, size: file.size, status: 'uploading', progress: 0 }]);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 50 } : u));
      const res = await fetch('/api/files/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, data: base64 }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed'); }
      const result = await res.json();
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'done', progress: 100 } : u));
      onUploadComplete?.(result.file);
      toast.success(`${file.name} uploaded!`);
      setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 2000);
    } catch (err) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error: err.message } : u));
      toast.error(`Failed: ${file.name}`);
    }
  };

  const onDrop = useCallback((accepted, rejected) => {
    rejected.forEach(({ file, errors }) => { if (errors[0]?.code === 'file-too-large') toast.error(`${file.name} is too large (max 50MB)`); });
    accepted.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxSize: MAX_FILE_SIZE, multiple: true });

  const fmtSize = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div>
      <div {...getRootProps()} style={{
        borderRadius: 16, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
        border: `2px dashed ${isDragActive ? '#e85d26' : '#e8e0d4'}`,
        background: isDragActive ? '#fff7f3' : '#faf8f5',
        transition: 'all 0.2s ease',
      }}>
        <input {...getInputProps()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: isDragActive ? 'linear-gradient(135deg, #e85d26, #f0833a)' : 'white', border: `1.5px solid ${isDragActive ? 'transparent' : '#e8e0d4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isDragActive ? '0 8px 24px rgba(232,93,38,0.3)' : '0 2px 8px rgba(26,18,8,0.06)', transition: 'all 0.2s', transform: isDragActive ? 'scale(1.1)' : 'scale(1)' }}>
            <CloudUpload size={24} color={isDragActive ? 'white' : '#9c8b74'} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: isDragActive ? '#e85d26' : '#1a1208', marginBottom: 4, fontSize: 15 }}>{isDragActive ? 'Drop it like it\'s hot 🔥' : 'Drop files or click to upload'}</p>
            <p style={{ fontSize: 13, color: '#9c8b74' }}>Images, Videos, Audio, PDFs, Documents — up to 50MB</p>
          </div>
        </div>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {uploads.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'white', border: '1px solid #f0ebe3', boxShadow: '0 2px 8px rgba(26,18,8,0.04)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1208', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                  <span style={{ fontSize: 11, color: '#9c8b74', flexShrink: 0, marginLeft: 8 }}>{fmtSize(u.size)}</span>
                </div>
                {u.status === 'uploading' && (
                  <div style={{ height: 4, borderRadius: 99, background: '#f0ebe3', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${u.progress}%`, background: 'linear-gradient(90deg, #e85d26, #f0833a)', borderRadius: 99, transition: 'width 0.3s' }} />
                  </div>
                )}
                {u.status === 'error' && <p style={{ fontSize: 11, color: '#dc2626' }}>{u.error}</p>}
              </div>
              {u.status === 'uploading' && <Loader size={16} color="#e85d26" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
              {u.status === 'done' && <CheckCircle size={16} color="#2d9e6b" style={{ flexShrink: 0 }} />}
              {u.status === 'error' && <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
