import { getUserFromRequest } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { category, folder, search, sort = 'created_at', order = 'desc', view } = req.query;
    const supabase = getServiceSupabase();
    let query = supabase.from('files').select('*').eq('user_id', user.id);

    // Special views
    if (view === 'trash') {
      query = query.eq('trashed', true);
    } else if (view === 'starred') {
      query = query.eq('starred', true).eq('trashed', false);
    } else {
      // Normal view: exclude trashed
      query = query.eq('trashed', false);
      if (category && category !== 'all') query = query.eq('category', category);
      if (folder) query = query.eq('folder', folder);
    }

    if (search) query = query.ilike('name', `%${search}%`);
    query = query.order(sort, { ascending: order === 'asc' });

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total: data.length,
      totalSize: data.reduce((acc, f) => acc + (f.size || 0), 0),
      byCategory: {
        image: data.filter(f => f.category === 'image').length,
        video: data.filter(f => f.category === 'video').length,
        audio: data.filter(f => f.category === 'audio').length,
        pdf: data.filter(f => f.category === 'pdf').length,
        document: data.filter(f => f.category === 'document').length,
        other: data.filter(f => f.category === 'other').length,
      }
    };
    return res.status(200).json({ files: data, stats });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list files' });
  }
}
