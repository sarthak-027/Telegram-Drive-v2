// pages/api/auth/google.js
import { createClient } from '@supabase/supabase-js';
import { createToken } from '../../../lib/auth';
import { serialize } from 'cookie';

function buildUser(googleUser) {
  const meta = googleUser.user_metadata || {};
  const fullName = meta.full_name || meta.name || '';
  const parts = fullName.split(' ');
  return {
    id: googleUser.id,
    first_name: parts[0] || meta.given_name || '',
    last_name: parts.slice(1).join(' ') || meta.family_name || '',
    username: googleUser.email || '',
    photo_url: meta.avatar_url || meta.picture || '',
  };
}

async function upsertUser(user) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabase.from('users').upsert({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      last_login: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Upsert error:', err);
  }
}

function setTokenCookie(res, token) {
  res.setHeader('Set-Cookie', serialize('td_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }));
}

export default async function handler(req, res) {
  // GET — code exchange flow
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data?.user) return res.redirect('/?error=auth_failed');
      const user = buildUser(data.user);
      await upsertUser(user);
      const token = await createToken(user);
      setTokenCookie(res, token);
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('GET error:', err);
      return res.redirect('/?error=auth_failed');
    }
  }

  // POST — access_token from hash fragment
  if (req.method === 'POST') {
    try {
      const { access_token } = req.body;
      if (!access_token) return res.status(400).json({ error: 'No token' });
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data, error } = await supabase.auth.getUser(access_token);
      if (error || !data?.user) {
        console.error('getUser error:', error?.message);
        return res.status(401).json({ error: 'Invalid token' });
      }
      const user = buildUser(data.user);
      await upsertUser(user);
      const token = await createToken(user);
      setTokenCookie(res, token);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('POST error:', err);
      return res.status(500).json({ error: 'Auth failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
