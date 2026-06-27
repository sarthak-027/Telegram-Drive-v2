import { getUserFromRequest } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { id, starred } = req.body;
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('files').update({ starred: !!starred })
      .eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    return res.status(200).json({ ok: true, file: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
