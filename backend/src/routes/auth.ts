import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId, hashPassword, verifyPassword, generateToken } from '../utils/auth.js';
import { sendOtpEmail } from '../utils/email.js';

const router: Router = Router();

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
    otp?: string;
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

router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from('otps').insert({
      email,
      otp,
      expires_at: expiresAt,
    });

    await sendOtpEmail(email, otp);

    res.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and password required' });
    }

    const { data: otpRecords } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const validOtp = otpRecords?.[0];

    if (!validOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const passwordHash = hashPassword(password);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email);

    if (updateError) throw updateError;

    await supabase
      .from('otps')
      .update({ used: true })
      .eq('id', validOtp.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Something went wrong' });
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
