CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_title TEXT DEFAULT '',
  notes_json JSONB NOT NULL DEFAULT '{"title":"","rows":[],"summary":""}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_page ON notes(user_id, page_url);
