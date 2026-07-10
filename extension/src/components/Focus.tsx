import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings, Shield, Clock, Plus, X, RotateCcw } from 'lucide-react';
import { api } from '../utils/api';
import '../styles.css';

export function Focus() {
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  
  const [blockedDomains, setBlockedDomains] = useState<string[]>([
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'reddit.com',
    'tiktok.com',
    'youtube.com'
  ]);
  const [newDomain, setNewDomain] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handlePhaseEnd();
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handlePhaseEnd = () => {
    setIsActive(false);
    
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(focusDuration * 60);
    } else {
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      
      // Stop blocking sites when we start the break
      chrome.runtime.sendMessage({ type: 'stop-focus' }).catch(() => {});
      
      // track the session
      api.trackStudySession(focusDuration).catch(console.error);
    }
    
    // play ding
    try {
      new Audio(chrome.runtime.getURL('bell.mp3')).play().catch(() => {});
    } catch (e) {}
  };

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
      if (!isBreak) {
        chrome.runtime.sendMessage({ type: 'stop-focus' }).catch(() => {});
      }
    } else {
      setIsActive(true);
      if (!isBreak) {
        chrome.runtime.sendMessage({ 
          type: 'start-focus', 
          domains: blockedDomains 
        }).catch(() => {});
      }
    }
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(focusDuration * 60);
    chrome.runtime.sendMessage({ type: 'stop-focus' }).catch(() => {});
  };

  const addDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    
    let domain = newDomain.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    domain = domain.split('/')[0];
    
    if (domain && !blockedDomains.includes(domain)) {
      setBlockedDomains([...blockedDomains, domain]);
      
      if (isActive && !isBreak) {
        chrome.runtime.sendMessage({ 
          type: 'start-focus', 
          domains: [...blockedDomains, domain] 
        }).catch(() => {});
      }
    }
    setNewDomain('');
  };

  const removeDomain = (domainToRemove: string) => {
    const updated = blockedDomains.filter(d => d !== domainToRemove);
    setBlockedDomains(updated);
    
    if (isActive && !isBreak) {
      chrome.runtime.sendMessage({ 
        type: 'start-focus', 
        domains: updated 
      }).catch(() => {});
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = isBreak ? breakDuration * 60 : focusDuration * 60;
  const progress = timeLeft / totalSeconds;
  const circleRadius = 120;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (progress * circleCircumference);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">
        
        <div className="glass3d rounded-3xl p-6 relative overflow-hidden animate-fade-slide-up">
          {isActive && !isBreak && (
            <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
          )}
          {isActive && isBreak && (
            <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
          )}

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
                isBreak 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-emerald-500/20' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20'
              }`}>
                {isBreak ? <Clock className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">
                  {isBreak ? 'Break Time' : 'Focus Mode'}
                </h2>
                <p className="text-xs text-slate-400 font-nunito">
                  {isActive && !isBreak ? 'Blocking distractions' : 'Pomodoro timer'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center relative z-10 mb-8">
            <div className="relative flex items-center justify-center w-64 h-64">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="128"
                  cy="128"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-linear ${
                    isBreak ? 'text-emerald-500' : 'text-blue-500'
                  }`}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className={`text-6xl font-bold font-nunito tracking-tight ${
                  isBreak ? 'text-emerald-500' : 'text-blue-500'
                }`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm font-medium text-slate-400 mt-2 font-nunito uppercase tracking-widest">
                  {isBreak ? 'Rest' : 'Focus'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={toggleTimer}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  isActive
                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                    : isBreak 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25'
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/25'
                }`}
              >
                {isActive ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>
              
              <button
                onClick={stopTimer}
                disabled={!isActive && timeLeft === (isBreak ? breakDuration : focusDuration) * 60}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {showSettings ? (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-nunito mb-4">Timer Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Focus Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1"
                  max="120"
                  value={focusDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 25;
                    setFocusDuration(val);
                    if (!isActive && !isBreak) setTimeLeft(val * 60);
                  }}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Break Duration (minutes)</label>
                <input 
                  type="number" 
                  min="1"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 5;
                    setBreakDuration(val);
                    if (!isActive && isBreak) setTimeLeft(val * 60);
                  }}
                  className="input"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-nunito flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Blocked Sites
              </h3>
              <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {blockedDomains.length} Active
              </span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-nunito leading-relaxed">
              These sites will be completely blocked in Chrome while the focus timer is active.
            </p>
            
            <form onSubmit={addDomain} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="e.g. reddit.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="input flex-1 text-sm py-2"
              />
              <button 
                type="submit"
                className="px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
            
            <div className="flex flex-wrap gap-2">
              {blockedDomains.map(domain => (
                <div 
                  key={domain} 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-sm"
                >
                  <span>{domain}</span>
                  <button 
                    onClick={() => removeDomain(domain)}
                    className="p-0.5 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {blockedDomains.length === 0 && (
                <div className="w-full text-center py-4 text-xs text-slate-400 italic">
                  No sites currently blocked
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
