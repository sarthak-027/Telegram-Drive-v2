// pages/api/files/upload.js
import { getUserFromRequest } from '../../../lib/auth';
import { sendFileToTelegram, extractFileId, getCategoryFromMime } from '../../../lib/telegram';
import { getServiceSupabase } from '../../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // disable bodyParser — we handle it manually
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Parse multipart form
    const form = formidable({ maxFileSize: 2000 * 1024 * 1024 }); // 2GB
    const [fields, files] = await form.parse(req);

    const uploadedFile = files.file?.[0];
    if (!uploadedFile) return res.status(400).json({ error: 'No file provided' });

    const name = fields.name?.[0] || uploadedFile.originalFilename || 'untitled';
    const mimeType = fields.mimeType?.[0] || uploadedFile.mimetype || 'application/octet-stream';
    const folder = fields.folder?.[0] || 'root';
    const size = uploadedFile.size;

    // Read file from temp path as buffer (stream directly to Telegram)
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);

    // Upload to Telegram
    const message = await sendFileToTelegram(fileBuffer, name, mimeType);
    const telegramFileId = extractFileId(message);
    if (!telegramFileId) throw new Error('Could not extract file ID from Telegram');

    // Cleanup temp file
    fs.unlinkSync(uploadedFile.filepath);

    const category = getCategoryFromMime(mimeType);

    const supabase = getServiceSupabase();
    const { data: fileRecord, error } = await supabase
      .from('files')
      .insert({
        user_id: user.id,
        telegram_file_id: telegramFileId,
        message_id: message.message_id,
        name, category, mime_type: mimeType, size, folder,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ ok: true, file: fileRecord });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
