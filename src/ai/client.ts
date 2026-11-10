import { pickFallback } from './fallback';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const TIMEOUT_MS = 20000;

export async function sendChat(
  message: string,
  history: ChatTurn[],
): Promise<{ reply: string; fallback: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('/functions/v1/app', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });
    if (!response.ok || response.redirected) throw new Error('bad status');
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('bad content type');
    }
    const data = (await response.json()) as { ok?: unknown; reply?: unknown };
    if (data.ok !== true || typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new Error('bad payload');
    }
    return { reply: data.reply.trim(), fallback: false };
  } catch {
    return { reply: pickFallback(message), fallback: true };
  } finally {
    clearTimeout(timer);
  }
}