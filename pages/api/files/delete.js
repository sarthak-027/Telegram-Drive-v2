// pages/api/files/delete.js
import { getUserFromRequest } from '../../../lib/auth';
import { deleteFileFromTelegram } from '../../../lib/telegram';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { id } = req.query;
    const supabase = getServiceSupabase();

    // Get file record first (to verify ownership and get message_id)
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from Telegram (best effort)
    if (file.message_id) {
      try {
        await deleteFileFromTelegram(file.message_id);
      } catch (e) {
        console.warn('Could not delete from Telegram:', e.message);
        // Continue with DB deletion even if Telegram delete fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Delete failed' });
  }
}
