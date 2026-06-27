// lib/telegram.js
// Helper functions to interact with Telegram Bot API

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STORAGE_CHAT_ID = process.env.TELEGRAM_STORAGE_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send a file (as buffer) to Telegram storage channel
 * Returns the telegram message object with file_id
 */
export async function sendFileToTelegram(fileBuffer, fileName, mimeType) {
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });

  // Determine which Telegram method to use based on MIME type
  const category = getCategoryFromMime(mimeType);

  let method = 'sendDocument';
  let fieldName = 'document';

  if (category === 'image') {
    method = 'sendPhoto';
    fieldName = 'photo';
  } else if (category === 'video') {
    method = 'sendVideo';
    fieldName = 'video';
  } else if (category === 'audio') {
    method = 'sendAudio';
    fieldName = 'audio';
  }

  formData.append('chat_id', STORAGE_CHAT_ID);
  formData.append(fieldName, blob, fileName);
  // Store filename in caption for reference
  formData.append('caption', `📁 ${fileName}`);

  const response = await fetch(`${BASE_URL}/${method}`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data.result;
}

/**
 * Delete a message (file) from Telegram storage channel
 */
export async function deleteFileFromTelegram(messageId) {
  const response = await fetch(`${BASE_URL}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: STORAGE_CHAT_ID,
      message_id: messageId,
    }),
  });

  const data = await response.json();
  return data.ok;
}

/**
 * Get a download URL for a Telegram file
 */
export async function getFileDownloadUrl(telegramFileId) {
  const response = await fetch(`${BASE_URL}/getFile?file_id=${telegramFileId}`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Could not get file: ${data.description}`);
  }

  const filePath = data.result.file_path;
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
}

/**
 * Extract file_id from a Telegram message object
 */
export function extractFileId(message) {
  if (message.photo) {
    // Photos come as array, take the largest one
    return message.photo[message.photo.length - 1].file_id;
  }
  if (message.video) return message.video.file_id;
  if (message.audio) return message.audio.file_id;
  if (message.document) return message.document.file_id;
  return null;
}

/**
 * Determine category from MIME type
 */
export function getCategoryFromMime(mimeType) {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('text/') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  )
    return 'document';
  return 'other';
}

/**
 * Verify Telegram Login Widget data
 * This ensures the login data is genuine and not forged
 */
export function verifyTelegramLogin(data) {
  const crypto = require('crypto');

  const { hash, ...fields } = data;

  // Build check string
  const checkString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');

  // Create secret key from bot token
  const secretKey = crypto
    .createHash('sha256')
    .update(BOT_TOKEN)
    .digest();

  // Calculate expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  // Verify hash matches
  if (expectedHash !== hash) {
    return false;
  }

  // Check auth is not older than 1 day
  const authDate = parseInt(fields.auth_date, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    return false;
  }

  return true;
}
