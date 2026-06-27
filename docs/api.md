# API Reference

Base URL: `http://localhost:3001/api`

---

## Authentication

### Register

Creates a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password1"
}
```

**Validation:**
- Email: must match basic email regex
- Password: minimum 8 characters, at least 1 uppercase letter, at least 1 digit

**Response `200`:**
```json
{
  "token": "a1b2c3d4...32-byte-hex",
  "userId": "uuid"
}
```

**Response `400`:**
```json
{
  "error": "Email already registered"
}
```

---

### Login

Authenticates an existing user.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password1"
}
```

**Response `200`:**
```json
{
  "token": "a1b2c3d4...32-byte-hex",
  "userId": "uuid"
}
```

**Response `401`:**
```json
{
  "error": "Invalid credentials"
}
```

---

### Forgot Password

Requests a 6-digit OTP sent to the user's email.

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

**Response `200`:**
```json
{
  "message": "If the email exists, an OTP has been sent"
}
```

Note: Always returns 200 (doesn't reveal if email exists). OTP expires in 15 minutes. Falls back to `console.log` if SMTP not configured.

---

### Reset Password

Resets password using OTP.

```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "student@example.com",
  "otp": "123456",
  "password": "NewPass1"
}
```

**Response `200`:**
```json
{
  "message": "Password reset successful"
}
```

**Response `400`:**
```json
{
  "error": "Invalid or expired OTP"
}
```

---

## Chat (Protected)

All chat endpoints require `Authorization: Bearer <token>` header.

### Send Message

Streams AI response via Server-Sent Events.

```http
POST /chat/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Explain recursion in Python",
  "context": "Optional page content for context-aware answers"
}
```

**Response:** SSE stream (text/event-stream)
```
data: {"content": "Recursion is a..."}
data: {"content": " technique where..."}
data: [DONE]
```

**Response `401`:**
```json
{
  "error": "Authentication required"
}
```

---

### Get Chat History

Returns all past conversations.

```http
GET /chat/history
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "message": "Explain recursion",
    "response": "Recursion is...",
    "context": null,
    "created_at": "2026-06-27T12:00:00Z"
  }
]
```

---

## Quiz (Protected)

### Generate Quiz

Creates a quiz with AI-generated questions.

```http
POST /quiz/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "JavaScript closures",
  "difficulty": "medium",
  "title": "JS Closures Quiz",
  "content": "Optional page content to base questions on",
  "numQuestions": 10,
  "questionTypes": ["mcq", "true-false", "essay"]
}
```

**Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `topic` | string | required | Quiz topic |
| `difficulty` | string | `"medium"` | `"easy"`, `"medium"`, or `"hard"` |
| `title` | string | topic | Optional display title |
| `content` | string | — | Page content to base questions on |
| `numQuestions` | number | `5` | Number of questions (1–25) |
| `questionTypes` | string[] | `["mcq"]` | Any subset of `["mcq", "true-false", "essay"]` |

**Response `200`:**
```json
{
  "id": "uuid",
  "content": {
    "questions": [
      {
        "question": "What is a closure in JavaScript?",
        "options": [
          "A function with access to its outer scope",
          "A closed block of code",
          "A type of loop",
          "A variable declaration"
        ],
        "correctAnswer": "A function with access to its outer scope",
        "type": "mcq"
      }
    ]
  }
}
```

**Question types:**
- `mcq`: has `options` array (4 items), `correctAnswer` matches one option
- `true-false`: has `options: ["True", "False"]`, `correctAnswer` is "True" or "False"
- `essay`: has no `options`, `correctAnswer` is a model answer

---

### Submit Quiz Answers

Scores answers and returns results.

```http
POST /quiz/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "quizId": "uuid",
  "answers": [
    { "questionIndex": 0, "selectedAnswer": "A function with access to its outer scope" },
    { "questionIndex": 1, "selectedAnswer": "True" }
  ]
}
```

**Response `200`:**
```json
{
  "score": 50,
  "correctCount": 1,
  "totalQuestions": 2,
  "details": [
    {
      "questionIndex": 0,
      "question": "What is a closure in JavaScript?",
      "userAnswer": "A function with access to its outer scope",
      "correctAnswer": "A function with access to its outer scope",
      "isCorrect": true
    },
    {
      "questionIndex": 1,
      "question": "Closures are only available in ES6",
      "userAnswer": "True",
      "correctAnswer": "False",
      "isCorrect": false
    }
  ]
}
```

---

### List Quizzes

Returns all quizzes for the authenticated user.

```http
GET /quiz/list
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "title": "JS Closures Quiz",
    "topic": "JavaScript closures",
    "difficulty": "medium",
    "created_at": "2026-06-27T12:00:00Z"
  }
]
```

Note: Response does not include the full question content — only metadata.

---

## Summary (Protected)

### Generate Summary

Streams AI-generated summary via Server-Sent Events.

```http
POST /summary/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Full text to summarize...",
  "title": "Optional title",
  "sourceUrl": "https://example.com/article",
  "length": "medium",
  "format": "bullet"
}
```

**Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `content` | string | required | Text to summarize |
| `title` | string | — | Optional title (saved with summary) |
| `sourceUrl` | string | — | Source page URL for reference |
| `length` | string | `"medium"` | `"short"` (3 points), `"medium"` (5-8 items), `"detailed"` (multi-section) |
| `format` | string | `"paragraph"` | `"paragraph"`, `"bullet"`, `"concept"` |

**Prompt mapping (9 combinations):**

| Length | Format | Output |
|--------|--------|--------|
| short | paragraph | 3 key points in paragraph |
| short | bullet | 3 key points as bullets |
| short | concept | 3 key concepts |
| medium | paragraph | 1 paragraph summary |
| medium | bullet | Key points as bullets |
| medium | concept | Key concepts extracted |
| detailed | paragraph | Full paragraph summary |
| detailed | bullet | Comprehensive bullet points |
| detailed | concept | Full concept breakdown |

**Response:** SSE stream (text/event-stream)
```
data: {"content": "The article covers..."}
data: {"content": " three main topics..."}
data: [DONE]
```

---

### List Summaries

```http
GET /summary/list
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "title": "Article Summary",
    "content": "The summarized text...",
    "source_url": "https://example.com/article",
    "created_at": "2026-06-27T12:00:00Z"
  }
]
```

---

## Health Check

```http
GET /health
```

**Response `200`:**
```json
{
  "status": "ok",
  "db": "connected"
}
```

**Response `503`:**
```json
{
  "status": "error",
  "db": "disconnected"
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error, missing field, duplicate email) |
| 401 | Unauthorized (invalid/missing/expired token, wrong credentials) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

**Error format:**
```json
{
  "error": "Descriptive error message"
}
```

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Auth endpoints | 10 requests per 15 minutes |
| Global | 60 requests per 15 minutes |
