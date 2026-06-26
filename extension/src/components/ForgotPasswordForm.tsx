import React from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  loading: boolean;
  error: string;
  onEmailChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateLogin: () => void;
}

export function ForgotPasswordForm({
  email, loading, error,
  onEmailChange, onSubmit, onNavigateLogin,
}: ForgotPasswordFormProps) {
  return (
    <div className="w-full max-w-sm glass3d rounded-3xl p-8 animate-fade-slide-up">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow"
        >
          <ArrowLeft className="w-5 h-5 text-slate-900" />
        </button>
        <h2 className="text-lg font-semibold font-nunito text-slate-900">Forget Password</h2>
      </div>

      <div className="flex justify-center mb-8">
        <img
          src="/images/forgot.png"
          alt="Forgot password"
          className="w-[304px] max-w-full"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-500 text-sm">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-base font-medium mb-2 font-nunito text-slate-900">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="user@gmail.com"
              required
              disabled={loading}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-blue-500 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-[3px] focus:ring-blue-100 font-nunito"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Sending...
            </span>
          ) : 'Send'}
        </button>
      </form>
    </div>
  );
}
