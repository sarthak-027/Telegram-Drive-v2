// pages/api/files/download.js
import { getUserFromRequest } from '../../../lib/auth';
import { getFileDownloadUrl } from '../../../lib/telegram';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { id } = req.query;
    const supabase = getServiceSupabase();

    // Get file from DB and verify ownership
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get temporary download URL from Telegram
    const downloadUrl = await getFileDownloadUrl(file.telegram_file_id);

    return res.status(200).json({ url: downloadUrl, file });
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Failed to get download URL' });
  }
}
