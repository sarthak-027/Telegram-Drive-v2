import { getUserFromRequest } from '../../../lib/auth';
import { deleteFileFromTelegram } from '../../../lib/telegram';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'No ids provided' });
    const supabase = getServiceSupabase();
    const { data: files } = await supabase.from('files').select('*').in('id', ids).eq('user_id', user.id);
    // Delete from Telegram (best effort)
    await Promise.allSettled((files || []).map(f => f.message_id ? deleteFileFromTelegram(f.message_id) : Promise.resolve()));
    const { error } = await supabase.from('files').delete().in('id', ids).eq('user_id', user.id);
    if (error) throw error;
    return res.status(200).json({ ok: true, deleted: ids.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
