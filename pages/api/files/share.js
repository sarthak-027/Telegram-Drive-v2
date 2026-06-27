import { getUserFromRequest } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';
import { getFileDownloadUrl } from '../../../lib/telegram';
import crypto from 'crypto';

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  // GET — access shared file (public, no auth needed)
  if (req.method === 'GET') {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const { data: file, error } = await supabase.from('files').select('*').eq('share_token', token).single();
    if (error || !file) return res.status(404).json({ error: 'Shared file not found' });
    const downloadUrl = await getFileDownloadUrl(file.telegram_file_id);
    return res.status(200).json({ file: { name: file.name, category: file.category, size: file.size, mime_type: file.mime_type }, url: downloadUrl });
  }

  // POST — create share token
  if (req.method === 'POST') {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { id } = req.body;
    const token = crypto.randomBytes(16).toString('hex');
    const { data, error } = await supabase.from('files').update({ share_token: token }).eq('id', id).eq('user_id', user.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, token, url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}` });
  }

  // DELETE — remove share token
  if (req.method === 'DELETE') {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { id } = req.body;
    await supabase.from('files').update({ share_token: null }).eq('id', id).eq('user_id', user.id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
