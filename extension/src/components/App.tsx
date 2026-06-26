import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, LogOut, BookOpen, GraduationCap, Brain, Lightbulb, Library, ScrollText } from 'lucide-react';
import { Auth } from './Auth';
import { Chat } from './Chat';
import { Quiz } from './Quiz';
import { Summary } from './Summary';
import { Settings } from './Settings';
import { PageContent } from './PageContent';
import { storage } from '../utils/storage';
import '../styles.css';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'content' | 'quiz' | 'summary'>('chat');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chatContext, setChatContext] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    checkAuth();
    loadDarkMode();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const checkAuth = async () => {
    const authenticated = await storage.isAuthenticated();
    setIsAuthenticated(authenticated);
    setLoading(false);
  };

  const loadDarkMode = async () => {
    const data = await storage.get(['darkMode']);
    if (data.darkMode) {
      setDarkMode(true);
    }
  };

  const handleToggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await storage.set({ darkMode: newMode });
  };

  const handleLogout = async () => {
    await storage.logout();
    setIsAuthenticated(false);
    setActiveTab('chat');
  };

  const handleSendToChat = (content: string) => {
    setChatContext(content);
    setActiveTab('chat');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 animate-fade-slide-up">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-blue-500/20 ring-[6px] ring-white/50 dark:ring-slate-700/50 overflow-hidden">
             <img src="https://res.cloudinary.com/dgsorkijt/image/upload/v1782497606/logostudy_bg6rv9.png" alt="StudySidebar" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-nunito tracking-tight">
              <span className="text-blue-600 dark:text-blue-400">Study</span>
              <span className="text-emerald-500 dark:text-emerald-400">Sidebar</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-nunito mt-1">Your AI study assistant</p>
          </div>
          <div className="w-48 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-[10px] text-slate-300 dark:text-slate-600 font-nunito animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <BookOpen className="absolute top-20 left-4 w-20 h-20 text-blue-200/60 dark:text-blue-800/40 rotate-12" />
        <GraduationCap className="absolute top-24 right-4 w-24 h-24 text-emerald-200/60 dark:text-emerald-800/40 -rotate-6" />
        <Brain className="absolute bottom-8 left-8 w-16 h-16 text-purple-200/60 dark:text-purple-800/40 -rotate-12" />
        <Lightbulb className="absolute bottom-8 right-8 w-14 h-14 text-amber-200/60 dark:text-amber-800/40 rotate-45" />
        <Library className="absolute top-1/2 -right-3 w-24 h-24 text-emerald-200/50 dark:text-emerald-800/35 rotate-12" />
        <ScrollText className="absolute top-1/3 -left-3 w-16 h-16 text-slate-300/60 dark:text-slate-600/40 rotate-[30deg]" />
      </div>
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <img src="https://res.cloudinary.com/dgsorkijt/image/upload/v1782497606/logostudy_bg6rv9.png" alt="" className="w-6 h-6" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">StudySidebar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all active:scale-95"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-all active:scale-95"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </header>

      <nav className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {(['chat', 'content', 'quiz', 'summary'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all font-nunito ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500 -mb-px'
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'content' ? 'Page' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'chat' && <Chat initialContext={chatContext} />}
        {activeTab === 'content' && <PageContent onSendToChat={handleSendToChat} />}
        {activeTab === 'quiz' && <Quiz />}
        {activeTab === 'summary' && <Summary />}
      </main>

      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm animate-fade-slide-up">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-50 dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white font-nunito">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all text-slate-500 dark:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <Settings darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
