import { Router, type Request, type Response } from 'express';
import { supabase } from '../db/client.js';
import { generateId } from '../utils/auth.js';
import { generateQuizFromContent } from '../utils/openrouter.js';

const router: Router = Router();

interface QuizRequest extends Request {
  userId?: string;
  body: {
    topic?: string;
    difficulty?: string;
    title?: string;
    quizId?: string;
    answers?: Array<{ questionIndex: number; selectedAnswer: string }>;
  };
}

router.post('/generate', async (req: QuizRequest, res: Response) => {
  try {
    const { topic, difficulty, title } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!topic || !difficulty) {
      return res.status(400).json({ error: 'Topic and difficulty required' });
    }

    res.setHeader('Content-Type', 'application/json');

    try {
      const quizContent = await generateQuizFromContent(topic, difficulty);
      const quizId = generateId();

      const { error } = await supabase.from('quizzes').insert({
        id: quizId,
        user_id: userId,
        title: title || `${topic} Quiz`,
        topic,
        difficulty,
        content: JSON.stringify(quizContent),
      });

      if (error) throw error;

      res.json({ id: quizId, content: quizContent });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Quiz generation failed' });
  }
});

router.post('/submit', async (req: QuizRequest, res: Response) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!quizId || !answers) {
      return res.status(400).json({ error: 'Quiz ID and answers required' });
    }

    const { data: quizList } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId);

    const quiz = quizList?.[0];

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quizContent = JSON.parse(quiz.content);

    let correctCount = 0;
    const scoredAnswers = answers.map(
      (answer: { questionIndex: number; selectedAnswer: string }, index: number) => {
        const question = quizContent.questions?.[answer.questionIndex];
        const isCorrect = question?.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;
        return { ...answer, isCorrect };
      }
    );

    for (const answer of scoredAnswers) {
      const { error } = await supabase.from('quiz_answers').insert({
        id: generateId(),
        quiz_id: quizId,
        user_id: userId,
        question_index: answer.questionIndex,
        selected_answer: answer.selectedAnswer,
        is_correct: answer.isCorrect,
      });
      if (error) throw error;
    }

    const score = (correctCount / answers.length) * 100;
    res.json({ score, correctCount, totalQuestions: answers.length });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

router.get('/list', async (req: QuizRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: userQuizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    res.json(userQuizzes || []);
  } catch (error) {
    console.error('List quizzes error:', error);
    res.status(500).json({ error: 'Failed to get quizzes' });
  }
});

export default router;
