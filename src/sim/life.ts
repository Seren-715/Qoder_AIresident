import {
  ACTIVITIES,
  AVAILABLE,
  FORCE,
  HOURLY,
  LOW_STAT_THRESHOLD,
  MOOD,
  MOOD_TARGET,
  NIGHT,
  REJECT_REASONS,
  START,
  TRAIT,
  type ActivityId,
} from '../data/life';
import { nextRandom } from './rng';
import { isNight } from './time';

const MAX_EVENTS = 200;

export interface LifeStats {
  fullness: number;
  energy: number;
  mood: number;
}

export interface LifeActivity {
  id: string;
  kind: ActivityId;
  startedAt: number;
  endsAt: number;
  statsAtStart: LifeStats;
}

export type LifeEventType = 'start' | 'end' | 'interrupt' | 'interact';

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  activityId: string | null;
  activity: ActivityId;
  atMinute: number;
  startedAtMinute?: number;
  endedAtMinute?: number;
  delta?: LifeStats;
}

export interface LifeState {
  saveId: string;
  seed: number;
  rngState: number;
  minute: number;
  fullness: number;
  energy: number;
  mood: number;
  activity: LifeActivity | null;
  lastFun: ActivityId | null;
  nextActivitySeq: number;
  nextEventSeq: number;
  events: LifeEvent[];
}

export interface InitialLifeOptions {
  seed: number;
  atMinute: number;
  fullness?: number;
  energy?: number;
  mood?: number;
  saveId?: string;
}

