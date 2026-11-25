import { describe, expect, it } from 'vitest';
import { tintCss, tintForMinute } from '../src/ui/tint';
import { DAY_MINUTES } from '../src/sim/time';

describe('昼夜色调', () => {
  it('深夜偏深蓝、不透明度约 0.35', () => {
    for (const minute of [22 * 60, 23 * 60 + 30, 0, 2 * 60, 4 * 60]) {
      const tint = tintForMinute(minute);
      expect(tint.opacity, `${minute}`).toBeCloseTo(0.35, 5);
      expect(tint.b).toBeGreaterThan(tint.r);
    }
  });

  it('清晨与傍晚偏暖橙、约 0.12', () => {
    for (const minute of [5 * 60, 6 * 60, 7 * 60, 17 * 60, 18 * 60]) {
      const tint = tintForMinute(minute);
      expect(tint.opacity, `${minute}`).toBeCloseTo(0.12, 5);
      expect(tint.r).toBeGreaterThan(tint.b);
    }
  });

  it('白天没有色调', () => {
    for (const minute of [8 * 60, 12 * 60, 16 * 60]) {
      expect(tintForMinute(minute).opacity).toBe(0);
    }
  });

  it('时段边缘平滑过渡，没有整点突变', () => {
    expect(tintForMinute(4 * 60 + 30).opacity).toBeGreaterThan(0.12);
    expect(tintForMinute(4 * 60 + 30).opacity).toBeLessThan(0.35);
    expect(tintForMinute(7 * 60 + 30).opacity).toBeGreaterThan(0);
    expect(tintForMinute(7 * 60 + 30).opacity).toBeLessThan(0.12);
    expect(tintForMinute(20 * 60 + 30).opacity).toBeGreaterThan(0);
    expect(tintForMinute(20 * 60 + 30).opacity).toBeLessThan(0.35);

    for (let minute = 0; minute < DAY_MINUTES; minute++) {
      const delta = Math.abs(tintForMinute(minute + 1).opacity - tintForMinute(minute).opacity);
      expect(delta, `${minute} 分钟`).toBeLessThan(0.01);
    }
  });

  it('按天循环，跨天的分钟数归一', () => {
    expect(tintForMinute(2 * 60)).toEqual(tintForMinute(2 * 60 + DAY_MINUTES));
    expect(tintForMinute(-60)).toEqual(tintForMinute(23 * 60));
  });

  it('生成 CSS 颜色', () => {
    expect(tintCss({ r: 26, g: 42, b: 92, opacity: 0.35 })).toBe('rgba(26, 42, 92, 0.35)');
  });
});