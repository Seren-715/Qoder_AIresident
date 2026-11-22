import { describe, expect, it } from 'vitest';
import type { ActivityId } from '../src/data/life';
import {
  MAX_CATCH_UP_MINUTES,
  catchUpLife,
  catchUpTarget,
  summarizeAway,
  type CatchUpResult,
} from '../src/sim/offline';
import {
  createInitialLife,
  type LifeActivity,
  type LifeEvent,
  type LifeState,
} from '../src/sim/life';

function stateAt(minute: number, activity: LifeActivity | null = null): LifeState {
  return {
    saveId: 'test',
    seed: 1,
    rngState: 1,
    minute,
    fullness: 70,
    energy: 80,
    mood: 70,
    activity,
    lastFun: null,
    nextActivitySeq: 2,
    nextEventSeq: 2,
    events: [],
  };
}

function endEvent(id: string, activity: ActivityId, atMinute: number): LifeEvent {
  return {
    id,
    type: 'end',
    activityId: null,
    activity,
    atMinute,
    startedAtMinute: atMinute - 10,
    endedAtMinute: atMinute,
    delta: { fullness: 0, energy: 0, mood: 0 },
  };
}

describe('离线补算', () => {
  it('离开 3 小时后状态前进，事件落在补算区间内', () => {
    const saved = createInitialLife({ seed: 5, atMinute: 1000 });
    const result = catchUpLife(saved, 1180);
    expect(result.capped).toBe(false);
    expect(result.minutes).toBe(180);
    expect(result.state.minute).toBe(1180);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events.every((e) => e.atMinute >= 1000 && e.atMinute <= 1180)).toBe(true);

    const summary = summarizeAway('Qoduck', result);
    expect(summary?.body).toContain('你不在的 3 小时里');
    expect(summary?.body).toContain('现在它在');
  });

  it('离开不超过 10 分钟不弹卡片', () => {
    const saved = stateAt(1000);
    expect(summarizeAway('Qoduck', catchUpLife(saved, 1005))).toBeNull();
    expect(summarizeAway('Qoduck', catchUpLife(saved, 1010))).toBeNull();
    expect(summarizeAway('Qoduck', catchUpLife(saved, 1011))).not.toBeNull();
  });

  it('离开 30 天只补最近 7 天，且 1 秒内完成', () => {
    const saved = stateAt(0);
    const now = 30 * 24 * 60;
    const started = performance.now();
    const result = catchUpLife(saved, now);
    const elapsed = performance.now() - started;

    expect(result.capped).toBe(true);
    expect(result.minutes).toBe(MAX_CATCH_UP_MINUTES);
    expect(result.fromMinute).toBe(now - MAX_CATCH_UP_MINUTES);
    expect(result.state.minute).toBe(now);
    expect(elapsed).toBeLessThan(1000);
    expect(
      result.events.every((e) => e.atMinute >= now - MAX_CATCH_UP_MINUTES),
    ).toBe(true);
  });

  it('存档时间在未来时不动也不回退', () => {
    const saved = stateAt(2000);
    const result = catchUpLife(saved, 1500);
    expect(result.minutes).toBe(0);
    expect(result.state).toBe(saved);
    expect(result.events).toEqual([]);
  });

  it('快进领先 50 小时后，离线 3 小时仍会补算', () => {
    const realSave = 1000;
    const ahead = 50 * 60;
    const saved = createInitialLife({ seed: 5, atMinute: realSave + ahead });
    const realNow = realSave + 180;
    const target = catchUpTarget(saved.minute, ahead, realNow);

    expect(target).toBe(saved.minute + 180);
    const result = catchUpLife(saved, target);
    expect(result.minutes).toBe(180);
    expect(result.state.minute).toBe(saved.minute + 180);
    expect(result.events.length).toBeGreaterThan(0);
    expect(summarizeAway('Qoduck', result)?.body).toContain('3 小时');
  });

  it('补算目标不会让游戏时间倒流', () => {
    const saved = stateAt(5000);
    expect(catchUpTarget(saved.minute, 0, 1000)).toBe(5000);
    expect(catchUpTarget(saved.minute, 600, 1000)).toBe(5000);
  });
});

describe('你不在的时候总结', () => {
  it('按事件计数并说明当前活动', () => {
    const gaze: LifeActivity = {
      id: 'a1',
      kind: 'gaze',
      startedAt: 100,
      endsAt: 200,
      statsAtStart: { fullness: 70, energy: 80, mood: 70 },
    };
    const result: CatchUpResult = {
      state: stateAt(150, gaze),
      fromMinute: 0,
      toMinute: 150,
      minutes: 150,
      capped: false,
      events: [
        endEvent('e1', 'sleep', 20),
        endEvent('e2', 'eat', 40),
        endEvent('e3', 'eat', 60),
        endEvent('e4', 'code', 90),
      ],
    };
    const summary = summarizeAway('阿鸭', result)!;
    expect(summary.body).toContain('你不在的 2 小时 30 分钟里');
    expect(summary.body).toContain('阿鸭');
    expect(summary.body).toContain('睡了一觉');
    expect(summary.body).toContain('吃了 2 次饭');
    expect(summary.body).toContain('写了一会儿代码');
    expect(summary.body).toContain('现在它在发呆。');
  });

  it('没有完成事件时也有温和的兜底文案', () => {
    const result: CatchUpResult = {
      state: stateAt(150),
      fromMinute: 0,
      toMinute: 150,
      minutes: 150,
      capped: false,
      events: [],
    };
    const summary = summarizeAway('Qoduck', result)!;
    expect(summary.body).toContain('安安静静地待着');
    expect(summary.body).toContain('现在它在家里待着。');
  });

  it('超过 7 天时说明只补了最近 7 天', () => {
    const now = 30 * 24 * 60;
    const result: CatchUpResult = {
      state: stateAt(now),
      fromMinute: now - MAX_CATCH_UP_MINUTES,
      toMinute: now,
      minutes: MAX_CATCH_UP_MINUTES,
      capped: true,
      events: [],
    };
    const summary = summarizeAway('Qoduck', result)!;
    expect(summary.body).toContain('只补了最近 7 天');
  });
});