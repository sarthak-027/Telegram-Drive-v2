import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// ─── Login Loading Overlay ────────────────────────────────────────────────────
function LoginOverlay({ user }) {
  const [step, setStep] = useState(0);

  const steps = [
    { label: 'Verifying Google identity…', icon: '🔐' },
    { label: 'Setting up your session…',      icon: '⚙️' },
    { label: 'Loading your drive…',            icon: '☁️' },
    { label: 'Welcome, ' + (user?.first_name || 'you') + '!', icon: '✅' },
  ];

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i >= steps.length) { clearInterval(iv); return; }
      setStep(i);
    }, 700);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#030507',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      {/* Animated ring */}
      <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 36 }}>
        <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute', inset: 0, animation: 'spinRing 1.4s linear infinite' }}>
          <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(45,212,191,0.1)" strokeWidth="3" />
          <circle cx="45" cy="45" r="40" fill="none" stroke="#2dd4bf" strokeWidth="3"
            strokeDasharray="251" strokeDashoffset="188"
            strokeLinecap="round" />
        </svg>
        {/* Avatar or icon */}
        {user?.photo_url ? (
          <img src={user.photo_url} alt=""
            style={{ position: 'absolute', inset: 10, width: 70, height: 70, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            background: 'rgba(45,212,191,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
          }}>
            {steps[step].icon}
          </div>
        )}
      </div>

      {/* Name */}
      {user?.first_name && (
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.3px' }}>
          {user.first_name} {user.last_name || ''}
        </div>
      )}
      {user?.username && (
        <div style={{ fontSize: 13, color: '#2dd4bf', marginBottom: 32, opacity: 0.7 }}>
          @{user.username}
        </div>
      )}

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: i <= step ? 1 : 0.2,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: i < step ? '#2dd4bf' : i === step ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.05)',
              border: i === step ? '1.5px solid #2dd4bf' : '1.5px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.4s ease',
            }}>
              {i < step
                ? <svg width="10" height="10" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#030507" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                : i === step
                ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', animation: 'pulseDot 1s ease infinite' }} />
                : null}
            </div>
            <span style={{ fontSize: 13, color: i <= step ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)', transition: 'color 0.4s ease', fontWeight: i === step ? 600 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spinRing { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const loginRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);
  const heroRef = useRef(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginUser, setLoginUser] = useState(null);

  useEffect(() => {
    window.onTelegramAuth = async (userData) => {
      setLoginUser(userData);
      setLoggingIn(true);
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        if (res.ok) {
          // Wait for the step animation to finish (4 steps × 700ms = 2.8s)
          await new Promise(r => setTimeout(r, 2800));
          router.push('/dashboard');
        } else {
          setLoggingIn(false);
          setLoginUser(null);
          alert('Login failed. Please try again.');
        }
      } catch {
        setLoggingIn(false);
        setLoginUser(null);
        alert('Something went wrong.');
      }
    };
    if (loginRef.current && !loginRef.current.hasChildNodes()) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_BOT_USERNAME);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-radius', '14');
      script.async = true;
      loginRef.current.appendChild(script);
    }
  }, []);

  // Glitch interval
  useEffect(() => {
    const iv = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 300);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // Custom cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = cursorDotRef.current;
    if (!cursor || !dot) return;
    let mx = 0, my = 0, cx = 0, cy = 0;
    const moveCursor = (e) => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; };
    const animCursor = () => {
      cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
      cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px';
      requestAnimationFrame(animCursor);
    };
    document.addEventListener('mousemove', moveCursor);
    animCursor();
    return () => document.removeEventListener('mousemove', moveCursor);
  }, []);

  // Spotlight effect on hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const move = (e) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      hero.style.setProperty('--mx', x + '%');
      hero.style.setProperty('--my', y + '%');
    };
    hero.addEventListener('mousemove', move);
    return () => hero.removeEventListener('mousemove', move);
  }, []);

  // Canvas particle network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, mouse = { x: -999, y: -999 };
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    const NUM = 80;
    const nodes = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        const dm = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (dm < 120) { n.x += (n.x - mouse.x) * 0.015; n.y += (n.y - mouse.y) * 0.015; }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45,212,191,0.5)';
        ctx.fill();
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(45,212,191,${(1 - d / 130) * 0.18})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const files = [
    { icon: '🖼️', name: 'vacation-2024.jpg', size: '4.2 MB', color: '#f472b6' },
    { icon: '🎬', name: 'intro-reel.mp4', size: '128 MB', color: '#a78bfa' },
    { icon: '📄', name: 'resume-final.pdf', size: '340 KB', color: '#f87171' },
    { icon: '🎵', name: 'podcast-ep01.mp3', size: '62 MB', color: '#fb923c' },
    { icon: '📁', name: 'project-docs.zip', size: '18 MB', color: '#60a5fa' },
    { icon: '🖼️', name: 'design-kit.png', size: '8.1 MB', color: '#34d399' },
  ];

  return (
    <>
      {loggingIn && <LoginOverlay user={loginUser} />}

      <Head>
        <title>TeleDrive — Unlimited Cloud Storage</title>
        <meta name="description" content="Store unlimited files free using Telegram's cloud. Beautiful organization for everything." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #030507; color: #e4e8ee; font-family: 'Space Grotesk', sans-serif; cursor: none; overflow-x: hidden; }
        ::selection { background: rgba(45,212,191,0.25); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #030507; } ::-webkit-scrollbar-thumb { background: rgba(45,212,191,0.25); border-radius: 99px; }

        .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }

        #cursor { position: fixed; width: 40px; height: 40px; border: 1.5px solid rgba(45,212,191,0.6); border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%,-50%); transition: width 0.2s, height 0.2s, background 0.2s; mix-blend-mode: screen; }
        #cursor-dot { position: fixed; width: 6px; height: 6px; background: #2dd4bf; border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%,-50%); }
        a:hover ~ #cursor, button:hover ~ #cursor { width: 60px; height: 60px; background: rgba(45,212,191,0.08); }

        .hero-bg { --mx: 50%; --my: 50%; background: radial-gradient(600px circle at var(--mx) var(--my), rgba(45,212,191,0.06), transparent 60%); }

        @keyframes glitch1 { 0%,100%{clip-path:inset(0 0 95% 0);transform:translate(-4px,0)} 50%{clip-path:inset(0 0 95% 0);transform:translate(4px,0)} }
        @keyframes glitch2 { 0%,100%{clip-path:inset(80% 0 0 0);transform:translate(4px,0)} 50%{clip-path:inset(80% 0 0 0);transform:translate(-4px,0)} }
        @keyframes glitch3 { 0%,100%{clip-path:inset(40% 0 40% 0);transform:translate(-3px,2px)} 50%{clip-path:inset(40% 0 40% 0);transform:translate(3px,-2px)} }
        .glitch-wrap { position: relative; display: inline-block; }
        .glitch-wrap::before, .glitch-wrap::after { content: attr(data-text); position: absolute; inset: 0; }
        .glitch-wrap.active::before { color: #ff006e; animation: glitch1 0.15s steps(1) 3; }
        .glitch-wrap.active::after { color: #00f5d4; animation: glitch2 0.15s steps(1) 3; }

        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track { display: flex; animation: ticker 20s linear infinite; white-space: nowrap; }

        @keyframes floatUp { 0%,100%{transform:translateY(0) rotate(var(--r,0deg))} 50%{transform:translateY(-14px) rotate(var(--r,0deg))} }
        @keyframes floatUpAlt { 0%,100%{transform:translateY(0) rotate(var(--r,0deg))} 50%{transform:translateY(-10px) rotate(var(--r,0deg))} }

        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }

        .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; } .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; } .reveal-delay-4 { transition-delay: 0.4s; }

        @keyframes borderRun { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        .border-run { background: linear-gradient(90deg,#2dd4bf,#818cf8,#f472b6,#2dd4bf) 0%/200%; background-size: 200%; animation: borderRun 4s linear infinite; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor-blink { animation: blink 1s step-end infinite; }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.5); }

        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        .pulse-ring { animation: pulse 2.5s ease infinite; }

        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(50px)} to{opacity:1;transform:translateY(0)} }
        .hero-text-1 { animation: fadeSlideUp 1s 0.1s cubic-bezier(0.22,1,0.36,1) both; }
        .hero-text-2 { animation: fadeSlideUp 1s 0.25s cubic-bezier(0.22,1,0.36,1) both; }
        .hero-text-3 { animation: fadeSlideUp 1s 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .hero-text-4 { animation: fadeSlideUp 1s 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .hero-text-5 { animation: fadeSlideUp 1s 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .hero-text-6 { animation: fadeSlideUp 1s 0.9s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Custom cursor */}
      <div id="cursor" ref={cursorRef} />
      <div id="cursor-dot" ref={cursorDotRef} />

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.7 }} />

      {/* Scanline effect */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(180deg, transparent, rgba(45,212,191,0.03), transparent)',
          animation: 'scanline 8s linear infinite',
        }} />
      </div>

      {/* ─────────────────── NAVBAR ─────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px',
        background: 'rgba(3,5,7,0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: '#2dd4bf',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(45,212,191,0.5)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#030507" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
            </svg>
          </div>
          <span className="display" style={{ fontSize: 22, color: '#fff', letterSpacing: 2 }}>TELEDRIVE</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Free Forever', '∞ Unlimited', 'No Ads'].map(t => (
            <div key={t} style={{
              padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
            }}>{t}</div>
          ))}
        </div>
      </nav>

      {/* ─────────────────── HERO ─────────────────── */}
      <section ref={heroRef} className="hero-bg" style={{
        position: 'relative', zIndex: 5, minHeight: '100vh',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        alignItems: 'center', paddingTop: 80,
        maxWidth: 1400, margin: '0 auto', padding: '100px 60px 80px',
        gap: 60,
      }}>

        {/* LEFT */}
        <div>
          <div className="hero-text-1" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.18)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 8px #2dd4bf', display: 'block' }} />
            <span style={{ fontSize: 12, color: '#2dd4bf', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Telegram-Powered Cloud Storage
            </span>
          </div>

          <div className="hero-text-2 glitch-wrap" data-text="STOP" style={{ display: 'block' }}>
            <h1 className={`display ${glitchActive ? 'active' : ''}`} style={{
              fontSize: 'clamp(80px, 10vw, 130px)', lineHeight: 0.9,
              color: '#fff', display: 'block',
            }}>
              STOP
            </h1>
          </div>
          <div className="hero-text-3">
            <h1 className="display" style={{
              fontSize: 'clamp(80px, 10vw, 130px)', lineHeight: 0.9,
              color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.12)',
              display: 'block',
            }}>PAYING FOR</h1>
          </div>
          <div className="hero-text-4">
            <h1 className="display" style={{
              fontSize: 'clamp(80px, 10vw, 130px)', lineHeight: 0.9,
              background: 'linear-gradient(135deg, #2dd4bf, #06b6d4 40%, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', display: 'block',
            }}>STORAGE.</h1>
          </div>

          <p className="hero-text-5" style={{
            fontSize: 17, lineHeight: 1.75, color: 'rgba(255,255,255,0.4)',
            maxWidth: 480, margin: '28px 0 40px', fontWeight: 400,
          }}>
            TeleDrive uses Telegram's unlimited cloud as your personal hard drive. 
            Images, videos, audio, PDFs — all beautifully organized. 
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}> 100% free, forever.</span>
          </p>

          <div className="hero-text-6" style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 18, padding: '24px 28px', display: 'inline-block',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Sign in with Telegram — no password
            </div>
            <div ref={loginRef} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#2dd4bf"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"/></svg>
              End-to-end verified by Telegram
            </div>
          </div>

          {/* Stats */}
          <div className="hero-text-6" style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[['∞', 'Storage'], ['2 GB', 'Per File Max'], ['0₹', 'Monthly Cost']].map(([n, l]) => (
              <div key={l}>
                <div className="display" style={{ fontSize: 32, color: '#fff', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — 3D Dashboard Mockup */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: 1000 }}>
          <div style={{
            width: '100%', maxWidth: 520,
            transform: 'rotateY(-12deg) rotateX(6deg)',
            transformStyle: 'preserve-3d',
            borderRadius: 20,
            background: '#0d1526',
            border: '1px solid rgba(45,212,191,0.12)',
            boxShadow: '0 60px 120px rgba(0,0,0,0.7), 0 0 60px rgba(45,212,191,0.06)',
            overflow: 'hidden',
          }}>
            {/* Mockup titlebar */}
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(5,8,16,0.8)',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#ffbd2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
              </div>
              <div style={{
                flex: 1, height: 22, borderRadius: 6, fontSize: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em',
              }}>teledrive.app/dashboard</div>
            </div>

            <div style={{ display: 'flex', minHeight: 380 }}>
              {/* Sidebar */}
              <div style={{
                width: 130, padding: '16px 10px', borderRight: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(5,8,16,0.5)',
              }}>
                {[['🗂️','All Files'], ['🖼️','Images'], ['🎬','Videos'], ['🎵','Audio'], ['📄','PDFs']].map(([ic, lb], i) => (
                  <div key={lb} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
                    borderRadius: 8, marginBottom: 2, fontSize: 11,
                    background: i === 0 ? 'rgba(45,212,191,0.1)' : 'transparent',
                    color: i === 0 ? '#2dd4bf' : 'rgba(255,255,255,0.35)',
                    borderLeft: i === 0 ? '2px solid #2dd4bf' : '2px solid transparent',
                  }}>
                    <span style={{ fontSize: 13 }}>{ic}</span>{lb}
                  </div>
                ))}
              </div>

              {/* File grid */}
              <div style={{ flex: 1, padding: 14 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 14,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>All Files</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['⊞','≡'].map(ic => <div key={ic} style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.05)', display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'rgba(255,255,255,0.4)' }}>{ic}</div>)}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {files.map((f, i) => (
                    <div key={f.name} className="card-hover" style={{
                      borderRadius: 10, overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      animation: `floatUp 3s ${i * 0.4}s ease-in-out infinite`,
                      '--r': `${(i % 3 - 1) * 2}deg`,
                    }}>
                      <div style={{
                        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${f.color}12`, fontSize: 22,
                      }}>{f.icon}</div>
                      <div style={{ padding: '6px 7px' }}>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{f.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── TICKER ─────────────────── */}
      <div style={{ position: 'relative', zIndex: 5, overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 0', background: 'rgba(5,8,16,0.8)' }}>
        <div className="ticker-track">
          {[...Array(2)].map((_, rep) => (
            <span key={rep} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {['UNLIMITED STORAGE', 'ZERO COST', 'TELEGRAM POWERED', 'DRAG & DROP UPLOADS', 'INSTANT SEARCH', 'PRIVATE & SECURE', 'ALL FILE TYPES', 'ORGANIZED FOREVER'].map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 32, paddingRight: 48 }}>
                  <span className="display" style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', letterSpacing: 3 }}>{t}</span>
                  <span style={{ color: '#2dd4bf', fontSize: 14, opacity: 0.4 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: 1200, margin: '0 auto', padding: '120px 60px' }}>
        <div className="reveal" style={{ marginBottom: 70 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', color: '#2dd4bf', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>Why TeleDrive</div>
          <h2 className="display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', color: '#fff', lineHeight: 0.95 }}>
            BUILT DIFFERENT.<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.15)' }}>WORKS BETTER.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {[
            { num: '01', icon: '⬡', title: 'Infinite Space', body: "Telegram doesn't cap storage. Ever. Upload your entire hard drive if you want — it'll handle it.", color: '#2dd4bf' },
            { num: '02', icon: '⚡', title: 'Blazing Fast CDN', body: "Telegram's infrastructure spans the globe. Your files reach you at full speed no matter where you are.", color: '#818cf8' },
            { num: '03', icon: '🔐', title: 'Your Data, Only Yours', body: "Files are stored in a private Telegram channel only you can see. We store zero content — just metadata.", color: '#f472b6' },
            { num: '04', icon: '🗂️', title: 'Auto-Categorized', body: "Every upload is automatically sorted — images, videos, audio, PDFs, documents. Always clean, always found.", color: '#fb923c' },
            { num: '05', icon: '🔍', title: 'Find Anything Fast', body: "Full-text search across all filenames, filter by type, sort by date. Find anything in under a second.", color: '#34d399' },
            { num: '06', icon: '📱', title: 'Every Device', body: "Responsive down to the smallest phone screen. Your storage goes wherever you go.", color: '#60a5fa' },
          ].map(({ num, icon, title, body, color }, i) => (
            <div key={num} className={`reveal reveal-delay-${(i % 3) + 1} card-hover`} style={{
              padding: '36px 32px',
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.01)',
              borderRadius: 4,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.08)', fontWeight: 700 }}>{num}</div>
              <div style={{
                width: 48, height: 48, borderRadius: 12, marginBottom: 24,
                background: `${color}14`, border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.3px' }}>{title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75 }}>{body}</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `${color}`, transform: 'scaleX(0)', transition: 'transform 0.3s ease', transformOrigin: 'left' }} className="feature-bar" />
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── BIG NUMBERS ─────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 60px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}>
          {[
            { num: '∞', label: 'Total Storage', sub: 'Telegram cloud' },
            { num: '2GB', label: 'Max File Size', sub: 'Per single file' },
            { num: '5', label: 'File Categories', sub: 'Auto-organized' },
            { num: '0₹', label: 'Monthly Fee', sub: 'Always free' },
          ].map(({ num, label, sub }, i) => (
            <div key={label} className={`reveal reveal-delay-${i + 1}`} style={{
              padding: '40px 32px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              textAlign: i === 0 ? 'left' : 'center',
            }}>
              <div className="display" style={{ fontSize: 60, color: i === 0 ? '#2dd4bf' : '#fff', lineHeight: 1, marginBottom: 8 }}>{num}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, maxWidth: 1200, margin: '0 auto', padding: '120px 60px' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.2em', color: '#2dd4bf', textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>Setup in 30 seconds</div>
          <h2 className="display" style={{ fontSize: 'clamp(48px, 6vw, 72px)', color: '#fff' }}>HOW IT WORKS</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '28%', left: '17%', right: '17%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.2), rgba(45,212,191,0.2), transparent)', zIndex: 0 }} />
          {[
            { n: '1', t: 'Connect Telegram', d: 'Hit the login button. One tap — Telegram verifies you instantly. No passwords, no forms.' },
            { n: '2', t: 'Upload Anything', d: 'Drag and drop files from your device. Any type, any size up to 2GB. Bulk upload supported.' },
            { n: '3', t: 'Organized Forever', d: 'Everything auto-sorted into categories. Search, filter, download — anytime, any device.' },
          ].map(({ n, t, d }, i) => (
            <div key={n} className={`reveal reveal-delay-${i + 1}`} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div className="pulse-ring" style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 28px',
                background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="display" style={{ fontSize: 22, color: '#2dd4bf' }}>{n}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{t}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── FINAL CTA ─────────────────── */}
      <section style={{ position: 'relative', zIndex: 5, padding: '0 60px 120px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal" style={{
          borderRadius: 24, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(129,140,248,0.06) 50%, rgba(244,114,182,0.06) 100%)',
          padding: '80px 60px', textAlign: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 24, padding: 1.5, background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(129,140,248,0.2), rgba(244,114,182,0.2))' }}>
            <div style={{ background: '#030507', borderRadius: 22.5, width: '100%', height: '100%' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 5vw, 68px)', color: '#fff', marginBottom: 16, lineHeight: 1 }}>
              YOUR STORAGE.<br />
              <span style={{ background: 'linear-gradient(135deg, #2dd4bf, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>YOUR RULES.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 48, maxWidth: 500, margin: '0 auto 48px' }}>
              Stop paying for storage you already have. TeleDrive gives you a beautiful interface to Telegram's unlimited cloud — free, forever.
            </p>
            <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#2dd4bf', color: '#030507',
              fontWeight: 700, fontSize: 15, padding: '14px 32px',
              borderRadius: 12, textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 0 30px rgba(45,212,191,0.3)',
            }}>
              ↑ Get started for free
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 5,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '36px 60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 20,
        background: 'rgba(5,8,16,0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#030507" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
            </svg>
          </div>
          <span className="display" style={{ fontSize: 18, color: '#fff', letterSpacing: 2 }}>TELEDRIVE</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>
            Designed & built with <span style={{ color: '#f472b6' }}>♥</span> by
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Sarthak Dherange</div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', textAlign: 'right' }}>
          Powered by Telegram<br />
          <span style={{ color: '#2dd4bf', opacity: 0.4 }}>∞ Free Forever</span>
        </div>
      </footer>

      <style jsx>{`
        section:nth-child(7) div:hover .feature-bar { transform: scaleX(1) !important; }
      `}</style>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const { getUserFromRequest } = await import('../lib/auth');
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => { const [k,...v]=c.trim().split('='); return [k,v.join('=')]; }));
  const user = await getUserFromRequest({ cookies });
  if (user) return { redirect: { destination: '/dashboard', permanent: false } };
  return { props: {} };
}