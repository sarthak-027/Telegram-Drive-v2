// pages/api/auth/telegram.js
import { verifyTelegramLogin } from '../../../lib/telegram';
import { createToken } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const telegramData = req.body;

    // Verify the data is genuinely from Telegram
    const isValid = verifyTelegramLogin(telegramData);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram login data' });
    }

    const user = {
      id: telegramData.id,
      first_name: telegramData.first_name,
      last_name: telegramData.last_name || '',
      username: telegramData.username || '',
      photo_url: telegramData.photo_url || '',
    };

    // Upsert user in Supabase (optional, for tracking)
    const supabase = getServiceSupabase();
    await supabase.from('users').upsert({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      last_login: new Date().toISOString(),
    }, { onConflict: 'id' });

    // Create JWT session token
    const token = await createToken(user);

    // Set cookie
    res.setHeader('Set-Cookie', serialize('td_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    }));

    return res.status(200).json({ ok: true, user });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
