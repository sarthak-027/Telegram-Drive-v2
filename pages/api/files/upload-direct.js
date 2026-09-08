// pages/api/files/upload-direct.js
// Step 2: receives file_id + metadata from browser after direct Telegram upload
import { getUserFromRequest } from '../../../lib/auth';
import { getCategoryFromMime } from '../../../lib/telegram';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return bot token + chat ID so browser can upload directly
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    return res.status(200).json({
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_STORAGE_CHAT_ID,
    });
  }

  if (req.method === 'POST') {
    // Save metadata after browser uploaded to Telegram
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { name, mimeType, size, telegramFileId, messageId, folder = 'root' } = req.body;
    if (!name || !telegramFileId || !messageId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const category = getCategoryFromMime(mimeType);
    const supabase = getServiceSupabase();
    const { data: fileRecord, error } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        telegram_file_id: telegramFileId,
        message_id: messageId,
        name, category,
        mime_type: mimeType,
        size: size || 0,
        folder,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, file: fileRecord });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
