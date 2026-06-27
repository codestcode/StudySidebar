import React, { useState } from 'react';
import { Sun, Moon, ArrowLeft, Info, Shield, Eye, Mail, Menu } from 'lucide-react';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

type SettingsPage = 'main' | 'about' | 'policy' | 'vision' | 'contact';

export function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const [page, setPage] = useState<SettingsPage>('main');

  const navItems: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: 'About Us', icon: <Info className="w-5 h-5" /> },
    { id: 'policy', label: 'Policy', icon: <Shield className="w-5 h-5" /> },
    { id: 'vision', label: 'Vision', icon: <Eye className="w-5 h-5" /> },
    { id: 'contact', label: 'Contact Us', icon: <Mail className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      {page === 'main' && (
        <div className="max-w-sm mx-auto space-y-4">
          <h2 className="text-lg font-semibold font-nunito text-slate-900 dark:text-white mb-4">Settings</h2>

          <div className="glass3d rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600" />}
                <span className="text-sm font-medium font-nunito text-slate-700 dark:text-slate-200">Dark Mode</span>
              </div>
              <button
                onClick={onToggleDarkMode}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  darkMode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    darkMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className="w-full glass3d rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 dark:hover:bg-white/5 transition-all"
              >
                <span className="text-slate-600 dark:text-slate-300">{item.icon}</span>
                <span className="text-sm font-medium font-nunito text-slate-700 dark:text-slate-200">{item.label}</span>
                <ArrowLeft className="w-4 h-4 text-slate-400 ml-auto rotate-180" />
              </button>
            ))}
          </div>
        </div>
      )}

      {page !== 'main' && (
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => setPage('main')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-shadow mb-6"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>

          <div className="glass3d rounded-3xl p-6 space-y-4">
            {page === 'about' && (
              <>
                <h2 className="text-lg font-semibold font-nunito text-slate-900 dark:text-white">About Us</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  StudySidebar is your intelligent study companion that lives in your browser. We help students
                  and professionals learn more effectively by providing AI-powered summaries, quizzes, and chat
                  assistance directly from any webpage.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  Our mission is to make learning accessible, efficient, and enjoyable for everyone, everywhere.
                </p>
              </>
            )}

            {page === 'policy' && (
              <>
                <h2 className="text-lg font-semibold font-nunito text-slate-900 dark:text-white">Privacy Policy</h2>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  <p>
                    Your privacy matters to us. StudySidebar only accesses webpage content when you explicitly
                    activate it. We do not sell, share, or misuse your personal data.
                  </p>
                  <p>
                    <strong>Data Collection:</strong> We collect only the email address you register with and
                    store your learning preferences locally.
                  </p>
                  <p>
                    <strong>Data Security:</strong> All communications are encrypted. Your authentication token
                    is stored securely in Chrome's local storage.
                  </p>
                  <p>
                    <strong>Third Parties:</strong> We do not share your data with third parties. Our AI
                    processing is done through secure API calls.
                  </p>
                </div>
              </>
            )}

            {page === 'vision' && (
              <>
                <h2 className="text-lg font-semibold font-nunito text-slate-900 dark:text-white">Our Vision</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  We envision a world where every learner has access to personalized, AI-powered study tools
                  that adapt to their unique needs and pace.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  Our goal is to eliminate barriers to learning by providing instant insights, summaries, and
                  practice materials — turning any webpage into a classroom.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  We believe in continuous innovation, user privacy, and making education truly borderless.
                </p>
              </>
            )}

            {page === 'contact' && (
              <>
                <h2 className="text-lg font-semibold font-nunito text-slate-900 dark:text-white">Contact Us</h2>
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 font-nunito leading-relaxed">
                  <p>
                    We'd love to hear from you! Whether you have feedback, questions, or need support,
                    reach out to us.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span>studysidebar@gmail.com</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
