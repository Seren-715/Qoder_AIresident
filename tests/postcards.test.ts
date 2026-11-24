import { afterEach, describe, expect, it } from 'vitest';
import { startPostcardStory } from '../src/ai/postcard';
import { DESTINATIONS } from '../src/data/travel';
import { hashText, pickTemplate, visitedCount } from '../src/data/postcards';
import {
  POSTCARDS_KEY,
  clearPostcards,
  loadPostcardCache,
  savePostcardStory,
  type PostcardStoryEntry,
} from '../src/storage/postcards';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

afterEach(() => store.clear());

describe('明信片模板', () => {
  it('hash 稳定、非负', () => {
    expect(hashText('trip-1')).toBe(hashText('trip-1'));
    expect(hashText('trip-1')).not.toBe(hashText('trip-2'));
    expect(hashText('')).toBeGreaterThanOrEqual(0);
  });

  it('同一张明信片每次都选同一条模板', () => {
    for (const destination of DESTINATIONS) {
      const first = pickTemplate('save-a3', destination.templates);
      expect(pickTemplate('save-a3', destination.templates)).toBe(first);
      expect(destination.templates).toContain(first);
    }
  });

  it('不同明信片会落到不同模板，空模板回空串', () => {
    const templates = DESTINATIONS[0].templates;
    const picked = new Set(
      Array.from({ length: 20 }, (_, i) => pickTemplate(`trip-${i}`, templates)),
    );
    expect(picked.size).toBeGreaterThan(1);
    expect(pickTemplate('trip', [])).toBe('');
  });

  it('数去过几处不重复', () => {
    expect(visitedCount([])).toBe(0);
    expect(visitedCount(['xihu', 'xihu', 'wuzhen'])).toBe(2);
  });
});

describe('明信片缓存', () => {
  it('保存后能读回，写入同一张会覆盖', () => {
    savePostcardStory('t1', { text: '模板一', source: 'template' });
    savePostcardStory('t2', { text: '模型写的', source: 'model' });
    expect(loadPostcardCache()).toEqual({
      t1: { text: '模板一', source: 'template' },
      t2: { text: '模型写的', source: 'model' },
    });

    savePostcardStory('t1', { text: '模型改过', source: 'model' });
    expect(loadPostcardCache().t1).toEqual({ text: '模型改过', source: 'model' });
  });

  it('坏 JSON、坏条目都忽略，不崩', () => {
    store.set(POSTCARDS_KEY, '{bad');
    expect(loadPostcardCache()).toEqual({});

    store.set(
      POSTCARDS_KEY,
      JSON.stringify({
        ok: { text: '好的', source: 'template' },
        empty: { text: '  ', source: 'model' },
        badSource: { text: '文字', source: 'other' },
        badText: { text: 42, source: 'model' },
        notObject: 'x',
      }),
    );
    expect(loadPostcardCache()).toEqual({ ok: { text: '好的', source: 'template' } });
  });

  it('重新开始时清空缓存', () => {
    savePostcardStory('t1', { text: '模板一', source: 'template' });
    clearPostcards();
    expect(loadPostcardCache()).toEqual({});
  });
});

describe('明信片故事', () => {
  const template = '模板故事';

  it('命中缓存直接展示，不再请求', async () => {
    let calls = 0;
    const job = startPostcardStory({
      tripId: 't1',
      template,
      cached: { text: '缓存好的', source: 'model' },
      request: async () => {
        calls++;
        return '新的';
      },
      isCurrent: () => true,
      onUpdate: () => {},
      save: () => {},
    });
    expect(job.initial).toEqual({ text: '缓存好的', source: 'model' });
    expect(job.pending).toBeNull();
    await Promise.resolve();
    expect(calls).toBe(0);
  });

  it('未命中先给模板，成功后替换并缓存模型文案', async () => {
    const saved: PostcardStoryEntry[] = [];
    const updates: PostcardStoryEntry[] = [];
    const job = startPostcardStory({
      tripId: 't1',
      template,
      request: async () => '模型写的明信片',
      isCurrent: () => true,
      onUpdate: (entry) => updates.push(entry),
      save: (_id, entry) => saved.push(entry),
    });
    expect(job.initial).toEqual({ text: template, source: 'template' });
    await job.pending;
    expect(saved).toEqual([{ text: '模型写的明信片', source: 'model' }]);
    expect(updates).toEqual([{ text: '模型写的明信片', source: 'model' }]);
  });

  it('失败或超时保留模板，并把模板写进缓存避免重复请求', async () => {
    const saved: PostcardStoryEntry[] = [];
    const updates: PostcardStoryEntry[] = [];
    const job = startPostcardStory({
      tripId: 't1',
      template,
      request: async () => null,
      isCurrent: () => true,
      onUpdate: (entry) => updates.push(entry),
      save: (_id, entry) => saved.push(entry),
    });
    await job.pending;
    expect(updates).toEqual([]);
    expect(saved).toEqual([{ text: template, source: 'template' }]);
  });

  it('请求抛错也不崩，按失败处理', async () => {
    const saved: PostcardStoryEntry[] = [];
    const job = startPostcardStory({
      tripId: 't1',
      template,
      request: async () => {
        throw new Error('offline');
      },
      isCurrent: () => true,
      onUpdate: () => {
        throw new Error('should not update');
      },
      save: (_id, entry) => saved.push(entry),
    });
    await expect(job.pending).resolves.toBeUndefined();
    expect(saved).toEqual([{ text: template, source: 'template' }]);
  });

  it('已经翻到别的明信片时只缓存，不替换', async () => {
    const saved: PostcardStoryEntry[] = [];
    const updates: PostcardStoryEntry[] = [];
    const job = startPostcardStory({
      tripId: 't1',
      template,
      request: async () => '迟到的文案',
      isCurrent: () => false,
      onUpdate: (entry) => updates.push(entry),
      save: (_id, entry) => saved.push(entry),
    });
    await job.pending;
    expect(updates).toEqual([]);
    expect(saved).toEqual([{ text: '迟到的文案', source: 'model' }]);
  });
});
