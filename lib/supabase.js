// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server-side Supabase instance (uses service role key — server only!)
export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/*
============================================================
  SUPABASE TABLE SCHEMA — Run this SQL in Supabase SQL editor
============================================================

-- Files table: stores metadata for every uploaded file
CREATE TABLE files (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  telegram_file_id TEXT NOT NULL,
  message_id    BIGINT,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'other',
  mime_type     TEXT,
  size          BIGINT DEFAULT 0,
  folder        TEXT DEFAULT 'root',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_category ON files(category);

-- Row Level Security (RLS) — users can only see their own files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  USING (user_id = (current_setting('app.current_user_id')::BIGINT));

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  WITH CHECK (user_id = (current_setting('app.current_user_id')::BIGINT));

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  USING (user_id = (current_setting('app.current_user_id')::BIGINT));

============================================================
*/

/*
============================================================
  UPDATED SCHEMA — Run this SQL in Supabase SQL editor
  (adds new columns to existing tables)
============================================================

-- Add new columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS trashed BOOLEAN DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMPTZ;
ALTER TABLE files ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_files_starred ON files(starred);
CREATE INDEX IF NOT EXISTS idx_files_trashed ON files(trashed);
CREATE INDEX IF NOT EXISTS idx_files_share_token ON files(share_token);

============================================================
*/
