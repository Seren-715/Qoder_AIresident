import { ACTIVITIES, type ActivityId } from '../data/life';
import { advance, type LifeEvent, type LifeState } from './life';

export const MAX_CATCH_UP_MINUTES = 7 * 24 * 60;
export const SUMMARY_THRESHOLD_MINUTES = 10;

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
  sleep: (count) => `睡了 ${count} 次觉`,
  eat: (count) => `吃了 ${count} 次饭`,
  read: (count) => `看了 ${count} 会儿书`,
  code: (count) => `写了 ${count} 会儿代码`,
  play: (count) => `打了 ${count} 次滚`,
  gaze: (count) => `发了 ${count} 次呆`,
};

const PHRASE_ORDER: ActivityId[] = ['sleep', 'eat', 'read', 'code', 'play', 'gaze'];

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
    ? { ...saved, minute: fromMinute, activity: null, events: [] }
    : saved;

  const state = advance(base, nowMinute);
  const events = state.events.filter(
    (event) => event.atMinute >= fromMinute && event.atMinute <= nowMinute,
  );

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
  for (const event of result.events) {
    if (event.type !== 'end') continue;
    counts.set(event.activity, (counts.get(event.activity) ?? 0) + 1);
  }

  const parts: string[] = [];
  for (const kind of PHRASE_ORDER) {
    const count = counts.get(kind) ?? 0;
    if (count > 0) parts.push(PHRASES[kind](count));
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