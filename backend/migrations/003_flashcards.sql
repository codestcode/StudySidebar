CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_url TEXT DEFAULT '',
  page_title TEXT DEFAULT '',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  box_level INTEGER DEFAULT 1,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(user_id, next_review_at);
