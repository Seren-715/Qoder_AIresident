import { describe, expect, it } from 'vitest';
import { pickFallback } from '../src/ai/fallback';

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
});