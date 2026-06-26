const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'openrouter/auto'; // or specific model like meta-llama/llama-2-7b-chat

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const allMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'StudySidebar',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: allMessages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              yield chunk;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function generateQuizFromContent(topic: string, difficulty: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const systemPrompt = `You are an expert quiz generator. Create a quiz in JSON format with exactly 5 questions about the given topic. 
Each question should have 4 multiple choice options (A, B, C, D) and one correct answer.
Return ONLY valid JSON, no other text.`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `Generate a ${difficulty} quiz about: ${topic}`,
    },
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages, systemPrompt)) {
    fullResponse += chunk;
  }

  try {
    return JSON.parse(fullResponse);
  } catch {
    return fullResponse;
  }
}

export async function summarizeContent(content: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const systemPrompt = `You are an expert summarizer. Create a concise, clear summary of the provided content in 3-5 bullet points.`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `Please summarize this:\n\n${content}`,
    },
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages, systemPrompt)) {
    fullResponse += chunk;
  }

  return fullResponse;
}
