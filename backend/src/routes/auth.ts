import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId, hashPassword, verifyPassword, generateToken } from '../utils/auth.js';

const router: Router = Router();

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
  };
}

const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = generateId();
    const passwordHash = hashPassword(password);

    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
    });

    if (error) throw error;

    const token = generateToken();
    tokenStore.set(token, {
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token, userId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: userList } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    const user = userList?.[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    tokenStore.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export function authenticateToken(req: any, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const tokenData = tokenStore.get(token);
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = tokenData.userId;
  req.token = token;
  next();
}

export default router;
