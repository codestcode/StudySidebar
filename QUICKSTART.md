# Quick Start Guide

## 5-Minute Setup

### Step 1: Get Required Keys

1. **OpenRouter API Key** (for AI features)
   - Go to https://openrouter.ai
   - Sign up and grab your API key

2. **Supabase Project** (for database)
   - Go to https://supabase.com
   - Create a project (free tier works)
   - Note your **Project URL** and **service_role key** (Settings → API)

### Step 2: Configure Environment

Copy the template and edit:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=sk-or-...your-key...
PORT=3001
```

### Step 3: Set Up Database Tables

Open your Supabase SQL Editor and run the SQL from README.md (or copy from below):

```sql
-- Creates 5 tables: users, chat_history, quizzes, quiz_answers, summaries
```

### Step 4: Install & Run

```bash
# Install dependencies
pnpm install

# Build extension
pnpm --filter ./extension build

# Start backend
pnpm dev:backend
```

### Step 5: Load Chrome Extension

1. Open `chrome://extensions`
2. Toggle "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/dist`
5. Extension icon appears in toolbar!

### Step 6: Use StudySidebar

1. **First time:** Click extension → Register with email/password → Login
2. **Chat Tab:** Ask questions, optionally paste context
3. **Quiz Tab:** Enter topic, choose difficulty, answer 5 questions
4. **Summary Tab:** Paste content, get bullet-point summary, save for later

## Commands Reference

```bash
pnpm dev                    # Run both backend & extension dev server
pnpm dev:backend           # Just backend
pnpm --filter ./extension build  # Build extension
pnpm build                 # Build all
```

## Troubleshooting

- **Extension not loading?** Run `pnpm --filter ./extension build`, refresh `chrome://extensions`
- **Backend connection error?** Is `pnpm dev:backend` running on port 3001?
- **AI not responding?** Verify `OPENROUTER_API_KEY` is set and has credits
- **Database errors?** Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

## What's Next?

- Customize AI prompts in `backend/src/utils/openrouter.ts`
- Add more quiz difficulty levels
- Implement dark mode
- Deploy backend to production
- Publish extension to Chrome Web Store
