import { Router, type Request, type Response } from 'express';
import multer from 'multer';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/extract', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Uploaded file must be a PDF' });
    }

    const { PDFParse } = await import('pdf-parse');
    const uint8 = new Uint8Array(req.file.buffer);
    const parser = new PDFParse(uint8);
    await parser.load();

    const result = await parser.getText();
    const info = await parser.getInfo();
    const text = (result.text || '').replace(/\s+/g, ' ').trim();

    if (!text) {
      return res.status(422).json({ error: 'PDF contains no extractable text. It may be a scanned/image-based PDF.' });
    }

    res.json({ text, pages: info.total || 1 });
  } catch (error: any) {
    console.error('PDF extraction error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to extract text from PDF' });
  }
});

export default router;
