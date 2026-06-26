import React from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  showPassword: boolean;
  success: boolean;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onShowPasswordChange: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateLogin: () => void;
}

export function ResetPasswordForm({
  password, confirmPassword, loading, error, showPassword, success,
  onPasswordChange, onConfirmPasswordChange,
  onShowPasswordChange, onSubmit, onNavigateLogin,
}: ResetPasswordFormProps) {
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
        <h2 className="text-lg font-semibold font-nunito text-slate-900">New Password</h2>
      </div>

      <div className="flex justify-center mb-8">
        <img
          src="/images/reset-password.png"
          alt="New password"
          className="w-[270px] max-w-full"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-500 text-sm">{error}</div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-14 h-14 text-emerald-500" />
          </div>
          <p className="text-sm text-slate-600 font-nunito">Password reset successfully!</p>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="w-full py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
          >
            Back to login
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-base font-medium mb-2 font-nunito text-slate-900">Enter New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="New password"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white border border-blue-500 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-[3px] focus:ring-blue-100 font-nunito"
                />
                <button
                  type="button"
                  onClick={onShowPasswordChange}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium mb-2 font-nunito text-slate-900">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white border border-blue-500 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-200 focus:ring-[3px] focus:ring-blue-100 font-nunito"
                />
                <button
                  type="button"
                  onClick={onShowPasswordChange}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold font-nunito text-slate-900">Password Requirements:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm font-nunito text-slate-400">At Least 8 Characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm font-nunito text-slate-400">One Uppercase Letter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm font-nunito text-slate-400">One Number</span>
              </div>
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
                Resetting...
              </span>
            ) : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}
