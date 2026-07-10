import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId } from '../utils/auth.js';
import { generateFlashcardsFromContent } from '../utils/openrouter.js';

const router: Router = Router();

interface FlashcardsRequest extends Request {
  userId?: string;
}

router.post('/generate', async (req: FlashcardsRequest, res: Response) => {
  try {
    const { content, pageTitle, pageUrl, count } = req.body;
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!content) return res.status(400).json({ error: 'Content required' });

    const { flashcards } = await generateFlashcardsFromContent(content, pageTitle, pageUrl, count || 5);
    
    if (!flashcards || flashcards.length === 0) {
      return res.status(500).json({ error: 'Failed to generate flashcards' });
    }

    const cardsToInsert = flashcards.map((fc: any) => ({
      id: generateId(),
      user_id: req.userId,
      page_url: pageUrl || '',
      page_title: pageTitle || '',
      question: fc.question,
      answer: fc.answer,
      box_level: 1,
      next_review_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('flashcards').insert(cardsToInsert);
    if (error) throw error;

    res.json({ cards: cardsToInsert });
  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

router.get('/list', async (req: FlashcardsRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('List flashcards error:', error);
    res.status(500).json({ error: 'Failed to list flashcards' });
  }
});

router.get('/due', async (req: FlashcardsRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', req.userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Get due flashcards error:', error);
    res.status(500).json({ error: 'Failed to get due flashcards' });
  }
});

router.post('/review/:id', async (req: FlashcardsRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const { id } = req.params;
    const { isCorrect } = req.body;

    const { data: cardList, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId);

    if (fetchError) throw fetchError;
    const card = cardList?.[0];
    if (!card) return res.status(404).json({ error: 'Flashcard not found' });

    let newBoxLevel = card.box_level;
    if (isCorrect) {
      newBoxLevel++;
    } else {
      newBoxLevel = 1;
    }

    const nextReview = new Date();
    if (newBoxLevel === 1) nextReview.setDate(nextReview.getDate() + 1);
    else if (newBoxLevel === 2) nextReview.setDate(nextReview.getDate() + 2);
    else if (newBoxLevel === 3) nextReview.setDate(nextReview.getDate() + 4);
    else if (newBoxLevel === 4) nextReview.setDate(nextReview.getDate() + 7);
    else if (newBoxLevel === 5) nextReview.setDate(nextReview.getDate() + 15);
    else nextReview.setDate(nextReview.getDate() + 30);

    const { error: updateError } = await supabase
      .from('flashcards')
      .update({
        box_level: newBoxLevel,
        next_review_at: nextReview.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.userId);

    if (updateError) throw updateError;
    res.json({ success: true, newBoxLevel, nextReview });
  } catch (error) {
    console.error('Review flashcard error:', error);
    res.status(500).json({ error: 'Failed to review flashcard' });
  }
});

router.delete('/all', async (req: FlashcardsRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete all flashcards error:', error);
    res.status(500).json({ error: 'Failed to delete flashcards' });
  }
});

router.delete('/:id', async (req: FlashcardsRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

export default router;
