# Component Reference

## Component Tree

```
App.tsx
├── LoadingScreen (inline)
├── DecorativeBackground (inline SVGs)
├── Auth.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── VerificationForm.tsx
│   └── ResetPasswordForm.tsx
├── Navigation (4-tab bar: Chat, Page, Quiz, Summary)
├── Chat.tsx
│   ├── ContextPanel
│   ├── MessageList
│   │   ├── UserMessage
│   │   ├── AssistantMessage (react-markdown)
│   │   └── TypingIndicator
│   └── ChatInput
├── PageContent.tsx
├── Quiz.tsx (orchestrator)
│   ├── QuizGenerate.tsx
│   ├── QuizTaking.tsx
│   ├── QuizResult.tsx
│   └── QuizReview.tsx
├── Summary.tsx
└── Settings.tsx (slide-out panel)
    ├── DarkModeToggle
    ├── AboutUs
    ├── Policy
    ├── Vision
    └── ContactUs
```

---

## App.tsx

The root orchestrator. Manages auth state, tab routing, dark mode, and settings panel.

**State:**
- `user` (object | null) — authenticated user
- `loading` (boolean) — initial loading
- `activeTab` ('chat' | 'page' | 'quiz' | 'summary')
- `showSettings` (boolean)
- `isDarkMode` (boolean)

**Flow:**
1. On mount: check `chrome.storage.local` for existing auth token and dark mode preference
2. If authenticated → render main layout with tabs
3. If not → render Auth component
4. Tab clicks switch `activeTab` and render the corresponding component

---

## Quiz.tsx (Orchestrator)

Central state manager for the quiz workflow. Does not render quiz UI itself — delegates to sub-components based on `mode`.

**State:**
| Variable | Type | Description |
|----------|------|-------------|
| `mode` | `'generate' \| 'taking' \| 'result' \| 'review'` | Current phase |
| `quiz` | `{ id: string; content: QuizContent } \| null` | Generated quiz data |
| `answers` | `Record<number, string>` | User's selected answers |
| `result` | `QuizResult \| null` | Scored result |
| `loading` | boolean | API in progress |
| `error` | string | Error message |

**Phase transitions:**
```
generate → (generate API call) → taking → (submit API call) → result → review
    ↑                                                              │
    └────────────────────────── reset ─────────────────────────────┘
```

---

## QuizGenerate.tsx

Configuration screen for creating a new quiz.

**Props:** `(onGenerate, loading, error)`

**Features:**
- **GenMode toggle:** "From Current Page" (auto-fetches via content script) vs "Enter Topic" (textarea)
- **Question count:** ± buttons + preset quick selects: 5, 10, 15, 20, 25
- **Difficulty:** 3 radio cards — Easy (green), Medium (blue), Hard (red)
- **Question types:** checkboxes — Multiple Choice, True/False, Essay (Short Answer)
- **Page content indicator** — shows char count when "From Current Page" is active

**Emits:** `onGenerate(topic, difficulty, numQuestions, questionTypes, content?)`

---

## QuizTaking.tsx

Question-by-question answering interface.

**Props:** `(quiz, answers, onAnswerChange, currentQuestionIndex, onPrevQuestion, onNextQuestion, onSubmit, onReset, loading, error)`

**Features:**
- Progress bar with percentage
- "Question X / Y" header
- MCQ: radio-button cards (blue border on selected)
- Essay: textarea
- Previous/Next navigation (Previous disabled on first question)
- Submit button on last question (with loading spinner)
- Fallback UI when `questions` array is empty

---

## QuizResult.tsx

Scoring and results display.

**Props:** `(result, onReview, onReset)`

**Features:**
- Circular score display (gradient ring, white inner circle)
- Pass/fail messaging (≥70% = "Great Job!", else "Keep Practicing!")
- Correct/wrong count with CheckCircle/XCircle icons
- Top 2 wrong answers preview with correct answers
- Perfect score (100%) congratulation banner
- "Review All Answers" and "New Quiz" buttons

---

## QuizReview.tsx

Full answer review.

**Props:** `(result, onBack)`

**Features:**
- All questions listed with correct (green gradient) / incorrect (red gradient) status
- Questions use `glass3d` cards with gradient icon containers
- Shows user answer and correct answer (only for wrong answers)
- "Return to Results" button

---

## QuizTypes.ts

Shared TypeScript interfaces.

