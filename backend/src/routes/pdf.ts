import { Router, type Request, type Response } from 'express';
import multer from 'multer';

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

router.post('/extract', upload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Uploaded file must be a PDF' });
    }

    const pdfParse = await import('pdf-parse');
    const uint8 = new Uint8Array(req.file.buffer);
    const result = await (pdfParse as any)(uint8);
    const text = (result.text || '').replace(/\s+/g, ' ').trim();

    if (!text) {
      return res.status(422).json({ error: 'PDF contains no extractable text. It may be a scanned/image-based PDF.' });
    }

    res.json({ text, pages: result.numpages || 1 });
  } catch (error: any) {
    console.error('PDF extraction error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to extract text from PDF' });
  }
});

export default router;
