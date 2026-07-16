const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'openrouter/auto';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const MASTER_SYSTEM_PROMPT = `You are an intelligent study assistant for students. The user will send you page content along with their question. Use the provided page content to answer their questions accurately.`;

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
  // Remove duplicate system messages - keep only unique ones
  const uniqueSystemMessages = systemMessages.filter((msg, index, self) =>
    index === self.findIndex(m => m.content === msg.content)
  );
  const allMessages: ChatMessage[] = [...uniqueSystemMessages, ...messages];

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
    systemPrompt = `CRITICAL: You MUST respond with ONLY a raw JSON object. Your entire response must start with { and end with }. Do NOT use markdown formatting, do NOT use code blocks, do NOT add any text before or after the JSON.

You are an expert quiz generator. Create a quiz in JSON format with exactly ${qCount} questions based on the provided content.
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
    systemPrompt = `CRITICAL: You MUST respond with ONLY a raw JSON object. Your entire response must start with { and end with }. Do NOT use markdown formatting, do NOT use code blocks, do NOT add any text before or after the JSON.

You are an expert quiz generator. Create a quiz in JSON format with exactly ${qCount} questions about the given topic.
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

  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const jsonCandidate = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

  try {
    parsed = JSON.parse(jsonCandidate);
  } catch {
    const firstBrace = jsonCandidate.indexOf('{');
    const lastBrace = jsonCandidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(jsonCandidate.slice(firstBrace, lastBrace + 1));
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

  // Fallback: parse markdown-formatted quiz (e.g. **Q:** / **Correct Answer:**)
  const questions: any[] = [];
  const lines = trimmed.split('\n').map(l => l.trim());
  let currentQ = '';
  let currentOptions: string[] = [];
  let currentAnswer = '';

  for (const line of lines) {
    const stripped = line.replace(/\*+/g, '').trim();
    if (!stripped || stripped === '---') {
      if (currentQ && currentOptions.length > 0 && currentAnswer) {
        questions.push({ question: currentQ, options: currentOptions, correctAnswer: currentAnswer });
      }
      if (!stripped) { currentQ = ''; currentOptions = []; currentAnswer = ''; }
      continue;
    }
    const qMatch = stripped.match(/^(?:Q|Question)[:\s]+(.+)/i);
    const aMatch = stripped.match(/^(?:Correct Answer|Answer)[:\s]+(.+)/i);
    const optMatch = stripped.match(/^([A-D])[).:]\s*(.+)/i);

    if (qMatch) {
      if (currentQ && currentOptions.length > 0 && currentAnswer) {
        questions.push({ question: currentQ, options: currentOptions, correctAnswer: currentAnswer });
      }
      currentQ = qMatch[1].trim();
      currentOptions = [];
      currentAnswer = '';
    } else if (aMatch) {
      currentAnswer = aMatch[1].trim();
    } else if (optMatch) {
      currentOptions.push(optMatch[2].trim());
    }
  }
  if (currentQ && currentOptions.length > 0 && currentAnswer) {
    questions.push({ question: currentQ, options: currentOptions, correctAnswer: currentAnswer });
  }
  if (questions.length > 0) {
    return { questions };
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

IMPORTANT: You MUST return ONLY a raw JSON object. No markdown, no code blocks, no extra text. Start your response with { and end with }.

Return ONLY valid JSON in this exact format:
{
  "title": "A concise title for these notes based on the page",
  "rows": [
    {
      "id": "unique-id-1",
      "cue": "Short keyword or question (e.g. 'What is X?')",
      "note": "Concise explanation answering the cue, 1-3 short lines",
      "importance": "high"
    }
  ],
  "summary": "3-5 sentence recap of the whole page"
}

Rules:
- Break the page into digestible chunks (5-12 rows)
- Mark 2-3 rows as "high" importance
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
  
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const jsonCandidate = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  
  try {
    const parsed = JSON.parse(jsonCandidate);
    if (parsed.rows && Array.isArray(parsed.rows)) {
      return parsed;
    }
  } catch {
    const firstBrace = jsonCandidate.indexOf('{');
    const lastBrace = jsonCandidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(jsonCandidate.slice(firstBrace, lastBrace + 1));
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

CRITICAL: You MUST respond with ONLY a raw JSON object. Your entire response must start with { and end with }. Do NOT use markdown formatting, do NOT use code blocks, do NOT add any text before or after the JSON. The very first character of your response must be { and the very last must be }.

Return ONLY valid JSON in this exact format:
{
  "flashcards": [
    {
      "question": "A concise question testing a single concept (max 15 words)",
      "answer": "A clear, concise answer (max 30 words)"
    }
  ]
}

Rules:
- Questions must be clear, specific, and self-contained
- Answers should be punchy and easy to memorize
- Focus on key definitions, core concepts, comparisons, and facts
- Generate a number of cards matching the requested count
- NEVER use markdown or text formatting in your response`;

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
  
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const jsonCandidate = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
  
  try {
    const parsed = JSON.parse(jsonCandidate);
    if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
      return parsed;
    }
  } catch {
    const firstBrace = jsonCandidate.indexOf('{');
    const lastBrace = jsonCandidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(jsonCandidate.slice(firstBrace, lastBrace + 1));
        if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
          return parsed;
        }
      } catch {}
    }
  }

  // Fallback: parse markdown-formatted flashcards
  // Handles formats like:
  //   **Q:** question? / **A:** answer
  //   **Flashcard 1** \n **Q:** ... \n **A:** ...
  //   **Front:** ... / **Back:** ...
  const mdCards: any[] = [];
  const lines = trimmed.split('\n').map(l => l.trim());
  let currentQ = '';
  let collectingAnswer = false;
  let currentA = '';

  for (const line of lines) {
    const stripped = line.replace(/\*+/g, '').trim();
    if (!stripped || stripped === '---') {
      if (collectingAnswer && currentQ && currentA) {
        mdCards.push({ question: currentQ, answer: currentA.trim() });
        currentQ = '';
        currentA = '';
        collectingAnswer = false;
      }
      continue;
    }
    const qMatch = stripped.match(/^(?:Q|Question|Front|Front side)[:\s]+(.+)/i);
    const aMatch = stripped.match(/^(?:A|Answer|Back|Back side)[:\s]+(.+)/i);
    if (qMatch) {
      if (collectingAnswer && currentQ && currentA) {
        mdCards.push({ question: currentQ, answer: currentA.trim() });
      }
      currentQ = qMatch[1].trim();
      currentA = '';
      collectingAnswer = false;
    } else if (aMatch && currentQ) {
      currentA = aMatch[1].trim();
      collectingAnswer = true;
    } else if (collectingAnswer) {
      currentA += ' ' + stripped;
    }
  }
  if (collectingAnswer && currentQ && currentA) {
    mdCards.push({ question: currentQ, answer: currentA.trim() });
  }

  if (mdCards.length > 0) {
    return { flashcards: mdCards };
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
