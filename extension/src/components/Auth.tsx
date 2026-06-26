import React, { useState } from 'react';
import { api } from '../utils/api';
import { storage } from '../utils/storage';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import '../styles.css';

interface AuthProps {
  onAuthSuccess: () => void;
}

type Page = 'login' | 'register' | 'forgot';

export function Auth({ onAuthSuccess }: AuthProps) {
  const [page, setPage] = useState<Page>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
      await new Promise((r) => setTimeout(r, 1000));
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const navigate = (to: Page) => {
    setPage(to);
    setError('');
    setResetSent(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
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
              resetSent={resetSent}
              onEmailChange={setEmail}
              onSubmit={handleForgotPassword}
              onNavigateLogin={() => navigate('login')}
            />
          )}

        </div>
      </div>
    </div>
  );
}
