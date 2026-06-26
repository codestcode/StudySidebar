import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  showPassword: boolean;
  rememberMe: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onShowPasswordChange: () => void;
  onRememberMeChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateRegister: () => void;
  onNavigateForgot: () => void;
}

export function LoginForm({
  email, password, loading, error, showPassword, rememberMe,
  onEmailChange, onPasswordChange, onShowPasswordChange, onRememberMeChange,
  onSubmit, onNavigateRegister, onNavigateForgot,
}: LoginFormProps) {
  return (
    <div className="w-full max-w-sm glass3d rounded-3xl p-8 animate-fade-slide-up">
      <img src="https://res.cloudinary.com/dgsorkijt/image/upload/v1782497606/logostudy_bg6rv9.png" alt="StudySidebar" className="w-36 h-36 mx-auto mb-3 rounded-3xl" />
      <div className="flex flex-col items-center mb-7">
        <h1 className="text-xl font-bold font-nunito tracking-tight">
          <span className="text-blue-600">Study</span>
          <span className="text-emerald-500">Sidebar</span>
        </h1>
        <p className="text-slate-400 text-sm font-nunito text-center">Welcome back</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-500 text-sm">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
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
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-[3px] focus:ring-blue-100 font-nunito"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-slate-500 uppercase tracking-wide">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-[3px] focus:ring-blue-100 font-nunito"
            />
            <button
              type="button"
              onClick={onShowPasswordChange}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-blue-600"
            />
            <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
          </label>
          <button type="button" onClick={onNavigateForgot} className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Logging in...
            </span>
          ) : 'Login'}
        </button>

        <p className="text-xs text-center text-slate-400 pt-1">
          Don't have an account?{' '}
          <button type="button" onClick={onNavigateRegister} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Create one
          </button>
        </p>
      </form>
    </div>
  );
}
