import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './db/client.js';
import authRouter, { authenticateToken } from './routes/auth.js';
import chatRouter from './routes/chat.js';
import quizRouter from './routes/quiz.js';
import summaryRouter from './routes/summary.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (no authentication required)
app.use('/api/auth', authRouter);

const requireAuth: express.RequestHandler[] = [
  (req, res, next) => authenticateToken(req, res, next).catch(next),
];
// Protected routes (require authentication)
app.use('/api/chat', ...requireAuth, chatRouter);
app.use('/api/quiz', ...requireAuth, quizRouter);
app.use('/api/summary', ...requireAuth, summaryRouter);

async function checkDatabase() {
  try {
    const { error } = await supabase.from('sessions').select('id').limit(1);
    if (error && error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.error('\n❌ Database tables missing! Run these SQL migrations in Supabase SQL editor:\n');
      console.error('  1. backend/migrations/000_users.sql');
      console.error('  2. backend/migrations/001_sessions.sql\n');
      console.error('  Or copy-paste their contents into the Supabase SQL editor.\n');
    } else if (error) {
      console.error('⚠️  Database check warning:', error.message);
    }
  } catch {
    // skip check on error
  }
}

app.listen(PORT, async () => {
  await checkDatabase();
  console.log(`Backend server running on http://localhost:${PORT}`);
});
