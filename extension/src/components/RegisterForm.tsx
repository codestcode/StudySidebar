import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  showPassword: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onShowPasswordChange: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateLogin: () => void;
}

export function RegisterForm({
  email, password, confirmPassword, loading, error, showPassword,
  onEmailChange, onPasswordChange, onConfirmPasswordChange, onShowPasswordChange,
  onSubmit, onNavigateLogin,
}: RegisterFormProps) {
  return (
    <div className="w-full max-w-sm glass3d rounded-3xl p-8 animate-fade-slide-up">
      <img src="https://res.cloudinary.com/dgsorkijt/image/upload/v1782497606/logostudy_bg6rv9.png" alt="StudySidebar" className="w-36 h-36 mx-auto mb-3 rounded-full" />
      <div className="flex flex-col items-center mb-7">
        <h1 className="text-xl font-bold font-nunito tracking-tight">
          <span className="text-blue-600">Study</span>
          <span className="text-emerald-500">Sidebar</span>
        </h1>
        <p className="text-slate-400 text-sm font-nunito text-center">Create your account</p>
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
              placeholder="Create a password"
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

        <div>
          <label className="block text-xs font-medium mb-1.5 text-slate-500 uppercase tracking-wide">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={loading}
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-blue-400 focus:ring-[3px] focus:ring-blue-100 font-nunito"
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
              Creating account...
            </span>
          ) : 'Register'}
        </button>

        <p className="text-xs text-center text-slate-400 pt-1">
          Already have an account?{' '}
          <button type="button" onClick={onNavigateLogin} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Log in
          </button>
        </p>
      </form>
    </div>
  );
}
