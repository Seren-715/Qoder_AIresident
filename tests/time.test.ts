import { describe, expect, it } from 'vitest';
import {
  formatClock,
  formatDateLabel,
  formatGameTime,
  isNight,
  minuteOfDay,
  toGameMinute,
} from '../src/sim/time';

describe('游戏时间', () => {
  it('2026-01-01 00:00 北京时间是第 0 分钟', () => {
    expect(toGameMinute(Date.UTC(2025, 11, 31, 16, 0, 0))).toBe(0);
    expect(toGameMinute(Date.UTC(2025, 11, 31, 16, 0, 59))).toBe(0);
    expect(toGameMinute(Date.UTC(2025, 11, 31, 16, 1, 0))).toBe(1);
  });

  it('一天内的分钟与夜里判断', () => {
    expect(minuteOfDay(0)).toBe(0);
    expect(minuteOfDay(24 * 60 + 30)).toBe(30);
    expect(isNight(23 * 60)).toBe(true);
    expect(isNight(0)).toBe(true);
    expect(isNight(6 * 60 + 59)).toBe(true);
    expect(isNight(7 * 60)).toBe(false);
    expect(isNight(12 * 60)).toBe(false);
  });

  it('游戏时间显示为月日和时分', () => {
    expect(formatGameTime(0)).toBe('1 月 1 日 00:00');
    expect(formatGameTime(12 * 60 + 34)).toBe('1 月 1 日 12:34');
    expect(formatGameTime(24 * 60)).toBe('1 月 2 日 00:00');
    expect(formatGameTime(325 * 24 * 60)).toBe('11 月 22 日 00:00');
  });

  it('便签用的大号时间和日期行', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(22 * 60 + 15)).toBe('22:15');
    expect(formatClock(24 * 60 + 5)).toBe('00:05');
    expect(formatDateLabel(0)).toBe('1 月 1 日 · 周四');
    expect(formatDateLabel(325 * 24 * 60 + 22 * 60 + 15)).toBe('11 月 22 日 · 周日');
  });
});
