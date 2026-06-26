import React, { useState, useEffect } from 'react';
import { Auth } from './Auth';
import { Chat } from './Chat';
import { Quiz } from './Quiz';
import { Summary } from './Summary';
import { storage } from '../utils/storage';
import '../styles.css';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'summary'>('chat');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await storage.isAuthenticated();
    setIsAuthenticated(authenticated);
    setLoading(false);
  };

  const handleLogout = async () => {
    await storage.logout();
    setIsAuthenticated(false);
    setActiveTab('chat');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <div className="inline-block w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">StudySidebar</h1>
        <button
          className="btn btn-primary text-xs py-1.5 px-3"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <nav className="flex border-b border-slate-200 bg-white">
        {(['chat', 'quiz', 'summary'] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500 -mb-px'
                : 'text-slate-400 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'quiz' && <Quiz />}
        {activeTab === 'summary' && <Summary />}
      </main>
    </div>
  );
}
