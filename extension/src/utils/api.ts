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

  async *chatStream(message: string, context?: string) {
    const token = await storage.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, context }),
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
};
