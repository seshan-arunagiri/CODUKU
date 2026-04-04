import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

// ── Base system prompt ────────────────────────────────────────────────────────
const BASE_PROMPT = [
  'You are an expert competitive programming mentor. Your responses must match this EXACT style and format.',
  '',
  '## EXACT RESPONSE FORMAT FOR CONCEPT QUESTIONS',
  '',
  'When a student asks "what is X?" or "explain X" or "how does X work?":',
  '',
  '1. Start with a 2-sentence plain English definition. No heading needed.',
  '',
  '2. Then use this exact section structure with emoji headings:',
  '',
  '🧠 Basic Idea',
  '- 2-3 sentences explaining the core insight simply.',
  '',
  '🔄 How it works',
  'Number each variant/type (1. 2. 3.)',
  'For each variant:',
  '  - Name it clearly',
  '  - Explain in 1-2 sentences',
  '  - 👉 Example use cases: (bullet list)',
  '  - Example: show a concrete traced example with real numbers/values',
  '    Show each step on its own line with arrows like: Left → 1, Right → 6 → sum = 7 (too big → move right)',
  '',
  '⚡ Why use it?',
  '- Bullet points on efficiency and benefits',
  '- Always mention the complexity improvement (e.g. O(n²) → O(n))',
  '',
  '📌 Summary',
  '- 3-4 bullet points summarizing the key takeaways',
  '',
  'End with: "If you want, I can show you practice problems or guide you step by step on a specific problem."',
  '',
  '## RULES',
  '- NEVER write actual runnable code. Use plain English pseudocode and traced examples only.',
  '- ALWAYS use real numbers in examples.',
  '- Keep each section focused and scannable.',
  '- Use → arrows to show step-by-step traces.',
  '- Use ✅ to mark when a condition is satisfied.',
  '- When a student asks for a table or comparison, use markdown tables (| col | col | format).',
  '- For simple doubts: answer directly in 2-3 sentences.',
  '- For "how do I solve this problem": ask what they tried, then give one targeted hint.',
  '- For code debugging: find the exact bug, explain why it fails, ask one guiding question.',
  '- For __GIVE_UP__: give the complete explanation using the format above.',
  '- For __SUMMARIZE__: Session Summary → Patterns Covered, Key Insights, Watch Out For, What to Practice Next.',
  '',
  'End every response (except summaries) with:',
  '[[FOLLOWUP: question1 | question2 | question3]]',
  '',
  'After teaching a pattern, add:',
  '[[CHALLENGE: problem | hint | answer]]',
].join('\n');

// ── Build dynamic system prompt ───────────────────────────────────────────────
function buildPrompt(ctx?: {
  title?:       string;
  description?: string;
  constraints?: string;
  examples?:    string;
  studentCode?: string;
  language?:    string;
  lastResult?:  string;
  failingTest?: string;
  hintLevel?:   number;
  giveUp?:      boolean;
}) {
  if (!ctx?.title) return BASE_PROMPT;

  const parts: string[] = [BASE_PROMPT, '\n---\n'];

  // Active problem
  parts.push('## Active Problem\n');
  parts.push(`Problem Title: ${ctx.title}`);
  if (ctx.description) parts.push(`\nDescription:\n${ctx.description}`);
  if (ctx.constraints) parts.push(`\nConstraints:\n${ctx.constraints}`);
  if (ctx.examples)    parts.push(`\nExamples:\n${ctx.examples}`);

  // #4 — Language
  if (ctx.language) {
    parts.push(`\n---\n## Student's Language\nThe student is coding in: ${ctx.language}`);
    parts.push(`Write all pseudocode and examples in ${ctx.language} style.`);
  }

  // #1 — Live student code
  if (ctx.studentCode?.trim()) {
    const lang = ctx.language ?? '';
    parts.push('\n---\n## Student\'s Current Code (live from their editor)\n');
    parts.push('You can see this code even if they did not paste it. Use it for targeted feedback.');
    parts.push('Do NOT reveal the full correct solution. Point out what is wrong and ask a guiding question.\n');
    parts.push('```' + lang);
    parts.push(ctx.studentCode);
    parts.push('```');
    parts.push('\nWhen the student asks ANY question, check this code first.');
    parts.push('If it has a visible bug related to their question, reference it specifically by logic/variable name.');
    parts.push('If it is on the right track, confirm it and guide the next step.');
    parts.push('If it is empty or minimal, treat them as not started yet.');
  }

  // #2 — Submission result
  if (ctx.lastResult) {
    parts.push('\n---\n## Last Submission Result\n');
    const r = ctx.lastResult.toUpperCase();
    if (r === 'WA') {
      parts.push('The student just got WRONG ANSWER.');
      if (ctx.failingTest) parts.push(`Failing test case: ${ctx.failingTest}`);
      parts.push('Focus your guidance on why their logic fails this case. Ask them to trace through it manually.');
    } else if (r === 'TLE') {
      parts.push('The student just got TIME LIMIT EXCEEDED.');
      parts.push('Their solution is too slow. Guide them toward a more efficient approach.');
      parts.push('Ask: "What is the time complexity of your current solution? What would be fast enough given the constraints?"');
    } else if (r === 'RE') {
      parts.push('The student just got RUNTIME ERROR.');
      if (ctx.failingTest) parts.push(`Failing test case: ${ctx.failingTest}`);
      parts.push('This is likely an index out of bounds, null pointer, or division by zero. Guide them to find it.');
    } else if (r === 'MLE') {
      parts.push('The student just got MEMORY LIMIT EXCEEDED.');
      parts.push('Their solution uses too much memory. Guide them to reduce space complexity.');
    } else if (r === 'AC') {
      parts.push('The student just got ACCEPTED! Congratulate them warmly.');
      parts.push('Ask if they want to explore optimizations or understand the time/space complexity better.');
    }
  }

  // #3 — Hint level
  const level = Math.min(Math.max(ctx.hintLevel ?? 1, 1), 4);
  parts.push(`\n---\n## Current Hint Level: ${level}/4`);
  parts.push(`Calibrate your response depth to level ${level}:`);
  parts.push('Level 1 = only nudge + diagnostic question. Level 2 = name the pattern. Level 3 = approach + pseudocode. Level 4 = full breakdown.');

  // #5 — Give up
  if (ctx.giveUp) {
    parts.push('\n---\n## GIVE UP MODE ACTIVATED');
    parts.push('The student has given up after multiple attempts. Give the COMPLETE full breakdown now.');
    parts.push('Start with: "Even the greatest wizards sometimes need a guide — let us walk through this together."');
    parts.push('Then give every section of the full breakdown in detail. This is the one time you hold nothing back.');
  }

  parts.push('\nIMPORTANT: Be specific to THIS problem. Never give generic advice when you can give targeted insight.');
  return parts.join('\n');
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const problemContext = body.problemContext;

    console.log('Received messages count:', messages?.length, 'problemContext:', !!problemContext);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured.' }), { status: 500 });
    }

    const groq = createGroq({ apiKey });

    // Convert UIMessages to plain model messages
    const modelMessages = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
        ?? m.content ?? '',
    })).filter((m: any) => m.content);

    console.log('Sending', modelMessages.length, 'messages to model');

    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: buildPrompt(problemContext),
      messages: modelMessages,
      temperature: 0.5,
    });

    return result.toUIMessageStreamResponse();

  } catch (err: any) {
    console.error('Chat error:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Unknown error' }), { status: 500 });
  }
}
