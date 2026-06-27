# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐ │
│  │  Popup   │  │ Side Panel │  │   Content Script     │ │
│  │ (popup)  │  │ (sidepanel)│  │   (content.ts)       │ │
│  └────┬─────┘  └─────┬─────┘  └──────────┬───────────┘ │
│       │              │                    │             │
│       └──────────────┴────────────────────┘             │
│                      │                                  │
│                 ┌────┴─────┐                            │
│                 │  App.tsx │  (orchestrator)            │
│                 └────┬─────┘                            │
│              ┌───────┼───────────┐                      │
│         ┌────┴──┐ ┌──┴───┐ ┌────┴─────┐                │
│         │ Chat  │ │ Quiz │ │ Summary  │                │
│         └───────┘ └──────┘ └──────────┘                │
│                      │                                  │
│              ┌───────┴────────┐                         │
│              │  utils/api.ts  │  (HTTP client)          │
│              └───────┬────────┘                         │
└──────────────────────┼──────────────────────────────────┘
                       │ HTTP/SSE
┌──────────────────────┼──────────────────────────────────┐
│              Express.js Server (port 3001)               │
│  ┌──────────────────┴──────────────────────────────┐   │
│  │              index.ts                            │   │
│  │  CORS · Rate Limiter · JSON Parser · Auth MW     │   │
│  └────┬──────┬──────┬──────┬────────────────────────┘   │
│  ┌────┴┐ ┌───┴───┐ ┌┴────┐ ┌┴────────┐                 │
│  │Auth │ │ Chat  │ │Quiz │ │ Summary │                 │
│  │routes│ │routes │ │routes│ │ routes  │                 │
│  └──┬──┘ └───┬───┘ └──┬──┘ └────┬───┘                 │
│     │        │        │         │                       │
│  ┌──┴────────┴────────┴─────────┴──┐                   │
│  │         utils/openrouter.ts     │  (AI client)       │
│  └─────────────────────────────────┘                   │
│                           │                             │
│  ┌────────────────────────┴─────────────────────┐      │
│  │           Supabase (PostgreSQL)               │      │
│  │  users · sessions · otps · chat_history      │      │
│  │  quizzes · quiz_answers · summaries            │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

## Layer Breakdown

### 1. Chrome Extension

**Entry Points:**
- `popup.html/tsx` — 560px popup window for quick access
- `sidepanel.html/tsx` — Full-featured sidebar (480px+)
- `background.ts` — Service worker (handles toolbar icon click, `onInstalled`)
- `content.ts` — Injected into every page; extracts clean content, listens for text selection

**Messaging Flow:**
```
Extension UI  ←→  Background SW  ←→  Content Script  ←→  Web Page
     │                                                     │
     └────────────────── chrome.storage ───────────────────┘
```

- `chrome.runtime.sendMessage` — between popup/sidepanel and background
- `chrome.tabs.sendMessage` — between UI/popup and content script
- `chrome.storage.local` — persists auth tokens, chat history, preferences

**App Shell (`App.tsx`):**
- Checks auth state → shows `<Auth />` or main 4-tab interface (Chat, Page, Quiz, Summary)
- Settings panel (slide-out) with dark mode toggle and info pages
- Decorative background SVGs

### 2. Backend (Express.js)

**Request Lifecycle:**
```
Request → CORS → Rate Limiter → JSON Parser → Router
                                                 ↓
      ┌──────────────── Routes ────────────────┐
      │ Auth (no middleware)                    │
      │ Chat / Quiz / Summary (auth middleware) │
      └────────────────────────────────────────┘
                                                 ↓
      ┌──────────── Response ──────────────────┐
      │ Normal: JSON body                      │
      │ Streaming: Server-Sent Events (SSE)    │
      └────────────────────────────────────────┘
```

**AI Integration (`openrouter.ts`):**
- All AI calls go through OpenRouter API (`openrouter/auto` model)
- Chat and Summary use SSE streaming (yield chunks as they arrive)
- Quiz generation is non-streaming (collects full JSON response, parses it)

**Auth (`utils/auth.ts`):**
- Custom implementation (not Supabase Auth)
- bcrypt (12 rounds) for password hashing
- 32-byte random hex tokens for sessions
- 7-day session expiry

### 3. Data Flow

**Chat Flow:**
```
User types message → api.ts POST /chat/message → SSE stream → React state → rendered as Markdown
                                                              ↕
                                                    Saved to chat_history table
```

**Quiz Flow:**
```
1. User configures topic/difficulty → POST /quiz/generate
2. AI generates questions → parsed JSON → saved to quizzes table
3. User answers → POST /quiz/submit → scored vs stored content
4. Score + details returned → displayed on result/review screens
```

**Summary Flow:**
```
User enters content + options → POST /summary/generate (SSE)
→ AI streams summary → saved to summaries table → rendered in real-time
```

**Page Content Flow:**
```
1. content.ts extracts page text (strips scripts, nav, header/footer)
2. On "From Current Page": text sent as `content` param to AI endpoints
3. On "Send to Chat": text passed as `context` in chat message
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Custom auth vs Supabase Auth | Full control over UX (password rules, OTP flow, session format) |
| Service role key in backend | Bypasses RLS; all access control handled in Express middleware |
| SSE streaming vs WebSocket | Simpler implementation, HTTP-only compatible, no extra dependency |
| pnpm workspaces | Single repo, shared lockfile, fast installs |
| JSONB for quiz content | Flexible schema — questions vary by type (MCQ options, essay) |
| `glass3d` CSS class | Reusable glassmorphism card style across all components |
