import { NIGHT } from '../data/life';

export const DAY_MINUTES = 24 * 60;

// 2026-01-01 00:00 北京时间 = 2025-12-31 16:00 UTC
const EPOCH_MS = Date.UTC(2025, 11, 31, 16, 0, 0);

export function toGameMinute(nowMs: number): number {
  return Math.floor((nowMs - EPOCH_MS) / 60000);
}

export function minuteOfDay(minute: number): number {
  return ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

export function isNight(minute: number): boolean {
  const m = minuteOfDay(minute);
  return m >= NIGHT.startMinute || m < NIGHT.endMinute;
}

export function formatGameTime(minute: number): string {
  const day = Math.floor(minute / DAY_MINUTES) + 1;
  const m = minuteOfDay(minute);
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `第 ${day} 天 ${hh}:${mm}`;
}
