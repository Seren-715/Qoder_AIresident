import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_NAME, LIFE_KEY, clearLife, loadLife, saveLife } from '../src/storage/life';
import { createInitialLife } from '../src/sim/life';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

afterEach(() => store.clear());

describe('生活存档', () => {
  it('保存后能读回，名字与状态完整', () => {
    const state = createInitialLife({ seed: 42, atMinute: 12 * 60 });
    saveLife('Qoduck', state);
    const save = loadLife();
    expect(save?.name).toBe('Qoduck');
    expect(save?.state).toEqual(state);
    expect(store.has(LIFE_KEY)).toBe(true);
    expect(store.has('ai-resident-settings')).toBe(false);
  });

  it('事件 delta 允许负数，不会把正常存档误判为坏档', () => {
    const state = createInitialLife({ seed: 3, atMinute: 12 * 60 });
    state.events.push({
      id: 'e-delta',
      type: 'end',
      activityId: state.activity?.id ?? null,
      activity: 'code',
      atMinute: state.minute,
      startedAtMinute: state.minute - 10,
      endedAtMinute: state.minute,
      delta: { fullness: -1, energy: -2.5, mood: 1.2 },
    });
    saveLife('Qoduck', state);
    expect(loadLife()?.state).toEqual(state);
  });

  it('名字去空白，超长回默认', () => {
    const state = createInitialLife({ seed: 1, atMinute: 12 * 60 });
    saveLife('  阿鸭  ', state);
    expect(loadLife()?.name).toBe('阿鸭');
    saveLife('x'.repeat(21), state);
    expect(loadLife()?.name).toBe(DEFAULT_NAME);
  });

  it('坏 JSON、错版本、坏状态都返回 null', () => {
    const state = createInitialLife({ seed: 1, atMinute: 12 * 60 });
    store.set(LIFE_KEY, '{bad');
    expect(loadLife()).toBeNull();

    store.set(LIFE_KEY, JSON.stringify({ version: 99, name: 'Qoduck', state }));
    expect(loadLife()).toBeNull();

    store.set(LIFE_KEY, JSON.stringify({ version: 1, name: 'Qoduck', state: { ...state, mood: 101 } }));
    expect(loadLife()).toBeNull();

    store.set(
      LIFE_KEY,
      JSON.stringify({ version: 1, name: 'Qoduck', state: { ...state, activity: { bad: true } } }),
    );
    expect(loadLife()).toBeNull();

    const expired = {
      ...state,
      activity: {
        ...state.activity!,
        startedAt: state.minute - 20,
        endsAt: state.minute,
      },
    };
    store.set(LIFE_KEY, JSON.stringify({ version: 1, name: 'Qoduck', state: expired }));
    expect(loadLife()).toBeNull();

    store.set(LIFE_KEY, JSON.stringify({ version: 1, name: 'Qoduck', state: { ...state, events: {} } }));
    expect(loadLife()).toBeNull();
  });

  it('清空后读不到', () => {
    const state = createInitialLife({ seed: 1, atMinute: 12 * 60 });
    saveLife('Qoduck', state);
    clearLife();
    expect(loadLife()).toBeNull();
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
    expect(loadLife()).toBeNull();
    expect(() => saveLife('Qoduck', createInitialLife({ seed: 1, atMinute: 0 }))).not.toThrow();
    expect(() => clearLife()).not.toThrow();
    (globalThis as Record<string, unknown>).localStorage = original;
  });
});