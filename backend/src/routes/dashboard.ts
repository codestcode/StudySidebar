import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client';

const router: Router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code === 'PGRST116') {
      // create stats if they don't exist yet
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert({ user_id: userId })
        .select()
        .single();
        
      if (insertError) return res.status(500).json({ error: 'Failed to create user stats' });
      stats = newStats;
    } else if (statsError) {
      return res.status(500).json({ error: 'Failed to fetch user stats' });
    }

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    res.json({ stats, achievements: achievements || [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/study-session', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { minutes } = req.body;
    if (typeof minutes !== 'number' || minutes <= 0) {
      return res.status(400).json({ error: 'Invalid minutes' });
    }

    let { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    if (!stats) {
      const { data: newStats } = await supabase.from('user_stats').insert({ user_id: userId }).select().single();
      stats = newStats;
    }
    if (!stats) return res.status(500).json({ error: 'Could not fetch or create stats' });

    // figure out if streak continues
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = stats.current_streak || 0;
    let longestStreak = stats.longest_streak || 0;

    if (stats.last_study_date) {
      const lastDate = new Date(stats.last_study_date);
      const currentDate = new Date(today);
      const diffDays = Math.ceil(Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); 

      if (diffDays === 1) currentStreak += 1;
      else if (diffDays > 1) currentStreak = 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    const newXp = (stats.xp || 0) + (minutes * 10);

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_stats')
      .update({
        total_minutes_studied: (stats.total_minutes_studied || 0) + minutes,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_study_date: today,
        xp: newXp,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: 'Failed to update stats' });

    // hand out badges if they hit milestones
    const earnedBadges: string[] = [];
    if (currentStreak === 3) earnedBadges.push('3_day_streak');
    if (currentStreak === 7) earnedBadges.push('7_day_streak');
    if (currentStreak === 30) earnedBadges.push('30_day_streak');

    for (const badge of earnedBadges) {
      await supabase.from('user_achievements').insert({ user_id: userId, badge_type: badge }).select().single();
    }

    res.json({ stats: updatedStats, newlyEarnedBadges: earnedBadges });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quiz-result', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { score } = req.body;
    if (typeof score !== 'number' || score < 0 || score > 100) return res.status(400).json({ error: 'Invalid score' });

    let { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    if (!stats) {
      const { data: newStats } = await supabase.from('user_stats').insert({ user_id: userId }).select().single();
      stats = newStats;
    }
    if (!stats) return res.status(500).json({ error: 'Could not fetch or create stats' });

    const completed = (stats.quizzes_completed || 0) + 1;
    const totalScore = (stats.total_quiz_score || 0) + score;
    // give 'em 50 base xp and another 50 for a perfect score
    const xp = (stats.xp || 0) + 50 + (score === 100 ? 50 : 0);

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_stats')
      .update({
        quizzes_completed: completed,
        total_quiz_score: totalScore,
        xp,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: 'Failed to update stats' });

    const earnedBadges: string[] = [];
    if (score === 100) earnedBadges.push('100_percent_quiz');
    if (completed === 10) earnedBadges.push('10_quizzes');

    for (const badge of earnedBadges) {
      await supabase.from('user_achievements').insert({ user_id: userId, badge_type: badge }).select().single();
    }

    res.json({ stats: updatedStats, newlyEarnedBadges: earnedBadges });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
