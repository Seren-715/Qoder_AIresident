import { describe, expect, it } from 'vitest';
import { MAX_RECENT_EVENTS, buildChatContext } from '../src/ai/context';
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

function endEvent(id: string, atMinute: number, kind: 'read' | 'code' = 'read'): LifeEvent {
  return {
    id,
    type: 'end',
    activityId: `a-${id}`,
    activity: kind,
    atMinute,
    startedAtMinute: atMinute - 30,
    endedAtMinute: atMinute,
    delta: { fullness: -1, energy: -1, mood: 2 },
  };
}

describe('聊天上下文', () => {
  it('只把完成和被打断的事件写成最近事实', () => {
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
    expect(context.recent).toEqual(['12:00 看了 30 分钟书', '12:10 写代码被打断了']);
  });

  it('最近事件只保留最近 8 条，顺序从旧到新', () => {
    const events = Array.from({ length: 12 }, (_, i) => endEvent(`e${i}`, 10 * 60 + i));
    const context = buildChatContext(stateWith(events), 'Qoduck');
    expect(context.recent).toHaveLength(MAX_RECENT_EVENTS);
    expect(context.recent[0].startsWith('10:04')).toBe(true);
    expect(context.recent.at(-1)!.startsWith('10:11')).toBe(true);
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