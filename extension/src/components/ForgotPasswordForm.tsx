import React from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  loading: boolean;
  error: string;
  resetSent: boolean;
  onEmailChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateLogin: () => void;
}

export function ForgotPasswordForm({
  email, loading, error, resetSent,
  onEmailChange, onSubmit, onNavigateLogin,
}: ForgotPasswordFormProps) {
  return (
    <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl shadow-blue-500/5 p-8 animate-fade-slide-up">
      <div className="flex flex-col items-center gap-3 mb-7">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <h1 className="text-xl font-bold font-poppins tracking-tight">
          <span className="text-blue-600">Study</span>
          <span className="text-emerald-500">Sidebar</span>
        </h1>
        <p className="text-slate-400 text-sm font-poppins text-center">Reset your password</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-500 text-sm">{error}</div>
      )}

      {resetSent ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-600">
            If an account exists with <strong className="text-slate-700">{email}</strong>, we've sent a password reset link.
          </p>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Back to login
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-500 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="user@gmail.com"
                required
                disabled={loading}
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-[3px] focus:ring-blue-100 font-poppins"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Sending...
              </span>
            ) : 'Send reset link'}
          </button>

          <p className="text-xs text-center text-slate-400">
            <button type="button" onClick={onNavigateLogin} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to login
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
