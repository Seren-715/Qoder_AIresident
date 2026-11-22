import { ACTIVITIES, type ActivityId } from '../data/life';
import { DESTINATIONS } from '../data/travel';
import { advance, type LifeEvent, type LifeState } from './life';

export const MAX_CATCH_UP_MINUTES = 7 * 24 * 60;
export const SUMMARY_THRESHOLD_MINUTES = 10;

export function catchUpTarget(
  savedMinute: number,
  aheadMinutes: number,
  realNowMinute: number,
): number {
  const ahead = Number.isFinite(aheadMinutes) ? Math.max(0, Math.floor(aheadMinutes)) : 0;
  return Math.max(savedMinute, realNowMinute + ahead);
}

export interface CatchUpResult {
  state: LifeState;
  fromMinute: number;
  toMinute: number;
  minutes: number;
  capped: boolean;
  events: LifeEvent[];
}

export interface AwaySummary {
  minutes: number;
  capped: boolean;
  body: string;
}

const PHRASES: Record<ActivityId, (count: number) => string> = {
  sleep: (count) => (count === 1 ? '睡了一觉' : `睡了 ${count} 次觉`),
  eat: (count) => `吃了 ${count} 次饭`,
  read: (count) => (count === 1 ? '看了一会儿书' : `看了 ${count} 次书`),
  code: (count) => (count === 1 ? '写了一会儿代码' : `写了 ${count} 次代码`),
  play: (count) => (count === 1 ? '打了一会儿滚' : `打了 ${count} 次滚`),
  gaze: (count) => (count === 1 ? '发了一会儿呆' : `发了 ${count} 次呆`),
  travel: (count) => (count === 1 ? '出了一趟远门' : `出了 ${count} 趟远门`),
};

const PHRASE_ORDER: ActivityId[] = ['sleep', 'eat', 'read', 'code', 'play', 'gaze', 'travel'];

function eventSeq(id: string, saveId: string): number | null {
  const prefix = `${saveId}-e`;
  if (!id.startsWith(prefix)) return null;
  const seq = Number(id.slice(prefix.length));
  return Number.isInteger(seq) ? seq : null;
}

function formatDuration(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  if (total < 60) return `${total} 分钟`;
  if (total < 24 * 60) {
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    return rest >= 10 ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
  }
  return `${Math.floor(total / (24 * 60))} 天`;
}

export function catchUpLife(saved: LifeState, nowMinute: number): CatchUpResult {
  if (!Number.isFinite(nowMinute) || nowMinute <= saved.minute) {
    return {
      state: saved,
      fromMinute: saved.minute,
      toMinute: saved.minute,
      minutes: 0,
      capped: false,
      events: [],
    };
  }

  const capped = nowMinute - saved.minute > MAX_CATCH_UP_MINUTES;
  const fromMinute = capped ? nowMinute - MAX_CATCH_UP_MINUTES : saved.minute;
  const base: LifeState = capped
    ? { ...saved, minute: fromMinute, activity: null }
    : saved;

  const state = advance(base, nowMinute);
  const events = state.events.filter((event) => {
    const seq = eventSeq(event.id, saved.saveId);
    return seq !== null && seq >= saved.nextEventSeq;
  });

  return {
    state,
    fromMinute,
    toMinute: nowMinute,
    minutes: nowMinute - fromMinute,
    capped,
    events,
  };
}

export function summarizeAway(name: string, result: CatchUpResult): AwaySummary | null {
  if (result.minutes <= SUMMARY_THRESHOLD_MINUTES) return null;

  const counts = new Map<ActivityId, number>();
  const travelNames: string[] = [];
  for (const event of result.events) {
    if (event.type !== 'end') continue;
    counts.set(event.activity, (counts.get(event.activity) ?? 0) + 1);
    if (event.activity === 'travel' && event.destinationId) {
      const destination = DESTINATIONS.find((d) => d.id === event.destinationId);
      if (destination && !travelNames.includes(destination.name)) {
        travelNames.push(destination.name);
      }
    }
  }

  const parts: string[] = [];
  for (const kind of PHRASE_ORDER) {
    const count = counts.get(kind) ?? 0;
    if (count <= 0) continue;
    if (kind === 'travel' && travelNames.length > 0) {
      parts.push(
        travelNames.length === 1
          ? `还去了一趟${travelNames[0]}，带回一张明信片`
          : `还去了${travelNames.join('、')}，带回 ${travelNames.length} 张明信片`,
      );
      continue;
    }
    parts.push(PHRASES[kind](count));
  }

  const duration = formatDuration(result.minutes);
  const prefix = result.capped
    ? `你不在的这段时间里（只补了最近 ${duration}）`
    : `你不在的 ${duration}里`;
  const who = name.trim() || '小黄鸭';
  const gap = /[A-Za-z0-9]$/.test(who) ? ' ' : '';
  const current = result.state.activity
    ? `现在它在${ACTIVITIES[result.state.activity.kind].label}。`
    : '现在它在家里待着。';
  const body =
    parts.length > 0
      ? `${prefix}，${who}${gap}${parts.join('，')}。${current}`
      : `${prefix}，${who}${gap}安安静静地待着。${current}`;

  return { minutes: result.minutes, capped: result.capped, body };
}