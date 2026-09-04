import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, CheckCircle, AlertCircle, Loader, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB

export default function UploadZone({ onUploadComplete }) {
  const [uploads, setUploads] = useState([]);

  const uploadFile = async (file) => {
    const id = Date.now() + Math.random();
    setUploads(prev => [...prev, { id, name: file.name, size: file.size, status: 'uploading', progress: 0 }]);

    try {
      // Use FormData instead of base64 — no encoding overhead, direct stream
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      formData.append('mimeType', file.type || 'application/octet-stream');
      formData.append('size', file.size);

      // Track upload progress with XMLHttpRequest
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90); // 90% = upload done, 10% = Telegram processing
            setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: pct } : u));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'done', progress: 100 } : u));
              onUploadComplete?.(result.file);
              toast.success(`${file.name} uploaded!`);
              setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 2500);
              resolve(result);
            } catch {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.timeout = 5 * 60 * 1000; // 5 min timeout for large files

        xhr.send(formData);
      });

    } catch (err) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error: err.message } : u));
      toast.error(`Failed: ${err.message}`);
    }
  };

  const onDrop = useCallback((accepted, rejected) => {
    rejected.forEach(({ file }) => toast.error(`${file.name} is too large (max 2GB)`));
    accepted.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxSize: MAX_FILE_SIZE, multiple: true });

  const fmtSize = (b) => {
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
    if (b < 1073741824) return `${(b/1048576).toFixed(1)} MB`;
    return `${(b/1073741824).toFixed(2)} GB`;
  };

  return (
    <div>
      <div {...getRootProps()} style={{
        borderRadius: 16, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
        border: `1.5px dashed ${isDragActive ? '#6c62f5' : 'rgba(255,255,255,0.1)'}`,
        background: isDragActive ? 'rgba(108,98,245,0.08)' : 'rgba(255,255,255,0.03)',
        transition: 'all 0.2s ease',
      }}>
        <input {...getInputProps()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: isDragActive ? 'rgba(108,98,245,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isDragActive ? 'rgba(108,98,245,0.4)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDragActive ? '0 8px 24px rgba(108,98,245,0.3)' : 'none',
            transition: 'all 0.2s', transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
          }}>
            <CloudUpload size={22} color={isDragActive ? '#9b8cf8' : 'rgba(255,255,255,0.3)'}/>
          </div>
          <div>
            <p style={{ fontWeight: 600, color: isDragActive ? '#9b8cf8' : 'rgba(255,255,255,0.7)', marginBottom: 4, fontSize: 14 }}>
              {isDragActive ? 'Drop it!' : 'Drop files or click to upload'}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Any file type — up to 2GB per file</p>
          </div>
        </div>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {uploads.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginLeft: 8, fontFamily: 'JetBrains Mono, monospace' }}>{fmtSize(u.size)}</span>
                </div>
                {u.status === 'uploading' && (
                  <div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${u.progress}%`, background: 'linear-gradient(90deg, #6c62f5, #9b8cf8)', borderRadius: 99, transition: 'width 0.3s' }}/>
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                      {u.progress < 90 ? `Uploading ${u.progress}%` : 'Processing on Telegram…'}
                    </p>
                  </div>
                )}
                {u.status === 'error' && <p style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>{u.error}</p>}
              </div>
              {u.status === 'uploading' && <Loader size={15} color="#6c62f5" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}/>}
              {u.status === 'done' && <CheckCircle size={15} color="#34d399" style={{ flexShrink: 0 }}/>}
              {u.status === 'error' && <X size={15} color="#f87171" style={{ flexShrink: 0 }}/>}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
