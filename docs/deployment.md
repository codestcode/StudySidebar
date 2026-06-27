# Deployment

## Backend

### Build
```bash
cd backend
pnpm build
```
Output: `backend/dist/` — compiled JavaScript.

### Deploy Options

#### Railway
```bash
# Procfile in backend/
web: node dist/index.js
```
Set environment variables in Railway dashboard: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `PORT`.

#### Render
1. Create a new **Web Service**
2. Connect your repo
3. Build command: `cd backend && pnpm install && pnpm build`
4. Start command: `cd backend && node dist/index.js`
5. Add environment variables in Render dashboard

#### Fly.io
```toml
# fly.toml
[build]
  builder = "heroku/buildpacks:20"
[env]
  PORT = "3001"
```

#### Vercel
Not recommended — Express.js requires a Node.js server. Vercel is serverless and doesn't support persistent WebSocket/SSE connections natively.

### After Deployment
Update `extension/src/utils/api.ts` to point to your deployed URL:
```typescript
const BASE_URL = 'https://your-app.railway.app/api';
// instead of 'http://localhost:3001/api'
```

---

## Extension

### Build for Distribution
```bash
pnpm --filter ./extension build
```
Output: `extension/dist/`.

### Chrome Web Store
1. Zip the `extension/dist` folder
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
3. Pay the one-time $5 registration fee
4. Click **New item** and upload the zip
5. Fill in:
   - **Description** — feature overview
   - **Screenshots** — 1280x800 or 640x400
   - **Promotional images** — optional
   - **Category** — Productivity or Education
6. Submit for review (usually 1–3 business days)

### Self-Hosted / Sideload
- Keep the extension in Developer mode
- Users load `extension/dist` as unpacked
- Or use Windows Group Policy / macOS MDM to force-install

### Continuous Build
If you change the backend URL or extension code:
```bash
pnpm --filter ./extension build
# Reload at chrome://extensions
```

---

## Environment Variables (Production)

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENROUTER_API_KEY=sk-or-...

# Optional
PORT=3001                    # Default if not set
SMTP_HOST=smtp.gmail.com     # For password reset emails
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
```

### Security Notes
- Never commit `.env` to version control
- Use your hosting provider's environment variable system (not `.env` files) in production
- Rotate Supabase service role keys periodically
- The service role key bypasses Row Level Security — keep it server-side only

---

## Data Migration

### Export all tables
In Supabase dashboard:
1. Go to **Database → Backup**
2. Enable Point-in-Time Recovery (paid plan) or
3. Manually export via **SQL Editor**:
```sql
COPY users TO '/tmp/users.csv' CSV HEADER;
```

### Import into new Supabase project
1. Create tables in the new project
2. Export from old project via Supabase CLI:
```bash
npx supabase db dump -f schema.sql
```
3. Import to new project:
```bash
npx supabase db push
```

---

## Monitoring

### Backend Health
```http
GET /health
```
Returns:
```json
{ "status": "ok", "db": "connected" }
```
Use this for uptime monitoring (e.g., UptimeRobot, Better Uptime).

### Logs
- Backend: stdout (use hosting provider's log dashboard)
- Extension: right-click → Inspect → Console tab

### Rate Limits
Limits are enforced in production:
- Auth: 10 requests / 15 min
- All endpoints: 60 requests / 15 min

Adjust in `backend/src/index.ts`:
```typescript
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // Increase for production
}));
```
