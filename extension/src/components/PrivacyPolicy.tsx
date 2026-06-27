import React from 'react';
import '../styles.css';

export function PrivacyPolicy() {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
        
          <h3 className="text-base font-semibold text-slate-900 mb-1">Privacy Policy</h3>
          <p className="text-xs text-slate-500 mb-5">Last updated: March 20, 2025</p>

          <div className="w-full space-y-4 text-sm text-slate-700">
            <section className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-white card flex items-center justify-center text-blue-500 text-xs shrink-0">1</div>
              <div className="text-left">
                <h4 className="font-semibold text-slate-900">Information We Collect</h4>
                <p className="text-slate-500 leading-snug">We collect minimal data to improve the service, like usage analytics and preferences.</p>
              </div>
            </section>

            <section className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-white card flex items-center justify-center text-blue-500 text-xs shrink-0">2</div>
              <div className="text-left">
                <h4 className="font-semibold text-slate-900">How We Use Information</h4>
                <p className="text-slate-500 leading-snug">We use your data to improve features and provide a more personal experience.</p>
              </div>
            </section>

            <section className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-white card flex items-center justify-center text-blue-500 text-xs shrink-0">3</div>
              <div className="text-left">
                <h4 className="font-semibold text-slate-900">Data Protection</h4>
                <p className="text-slate-500 leading-snug">We use standard security measures to keep your data safe.</p>
              </div>
            </section>

            <section className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-white card flex items-center justify-center text-blue-500 text-xs shrink-0">4</div>
              <div className="text-left">
                <h4 className="font-semibold text-slate-900">Your Choices</h4>
                <p className="text-slate-500 leading-snug">You can clear your data or disable features at any time.</p>
              </div>
            </section>

            <div className="pt-4 text-center text-xs text-slate-500">
              <p>If you have any questions, please <a href="#" className="text-blue-500 font-medium">Contact Us</a></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

