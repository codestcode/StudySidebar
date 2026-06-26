import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setError('');
    setLoading(true);
    const userMessage = input;
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      let assistantMessage = '';
      for await (const chunk of api.chatStream(userMessage, context)) {
        assistantMessage += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.role === 'assistant') {
            updated[updated.length - 1].content = assistantMessage;
          } else {
            updated.push({ role: 'assistant', content: assistantMessage });
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div>
        <label className="block text-sm font-medium mb-1.5">Context (optional)</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Paste relevant course material or notes..."
          disabled={loading}
          className="input h-24 resize-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-100 rounded-2xl p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-5">
            No messages yet. Start typing to chat with your AI assistant!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-100 text-blue-700 ml-5 text-right'
                  : 'bg-white text-slate-800 mr-5'
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading && (
          <div className="p-3 rounded-2xl bg-white mr-5">
            <span className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin inline-block"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          className="input flex-1"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
