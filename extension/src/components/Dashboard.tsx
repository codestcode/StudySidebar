import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Clock, BrainCircuit, Target, Sparkles, Loader2, Award, CalendarDays, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';
import '../styles.css';

interface DashboardStats {
  total_minutes_studied: number;
  quizzes_completed: number;
  total_quiz_score: number;
  current_streak: number;
  longest_streak: number;
  xp: number;
}

interface Achievement {
  id: string;
  badge_type: string;
  earned_at: string;
}

const BADGES: Record<string, { title: string; desc: string; icon: React.ReactNode; color: string }> = {
  '3_day_streak': { title: 'On Fire', desc: '3 Day Study Streak', icon: <Flame className="w-6 h-6 text-orange-500" />, color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' },
  '7_day_streak': { title: 'Unstoppable', desc: '7 Day Study Streak', icon: <Flame className="w-6 h-6 text-rose-500" />, color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30' },
  '30_day_streak': { title: 'Legend', desc: '30 Day Study Streak', icon: <Trophy className="w-6 h-6 text-yellow-500" />, color: 'from-yellow-400/20 to-amber-500/20 border-yellow-500/30' },
  '100_percent_quiz': { title: 'Perfectionist', desc: 'Scored 100% on a Quiz', icon: <Target className="w-6 h-6 text-emerald-500" />, color: 'from-emerald-400/20 to-teal-500/20 border-emerald-500/30' },
  '10_quizzes': { title: 'Quiz Master', desc: 'Completed 10 Quizzes', icon: <BrainCircuit className="w-6 h-6 text-purple-500" />, color: 'from-purple-400/20 to-indigo-500/20 border-purple-500/30' },
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { stats, achievements } = await api.getDashboardStats();
      setStats(stats);
      setAchievements(achievements);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // safely calculate avg score
  const avgQuizScore = stats?.quizzes_completed ? Math.round(stats.total_quiz_score / stats.quizzes_completed) : 0;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      
      <div className="glass3d rounded-3xl p-6 relative overflow-hidden animate-fade-slide-up">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-32 h-32 text-blue-500" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold font-nunito text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> 
              {stats?.xp || 0} XP
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-nunito mt-1">Total Experience Points</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">{stats?.current_streak || 0} Days</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current Streak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass3d rounded-2xl p-5 animate-fade-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-nunito">
            {stats?.total_minutes_studied || 0}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito font-medium uppercase tracking-wider">Minutes Studied</p>
        </div>

        <div className="glass3d rounded-2xl p-5 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <BrainCircuit className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-nunito">
            {stats?.quizzes_completed || 0}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito font-medium uppercase tracking-wider">Quizzes Taken</p>
        </div>
        
        <div className="glass3d rounded-2xl p-5 animate-fade-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-nunito">
            {avgQuizScore}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito font-medium uppercase tracking-wider">Avg Score</p>
        </div>

        <div className="glass3d rounded-2xl p-5 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-nunito">
            {stats?.longest_streak || 0}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito font-medium uppercase tracking-wider">Longest Streak</p>
        </div>
      </div>

      <div className="glass3d rounded-3xl p-6 animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white font-nunito mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-500" />
          Earned Badges
        </h3>

        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-nunito">
              Keep studying to earn your first badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map(ach => {
              const badge = BADGES[ach.badge_type] || { 
                title: 'Unknown', desc: 'Achievement', icon: <Award className="w-6 h-6 text-slate-500" />, color: 'from-slate-500/20 to-slate-400/20 border-slate-500/30' 
              };
              
              return (
                <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-2xl border bg-gradient-to-br ${badge.color}`}>
                  <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center shadow-sm backdrop-blur-sm">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-nunito">{badge.title}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-nunito">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
