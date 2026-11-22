import { describe, expect, it } from 'vitest';
import type { ActivityId } from '../src/data/life';
import {
  advance,
  createInitialLife,
  suggestActivity,
  type LifeActivity,
  type LifeState,
} from '../src/sim/life';

const NOON = 12 * 60;
const NIGHT_TIME = 23 * 60 + 30;

function manualState(activity: LifeActivity, overrides: Partial<LifeState> = {}): LifeState {
  return {
    saveId: 'test',
    seed: 1,
    rngState: 1,
    minute: activity.startedAt,
    fullness: 70,
    energy: 80,
    mood: 70,
    activity,
    lastFun: null,
    nextActivitySeq: 2,
    nextEventSeq: 2,
    events: [
      {
        id: 'test-e1',
        type: 'start',
        activityId: activity.id,
        activity: activity.kind,
        atMinute: activity.startedAt,
      },
    ],
    ...overrides,
  };
}

describe('生活模拟', () => {
  it('同一种子推进 7 天结果完全一致', () => {
    const end = 8 * 60 + 7 * 24 * 60;
    const a = advance(createInitialLife({ seed: 12345, atMinute: 8 * 60 }), end);
    const b = advance(createInitialLife({ seed: 12345, atMinute: 8 * 60 }), end);
    expect(b).toEqual(a);
  });

  it('推进 7 天后三项数值始终在 0～100', () => {
    let state = createInitialLife({ seed: 7, atMinute: 8 * 60 });
    const end = state.minute + 7 * 24 * 60;
    while (state.minute < end) {
      state = advance(state, Math.min(state.minute + 10, end));
      for (const value of [state.fullness, state.energy, state.mood]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('饱腹低于 20 时一定先吃饭', () => {
    const state = createInitialLife({
      seed: 9,
      atMinute: NOON,
      fullness: 19,
      energy: 80,
      mood: 70,
    });
    expect(state.activity?.kind).toBe('eat');
  });

  it('体力低于 10 时一定先睡觉', () => {
    const state = createInitialLife({
      seed: 9,
      atMinute: NOON,
      fullness: 50,
      energy: 9,
      mood: 70,
    });
    expect(state.activity?.kind).toBe('sleep');
  });

  it('夜里体力不足时优先睡觉', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const state = createInitialLife({
        seed,
        atMinute: NIGHT_TIME,
        fullness: 70,
        energy: 50,
        mood: 70,
      });
      expect(state.activity?.kind).toBe('sleep');
    }
  });

  it('打断的活动按已过时间比例结算', () => {
    const activity: LifeActivity = {
      id: 'test-a1',
      kind: 'code',
      startedAt: 600,
      endsAt: 660,
      statsAtStart: { fullness: 70, energy: 80, mood: 70 },
    };
    const before = manualState(activity);
    const after = advance(before, 610);

    expect(before.energy).toBe(80);
    expect(after.fullness).toBeCloseTo(70 - (10 * 6) / 60, 6);
    expect(after.energy).toBeCloseTo(80 - (10 * 4) / 60 - (10 * 10) / 60, 6);
    expect(after.mood).toBeCloseTo(70 + (10 * 8) / 60, 6);
  });

  it('完整做完记 end，被打断记 interrupt 且不记 end', () => {
    const activity: LifeActivity = {
      id: 'test-a1',
      kind: 'code',
      startedAt: 600,
      endsAt: 660,
      statsAtStart: { fullness: 70, energy: 80, mood: 70 },
    };
    const completed = advance(manualState(activity), 660);
    expect(completed.events.some((e) => e.type === 'end' && e.activity === 'code')).toBe(true);
    expect(completed.events.some((e) => e.type === 'interrupt')).toBe(false);
    expect(completed.activity?.startedAt).toBe(660);

    const partial = advance(manualState(activity), 610);
    const result = suggestActivity(partial, 'eat', 610);
    const interrupt = result.state.events.find(
      (e) => e.type === 'interrupt' && e.activity === 'code',
    );
    expect(interrupt?.endedAtMinute).toBe(610);
    expect(interrupt?.delta?.energy).toBeCloseTo(-2.3, 5);
    expect(result.accepted).toBe(true);
    expect(result.state.activity?.kind).toBe('eat');
    expect(result.state.events.some((e) => e.type === 'interact')).toBe(true);
  });

  it('条件不满足时不打断，只记互动并说明原因', () => {
    const activity: LifeActivity = {
      id: 'test-a1',
      kind: 'gaze',
      startedAt: 600,
      endsAt: 630,
      statsAtStart: { fullness: 70, energy: 80, mood: 70 },
    };
    const state = manualState(activity);
    const result = suggestActivity(state, 'sleep', 605);
    expect(result.accepted).toBe(false);
    expect(result.message).toBe('现在还不困');
    expect(result.state.activity?.kind).toBe('gaze');
    expect(result.state.events.some((e) => e.type === 'interact')).toBe(true);
    expect(state.events.some((e) => e.type === 'interact')).toBe(false);
  });

  it('睡觉时体力不足不会被叫醒，体力够时会醒来去做别的事', () => {
    const sleepActivity: LifeActivity = {
      id: 'test-a1',
      kind: 'sleep',
      startedAt: 1380,
      endsAt: 1740,
      statsAtStart: { fullness: 70, energy: 50, mood: 70 },
    };
    const low = manualState(sleepActivity, { minute: 1380, energy: 50 });
    const lowResult = suggestActivity(low, 'code', 1390);
    expect(lowResult.accepted).toBe(false);
    expect(lowResult.message).toBe('呼……');
    expect(lowResult.state.activity?.kind).toBe('sleep');

    const high = manualState(sleepActivity, {
      minute: 1380,
      energy: 70,
      activity: { ...sleepActivity, statsAtStart: { fullness: 70, energy: 70, mood: 70 } },
    });
    const highResult = suggestActivity(high, 'code', 1390);
    expect(highResult.accepted).toBe(true);
    expect(highResult.state.activity?.kind).toBe('code');
    expect(
      highResult.state.events.some((e) => e.type === 'interrupt' && e.activity === 'sleep'),
    ).toBe(true);
  });

  it('7 天里写代码多于打滚，每天都有睡觉和吃饭', () => {
    const start = 8 * 60;
    let state = createInitialLife({ seed: 20261113, atMinute: start });
    state = advance(state, start + 7 * 24 * 60);

    const ends = state.events.filter((e) => e.type === 'end');
    const count = (id: ActivityId) => ends.filter((e) => e.activity === id).length;

    expect(state.events.length).toBeLessThanOrEqual(200);
    expect(count('code')).toBeGreaterThan(count('play'));

    for (let day = 0; day < 7; day++) {
      const from = start + day * 24 * 60;
      const to = from + 24 * 60;
      const dayEnds = ends.filter((e) => e.atMinute >= from && e.atMinute < to);
      expect(dayEnds.some((e) => e.activity === 'sleep')).toBe(true);
      expect(dayEnds.some((e) => e.activity === 'eat')).toBe(true);
    }
  });
});
