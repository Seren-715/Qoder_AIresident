import { describe, expect, it } from 'vitest';
import type { ChatContext } from '../src/ai/context';
import { pickFallback } from '../src/ai/fallback';

const CONTEXT: ChatContext = {
  name: 'Qoduck',
  now: {
    atMinute: 12 * 60,
    timeLabel: '1 月 1 日 12:00',
    activity: '看书',
    fullness: 70,
    energy: 80,
    mood: 70,
  },
  recent: [],
};

describe('模板兜底', () => {
  it('关键词命中对应话题', () => {
    expect(pickFallback('我饿了')).toMatch(/锅巴|吃一口/);
    expect(pickFallback('好困啊')).toMatch(/躺一会儿|打个盹/);
    expect(pickFallback('你好呀')).toMatch(/小黄鸭|聊天/);
  });

  it('同一句话回复稳定可复现', () => {
    expect(pickFallback('今天天气不错')).toBe(pickFallback('今天天气不错'));
  });

  it('无关键词时也有温柔回复', () => {
    expect(pickFallback('量子力学是什么').length).toBeGreaterThan(0);
  });

  it('有上下文时按当前活动回答在干嘛', () => {
    expect(pickFallback('你在干嘛', CONTEXT)).toContain('看书');
    expect(
      pickFallback('你在干嘛', { ...CONTEXT, now: { ...CONTEXT.now, activity: '睡觉' } }),
    ).toContain('睡觉');
  });

  it('有上下文时按饱腹和体力说真话', () => {
    expect(
      pickFallback('我饿了', { ...CONTEXT, now: { ...CONTEXT.now, fullness: 10 } }),
    ).toContain('饿了');
    expect(
      pickFallback('我饿了', { ...CONTEXT, now: { ...CONTEXT.now, fullness: 90 } }),
    ).toContain('不饿');
    expect(
      pickFallback('好困', { ...CONTEXT, now: { ...CONTEXT.now, energy: 10 } }),
    ).toContain('困');
  });

  it('无关键词时也会接上当前活动', () => {
    expect(pickFallback('量子力学是什么', CONTEXT)).toContain('我在看书');
  });

  it('旅行中像在路上发消息', () => {
    const traveling = { ...CONTEXT, now: { ...CONTEXT.now, activity: '在乌镇旅行' } };
    expect(pickFallback('你在干嘛', traveling)).toBe('我在乌镇呢，晚点回来讲给你听。');
    expect(pickFallback('今天天气不错', traveling)).toContain('我在乌镇旅行');
  });
});