```typescript
interface Question {
  question: string;
  options?: string[];     // undefined for essay
  correctAnswer: string;
  type: 'mcq' | 'true-false' | 'essay';
}

interface QuizContent {
  questions: Question[];
}

interface QuizResultDetail {
  questionIndex: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  details: QuizResultDetail[];
}

type GenMode = 'current-page' | 'enter-topic';
type Mode = 'generate' | 'taking' | 'result' | 'review';
type Difficulty = 'easy' | 'medium' | 'hard';
```

---

## Chat.tsx

AI chat interface with streaming responses.

**State:**
- `messages` — array of `{ role: 'user' | 'assistant', content: string }`
- `input` — current input text
- `context` — optional page context text
- `streaming` — boolean for active SSE connection
- `showContext` — collapse/expand context panel

**Features:**
- Streaming response via async generator from `api.ts`
- Markdown rendering with `react-markdown` + `remark-gfm`
- Code blocks: language label, copy button, macOS-style dots
- User messages: right-aligned, blue gradient
- AI messages: left-aligned, glassmorphism
- Auto-scroll with scroll-detection
- Typing indicator (3 bouncing dots)
- Copy buttons on AI responses
- Clear chat button
- Chat history persistence

---

## Summary.tsx

Content summarization with 9 output style combinations.

**Features:**
- Length selector: Short / Medium / Detailed
- Format selector: Paragraph / Bullet Point / Key Concept
- Content source: auto-fetch from current page or manual paste
- Streaming response with real-time rendering
- Copy and Regenerate buttons

---

## Auth Flow Components

### Auth.tsx
Multi-page auth wizard. Manages 5 sub-pages:
1. Login
2. Register
3. Forgot Password
4. Verification (OTP)
5. Reset Password

**State machine:** `page` state controls which form is shown. Each form has its own error/loading state.

### LoginForm.tsx
- Email input with Mail icon
- Password input with Lock icon + show/hide toggle
- "Remember Me" checkbox
- "Forgot Password?" link
- Gradient submit button

### RegisterForm.tsx
- Email, Password, Confirm Password
- Password requirements indicator
- Link back to Login

### ForgotPasswordForm.tsx
- Email input
- Back navigation
- Illustration image

### VerificationForm.tsx
- 6 individual digit inputs
- Auto-advance on typing
- Backspace navigation
- Paste support (6-digit)
- Error/loading states

### ResetPasswordForm.tsx
- New Password + Confirm Password
- Password requirements checklist
- Success state overlay

---

## Settings.tsx

Slide-out panel from the right.

**Features:**
- Dark mode toggle (Moon/Sun icons, persisted to storage)
- Navigation links to: About Us, Policy, Vision, Contact Us
- Each sub-page has a back button

---

## Storage Utilities (`utils/storage.ts`)

Chrome storage wrapper providing typed access to `chrome.storage.local`.

**Methods:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `<T>(keys: string[]) => Promise<Record<string, T>>` | Read values |
| `set` | `(data: Record<string, any>) => Promise<void>` | Write values |
| `clear` | `() => Promise<void>` | Clear all storage |
| `getToken` | `() => Promise<string \| null>` | Get auth token |
| `setToken` | `(token, userId, email) => Promise<void>` | Persist auth data |
| `logout` | `() => Promise<void>` | Clear everything |
| `isAuthenticated` | `() => Promise<boolean>` | Check token exists |

---

## API Client (`utils/api.ts`)

HTTP client for all backend endpoints. Base URL: `http://localhost:3001/api`.

**Methods:**
| Method | Signature | Response |
|--------|-----------|----------|
| `register` | `(email, password)` | `{ token, userId }` |
| `login` | `(email, password)` | `{ token, userId }` |
| `forgotPassword` | `(email)` | `{ message }` |
| `resetPassword` | `(email, otp, password)` | `{ message }` |
| `chatStream` | `(message, context?)` | AsyncGenerator (SSE chunks) |
| `getChatHistory` | `()` | `ChatMessage[]` |
| `generateQuiz` | `(topic, difficulty, title?, numQuestions?, questionTypes?, content?)` | `{ id, content }` |
| `submitQuizAnswers` | `(quizId, answers)` | `QuizResult` |
| `getQuizzes` | `()` | `Quiz[]` |
| `generateSummary` | `(content, title?, sourceUrl?, length?, format?)` | AsyncGenerator (SSE chunks) |
| `getSummaries` | `()` | `Summary[]` |

Token is automatically attached via `chrome.storage.local` lookup on each request.
