import { getUserFromRequest } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  const supabase = getServiceSupabase();

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('folders').select('*').eq('user_id', user.id).order('name');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ folders: data });
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const { data, error } = await supabase.from('folders').insert({ user_id: user.id, name: name.trim() }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, folder: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    // Move files back to root before deleting folder
    await supabase.from('files').update({ folder: 'root' }).eq('folder', id).eq('user_id', user.id);
    const { error } = await supabase.from('folders').delete().eq('id', id).eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
