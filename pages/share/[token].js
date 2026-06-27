import { useState } from 'react';
import Head from 'next/head';
import { Download, File, Image, Video, Music, FileText } from 'lucide-react';

const catConfig = {
  image: { icon: Image, color: '#f472b6', emoji: '🖼️' },
  video: { icon: Video, color: '#a78bfa', emoji: '🎬' },
  audio: { icon: Music, color: '#fb923c', emoji: '🎵' },
  pdf:   { icon: FileText, color: '#f87171', emoji: '📄' },
  other: { icon: File, color: '#94a3b8', emoji: '📎' },
};

const fmtSize = (b) => {
  if (!b) return '—';
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
};

export default function SharePage({ file, url, error }) {
  const [downloading, setDownloading] = useState(false);

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#030507', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <h1 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>Link not found</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>This share link may have been removed.</p>
      </div>
    </div>
  );

  const cfg = catConfig[file.category] || catConfig.other;
  const Icon = cfg.icon;

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = url; a.download = file.name; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <>
      <Head>
        <title>{file.name} — TeleDrive</title>
        <meta name="description" content={`Download ${file.name} via TeleDrive`} />
      </Head>
      <div style={{ minHeight: '100vh', background: '#030507', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#030507" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>TeleDrive</span>
          </div>

          {/* File card */}
          <div style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px', marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
              {cfg.emoji}
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, wordBreak: 'break-word' }}>{file.name}</h1>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{file.category}</span>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{fmtSize(file.size)}</span>
            </div>
            <button onClick={handleDownload} disabled={downloading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 0', borderRadius: 12, background: '#2dd4bf', border: 'none',
              color: '#030507', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Download size={18} /> {downloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
            Shared via <a href="/" style={{ color: '#2dd4bf', textDecoration: 'none' }}>TeleDrive</a> — Free unlimited storage using Telegram
          </p>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { token } = params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/files/share?token=${token}`);
    if (!res.ok) return { props: { error: true } };
    const data = await res.json();
    return { props: { file: data.file, url: data.url } };
  } catch {
    return { props: { error: true } };
  }
}
