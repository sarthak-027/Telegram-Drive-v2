// pages/api/auth/google.js
import { createClient } from '@supabase/supabase-js';
import { createToken } from '../../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.user) {
    console.error('Google auth error:', error);
    return res.redirect('/?error=auth_failed');
  }

  const googleUser = data.user;
  const meta = googleUser.user_metadata;

  const user = {
    id: googleUser.id,
    first_name: meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '',
    last_name: meta.full_name?.split(' ').slice(1).join(' ') || '',
    username: googleUser.email,
    photo_url: meta.avatar_url || meta.picture || '',
  };

  // Upsert user in your users table
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  await serviceSupabase.from('users').upsert({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    photo_url: user.photo_url,
    last_login: new Date().toISOString(),
  }, { onConflict: 'id' });

  // Create JWT session (same as Telegram flow)
  const token = await createToken(user);
  res.setHeader('Set-Cookie', serialize('td_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }));

  return res.redirect('/dashboard');
}