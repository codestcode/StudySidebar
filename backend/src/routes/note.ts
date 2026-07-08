import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId } from '../utils/auth.js';
import { generateCornellNotes } from '../utils/openrouter.js';

const router: Router = Router();

interface NotesRequest extends Request {
  userId?: string;
  body: {
    pageContent?: string;
    pageTitle?: string;
    pageUrl?: string;
    style?: string;
    notesJson?: any;
  };
  params: {
    id?: string;
    pageUrl?: string;
  };
}

router.post('/generate', async (req: NotesRequest, res: Response) => {
  try {
    const { pageContent, pageTitle, pageUrl, style } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!pageContent) {
      return res.status(400).json({ error: 'Page content required' });
    }

    const notesData = await generateCornellNotes(pageContent, pageTitle, pageUrl, style);

    const noteId = generateId();
    const { error } = await supabase.from('notes').insert({
      id: noteId,
      user_id: userId,
      page_url: pageUrl || '',
      page_title: pageTitle || 'Untitled',
      notes_json: notesData,
    });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to save notes' });
    }

    res.json({ id: noteId, notes: notesData });
  } catch (error) {
    console.error('Notes generation error:', error);
    res.status(500).json({ error: 'Notes generation failed' });
  }
});

router.patch('/:id', async (req: NotesRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notesJson } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!notesJson) {
      return res.status(400).json({ error: 'notesJson required' });
    }

    const { error } = await supabase
      .from('notes')
      .update({
        notes_json: notesJson,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to update notes' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Notes update error:', error);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

router.get('/list', async (req: NotesRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userNotes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json(userNotes || []);
  } catch (error) {
    console.error('List notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

router.get('/page/:pageUrl', async (req: NotesRequest, res: Response) => {
  try {
    const userId = req.userId;
    const pageUrl = req.params.pageUrl;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!pageUrl) {
      return res.status(400).json({ error: 'Page URL required' });
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('page_url', pageUrl)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json(data || null);
  } catch (error) {
    console.error('Get page notes error:', error);
    res.status(500).json({ error: 'Failed to get page notes' });
  }
});

export default router;
