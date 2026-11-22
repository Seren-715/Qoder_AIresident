import { ACTIVITIES, type ActivityId } from '../data/life';
import type {
  LifeActivity,
  LifeEvent,
  LifeEventType,
  LifeState,
  LifeStats,
} from '../sim/life';

export const LIFE_KEY = 'ai-resident-life';
export const DEFAULT_NAME = 'Qoduck';
const VERSION = 1;
const MAX_NAME = 20;
const MAX_EVENTS = 200;
const ACTIVITY_IDS = new Set<string>(Object.keys(ACTIVITIES));
const EVENT_TYPES = new Set<string>(['start', 'end', 'interrupt', 'interact']);

export interface LifeSave {
  name: string;
  aheadMinutes: number;
  state: LifeState;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isStat(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isActivityId(value: unknown): value is ActivityId {
  return typeof value === 'string' && ACTIVITY_IDS.has(value);
}

function isEventType(value: unknown): value is LifeEventType {
  return typeof value === 'string' && EVENT_TYPES.has(value);
}

function parseStats(value: unknown): LifeStats | null {
  if (!isRecord(value)) return null;
  const { fullness, energy, mood } = value;
  if (!isStat(fullness) || !isStat(energy) || !isStat(mood)) return null;
  return { fullness, energy, mood };
}

function parseDelta(value: unknown): LifeStats | null {
  if (!isRecord(value)) return null;
  const { fullness, energy, mood } = value;
  if (!isFiniteNumber(fullness) || !isFiniteNumber(energy) || !isFiniteNumber(mood)) return null;
  return { fullness, energy, mood };
}

function parseActivity(value: unknown): LifeActivity | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id) return null;
  if (!isActivityId(value.kind)) return null;
  if (!isInteger(value.startedAt, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (!isInteger(value.endsAt, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (value.endsAt <= value.startedAt) return null;
  const statsAtStart = parseStats(value.statsAtStart);
  if (!statsAtStart) return null;
  return {
    id: value.id,
    kind: value.kind,
    startedAt: value.startedAt,
    endsAt: value.endsAt,
    statsAtStart,
  };
}

function parseEvent(value: unknown): LifeEvent | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id) return null;
  if (!isEventType(value.type)) return null;
  if (value.activityId !== null && typeof value.activityId !== 'string') return null;
  if (!isActivityId(value.activity)) return null;
  if (!isInteger(value.atMinute, 0, Number.MAX_SAFE_INTEGER)) return null;

  const event: LifeEvent = {
    id: value.id,
    type: value.type,
    activityId: value.activityId as string | null,
    activity: value.activity,
    atMinute: value.atMinute,
  };
  if (value.startedAtMinute !== undefined) {
    if (!isInteger(value.startedAtMinute, 0, Number.MAX_SAFE_INTEGER)) return null;
    event.startedAtMinute = value.startedAtMinute;
  }
  if (value.endedAtMinute !== undefined) {
    if (!isInteger(value.endedAtMinute, 0, Number.MAX_SAFE_INTEGER)) return null;
    event.endedAtMinute = value.endedAtMinute;
  }
  if (value.delta !== undefined) {
    const delta = parseDelta(value.delta);
    if (!delta) return null;
    event.delta = delta;
  }
  if (value.outcome !== undefined) {
    if (
      value.outcome !== 'accepted' &&
      value.outcome !== 'rejected' &&
      value.outcome !== 'ignored'
    ) {
      return null;
    }
    event.outcome = value.outcome;
  }
  if (value.message !== undefined) {
    if (typeof value.message !== 'string' || value.message.length > 80) return null;
    event.message = value.message;
  }
  return event;
}

function parseState(value: unknown): LifeState | null {
  if (!isRecord(value)) return null;
  if (typeof value.saveId !== 'string' || !value.saveId || value.saveId.length > 64) return null;
  if (!isInteger(value.seed, 0, 0xffffffff)) return null;
  if (!isInteger(value.rngState, 0, 0xffffffff)) return null;
  if (!isInteger(value.minute, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (!isStat(value.fullness) || !isStat(value.energy) || !isStat(value.mood)) return null;

  let activity: LifeActivity | null = null;
  if (value.activity !== null) {
    activity = parseActivity(value.activity);
    if (!activity) return null;
    if (activity.startedAt > value.minute || activity.endsAt <= value.minute) return null;
  }

  let lastFun: ActivityId | null = null;
  if (value.lastFun !== null) {
    if (!isActivityId(value.lastFun)) return null;
    lastFun = value.lastFun;
  }

  if (!isInteger(value.nextActivitySeq, 1, Number.MAX_SAFE_INTEGER)) return null;
  if (!isInteger(value.nextEventSeq, 1, Number.MAX_SAFE_INTEGER)) return null;
  if (!Array.isArray(value.events) || value.events.length > MAX_EVENTS) return null;

  const events: LifeEvent[] = [];
  for (const item of value.events) {
    const event = parseEvent(item);
    if (!event) return null;
    events.push(event);
  }

  return {
    saveId: value.saveId,
    seed: value.seed,
    rngState: value.rngState,
    minute: value.minute,
    fullness: value.fullness,
    energy: value.energy,
    mood: value.mood,
    activity,
    lastFun,
    nextActivitySeq: value.nextActivitySeq,
    nextEventSeq: value.nextEventSeq,
    events,
  };
}

function normalizeName(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_NAME;
  const name = value.trim();
  return name && name.length <= MAX_NAME ? name : DEFAULT_NAME;
}

export function loadLife(): LifeSave | null {
  try {
    const raw = localStorage.getItem(LIFE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!isRecord(data) || data.version !== VERSION) return null;
    const state = parseState(data.state);
    if (!state) return null;
    let aheadMinutes = 0;
    if (data.aheadMinutes !== undefined) {
      if (!isInteger(data.aheadMinutes, 0, Number.MAX_SAFE_INTEGER)) return null;
      aheadMinutes = data.aheadMinutes;
    }
    return { name: normalizeName(data.name), aheadMinutes, state };
  } catch {
    return null;
  }
}

export function saveLife(name: string, state: LifeState, aheadMinutes = 0): void {
  const ahead =
    Number.isFinite(aheadMinutes) && aheadMinutes > 0 ? Math.round(aheadMinutes) : 0;
  try {
    localStorage.setItem(
      LIFE_KEY,
      JSON.stringify({ version: VERSION, name: normalizeName(name), aheadMinutes: ahead, state }),
    );
  } catch {
    // 浏览器禁用存储或额度用完时，生活照常继续，只是不落盘。
  }
}

export function clearLife(): void {
  try {
    localStorage.removeItem(LIFE_KEY);
  } catch {
    // 忽略清理失败。
  }
}