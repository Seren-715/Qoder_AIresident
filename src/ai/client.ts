import { pickFallback } from './fallback';
import type { ChatContext } from './context';
import type { AiConfig } from '../data/ai';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const TIMEOUT_MS = 20000;
const POSTCARD_TIMEOUT_MS = 8000;

export interface PostcardTripRequest {
  destination: string;
  region: string;
  facts: string[];
  departedLabel: string;
  returnedLabel: string;
  hours: number;
}

export async function sendChat(
  message: string,
  history: ChatTurn[],
  config?: AiConfig,
  context?: ChatContext,
): Promise<{ reply: string; fallback: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('/functions/v1/app', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ operation: 'chat', message, history, context, config }),
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
    return { reply: pickFallback(message, context), fallback: true };
  } finally {
    clearTimeout(timer);
  }
}

/** 请模型写一张明信片；失败、超时或不合格都静默返回 null。 */
export async function sendPostcard(
  trip: PostcardTripRequest,
  config?: AiConfig,
  context?: ChatContext,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POSTCARD_TIMEOUT_MS);
  try {
    const response = await fetch('/functions/v1/app', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ operation: 'postcard', trip, context, config }),
      signal: controller.signal,
    });
    if (!response.ok || response.redirected) return null;
    if (!response.headers.get('content-type')?.includes('application/json')) return null;
    const data = (await response.json()) as { ok?: unknown; text?: unknown };
    if (data.ok !== true || typeof data.text !== 'string' || !data.text.trim()) return null;
    return data.text.trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}