import { describe, expect, it } from 'vitest';
import type { ActivityId } from '../src/data/life';
import {
  advance,
  createInitialLife,
  suggestActivity,
  type LifeActivity,
  type LifeState,
} from '../src/sim/life';
import { isNight } from '../src/sim/time';

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
    trips: [],
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
    expect(after.mood).toBeCloseTo(70 + (10 * 15) / 60, 6);
  });

  it('心情朝目标值靠拢，不会被娱乐顶满', () => {
    const activity: LifeActivity = {
      id: 'test-a1',
      kind: 'code',
      startedAt: 600,
      endsAt: 720,
      statsAtStart: { fullness: 80, energy: 80, mood: 70 },
    };
    const state = manualState(activity, { mood: 70, fullness: 80, energy: 80 });
    const after = advance(state, 720);
    expect(after.mood).toBeGreaterThan(70);
    expect(after.mood).toBeLessThanOrEqual(82);
    expect(after.mood).toBeLessThan(100);
  });

  it('又饿又累时心情会降下来，但不会掉到 0', () => {
    const activity: LifeActivity = {
      id: 'test-a1',
      kind: 'gaze',
      startedAt: 600,
      endsAt: 960,
      statsAtStart: { fullness: 10, energy: 10, mood: 70 },
    };
    const state = manualState(activity, { mood: 70, fullness: 10, energy: 10 });
    const after = advance(state, 959);
    expect(after.mood).toBeLessThan(30);
    expect(after.mood).toBeGreaterThan(0);
  });

  it('7 天里心情有变化，不会一直顶满或掉到 0', () => {
    let state = createInitialLife({ seed: 20261113, atMinute: 8 * 60 });
    const end = state.minute + 7 * 24 * 60;
    let min = 100;
    let max = 0;
    let at100 = 0;
    let samples = 0;
    while (state.minute < end) {
      state = advance(state, Math.min(state.minute + 10, end));
      min = Math.min(min, state.mood);
      max = Math.max(max, state.mood);
      if (state.mood >= 99.9) at100++;
      samples++;
    }
    expect(max).toBeLessThan(100);
    expect(min).toBeGreaterThan(0);
    expect(max - min).toBeGreaterThan(20);
    expect(at100 / samples).toBeLessThan(0.1);
  });

  it('不同开局的活动编号不会重复', () => {
    const a = createInitialLife({ seed: 1, atMinute: 600, saveId: 'a' });
    const b = createInitialLife({ seed: 1, atMinute: 600, saveId: 'b' });
    expect(a.activity?.id.startsWith('a-')).toBe(true);
    expect(b.activity?.id.startsWith('b-')).toBe(true);
    const idsA = new Set(a.events.map((e) => e.activityId).filter(Boolean));
    for (const id of b.events.map((e) => e.activityId).filter(Boolean)) {
      expect(idsA.has(id)).toBe(false);
    }
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
    expect(result.state.events.find((e) => e.type === 'interact')?.outcome).toBe('accepted');
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
    const interact = result.state.events.find((e) => e.type === 'interact');
    expect(interact?.outcome).toBe('rejected');
    expect(interact?.message).toBe('现在还不困');
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
    const lowInteract = lowResult.state.events.find((e) => e.type === 'interact');
    expect(lowInteract?.outcome).toBe('rejected');
    expect(lowInteract?.message).toBe('呼……');

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

  it(
    '6 颗种子 7 天的作息与心情统计达标',
    () => {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        let state = createInitialLife({ seed, atMinute: 8 * 60 });
        const end = state.minute + 7 * 24 * 60;
        let nightSamples = 0;
        let awakeAtNight = 0;
        let lowFullness = 0;
        let lowMood = 0;
        let fullMood = 0;
        let samples = 0;
        let codeMinutes = 0;
        let playMinutes = 0;
        const moods: number[] = [];

        while (state.minute < end) {
          state = advance(state, state.minute + 1);
          samples++;
          moods.push(state.mood);

          if (isNight(state.minute)) {
            nightSamples++;
            if (state.activity?.kind !== 'sleep') awakeAtNight++;
          }
          if (state.fullness < 30) lowFullness++;
          if (state.mood < 30) lowMood++;
          if (state.mood >= 99) fullMood++;
          if (state.activity?.kind === 'code') codeMinutes++;
          if (state.activity?.kind === 'play') playMinutes++;
        }

        moods.sort((a, b) => a - b);
        const median = moods[Math.floor(moods.length / 2)];
        expect(awakeAtNight / nightSamples, `seed ${seed} 夜里醒着`).toBeLessThan(0.15);
        expect(lowFullness / samples, `seed ${seed} 饱腹<30`).toBeLessThan(0.1);
        expect(median, `seed ${seed} 心情中位数`).toBeGreaterThanOrEqual(50);
        expect(median, `seed ${seed} 心情中位数`).toBeLessThanOrEqual(80);
        expect(lowMood / samples, `seed ${seed} 心情<30`).toBeLessThan(0.1);
        expect(fullMood / samples, `seed ${seed} 心情>=99`).toBeLessThan(0.1);
        expect(codeMinutes, `seed ${seed} 写代码时长`).toBeGreaterThan(playMinutes);
      }
    },
    30000,
  );

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
