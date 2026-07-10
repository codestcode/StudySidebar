import { Router, type Request, type Response } from 'express';
import { YoutubeTranscript } from 'youtube-transcript';

const router: Router = Router();

router.get('/transcript', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const fullText = transcript.map(t => t.text).join(' ');

    res.json({ text: fullText });
  } catch (error) {
    console.error('YouTube transcript error:', error);
    res.status(500).json({ error: 'Failed to fetch transcript. The video might not have captions or is restricted.' });
  }
});

export default router;
