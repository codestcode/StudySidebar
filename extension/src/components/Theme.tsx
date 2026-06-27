import React, { useEffect, useState } from 'react';
import '../styles.css';
import { storage } from '../utils/storage';

type ThemeOption = 'light' | 'dark' | 'system';

export function Theme() {
  const [theme, setTheme] = useState<ThemeOption>('system');

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get(['theme']);
        if ((s as any).theme) setTheme((s as any).theme as ThemeOption);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const save = async (t: ThemeOption) => {
    setTheme(t);
    await storage.set({ ...(await storage.get([] as any)), ...( { theme: t } as any) } as any);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white">
        <button className="p-2 rounded-lg hover:bg-slate-100" aria-label="back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h2 className="text-base font-semibold text-slate-900">Theme</h2>

        <div className="w-6" />
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-slate-600 mb-6">Choose Theme
            <span className="block text-xs text-slate-400">Select the theme that you prefer</span>
          </p>

          <div className="space-y-4">
            <label className={`card flex items-center gap-4 p-4 ${theme === 'light' ? 'border-2 border-slate-200' : ''}`}>
              <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => save('light')} className="ml-auto" />
              <div className="flex-1 text-left">
                <div className="font-medium">Light</div>
                <div className="text-xs text-slate-400">Use a light theme</div>
              </div>
            </label>

            <label className={`card flex items-center gap-4 p-4 ${theme === 'dark' ? 'border-2 border-blue-500' : ''}`}>
              <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => save('dark')} className="ml-auto" />
              <div className="flex-1 text-left">
                <div className="font-medium">Dark</div>
                <div className="text-xs text-slate-400">Use a dark theme</div>
              </div>
            </label>

            <label className={`card flex items-center gap-4 p-4 ${theme === 'system' ? 'border-2 border-slate-200' : ''}`}>
              <input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={() => save('system')} className="ml-auto" />
              <div className="flex-1 text-left">
                <div className="font-medium">System Default</div>
                <div className="text-xs text-slate-400">Use theme based on your system</div>
              </div>
            </label>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-sm text-slate-500">
              You can change the theme anytime. Your preference will be saved automatically.
            </div>

            <button className="btn btn-gradient w-full">Save Changes</button>
          </div>
        </div>
      </main>
    </div>
  );
}
