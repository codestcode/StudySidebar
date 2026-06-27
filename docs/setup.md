# Setup Guide

## Prerequisites

- **Node.js** 18 or later
- **pnpm** — install via `npm install -g pnpm` or `corepack enable pnpm`
- **Supabase** account — free tier at [supabase.com](https://supabase.com)
- **OpenRouter** account — free tier at [openrouter.ai](https://openrouter.ai)

---

## Step 1: Get API Keys

### OpenRouter
1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create a new API key
3. Copy the key (starts with `sk-or-`)

### Supabase
1. Create a project at [supabase.com](https://supabase.com) (free tier)
2. Go to **Project Settings → API**
3. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
4. Copy your **service_role key** (not the anon key)

---

## Step 2: Install & Configure

### Clone and install
```bash
git clone <repo-url> studysidebar
cd studysidebar
pnpm install
```

### Environment variables
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
OPENROUTER_API_KEY=sk-or-v1-...
PORT=3001
```

### Create database tables
1. Open your Supabase project's **SQL Editor**
2. Copy and paste the table creation SQL from [database.md](./database.md)
3. Run all CREATE TABLE statements in order

---

## Step 3: Run Backend

```bash
pnpm dev:backend
```

Expected output:
```
Server running on port 3001
```

Verify: visit `http://localhost:3001/health`
```json
{ "status": "ok", "db": "connected" }
```

---

## Step 4: Build & Load Extension

```bash
pnpm --filter ./extension build
```

Output goes to `extension/dist/`.

### Load in Chrome:
1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/dist` folder
5. The StudySidebar icon appears in the toolbar

Alternatively, run both simultaneously:
```bash
pnpm dev
```

---

## Step 5: Verify

1. Click the extension icon in the toolbar → side panel opens
2. Register a new account (email + password)
3. Test features:
   - **Chat tab** — type a message, verify AI responds
   - **Page tab** — navigate to any page, verify content is extracted
   - **Quiz tab** — enter a topic, generate a quiz, take it, see results
   - **Summary tab** — paste content, generate a summary

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| Backend won't start | Port 3001 in use? Kill it: `npx kill-port 3001` |
| `SUPABASE_URL` not set | Verify `.env` file exists in `backend/` |
| DB connection failed | Supabase project paused? (Free tier pauses after 1 week) |
| Extension won't load | Run `pnpm --filter ./extension build` first, check `extension/dist` exists |
| AI not responding | OpenRouter key valid? Account has credits? |
| Auth fails (401) | Backend running? Tables created? Token valid? |
| Chat history empty | First time? Messages only save after sending one |
| Quiz empty | AI may return malformed JSON — check backend console logs |

---

## Configuration Options

### Dark Mode
Toggle in the Settings panel (gear icon in header). Preference persisted to `chrome.storage.local`.

### Email (Password Reset)
Optional. Set SMTP vars in `.env` for password reset emails to work:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```
Without SMTP, OTP is logged to the backend console.

### AI Model
Edit `backend/src/utils/openrouter.ts`:
```typescript
const MODEL = 'openrouter/auto';  // Change to any OpenRouter model
```
