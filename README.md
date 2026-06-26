# StudySidebar

An AI-powered Chrome extension that helps CS students study more effectively with three main features:
- **Chat**: Ask AI questions about your coursework with optional context
- **Quiz**: Auto-generate quizzes on any topic to test your knowledge
- **Summary**: Summarize lecture notes, code, or any study material

## Project Structure

```
studysidebar/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── db/client.ts    # Supabase database client
│   │   ├── routes/         # API endpoints (auth, chat, quiz, summary)
│   │   ├── utils/          # Auth, AI streaming, utilities
│   │   └── index.ts        # Express server
│   ├── .env                # Configuration (Supabase keys, OpenRouter key)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── extension/               # Chrome extension (React 19 + Vite)
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── utils/          # API client, Chrome storage wrapper
│   │   ├── styles.css      # Extension styling
│   │   ├── popup.html & popup.tsx
│   │   ├── sidepanel.html & sidepanel.tsx
│   │   ├── background.ts   # Service worker
│   │   ├── content.ts      # Content script
│   │   └── manifest.json   # Chrome manifest
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json             # Root monorepo
└── pnpm-workspace.yaml      # Workspace config
```

## Prerequisites

- Node.js 18+
- pnpm
- Supabase account (free tier at [supabase.com](https://supabase.com))
- OpenRouter API key at [openrouter.ai](https://openrouter.ai)

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `backend/.env` (or copy from `.env.example`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=3001
```



  

```bash
pnpm build
```

Or build individually:

```bash
pnpm --filter ./backend build
pnpm --filter ./extension build
```

## Development

### Run Backend

```bash
pnpm dev:backend
```

The API will run on `http://localhost:3001`

### Build & Load Extension

```bash
pnpm --filter ./extension build
```

Then load the extension in Chrome:
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist` folder

### Run Both Simultaneously

```bash
pnpm dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create new account
- `POST /api/auth/login` — Login to existing account

### Chat (requires auth token)
- `POST /api/chat/message` — Send message (streaming response)
- `GET /api/chat/history` — Get chat history

### Quiz (requires auth token)
- `POST /api/quiz/generate` — Generate new quiz
- `POST /api/quiz/submit` — Submit quiz answers and get score
- `GET /api/quiz/list` — Get user's quizzes

### Summary (requires auth token)
- `POST /api/summary/generate` — Generate summary from content (streaming)
- `GET /api/summary/list` — Get saved summaries

## Extension Features

### Chat Tab
- Ask questions with optional course context
- Real-time streaming responses from AI
- Automatic history persistence

### Quiz Tab
- Select topic and difficulty level
- Auto-generates 5 multiple-choice questions
- Immediate feedback on answers with score

### Summary Tab
- Paste lecture notes, code, or articles
- Get concise bulleted summaries
- Save summaries for later review

## Authentication

The extension uses simple email/password authentication:
- Credentials stored securely in Chrome's local storage
- Auth token sent with each API request
- Session expires after 7 days of inactivity

## AI Integration

Uses **OpenRouter** for LLM access:
- Streaming responses for real-time chat
- Configurable AI model
- Cost-effective API with no rate limits

To get an API key:
1. Visit [openrouter.ai](https://openrouter.ai)
2. Create account and get API key
3. Add to `backend/.env`

## Building for Production

### Extension Distribution

```bash
pnpm build
# Outputs to extension/dist/
```

To publish to Chrome Web Store:
1. Zip the `extension/dist` folder
2. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/category/extensions)

### Backend Deployment

```bash
cd backend
pnpm build
```

Deploy the built files to your hosting (Vercel, Railway, Render, etc.) and ensure the Supabase URL and service role key are set as environment variables.

## Tech Stack

**Backend:**
- Express.js — REST API framework
- Supabase — Database (PostgreSQL via REST API)
- OpenRouter — AI model access

**Extension:**
- React 19 — UI framework
- TypeScript — Type safety
- Vite — Fast build tool
- Chrome APIs — Extension features

## Troubleshooting

### Extension won't load
- Ensure build succeeds: `pnpm --filter ./extension build`
- Check `extension/dist` folder exists
- Open Chrome DevTools for the extension (right-click → Inspect)

### Backend API errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
- Check `OPENROUTER_API_KEY` is valid
- Review server logs: `pnpm dev:backend`

### Authentication fails
- Ensure backend is running on port 3001
- Check email/password match in database
- Browser console shows detailed error messages

## Database Schema

```
users
- id (UUID, PK)
- email (unique)
- password_hash
- created_at

chat_history
- id (UUID, PK)
- user_id (FK → users)
- message
- response
- context (optional)
- created_at

quizzes
- id (UUID, PK)
- user_id (FK → users)
- title
- topic
- difficulty (easy/medium/hard)
- content (JSON — questions array)
- created_at

quiz_answers
- id (UUID, PK)
- quiz_id (FK → quizzes)
- user_id (FK → users)
- question_index
- selected_answer
- is_correct
- created_at

summaries
- id (UUID, PK)
- user_id (FK → users)
- title
- content
- source_url (optional)
- created_at
```

## Future Enhancements

- OAuth login options
- Spaced repetition for quizzes
- Dark mode
- Export study materials
- Collaborative learning features
- Mobile app version

## License

MIT
