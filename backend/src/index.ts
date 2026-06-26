import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

// Protected routes (require authentication)
app.use('/api/chat', authenticateToken, chatRouter);
app.use('/api/quiz', authenticateToken, quizRouter);
app.use('/api/summary', authenticateToken, summaryRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
