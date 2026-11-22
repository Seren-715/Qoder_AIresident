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
  const date = new Date(EPOCH_MS + minute * 60000 + 8 * 60 * 60 * 1000);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${month} 月 ${day} 日 ${hh}:${mm}`;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 便签上的大号时间，例如「22:15」。 */
export function formatClock(minute: number): string {
  const date = new Date(EPOCH_MS + minute * 60000 + 8 * 60 * 60 * 1000);
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

/** 便签上的日期行，例如「11 月 22 日 · 周日」。 */
export function formatDateLabel(minute: number): string {
  const date = new Date(EPOCH_MS + minute * 60000 + 8 * 60 * 60 * 1000);
  return `${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日 · ${WEEKDAYS[date.getUTCDay()]}`;
}
