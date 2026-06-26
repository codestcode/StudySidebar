import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface VerificationFormProps {
  otp: string[];
  loading: boolean;
  error: string;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNavigateForgot: () => void;
}

export function VerificationForm({
  otp, loading, error,
  onOtpChange, onOtpKeyDown, onSubmit, onNavigateForgot,
}: VerificationFormProps) {
  return (
    <div className="w-full max-w-sm glass3d rounded-3xl p-8 animate-fade-slide-up">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onNavigateForgot}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow"
        >
          <ArrowLeft className="w-5 h-5 text-slate-900" />
        </button>
        <h2 className="text-lg font-semibold font-nunito text-slate-900">Verification</h2>
      </div>

      <div className="flex justify-center mb-8">
        <img
          src="/images/verification.png"
          alt="Verification"
          className="w-[267px] max-w-full"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-500 text-sm">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        <p className="text-base font-nunito text-blue-600 text-center">Enter Verification code</p>

        <div className="flex justify-center gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              disabled={loading}
              className="w-12 h-12 text-center text-xl font-semibold rounded-full bg-slate-100 text-slate-900 outline-none transition-all duration-200 focus:ring-[3px] focus:ring-blue-100 focus:border-blue-400 border-2 border-slate-700 font-nunito"
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Verifying...
              </span>
            ) : 'Send'}
          </button>

          <p className="text-sm font-bold font-nunito text-amber-600 text-center">
            Didn't receive it? Check your spam/junk folder in Gmail
          </p>
          <p className="text-base font-nunito text-slate-700 text-center">
            If you didn't receive a code,{' '}
            <button
              type="button"
              onClick={onNavigateForgot}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Resend
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
