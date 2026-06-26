import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../db/client.js';
import { generateId, hashPassword, verifyPassword, generateToken, isValidEmail, isValidPassword } from '../utils/auth.js';
import { sendOtpEmail } from '../utils/email.js';

const router: Router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, try again later' },
});

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
    otp?: string;
  };
}

router.post('/register', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordError = isValidPassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);

    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
    });

    if (error) throw error;

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('sessions').insert({
      token,
      user_id: userId,
      expires_at: expiresAt,
    });

    res.json({ token, userId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { data: userList } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    const user = userList?.[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email Or Password are incorrect' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('sessions').insert({
      token,
      user_id: user.id,
      expires_at: expiresAt,
    });

    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
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

router.post('/reset-password', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and password required' });
    }

    const passwordError = isValidPassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
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

    const passwordHash = await hashPassword(password);

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

export async function authenticateToken(req: any, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .limit(1);

  const session = sessions?.[0];

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = session.user_id;
  req.token = token;
  next();
}

export default router;
