// pages/api/files/proxy.js
import { getUserFromRequest } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).end();

  const { id } = req.query;
  if (!id) return res.status(400).end();

  try {
    const supabase = getServiceSupabase();
    const { data: file } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!file) return res.status(404).end();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const fileInfoRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${file.telegram_file_id}`
    );
    const fileInfo = await fileInfoRes.json();
    if (!fileInfo.ok) return res.status(500).end();

    const filePath = fileInfo.result.file_path;
    const telegramUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    const upstream = await fetch(telegramUrl);
    if (!upstream.ok) return res.status(502).end();

    const mime = file.mime_type || 'application/octet-stream';

    // CRITICAL: inline disposition prevents mobile browsers from downloading
    // instead of previewing. Only force download for non-previewable types.
    const previewable = mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || mime === 'application/pdf';
    const disposition = previewable
      ? `inline; filename="${encodeURIComponent(file.name)}"`
      : `attachment; filename="${encodeURIComponent(file.name)}"`;

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    // Allow embedding in iframe (for PDF preview)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Allow video/audio on mobile Safari
    res.setHeader('Accept-Ranges', 'bytes');

    if (file.size) res.setHeader('Content-Length', file.size);

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) { res.end(); break; }
      res.write(Buffer.from(value));
    }

  } catch (err) {
    console.error('Proxy error:', err);
    if (!res.headersSent) res.status(500).end();
  }
}

export const config = {
  api: { responseLimit: false },
};
