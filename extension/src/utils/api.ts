import { storage } from './storage.js';

const API_BASE = 'http://localhost:3001/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const api = {
  async register(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async forgotPassword(email: string) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async resetPassword(email: string, otp: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  async *chatStream(message: string, context?: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, context, history }),
    });

    if (!response.ok) throw new Error('Chat failed');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) yield parsed.chunk;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  },

  async getChatHistory() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/chat/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get history');
    return response.json();
  },

  async generateQuiz(topic: string, difficulty: string, title?: string, numQuestions?: number, questionTypes?: string[], content?: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic, difficulty, title, numQuestions, questionTypes, content }),
    });

    if (!response.ok) throw new Error('Quiz generation failed');
    return response.json();
  },

  async submitQuizAnswers(quizId: string, answers: Array<{ questionIndex: number; selectedAnswer: string }>) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quizId, answers }),
    });

    if (!response.ok) throw new Error('Failed to submit quiz');
    return response.json();
  },

  async getQuizzes() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/quiz/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get quizzes');
    return response.json();
  },

  async *generateSummary(content: string, title?: string, sourceUrl?: string, length?: string, format?: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/summary/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, title, sourceUrl, length, format }),
    });

    if (!response.ok) throw new Error('Summary generation failed');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) yield parsed.chunk;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  },

  async getSummaries() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/summary/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get summaries');
    return response.json();
  },

  async generateNotes(pageContent: string, pageTitle?: string, pageUrl?: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/notes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageContent, pageTitle, pageUrl }),
    });

    if (!response.ok) throw new Error('Notes generation failed');
    return response.json();
  },

  async updateNotes(id: string, notesJson: any) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notesJson }),
    });

    if (!response.ok) throw new Error('Failed to update notes');
    return response.json();
  },

  async getNotesForPage(pageUrl: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/notes/page/${encodeURIComponent(pageUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get notes');
    return response.json();
  },

  async getNotes() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/notes/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get notes');
    return response.json();
  },

  async getYoutubeTranscript(url: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/youtube/transcript?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch YouTube transcript');
    return response.json();
  },

  async extractPdfText(file: File) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/pdf/extract`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Failed to extract PDF text');
    }
    return response.json();
  },

  async getDashboardStats() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to get dashboard stats');
    return response.json();
  },

  async trackStudySession(minutes: number) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/dashboard/study-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ minutes }),
    });

    if (!response.ok) throw new Error('Failed to track study session');
    return response.json();
  },

  async trackQuizResult(score: number) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/dashboard/quiz-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ score }),
    });

    if (!response.ok) throw new Error('Failed to track quiz result');
    return response.json();
  },

  async generateFlashcards(content: string, pageTitle?: string, pageUrl?: string, count?: number) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/flashcards/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, pageTitle, pageUrl, count }),
    });
    if (!response.ok) throw new Error('Failed to generate flashcards');
    return response.json();
  },

  async getFlashcards() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/flashcards/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch flashcards');
    return response.json();
  },

  async getDueFlashcards() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/flashcards/due`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch due flashcards');
    return response.json();
  },

  async reviewFlashcard(id: string, isCorrect: boolean) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/flashcards/review/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isCorrect }),
    });
    if (!response.ok) throw new Error('Failed to review flashcard');
    return response.json();
  },

  async deleteFlashcard(id: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/flashcards/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete flashcard');
    return response.json();
  },

  async clearAllFlashcards() {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/flashcards/all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to clear flashcards');
    return response.json();
  },

  async generateMindMap(content: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/notes/mindmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pageContent: content }),
    });
    if (!response.ok) throw new Error('Failed to generate mind map');
    return response.json();
  },
};

