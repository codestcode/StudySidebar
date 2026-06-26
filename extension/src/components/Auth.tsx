import React, { useState, useCallback } from 'react';
import { BookOpen, GraduationCap, Brain, Lightbulb, PenLine, Library, ScrollText, Pencil } from 'lucide-react';
import { api } from '../utils/api';
import { storage } from '../utils/storage';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { VerificationForm } from './VerificationForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import '../styles.css';

interface AuthProps {
  onAuthSuccess: () => void;
}

type Page = 'login' | 'register' | 'forgot' | 'verification' | 'reset';

export function Auth({ onAuthSuccess }: AuthProps) {
  const [page, setPage] = useState<Page>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.login(email, password);
      await storage.setToken(result.token, result.userId, email);
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const result = await api.register(email, password);
      await storage.setToken(result.token, result.userId, email);
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setPage('verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setPage('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Invalid verification code');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, otpString, password);
      setResetSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const navigate = useCallback((to: Page) => {
    setPage(to);
    setError('');
    setOtp(Array(6).fill(''));
    setResetSuccess(false);
    setPassword('');
    setConfirmPassword('');
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <BookOpen className="absolute top-8 left-8 w-24 h-24 text-blue-200/70 rotate-12" />
        <GraduationCap className="absolute top-12 right-12 w-28 h-28 text-emerald-200/70 -rotate-6" />
        <Brain className="absolute bottom-16 left-12 w-20 h-20 text-purple-200/70 -rotate-12" />
        <Lightbulb className="absolute bottom-20 right-10 w-16 h-16 text-amber-200/70 rotate-45" />
        <PenLine className="absolute top-1/2 -left-6 w-20 h-20 text-blue-200/60 -rotate-45" />
        <Library className="absolute top-1/3 -right-4 w-28 h-28 text-emerald-200/60 rotate-12" />
        <ScrollText className="absolute bottom-1/4 left-1/3 w-14 h-14 text-slate-300/70 rotate-[30deg]" />
        <Pencil className="absolute top-1/4 right-1/4 w-12 h-12 text-amber-300/70 -rotate-[20deg]" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-5">

          {page === 'login' && (
            <LoginForm
              email={email}
              password={password}
              loading={loading}
              error={error}
              showPassword={showPassword}
              rememberMe={rememberMe}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onShowPasswordChange={() => setShowPassword(!showPassword)}
              onRememberMeChange={setRememberMe}
              onSubmit={handleLogin}
              onNavigateRegister={() => navigate('register')}
              onNavigateForgot={() => navigate('forgot')}
            />
          )}

          {page === 'register' && (
            <RegisterForm
              email={email}
              password={password}
              confirmPassword={confirmPassword}
              loading={loading}
              error={error}
              showPassword={showPassword}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onShowPasswordChange={() => setShowPassword(!showPassword)}
              onSubmit={handleRegister}
              onNavigateLogin={() => navigate('login')}
            />
          )}

          {page === 'forgot' && (
            <ForgotPasswordForm
              email={email}
              loading={loading}
              error={error}
              onEmailChange={setEmail}
              onSubmit={handleForgotPassword}
              onNavigateLogin={() => navigate('login')}
            />
          )}

          {page === 'verification' && (
            <VerificationForm
              otp={otp}
              loading={loading}
              error={error}
              onOtpChange={handleOtpChange}
              onOtpKeyDown={handleOtpKeyDown}
              onSubmit={handleVerification}
              onNavigateForgot={() => navigate('forgot')}
            />
          )}

          {page === 'reset' && (
            <ResetPasswordForm
              password={password}
              confirmPassword={confirmPassword}
              loading={loading}
              error={error}
              showPassword={showPassword}
              success={resetSuccess}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onShowPasswordChange={() => setShowPassword(!showPassword)}
              onSubmit={handleResetPassword}
              onNavigateLogin={() => navigate('login')}
            />
          )}

        </div>
      </div>
    </div>
  );
}
