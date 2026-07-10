import React from 'react';
import ReactDOM from 'react-dom/client';
import { Shield } from 'lucide-react';
import './styles.css';

function BlockedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="max-w-md w-full p-8 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-slide-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold font-nunito mb-2">Stay Focused!</h1>
        <p className="text-slate-500 dark:text-slate-400 font-nunito mb-8 leading-relaxed">
          This site is blocked by EduSpark because your Focus Mode is active. Get back to your studies, you can do this!
        </p>
        
        <button 
          onClick={() => window.close()} 
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-semibold transition-colors font-nunito"
        >
          Close Tab
        </button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<BlockedPage />);
