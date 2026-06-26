import React, { useState } from 'react';
import { api } from '../utils/api';
import { storage } from '../utils/storage';
import '../styles.css';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password);

      await storage.setToken(result.token, result.userId, email);
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="px-4 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">StudySidebar</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="auth-container">
          <div className="flex justify-center mb-6">
            <div className="logo">S</div>
          </div>

          <h2 className="text-xl font-semibold text-center mb-6 text-slate-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-3 p-3 rounded-2xl bg-red-50 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : mode === 'login' ? (
                'Login'
              ) : (
                'Register'
              )}
            </button>

            <button
              type="button"
              className="btn w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              disabled={loading}
            >
              {mode === 'login' ? "Need an account? Register" : "Already have an account? Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
