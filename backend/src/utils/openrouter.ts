const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'openrouter/auto';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MASTER_SYSTEM_PROMPT = `You are an intelligent reading assistant embedded in a browser extension for students and researchers. Your job is to summarize webpage content in a way that is clear, well-organized, and immediately useful. 

Rules you must always follow:
- Never start with phrases like "This article...", "This page...", or "The content..."
- Never add meta-commentary like "Here is your summary" or "I hope this helps"
- Use clean, precise language — no filler words
- Preserve technical terms, names, and definitions exactly as they appear
- If the content has multiple distinct sections, reflect that structure in your output
- Output only the summary, nothing else`;

export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): AsyncGenerator<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const systemMessages: ChatMessage[] = [{ role: 'system', content: MASTER_SYSTEM_PROMPT }];
  if (systemPrompt) {
    systemMessages.push({ role: 'system', content: systemPrompt });
  }
  const allMessages: ChatMessage[] = [...systemMessages, ...messages];

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

export async function generateQuizFromContent(topic: string, difficulty: string, content?: string, numQuestions?: number, questionTypes?: string[]): Promise<any> {
  console.log('[QUIZ] generateQuizFromContent called with topic:', topic, 'content length:', content?.length || 0);
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const qTypes = questionTypes?.length ? questionTypes.join(', ') : 'multiple choice (MCQ)';
  const qCount = numQuestions || 5;

  let systemPrompt: string;
  let userMessage: string;

  if (content) {
    systemPrompt = `You are an expert quiz generator. Create a quiz in JSON format with exactly ${qCount} questions based on the provided content.
Question types to include: ${qTypes}.
- For "mcq": each question must have 4 options and one correct answer.
- For "truefalse": each question must have options ["True", "False"] and one correct answer.
- For "essay": each question must have an empty options array and the correctAnswer should be a model answer.

Return ONLY valid JSON in this exact format, no other text:
{
  "questions": [
    {
      "question": "question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct option text"
    }
  ]
}`;
    userMessage = `Generate a ${difficulty} quiz with ${qCount} questions (${qTypes}) based on the following content:\n\n${content}`;
  } else {
    systemPrompt = `You are an expert quiz generator. Create a quiz in JSON format with exactly ${qCount} questions about the given topic.
Question types to include: ${qTypes}.
- For "mcq": each question must have 4 options and one correct answer.
- For "truefalse": each question must have options ["True", "False"] and one correct answer.
- For "essay": each question must have an empty options array and the correctAnswer should be a model answer.

Return ONLY valid JSON in this exact format, no other text:
{
  "questions": [
    {
      "question": "question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct option text"
    }
  ]
}`;
    userMessage = `Generate a ${difficulty} quiz with ${qCount} questions (${qTypes}) about: ${topic}`;
  }

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages, systemPrompt)) {
    fullResponse += chunk;
  }

  let parsed: any;
  const trimmed = fullResponse.trim();

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
  }

  if (Array.isArray(parsed)) {
    parsed = { questions: parsed };
  }
  if (parsed && parsed.questions) {
    for (const q of parsed.questions) {
      if (q.options && !Array.isArray(q.options)) {
        q.options = Object.values(q.options);
      }
    }
    return parsed;
  }
  console.error('AI raw response (first 1000 chars):', fullResponse.slice(0, 1000));
  return { questions: [] };
}

const SUMMARY_PROMPTS: Record<string, (pageContent: string) => string> = {
  'short-paragraph': (pageContent) =>
    `Summarize the following content in exactly 3 sentences. 
Each sentence must capture a distinct key point. 
Together, the 3 sentences should give a complete picture of what the content is about.

Content:
${pageContent}`,
  'short-bullet': (pageContent) =>
    `Extract the 3 most important takeaways from the following content.
Write each as a single sharp bullet point starting with "•".
Each bullet must be one sentence, specific, and self-contained.

Content:
${pageContent}`,
  'short-concept': (pageContent) =>
    `Identify the 3 core concepts in the following content.
For each concept use this format:

🔑 **[Concept Name]**
One sentence defining it in context.

No extra text. Just the 3 concepts.

Content:
${pageContent}`,
  'medium-paragraph': (pageContent) =>
    `Write a single, well-structured paragraph (5–7 sentences) summarizing the following content.
Structure it like this: open with the main topic → explain the core ideas → close with the key takeaway or conclusion.
Write for an intelligent reader who hasn't seen the page.

Content:
${pageContent}`,
  'medium-bullet': (pageContent) =>
    `Summarize the following content as 6–8 bullet points.
Rules:
- Cover the full scope — main idea, supporting points, and conclusion
- Each bullet = 1 clear sentence
- Order bullets from most important to least
- Start each bullet with "•"

Content:
${pageContent}`,
  'medium-concept': (pageContent) =>
    `Identify the 5–7 key concepts from the following content.
For each concept use this exact format:

🔑 **[Concept Name]**
2 sentences: what it is, and why it matters in this context.

Order them from foundational to advanced.

Content:
${pageContent}`,
  'detailed-paragraph': (pageContent) =>
    `Write a comprehensive multi-paragraph summary of the following content.

Structure:
**Overview** — What is this content about and why does it matter? (2–3 sentences)

**Main Ideas** — Walk through the key arguments, sections, or topics covered. (3–5 sentences per major idea, use a new paragraph for each)

**Conclusion & Takeaways** — What should the reader walk away knowing or doing? (2–3 sentences)

Use clear paragraph breaks. Write at a level appropriate for a university student.

Content:
${pageContent}`,
  'detailed-bullet': (pageContent) =>
    `Write a thorough bullet-point summary of the following content.

Format:
## [Section or Topic Name]
- [Point]
- [Point]

Rules:
- Create a new ## section for each major topic or section in the content
- 3–6 bullets per section
- Each bullet = 1–2 sentences, specific and informative
- End with a ## Key Takeaways section with 3–5 final bullets

Content:
${pageContent}`,
  'detailed-concept': (pageContent) =>
    `Extract every important concept, term, and idea from the following content.

For each one use this format:

🔑 **[Concept Name]**
Definition: What is it? (1–2 sentences)
Context: How is it used or discussed in this content? (1–2 sentences)
Related to: [other concept names if applicable]

---

Order from most fundamental to most advanced. Be thorough — this is a study reference.

Content:
${pageContent}`,
};