export interface SuggestionResult {
  state: LifeState;
  accepted: boolean;
  message: string | null;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function statsOf(state: LifeState): LifeStats {
  return { fullness: state.fullness, energy: state.energy, mood: state.mood };
}

function cloneState(state: LifeState): LifeState {
  return {
    ...state,
    activity: state.activity
      ? { ...state.activity, statsAtStart: { ...state.activity.statsAtStart } }
      : null,
    events: state.events.slice(),
  };
}

function random(draft: LifeState): number {
  const step = nextRandom(draft.rngState);
  draft.rngState = step.state;
  return step.value;
}

function randomInt(draft: LifeState, min: number, max: number): number {
  return min + Math.floor(random(draft) * (max - min + 1));
}

function pushEvent(draft: LifeState, event: Omit<LifeEvent, 'id'>): void {
  draft.events.push({ ...event, id: `${draft.saveId}-e${draft.nextEventSeq++}` });
  if (draft.events.length > MAX_EVENTS) {
    draft.events.splice(0, draft.events.length - MAX_EVENTS);
  }
}

function isAvailable(kind: ActivityId, state: LifeState, atMinute: number): boolean {
  switch (kind) {
    case 'sleep':
      return state.energy < AVAILABLE.sleepEnergyBelow || isNight(atMinute);
    case 'eat':
      return state.fullness < AVAILABLE.eatFullnessBelow;
    case 'read':
      return state.energy >= AVAILABLE.readEnergyAtLeast;
    case 'code':
      return state.energy >= AVAILABLE.codeEnergyAtLeast;
    case 'play':
      return state.energy >= AVAILABLE.playEnergyAtLeast;
    case 'gaze':
      return true;
  }
}

function needScore(kind: ActivityId, state: LifeState, atMinute: number): number {
  const need = ACTIVITIES[kind].need;
  if (need === 'fullness') return 100 - state.fullness;
  if (need === 'energy') {
    return 100 - state.energy + (isNight(atMinute) ? NIGHT.sleepScoreBonus : 0);
  }
  return 100 - state.mood + 20;
}

function chooseActivity(draft: LifeState, atMinute: number): ActivityId {
  if (draft.fullness < FORCE.eatBelow) return 'eat';
  if (draft.energy < FORCE.sleepBelow) return 'sleep';
  if (isNight(atMinute) && draft.energy < NIGHT.sleepBelowEnergy) return 'sleep';

  const ids = Object.keys(ACTIVITIES) as ActivityId[];
  const available = ids.filter((id) => isAvailable(id, draft, atMinute));
  const funCount = available.filter((id) => ACTIVITIES[id].entertainment).length;
  const pool =
    funCount > 1
      ? available.filter((id) => !(ACTIVITIES[id].entertainment && id === draft.lastFun))
      : available;

  let best = pool[0];
  let bestScore = -Infinity;
  for (const id of pool) {
    const score = needScore(id, draft, atMinute) * TRAIT[id] * (0.8 + random(draft) * 0.4);
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

function startActivity(
  draft: LifeState,
  kind: ActivityId,
  atMinute: number,
  durationMinutes: number,
): void {
  const id = `${draft.saveId}-a${draft.nextActivitySeq++}`;
  draft.activity = {
    id,
    kind,
    startedAt: atMinute,
    endsAt: atMinute + durationMinutes,
    statsAtStart: statsOf(draft),
  };
  if (ACTIVITIES[kind].entertainment) draft.lastFun = kind;
  pushEvent(draft, {
    type: 'start',
    activityId: id,
    activity: kind,
    atMinute,
  });
}

function startNextActivity(draft: LifeState, atMinute: number): void {
  const kind = chooseActivity(draft, atMinute);
  const def = ACTIVITIES[kind];
  startActivity(draft, kind, atMinute, randomInt(draft, def.minMinutes, def.maxMinutes));
}

function moodTarget(draft: LifeState): number {
  let target = draft.activity ? MOOD_TARGET[draft.activity.kind] : MOOD.idleTarget;
  const hungry = draft.fullness < LOW_STAT_THRESHOLD;
  const tired = draft.energy < LOW_STAT_THRESHOLD;
  if (hungry && tired) target = Math.min(target, MOOD.bothLowTarget);
  else if (hungry || tired) target = Math.min(target, MOOD.lowTarget);
  if (draft.fullness < FORCE.eatBelow || draft.energy < FORCE.sleepBelow) {
    target = Math.min(target, MOOD.criticalTarget);
  }
  return target;
}

function applyMinute(draft: LifeState): void {
  const activity = draft.activity;
  if (!activity) return;
  const def = ACTIVITIES[activity.kind];
  const duration = Math.max(1, activity.endsAt - activity.startedAt);

  draft.fullness += HOURLY.fullness / 60;
  if (activity.kind !== 'sleep') draft.energy += HOURLY.energy / 60;

  draft.fullness += (def.effects.fullness ?? 0) / duration;
  draft.energy += (def.effects.energy ?? 0) / duration;
  if (def.energyToFull) {
    draft.energy += Math.max(0, 100 - activity.statsAtStart.energy) / duration;
  }

  draft.fullness = clamp(draft.fullness);
  draft.energy = clamp(draft.energy);

  const target = moodTarget(draft);
  const step = MOOD.pullPerHour / 60;
  if (draft.mood < target) draft.mood = Math.min(target, draft.mood + step);
  else if (draft.mood > target) draft.mood = Math.max(target, draft.mood - step);
  draft.mood = clamp(draft.mood);
}

function closeActivity(
  draft: LifeState,
  type: 'end' | 'interrupt',
  atMinute: number,
): void {
  const activity = draft.activity;
  if (!activity) return;
  const now = statsOf(draft);
  pushEvent(draft, {
    type,
    activityId: activity.id,
    activity: activity.kind,
    atMinute,
    startedAtMinute: activity.startedAt,
    endedAtMinute: atMinute,
    delta: {
      fullness: round1(now.fullness - activity.statsAtStart.fullness),
      energy: round1(now.energy - activity.statsAtStart.energy),
      mood: round1(now.mood - activity.statsAtStart.mood),
    },
  });
  draft.activity = null;
}

export function createInitialLife(options: InitialLifeOptions): LifeState {
  const draft: LifeState = {
    saveId: options.saveId ?? 'life',
    seed: options.seed >>> 0,
    rngState: options.seed >>> 0,
    minute: options.atMinute,
    fullness: clamp(options.fullness ?? START.fullness),
    energy: clamp(options.energy ?? START.energy),
    mood: clamp(options.mood ?? START.mood),
    activity: null,
    lastFun: null,
    nextActivitySeq: 1,
    nextEventSeq: 1,
    events: [],
  };
  startNextActivity(draft, draft.minute);
  return draft;
}

export function advance(state: LifeState, toMinute: number): LifeState {
  if (!Number.isFinite(toMinute) || toMinute <= state.minute) return state;

  const draft = cloneState(state);
  if (!draft.activity) startNextActivity(draft, draft.minute);

  while (draft.minute < toMinute) {
    if (!draft.activity) startNextActivity(draft, draft.minute);
    const activity = draft.activity!;
    const stepEnd = Math.min(activity.endsAt, toMinute);
    for (let m = draft.minute; m < stepEnd; m++) applyMinute(draft);
    draft.minute = stepEnd;

    if (draft.minute >= activity.endsAt) {
      closeActivity(draft, 'end', draft.minute);
      startNextActivity(draft, draft.minute);
    }
  }
  return draft;
}

export function suggestActivity(
  state: LifeState,
  target: ActivityId,
  atMinute: number,
): SuggestionResult {
  const draft = cloneState(advance(state, atMinute));
  pushEvent(draft, {
    type: 'interact',
    activityId: draft.activity?.id ?? null,
    activity: target,
    atMinute,
  });

  if (draft.activity?.kind === target) {
    return { state: draft, accepted: false, message: null };
  }

  if (draft.activity?.kind === 'sleep') {
    if (draft.energy < NIGHT.wakeEnergy) {
      return { state: draft, accepted: false, message: '呼……' };
    }
    if (!isAvailable(target, draft, atMinute)) {
      return { state: draft, accepted: false, message: REJECT_REASONS[target] };
    }
    closeActivity(draft, 'interrupt', atMinute);
    const def = ACTIVITIES[target];
    const middle = Math.floor((def.minMinutes + def.maxMinutes) / 2);
    startActivity(draft, target, atMinute, randomInt(draft, def.minMinutes, middle));
    return { state: draft, accepted: true, message: null };
  }

  if (!isAvailable(target, draft, atMinute)) {
    return { state: draft, accepted: false, message: REJECT_REASONS[target] };
  }

  if (draft.activity) closeActivity(draft, 'interrupt', atMinute);
  const def = ACTIVITIES[target];
  const middle = Math.floor((def.minMinutes + def.maxMinutes) / 2);
  startActivity(draft, target, atMinute, randomInt(draft, def.minMinutes, middle));
  return { state: draft, accepted: true, message: null };
}
