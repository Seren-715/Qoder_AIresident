import type { FurnitureId } from './scene';

export type StatKey = 'fullness' | 'energy' | 'mood';

export type ActivityId = 'sleep' | 'eat' | 'read' | 'code' | 'gaze' | 'play';

export interface ActivityDef {
  id: ActivityId;
  furniture: FurnitureId;
  label: string;
  minMinutes: number;
  maxMinutes: number;
  effects: Partial<Record<StatKey, number>>;
  energyToFull?: boolean;
  entertainment?: boolean;
  need: StatKey;
}

export const ACTIVITIES: Record<ActivityId, ActivityDef> = {
  sleep: {
    id: 'sleep',
    furniture: 'bed',
    label: '睡觉',
    minMinutes: 120,
    maxMinutes: 480,
    effects: { mood: 5 },
    energyToFull: true,
    need: 'energy',
  },
  eat: {
    id: 'eat',
    furniture: 'bowl',
    label: '吃饭',
    minMinutes: 20,
    maxMinutes: 40,
    effects: { fullness: 50, mood: 5 },
    need: 'fullness',
  },
  read: {
    id: 'read',
    furniture: 'bookshelf',
    label: '看书',
    minMinutes: 40,
    maxMinutes: 90,
    effects: { mood: 10, energy: -5 },
    entertainment: true,
    need: 'mood',
  },
  code: {
    id: 'code',
    furniture: 'desk',
    label: '写代码',
    minMinutes: 40,
    maxMinutes: 120,
    effects: { mood: 8, energy: -10 },
    entertainment: true,
    need: 'mood',
  },
  gaze: {
    id: 'gaze',
    furniture: 'window',
    label: '发呆',
    minMinutes: 15,
    maxMinutes: 40,
    effects: { mood: 6 },
    entertainment: true,
    need: 'mood',
  },
  play: {
    id: 'play',
    furniture: 'rug',
    label: '打滚',
    minMinutes: 15,
    maxMinutes: 30,
    effects: { mood: 12, energy: -8, fullness: -5 },
    entertainment: true,
    need: 'mood',
  },
};

export const START: Record<StatKey, number> = {
  fullness: 70,
  energy: 80,
  mood: 70,
};

export const HOURLY: Record<StatKey, number> = {
  fullness: -6,
  energy: -4,
  mood: -3,
};

export const LOW_STAT_THRESHOLD = 30;

export const NIGHT = {
  startMinute: 23 * 60,
  endMinute: 7 * 60,
  sleepScoreBonus: 40,
  sleepBelowEnergy: 70,
  wakeEnergy: 60,
};

export const FORCE = {
  eatBelow: 20,
  sleepBelow: 10,
};

export const AVAILABLE = {
  sleepEnergyBelow: 40,
  eatFullnessBelow: 70,
  readEnergyAtLeast: 20,
  codeEnergyAtLeast: 30,
  playEnergyAtLeast: 25,
};

export const TRAIT: Record<ActivityId, number> = {
  eat: 1.0,
  read: 1.3,
  code: 1.6,
  gaze: 1.0,
  play: 1.2,
  sleep: 0.9,
};

export const REJECT_REASONS: Record<ActivityId, string> = {
  eat: '肚子还不饿',
  sleep: '现在还不困',
  read: '眼睛有点累了，先歇一会儿',
  code: '太困了，先睡一会儿',
  gaze: '已经在这儿发呆啦',
  play: '没力气打滚了',
};

const FURNITURE_ACTIVITY: Partial<Record<FurnitureId, ActivityId>> = {
  bed: 'sleep',
  bowl: 'eat',
  bookshelf: 'read',
  desk: 'code',
  window: 'gaze',
  rug: 'play',
};

export function activityAtFurniture(id: FurnitureId): ActivityId | null {
  return FURNITURE_ACTIVITY[id] ?? null;
}
