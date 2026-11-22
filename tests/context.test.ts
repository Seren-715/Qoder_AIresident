import { describe, expect, it } from 'vitest';
import {
  MAX_AWAY_SUMMARY,
  MAX_RECENT_EVENTS,
  buildChatContext,
} from '../src/ai/context';
import type { LifeEvent, LifeState } from '../src/sim/life';

function stateWith(events: LifeEvent[], overrides: Partial<LifeState> = {}): LifeState {
  return {
    saveId: 'test',
    seed: 1,
    rngState: 1,
    minute: 12 * 60 + 30,
    fullness: 65.4,
    energy: 78.6,
    mood: 71.2,
    activity: {
      id: 'a-current',
      kind: 'gaze',
      startedAt: 12 * 60 + 20,
      endsAt: 12 * 60 + 40,
      statsAtStart: { fullness: 66, energy: 79, mood: 71 },
    },
    lastFun: 'gaze',
    nextActivitySeq: 2,
    nextEventSeq: 10,
    events,
    ...overrides,
  };
}

function endEvent(
  id: string,
  atMinute: number,
  kinds: 'read' | 'code' = 'read',
  duration = 30,
): LifeEvent {
  return {
    id,
    type: 'end',
    activityId: `a-${id}`,
    activity: kinds,
    atMinute,
    startedAtMinute: atMinute - duration,
    endedAtMinute: atMinute,
    delta: { fullness: -1, energy: -1, mood: 2 },
  };
}

describe('聊天上下文', () => {
  it('把完成、被打断和互动事件写成最近事实', () => {
    const state = stateWith([
      {
        id: 'e-start',
        type: 'start',
        activityId: 'a-read',
        activity: 'read',
        atMinute: 11 * 60 + 30,
      },
      endEvent('e-read', 12 * 60),
      {
        id: 'e-interact',
        type: 'interact',
        activityId: 'a-current',
        activity: 'read',
        atMinute: 12 * 60 + 5,
        outcome: 'accepted',
      },
      {
        id: 'e-interrupt',
        type: 'interrupt',
        activityId: 'a-code',
        activity: 'code',
        atMinute: 12 * 60 + 10,
        startedAtMinute: 12 * 60,
        endedAtMinute: 12 * 60 + 10,
      },
    ]);

    const context = buildChatContext(state, '  Qoduck  ');
    expect(context.name).toBe('Qoduck');
    expect(context.now.atMinute).toBe(12 * 60 + 30);
    expect(context.now.timeLabel).toBe('1 月 1 日 12:30');
    expect(context.now.activity).toBe('发呆');
    expect(context.now.fullness).toBe(65);
    expect(context.now.energy).toBe(79);
    expect(context.now.mood).toBe(71);
    expect(context.recent).toEqual([
      '11:30～12:00 看了 30 分钟书',
      '12:05 你让我去看书',
      '12:10 写代码被打断了',
    ]);
  });

  it('被拒绝的互动会写明原因', () => {
    const state = stateWith([
      {
        id: 'e-reject',
        type: 'interact',
        activityId: 'a-current',
        activity: 'code',
        atMinute: 12 * 60 + 5,
        outcome: 'rejected',
        message: '太困了，先睡一会儿',
      },
    ]);
    const context = buildChatContext(state, 'Qoduck');
    expect(context.recent[0]).toBe('12:05 你让我去写代码，我太困了，先睡一会儿');
  });

  it('超过 60 分钟写成小时和分钟', () => {
    const state = stateWith([endEvent('e-code', 12 * 60 + 6, 'code', 66)]);
    const context = buildChatContext(state, 'Qoduck');
    expect(context.recent[0]).toBe('11:00～12:06 写了 1 小时 6 分钟代码');
  });

  it('昨天和更早的事件带上日期', () => {
    const yesterday = stateWith([endEvent('e-read', 24 * 60 + 10 * 60, 'read', 60)], {
      minute: 2 * 24 * 60 + 10 * 60,
      activity: null,
    });
    expect(buildChatContext(yesterday, 'Qoduck').recent[0]).toBe(
      '昨天 09:00～10:00 看了 1 小时书',
    );

    const older = stateWith([endEvent('e-read', 24 * 60 + 10 * 60, 'read', 60)], {
      minute: 3 * 24 * 60 + 10 * 60,
      activity: null,
    });
    expect(buildChatContext(older, 'Qoduck').recent[0]).toBe(
      '1 月 2 日 09:00～10:00 看了 1 小时书',
    );
  });

  it('最近事件只保留最近 8 条，顺序从旧到新', () => {
    const events = Array.from({ length: 12 }, (_, i) => endEvent(`e${i}`, 10 * 60 + i));
    const context = buildChatContext(stateWith(events), 'Qoduck');
    expect(context.recent).toHaveLength(MAX_RECENT_EVENTS);
    expect(context.recent[0]).toContain('09:34～10:04');
    expect(context.recent.at(-1)).toContain('09:41～10:11');
  });

  it('带上「你不在的时候」总结并限长', () => {
    const summary = '你不在的 3 小时里，Qoduck 看了一会儿书。现在它在窗边发呆。';
    expect(buildChatContext(stateWith([]), 'Qoduck', summary).awaySummary).toBe(summary);

    const long = buildChatContext(stateWith([]), 'Qoduck', 'x'.repeat(200));
    expect(long.awaySummary).toHaveLength(MAX_AWAY_SUMMARY);

    expect(buildChatContext(stateWith([]), 'Qoduck', '   ').awaySummary).toBeUndefined();
  });

  it('名字空白回默认，过长截断', () => {
    const context = buildChatContext(stateWith([]), '   ');
    expect(context.name).toBe('Qoduck');
    expect(buildChatContext(stateWith([]), '鸭'.repeat(25)).name).toHaveLength(20);
  });

  it('没有活动时用休息兜底，没有事件时最近为空', () => {
    const state = stateWith([], { activity: null });
    const context = buildChatContext(state, 'Qoduck');
    expect(context.now.activity).toBe('休息');
    expect(context.recent).toEqual([]);
  });
});