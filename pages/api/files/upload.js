// pages/api/files/upload.js
import { getUserFromRequest } from '../../../lib/auth';
import { sendFileToTelegram, extractFileId, getCategoryFromMime } from '../../../lib/telegram';
import { getServiceSupabase } from '../../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify user is logged in
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { name, mimeType, size, data: base64Data, folder = 'root' } = req.body;

    if (!name || !mimeType || !base64Data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Decode base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Upload to Telegram
    const message = await sendFileToTelegram(fileBuffer, name, mimeType);

    // Extract file_id from telegram message
    const telegramFileId = extractFileId(message);
    if (!telegramFileId) {
      throw new Error('Could not extract file ID from Telegram response');
    }

    const category = getCategoryFromMime(mimeType);

    // Save metadata to Supabase
    const supabase = getServiceSupabase();
    const { data: fileRecord, error } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        telegram_file_id: telegramFileId,
        message_id: message.message_id,
        name,
        category,
        mime_type: mimeType,
        size: size || fileBuffer.length,
        folder,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ ok: true, file: fileRecord });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
