# TeleDrive 🚀
**Unlimited cloud storage using Telegram — beautifully organized.**

Store all your files (images, videos, audio, PDFs, documents) using Telegram's free unlimited cloud, with a beautiful Next.js frontend to organize them.

---

## ⚡ Quick Setup (Step by Step)

### Step 1 — Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name (e.g. "My Drive Bot")
4. Choose a username ending in `bot` (e.g. `mydrivestore_bot`)
5. BotFather gives you a **Bot Token** — save it!
6. Also save your bot's **username** (without the @)

### Step 2 — Create a Storage Channel

1. Create a **new private channel** on Telegram (this is where files are stored)
2. Add your bot to the channel as an **Administrator**
3. Get the **channel ID**:
   - Forward any message from the channel to [@userinfobot](https://t.me/userinfobot)
   - Or send a message to the channel, then open:
     `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
   - The channel ID starts with `-100...`

### Step 3 — Set Up Supabase (Free Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run this SQL:

```sql
-- Users table (optional, for tracking)
CREATE TABLE users (
  id         BIGINT PRIMARY KEY,
  first_name TEXT,
  last_name  TEXT,
  username   TEXT,
  photo_url  TEXT,
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           BIGINT NOT NULL,
  telegram_file_id  TEXT NOT NULL,
  message_id        BIGINT,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'other',
  mime_type         TEXT,
  size              BIGINT DEFAULT 0,
  folder            TEXT DEFAULT 'root',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_category ON files(category);
```

4. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 4 — Configure Environment

1. Copy `.env.example` to `.env.local`
2. Fill in all the values:

```env
TELEGRAM_BOT_TOKEN=         # From BotFather
TELEGRAM_BOT_USERNAME=      # Your bot username (no @)
TELEGRAM_STORAGE_CHAT_ID=   # Your private channel ID (e.g. -1001234567890)

NEXT_PUBLIC_SUPABASE_URL=   # From Supabase settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=                 # Any random string (min 32 chars)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5 — Install & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🚀 Deployment (Vercel — Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add all environment variables from `.env.local` in Vercel's dashboard
4. Deploy!

> **Important**: After deploying, update `NEXT_PUBLIC_APP_URL` to your Vercel URL

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, Tailwind CSS |
| Auth | Telegram Login Widget + JWT |
| Storage Engine | Telegram Bot API |
| Metadata DB | Supabase (PostgreSQL) |
| File Upload | React Dropzone |

---

## ✨ Features

- 📁 **5 categories**: Images, Videos, Audio, PDFs, Documents
- 🔍 **Search** files by name
- ↕️ **Sort** by date (newest/oldest)
- 📋 **Grid & List** view toggle
- 🖱️ **Drag & drop** upload
- 📊 **Storage stats** in sidebar
- 🔐 **Secure** — Telegram verified login
- ⚡ **No file size limit** (up to 2GB per file via Telegram)

---

## ⚠️ Known Limits

- Max file size: **50MB** per upload (configurable in `next.config.js`)
- Telegram bot file limit: **2GB** (50GB for Premium users)
- Telegram may throttle heavy API usage

---

## 🐛 Troubleshooting

**"Invalid Telegram login"** → Make sure `TELEGRAM_BOT_TOKEN` is correct

**"Bot can't send messages"** → Make sure your bot is an Admin in the storage channel

**"Supabase error"** → Check that you ran the SQL schema and keys are correct

**Login widget not showing** → Make sure `NEXT_PUBLIC_BOT_USERNAME` is set (without @)
