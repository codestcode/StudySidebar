# StudySidebar

AI-powered Chrome extension that turns your browser sidebar into a full study assistant — chat, quiz, and summarize any web content.

---

## Features

### AI Chat Assistant
- Stream AI responses with real-time Markdown rendering
- Send any page's content as context for contextual Q&A
- Collapsible context panel with character count and manual editing
- Chat history auto-saved and restored across sessions
- Copy individual AI responses or clear the entire conversation

### Quiz Generator (4-phase workflow)
- **Generate** — Choose topic (auto-fetch from current page or manual entry), number of questions (1–25+ preset buttons), difficulty (Easy/Medium/Hard), and question types (Multiple Choice, True/False, Essay)
- **Take** — Navigate questions with progress bar, select or type answers, submit for scoring
- **Result** — Circular score display with pass/fail assessment, wrong-answer preview, perfect-score banner
- **Review** — Full answer review with correct/incorrect indicators

### Content Summarization
- Summarize any webpage or pasted text
- 9 combinations: Short (3 key points) / Medium (1 paragraph) / Detailed (full summary) × Paragraph / Bullet Point / Key Concept
- Streaming responses with real-time updates
- Copy and regenerate with one click

### Page Content Extractor
- Automatically reads current tab content, stripped of scripts, nav, and ads
- Displays word/character count and page URL
- Editable before sending to Chat or generating Quiz/Summary
- Inject fallback via scripting API when content script isn't available

### Authentication & Security
- Register, Login, Forgot Password with OTP verification, and Reset Password
- 6-digit OTP input with auto-advance and paste support
- Password requirements (8+ chars, uppercase, number)
- "Remember Me" and 7-day session token expiry
- Rate-limited endpoints (10 req/15min auth, 60 req/15min global)
- bcrypt password hashing (12 rounds)

### Settings Panel
- Dark mode toggle with Moon/Sun icons
- About Us, Privacy Policy, Vision, Contact Us pages

### Extension Integration
- Chrome Side Panel (full-featured) and Popup (quick access)
- Toolbar icon click opens side panel
- Text selection triggers via `mouseup` listener
- Works on all URLs (including `chrome://` pages via scripting fallback)
- Chrome storage for token and preference persistence

---

## Tech Stack

| Layer        | Technology                                            |
|-------------|-------------------------------------------------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend**  | Express.js, TypeScript, OpenRouter API, Nodemailer     |
| **Database** | Supabase (PostgreSQL)                                  |
| **Auth**     | bcrypt, custom session tokens, OTP-based password reset |

---

## Project Structure

```
studysidebar/
├── backend/
│   ├── src/
│   │   ├── routes/           # auth.ts, chat.ts, quiz.ts, summary.ts
│   │   ├── utils/            # auth.ts, openrouter.ts, email.ts
│   │   ├── db/client.ts      # Supabase client
│   │   └── index.ts          # Express server
│   ├── .env.example
│   └── package.json
├── extension/
│   ├── src/
│   │   ├── components/       # App, Auth, Chat, Quiz*, Summary, Settings, Theme
│   │   ├── utils/            # api.ts (backend client), storage.ts (Chrome storage)
│   │   ├── popup.html/.tsx   # Popup entry point
│   │   ├── sidepanel.html/.tsx # Side panel entry point
│   │   ├── background.ts     # Service worker
│   │   ├── content.ts        # Content script
│   │   ├── manifest.json     # Chrome manifest
│   │   └── styles.css        # Custom styling (glass3d, animations)
│   ├── vite.config.ts
│   └── package.json
├── package.json               # Root monorepo orchestrator
├── pnpm-workspace.yaml
├── QUICKSTART.md
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- [pnpm](https://pnpm.io/installation)
- [Supabase](https://supabase.com) project (free tier)
- [OpenRouter](https://openrouter.ai) API key

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase URL, service role key, and OpenRouter key

# Set up database tables in Supabase SQL Editor
# (see Database Schema below)

# Build extension
pnpm --filter ./extension build
```

### Run

```bash
# Start backend (port 3001)
pnpm dev:backend
```

### Load Extension in Chrome
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist`

### Or run both simultaneously
```bash
pnpm dev
```

---

## API Endpoints

Base URL: `http://localhost:3001/api`

### Auth (no token required)
| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | `/auth/register`          | Create account                 |
| POST   | `/auth/login`             | Login                          |
| POST   | `/auth/forgot-password`   | Request OTP                    |
| POST   | `/auth/reset-password`    | Reset password with OTP        |

### Protected (Bearer token required)
| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | `/chat/message`           | Send message (SSE streaming)   |
| GET    | `/chat/history`           | Get chat history               |
| POST   | `/quiz/generate`          | Generate quiz                  |
| POST   | `/quiz/submit`            | Submit answers and get score   |
| GET    | `/quiz/list`              | List user's quizzes            |
| POST   | `/summary/generate`       | Generate summary (SSE streaming) |
| GET    | `/summary/list`           | List user's summaries          |

---

## Scripts

| Command                     | Description                          |
|----------------------------|--------------------------------------|
| `pnpm dev`                 | Run backend + extension concurrently |
| `pnpm build`               | Build all packages                   |
| `pnpm dev:backend`         | Start backend only (`tsx watch`)     |
| `pnpm --filter ./extension build` | Build extension only           |

---

## Troubleshooting

- **Extension not loading?** Run `pnpm --filter ./extension build`, check `extension/dist` exists, refresh `chrome://extensions`
- **Backend connection error?** Is `pnpm dev:backend` running on port 3001?
- **AI not responding?** Verify `OPENROUTER_API_KEY` is set and has credits
- **Auth fails?** Check Supabase credentials and that tables exist in the SQL Editor
- **Port in use?** Kill the process: `npx kill-port 3001`

---

## License

MIT © 2026 StudySidebar 
---

*From passive reader to active master.*
