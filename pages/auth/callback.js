// pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Extract code from URL and send to our API
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      window.location.href = `/api/auth/google?code=${code}`;
    } else {
      router.replace('/');
    }
  }, []);

  return (
    <div style={{
      background: '#030507', height: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <svg width="90" height="90" viewBox="0 0 90 90" style={{ animation: 'spin 1.4s linear infinite' }}>
        <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(45,212,191,0.1)" strokeWidth="3" />
        <circle cx="45" cy="45" r="40" fill="none" stroke="#2dd4bf" strokeWidth="3"
          strokeDasharray="251" strokeDashoffset="188" strokeLinecap="round" />
      </svg>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'sans-serif' }}>
        Completing sign in…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}