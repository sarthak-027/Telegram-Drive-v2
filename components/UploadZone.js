import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, CheckCircle, Loader, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_SIZE = 2000 * 1024 * 1024; // 2GB

function getCategoryFromMime(mimeType) {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document') ||
      mimeType.includes('text/') || mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')) return 'document';
  return 'other';
}

function extractFileId(message) {
  if (message.photo) return message.photo[message.photo.length - 1].file_id;
  if (message.video) return message.video.file_id;
  if (message.audio) return message.audio.file_id;
  if (message.document) return message.document.file_id;
  return null;
}

export default function UploadZone({ onUploadComplete }) {
  const [uploads, setUploads] = useState([]);

  const uploadFile = async (file) => {
    const id = Date.now() + Math.random();
    setUploads(prev => [...prev, { id, name: file.name, size: file.size, status: 'uploading', progress: 0 }]);

    const updateProgress = (p) => setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: p } : u));
    const setDone = (fileRecord) => {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'done', progress: 100 } : u));
      onUploadComplete?.(fileRecord);
      toast.success(`${file.name} uploaded!`);
      setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 2500);
    };
    const setError = (msg) => {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', error: msg } : u));
      toast.error(`Failed: ${msg}`);
    };

    try {
      // Step 1 — get bot credentials from our server
      const credsRes = await fetch('/api/files/upload-direct');
      if (!credsRes.ok) throw new Error('Could not get upload credentials');
      const { token, chatId } = await credsRes.json();

      // Step 2 — upload directly from browser to Telegram
      const mimeType = file.type || 'application/octet-stream';
      const category = getCategoryFromMime(mimeType);

      const method = 'sendDocument';
const fieldName = 'document';

      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append(fieldName, file, file.name);
      formData.append('caption', `📁 ${file.name}`);

      updateProgress(10);

      // XHR so we get real upload progress
      const telegramResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.telegram.org/bot${token}/${method}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 85) + 10;
            updateProgress(Math.min(pct, 95));
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.ok) resolve(data.result);
            else reject(new Error(data.description || 'Telegram upload failed'));
          } catch {
            reject(new Error('Invalid Telegram response'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.timeout = 10 * 60 * 1000; // 10 min for large files
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.send(formData);
      });

      updateProgress(96);

      // Step 3 — save metadata to our server (tiny request, no 413 risk)
      const telegramFileId = extractFileId(telegramResult);
      if (!telegramFileId) throw new Error('Could not get file ID from Telegram');

      const saveRes = await fetch('/api/files/upload-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mimeType,
          size: file.size,
          telegramFileId,
          messageId: telegramResult.message_id,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Failed to save file metadata');
      }

      const { file: fileRecord } = await saveRes.json();
      setDone(fileRecord);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    }
  };

  const onDrop = useCallback((accepted, rejected) => {
    rejected.forEach(({ file }) => toast.error(`${file.name} is too large (max 2GB)`));
    accepted.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxSize: MAX_SIZE, multiple: true,
  });

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
        <input {...getInputProps()}/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: isDragActive ? 'rgba(108,98,245,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isDragActive ? 'rgba(108,98,245,0.4)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: isDragActive ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.2s',
          }}>
            <CloudUpload size={22} color={isDragActive ? '#9b8cf8' : 'rgba(255,255,255,0.3)'}/>
          </div>
          <div>
            <p style={{ fontWeight: 600, color: isDragActive ? '#9b8cf8' : 'rgba(255,255,255,0.7)', marginBottom: 4, fontSize: 14 }}>
              {isDragActive ? 'Drop it!' : 'Drop files or click to upload'}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Any file type — up to 2GB · Direct to Telegram</p>
          </div>
        </div>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {uploads.map(u => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 12, background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${u.status === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginLeft: 8, fontFamily: 'monospace' }}>{fmtSize(u.size)}</span>
                </div>
                {u.status === 'uploading' && (
                  <div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${u.progress}%`, background: 'linear-gradient(90deg,#6c62f5,#9b8cf8)', borderRadius: 99, transition: 'width 0.4s ease' }}/>
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, fontFamily: 'monospace' }}>
                      {u.progress < 95 ? `Uploading to Telegram ${u.progress}%` : 'Saving…'}
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
