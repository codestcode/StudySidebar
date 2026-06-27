import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId } from '../utils/auth.js';
import { summarizeContent } from '../utils/openrouter.js';

const router: Router = Router();

interface SummaryRequest extends Request {
  userId?: string;
  body: {
    content?: string;
    title?: string;
    sourceUrl?: string;
    length?: string;
    format?: string;
  };
}

router.post('/generate', async (req: SummaryRequest, res: Response) => {
  try {
    const { content, title, sourceUrl, length, format } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullSummary = '';

    try {
      fullSummary = await summarizeContent(content, length, format);
      res.write(`data: ${JSON.stringify({ chunk: fullSummary })}\n\n`);
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    }

    try {
      const summaryId = generateId();
      const { error } = await supabase.from('summaries').insert({
        id: summaryId,
        user_id: userId,
        title: title || 'Untitled Summary',
        content: fullSummary,
        source_url: sourceUrl || null,
      });
      if (error) console.error('Database error:', error);
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Summary generation failed' });
  }
});

router.get('/list', async (req: SummaryRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userSummaries, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(userSummaries || []);
  } catch (error) {
    console.error('List summaries error:', error);
    res.status(500).json({ error: 'Failed to get summaries' });
  }
});

export default router;
