import { createClient } from '@supabase/supabase-js';
import { createToken } from '../../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'No token' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });

    const googleUser = data.user;
    const meta = googleUser.user_metadata;

    const user = {
      id: googleUser.id,
      first_name: meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || '',
      last_name: meta.full_name?.split(' ').slice(1).join(' ') || '',
      username: googleUser.email,
      photo_url: meta.avatar_url || meta.picture || '',
    };

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

    const token = await createToken(user);
    res.setHeader('Set-Cookie', serialize('td_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }));

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
