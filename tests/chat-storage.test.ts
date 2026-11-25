import { afterEach, describe, expect, it } from 'vitest';
import type { ChatTurn } from '../src/ai/client';
import {
  CHAT_KEY,
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
} from '../src/storage/chat';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

afterEach(() => store.clear());

const turn = (role: ChatTurn['role'], content: string): ChatTurn => ({ role, content });

describe('聊天记录持久化', () => {
  it('保存后能读回', () => {
    const history = [turn('user', '你好'), turn('assistant', '嘎，你好呀')];
    saveChatHistory(history);
    expect(loadChatHistory()).toEqual(history);
  });

  it('只保留最近 12 轮', () => {
    const history = Array.from({ length: 20 }, (_, i) => turn('user', `第 ${i} 句`));
    saveChatHistory(history);
    const loaded = loadChatHistory();
    expect(loaded).toHaveLength(12);
    expect(loaded[0].content).toBe('第 8 句');
    expect(loaded.at(-1)?.content).toBe('第 19 句');
  });

  it('坏数据、坏条目都当作空记录', () => {
    store.set(CHAT_KEY, '{bad');
    expect(loadChatHistory()).toEqual([]);

    store.set(CHAT_KEY, JSON.stringify({ role: 'user', content: '不是数组' }));
    expect(loadChatHistory()).toEqual([]);

    store.set(
      CHAT_KEY,
      JSON.stringify([
        turn('user', '好的'),
        { role: 'system', content: 'x' },
        { role: 'user', content: '' },
        { role: 'assistant', content: 'x'.repeat(501) },
        'nope',
      ]),
    );
    expect(loadChatHistory()).toEqual([turn('user', '好的')]);
  });

  it('清空后读不到', () => {
    saveChatHistory([turn('user', '你好')]);
    clearChatHistory();
    expect(loadChatHistory()).toEqual([]);
  });

  it('存储抛错时不崩', () => {
    const original = (globalThis as Record<string, unknown>).localStorage as Storage;
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadChatHistory()).toEqual([]);
    expect(() => saveChatHistory([turn('user', '你好')])).not.toThrow();
    expect(() => clearChatHistory()).not.toThrow();
    (globalThis as Record<string, unknown>).localStorage = original;
  });
});