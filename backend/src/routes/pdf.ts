import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

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

    const pdfData = await pdfParse(req.file.buffer);
    
    // Clean up excessive whitespace
    const text = pdfData.text.replace(/\s+/g, ' ').trim();

    res.json({ text, pages: pdfData.numpages });
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
});

export default router;
