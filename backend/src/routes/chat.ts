import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId } from '../utils/auth.js';
import { streamChatResponse } from '../utils/openrouter.js';

const router: Router = Router();

interface ChatRequest extends Request {
  userId?: string;
  body: {
    message?: string;
    context?: string;
  };
}

router.post('/message', async (req: ChatRequest, res: Response) => {
  try {
    const { message, context } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    const systemPrompt = context
      ? `You are a helpful study assistant. Use this context to answer questions:\n\n${context}`
      : 'You are a helpful study assistant for computer science students.';

    const messages = [
      { role: 'user' as const, content: message },
    ];

    try {
      for await (const chunk of streamChatResponse(messages, systemPrompt)) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    }

    try {
      const { error } = await supabase.from('chat_history').insert({
        id: generateId(),
        user_id: userId,
        message,
        response: fullResponse,
        context: context || null,
      });
      if (error) console.error('Database error:', error);
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

router.get('/history', async (req: ChatRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: history, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(history || []);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;
