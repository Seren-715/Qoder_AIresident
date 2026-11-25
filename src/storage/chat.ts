import type { ChatTurn } from '../ai/client';

export const CHAT_KEY = 'ai-resident-chat';
const MAX_TURNS = 12;
const MAX_CONTENT = 500;

export function loadChatHistory(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const turns: ChatTurn[] = [];
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const turn = item as Record<string, unknown>;
      if (turn.role !== 'user' && turn.role !== 'assistant') continue;
      if (
        typeof turn.content !== 'string' ||
        !turn.content.trim() ||
        turn.content.length > MAX_CONTENT
      ) {
        continue;
      }
      turns.push({ role: turn.role, content: turn.content });
    }
    return turns.slice(-MAX_TURNS);
  } catch {
    return [];
  }
}

export function saveChatHistory(turns: ChatTurn[]): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(turns.slice(-MAX_TURNS)));
  } catch {
    // 存储不可用时只在本次会话里保留对话。
  }
}

export function clearChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_KEY);
  } catch {
    // 忽略清理失败。
  }
}