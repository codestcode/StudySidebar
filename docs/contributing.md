# Contributing

## Development Setup

```bash
# Fork and clone
git clone <your-fork> studysidebar
cd studysidebar
pnpm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Start backend
pnpm dev:backend

# Build extension (in another terminal)
pnpm --filter ./extension build
```

Load the extension from `extension/dist` in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

---

## Project Conventions

### Code Style
- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **React 19** — functional components with hooks, no class components
- **Tailwind CSS** — utility classes, custom styles in `styles.css` only for reusable patterns (`.glass3d`, `.btn`, `.card`)
- **Imports** — `react` first, then third-party, then local relative imports

### Naming
- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components**: named exports, not default exports
- **Props interfaces**: `ComponentNameProps` in same file
- **State**: `useState` with descriptive names, group related state in objects

### Branching
```
main          — Production-ready, deployable
├── dev       — Integration branch
├── feat/xxx  — New features
├── fix/xxx   — Bug fixes
└── docs/xxx  — Documentation
```

---

## Adding a Feature

### New API Endpoint
1. Create route file in `backend/src/routes/` (or add to existing)
2. Register in `backend/src/index.ts` with appropriate auth middleware
3. Add client method in `extension/src/utils/api.ts`
4. Add UI component in `extension/src/components/`

### New UI Component
1. Check existing components for patterns to follow
2. Create file in `extension/src/components/`
3. Use `glass3d`, `btn`, `btn-primary`, and `card` CSS classes where appropriate
4. Import and render in the parent component

### New Quiz Question Type
1. Update `Question` type in `QuizTypes.ts`
2. Update the AI prompt in `backend/src/utils/openrouter.ts` (`generateQuizFromContent`)
3. Update rendering in `QuizTaking.tsx`
4. Update scoring logic in `backend/src/routes/quiz.ts`

---

## Testing

No formal test framework is set up. Manual testing approach:

### Backend
```bash
# Health check
curl http://localhost:3001/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Use the returned token for protected endpoints
```

### Extension
- Open DevTools for the extension (right-click extension → Inspect)
- Check Console for logs and errors
- Test each tab (Chat, Page, Quiz, Summary) with various inputs

---

## Pull Request Process

1. Create a branch from `dev`
2. Make your changes
3. Rebuild the extension: `pnpm --filter ./extension build`
4. Load and test manually in Chrome
5. Verify backend still compiles: `cd backend && npx tsc --noEmit`
6. Push and open a PR to `dev`
7. Describe what changed and why

---

## Project Structure Overview

```
backend/src/
├── index.ts            # Express app setup
├── routes/             # auth.ts, chat.ts, quiz.ts, summary.ts
├── utils/              # auth.ts, openrouter.ts, email.ts
└── db/client.ts        # Supabase client

extension/src/
├── components/         # React components
├── utils/              # api.ts, storage.ts
├── popup.html/.tsx     # Popup entry
├── sidepanel.html/.tsx # Side panel entry
├── background.ts       # Service worker
├── content.ts          # Content script
├── manifest.json       # Chrome manifest
└── styles.css          # Custom CSS
```

---

## Common Tasks

### Add a new page to the extension
1. Create component in `extension/src/components/`
2. Add tab button in `App.tsx` navigation bar
3. Add route in `App.tsx` switch statement

### Add a new API route
1. Create file in `backend/src/routes/`
2. Export an Express Router
3. Import and mount in `backend/src/index.ts`
4. Add auth middleware if needed
5. Add client method in `extension/src/utils/api.ts`

### Add a database table
1. Add CREATE TABLE to docs/database.md
2. Run SQL in Supabase SQL Editor
3. Add query logic to the relevant route file
