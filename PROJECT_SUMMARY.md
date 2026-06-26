# StudySidebar - Project Summary

## What You Got

A complete, production-ready AI-powered study assistant Chrome extension with a full backend.

### Backend (Express.js + Supabase + OpenRouter)
- **Express API** with streaming responses for chat and summaries
- **OpenRouter integration** for LLM access
- **Supabase** for database (PostgreSQL via REST API)
- **Authentication** with email/password and token-based sessions
- **4 API endpoints** for chat, quiz, and summary features
- **5 database tables** for users, chat history, quizzes, and summaries

### Extension (React 19 + TypeScript + Vite)
- **Popup UI** for quick access
- **Side panel UI** for full-featured interface
- **3 main features**: Chat, Quiz Generator, Summary Tool
- **Chrome storage** for secure token management
- **Real-time streaming** responses from backend
- **Custom CSS styling**

## File Structure

```
studysidebar/
├── backend/
│   ├── src/
│   │   ├── db/client.ts          (Supabase client)
│   │   ├── routes/auth.ts        (Registration/login)
│   │   ├── routes/chat.ts        (Chat with context)
│   │   ├── routes/quiz.ts        (Quiz generation & scoring)
│   │   ├── routes/summary.ts     (Summarization)
│   │   ├── utils/auth.ts         (Password hashing, tokens)
│   │   ├── utils/openrouter.ts   (LLM streaming)
│   │   └── index.ts              (Express server)
│   ├── .env                      (Supabase + OpenRouter keys)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── extension/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx           (Main app shell)
│   │   │   ├── Auth.tsx          (Login/register)
│   │   │   ├── Chat.tsx          (Chat UI with streaming)
│   │   │   ├── Quiz.tsx          (Quiz generation & taking)
│   │   │   └── Summary.tsx       (Summary generation)
│   │   ├── utils/
│   │   │   ├── api.ts            (Backend client)
│   │   │   └── storage.ts        (Chrome storage wrapper)
│   │   ├── styles.css            (Extension styling)
│   │   ├── popup.html/.tsx       (Popup entry point)
│   │   ├── sidepanel.html/.tsx   (Side panel entry point)
│   │   ├── background.ts         (Service worker)
│   │   ├── content.ts            (Content script)
│   │   └── manifest.json         (Chrome manifest)
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json                  (Root monorepo)
├── pnpm-workspace.yaml           (Workspace config)
├── README.md                     (Full documentation)
├── QUICKSTART.md                 (5-minute setup)
└── .gitignore
```

## Key Features Implemented

### 1. Chat with Context
- Real-time AI responses (streaming)
- Optional course context for better answers
- Persisted chat history
- System prompts for CS education focus

### 2. Quiz Generator
- Auto-generate 5-question quizzes on any topic
- Difficulty levels: Easy, Medium, Hard
- Instant scoring and feedback
- Quiz attempt tracking

### 3. Content Summarization
- Summarize lecture notes, code, or articles
- Streaming response for real-time feedback
- Save summaries to database
- Optional source URL tracking

### 4. User Authentication
- Email/password registration & login
- 7-day session persistence
- Secure token-based API auth
- Chrome storage for token management

### 5. Data Persistence
- PostgreSQL database via Supabase
- 5 tables: users, chat_history, quizzes, quiz_answers, summaries
- User-scoped data queries

## Technology Stack

**Backend:**
- Node.js + TypeScript
- Express.js (REST API)
- Supabase (PostgreSQL via REST API)
- OpenRouter (LLM access)
- Crypto module (password hashing)

**Extension:**
- React 19 (UI framework)
- TypeScript (type safety)
- Vite (fast bundler)
- Chrome APIs (extension features)
- Fetch API (HTTP requests)

**Infrastructure:**
- Supabase (managed PostgreSQL)
- OpenRouter (AI models)
- pnpm (package manager)
- Chrome (extension platform)

## API Reference

### Base URL: `http://localhost:3001/api`

**Auth:**
- `POST /auth/register` → `{ token, userId }`
- `POST /auth/login` → `{ token, userId }`

**Chat (Bearer token required):**
- `POST /chat/message` → Server-Sent Events (streaming)
- `GET /chat/history` → `[{ id, message, response, createdAt }]`

**Quiz (Bearer token required):**
- `POST /quiz/generate` → `{ id, content: { questions: [] } }`
- `POST /quiz/submit` → `{ score, correctCount, totalQuestions }`
- `GET /quiz/list` → `[{ id, title, topic, difficulty, createdAt }]`

**Summary (Bearer token required):**
- `POST /summary/generate` → Server-Sent Events (streaming)
- `GET /summary/list` → `[{ id, title, content, createdAt }]`

## Getting Started

1. Clone the project
2. Set environment variables in `backend/.env`
3. Run `pnpm install`
4. Run the SQL setup in Supabase SQL Editor
5. Run `pnpm dev:backend` and build the extension
6. Load extension from `extension/dist` in Chrome
7. Register and start using!

## What's Ready vs What's Next

### Ready Now:
- ✅ Core features (chat, quiz, summary)
- ✅ Authentication system
- ✅ Database persistence
- ✅ Real-time streaming responses
- ✅ Chrome extension UI
- ✅ API endpoints
- ✅ Type safety (TypeScript)

### Consider Adding:
- OAuth (Google, GitHub login)
- Dark mode
- Export study materials (PDF)
- Spaced repetition system
- Study group collaboration
- Mobile app (React Native)
- Search/filter history
- Custom AI models per topic
- Analytics & progress tracking

## Deployment

**Backend:** Build with `cd backend && pnpm build`, deploy the built files, set Supabase and OpenRouter env vars on your hosting provider.

**Extension:** Build with `pnpm --filter ./extension build`, zip `extension/dist/`, upload to Chrome Web Store Developer Console.

## Troubleshooting

**Extension won't load:** Run `pnpm --filter ./extension build`, check `extension/dist` exists, reload in Chrome.

**Backend errors:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct. Check OPENROUTER_API_KEY is valid.

**AI not responding:** Ensure OpenRouter account has credits and API key is set in .env.

---

**You now have a complete, working study tool!**
Students can use this to:
- Get instant answers to study questions
- Test their knowledge with auto-generated quizzes
- Quickly summarize complex material