const CORNELL_SYSTEM_PROMPT = `You are a study assistant that generates Cornell-style notes from webpage content.

Return ONLY valid JSON in this exact format, no other text:
{
  "title": "A concise title for these notes based on the page",
  "rows": [
    {
      "id": "unique-id-1",
      "cue": "Short keyword or question (e.g. 'What is X?')",
      "note": "Concise explanation answering the cue, 1-3 short lines",
      "importance": "high" | "medium" | "low"
    }
  ],
  "summary": "3-5 sentence recap of the whole page, written as if the student is reviewing right before a test"
}

Rules:
- Break the page into digestible chunks (roughly one idea per row — aim for 5-12 rows depending on page length)
- Cue = a short keyword, term, or question that would trigger recall
- Note = the actual explanation, kept tight (1-3 short lines)
- Mark 2-3 rows as "high" importance (core concepts vs supporting detail)
- Summary must NOT just repeat the rows — read like a final review paragraph
- Generate unique string IDs for each row`;

export async function generateCornellNotes(content: string, pageTitle?: string, pageUrl?: string): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const userMessage = `Generate Cornell-style study notes from the following page content.

Page title: ${pageTitle || 'Untitled'}
Page URL: ${pageUrl || 'Unknown'}

Content:
${content}`;

  const messages: ChatMessage[] = [
    { role: 'user', content: userMessage },
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages, CORNELL_SYSTEM_PROMPT)) {
    fullResponse += chunk;
  }

  const trimmed = fullResponse.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.rows && Array.isArray(parsed.rows)) {
      return parsed;
    }
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        if (parsed.rows && Array.isArray(parsed.rows)) {
          return parsed;
        }
      } catch {}
    }
  }

  console.error('AI raw response (first 1000 chars):', fullResponse.slice(0, 1000));
  return {
    title: pageTitle || 'Notes',
    rows: [],
    summary: 'Failed to generate notes. Please try again.',
  };
}

export async function summarizeContent(content: string, length: string = 'medium', format: string = 'paragraph'): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const key = `${length}-${format}` as keyof typeof SUMMARY_PROMPTS;
  const promptFn = SUMMARY_PROMPTS[key] || SUMMARY_PROMPTS['medium-paragraph'];
  const userPrompt = promptFn(content);

  const messages: ChatMessage[] = [
    { role: 'user', content: userPrompt },
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages)) {
    fullResponse += chunk;
  }

  return fullResponse;
}

const FLASHCARD_SYSTEM_PROMPT = `You are a study assistant that generates flashcards from webpage content or notes.

Return ONLY valid JSON in this exact format, no other text:
{
  "flashcards": [
    {
      "question": "A concise question testing a single concept (max 15 words)?",
      "answer": "A clear, concise, and direct answer (max 30 words)."
    }
  ]
}

Rules:
- Questions must be clear, specific, and self-contained.
- Answers should be punchy and easy to memorize for active recall.
- Avoid multi-part answers or overly wordy explanations.
- Focus on key definitions, core concepts, comparisons, and facts.
- Generate a number of cards matching the requested count.`;

export async function generateFlashcardsFromContent(
  content: string,
  pageTitle?: string,
  pageUrl?: string,
  count: number = 5
): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const userMessage = `Generate exactly ${count} high-quality flashcards from the following content.

Page Title: ${pageTitle || 'Untitled'}
Page URL: ${pageUrl || 'Unknown'}

Content:
${content}`;

  const messages: ChatMessage[] = [
    { role: 'user', content: userMessage },
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages, FLASHCARD_SYSTEM_PROMPT)) {
    fullResponse += chunk;
  }

  const trimmed = fullResponse.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      return parsed;
    }
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
          return parsed;
        }
      } catch {}
    }
  }

  console.error('AI raw response for flashcards (first 1000 chars):', fullResponse.slice(0, 1000));
  return { flashcards: [] };
}

const MINDMAP_SYSTEM_PROMPT = `You are a study assistant that converts text into a Concept Map using Mermaid.js syntax.

Return ONLY valid mermaid syntax starting with 'graph TD' or 'mindmap'. No markdown blocks, no formatting, no extra text.

Rules:
- Keep node text concise (1-4 words max)
- Use standard flowchart syntax (graph TD)
- Root node at the top, branching out
- Example:
graph TD
A[Main Concept] --> B[Sub Concept 1]
A --> C[Sub Concept 2]
B --> D[Detail 1]
`;

export async function generateMindMapFromContent(content: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set');

  const messages: ChatMessage[] = [
    { role: 'user', content: `Create a mermaid concept map from this content:\n\n${content}` }
  ];

  let fullResponse = '';
  for await (const chunk of streamChatResponse(messages, MINDMAP_SYSTEM_PROMPT)) {
    fullResponse += chunk;
  }

  const trimmed = fullResponse.trim();
  const match = trimmed.match(/```mermaid\n([\s\S]*?)```/) || trimmed.match(/```\n([\s\S]*?)```/);
  if (match) return match[1].trim();

  return trimmed;
}
