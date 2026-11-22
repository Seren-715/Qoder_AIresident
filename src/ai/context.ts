import { ACTIVITIES, type ActivityId } from '../data/life';
import type { LifeEvent, LifeState } from '../sim/life';
import { DAY_MINUTES, formatGameTime, minuteOfDay } from '../sim/time';

export interface ChatContext {
  name: string;
  now: {
    atMinute: number;
    timeLabel: string;
    activity: string;
    fullness: number;
    energy: number;
    mood: number;
  };
  awaySummary?: string;
  recent: string[];
}

export const MAX_RECENT_EVENTS = 8;
export const MAX_RECENT_CHARS = 600;
export const MAX_AWAY_SUMMARY = 120;
const MAX_NAME = 20;
const MAX_LINE = 80;

const DURATION_PHRASES: Record<ActivityId, (duration: string) => string> = {
  sleep: (duration) => `睡了 ${duration}`,
  eat: (duration) => `吃了 ${duration}饭`,
  read: (duration) => `看了 ${duration}书`,
  code: (duration) => `写了 ${duration}代码`,
  play: (duration) => `打了 ${duration}滚`,
  gaze: (duration) => `发了 ${duration}呆`,
};

function cleanName(name: string): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  return (clean || 'Qoduck').slice(0, MAX_NAME);
}

function clockOf(minute: number): string {
  const m = minuteOfDay(minute);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function durationText(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

function eventTime(eventMinute: number, currentMinute: number): string {
  const eventDay = Math.floor(eventMinute / DAY_MINUTES);
  const today = Math.floor(currentMinute / DAY_MINUTES);
  if (eventDay === today) return clockOf(eventMinute);
  if (eventDay === today - 1) return `昨天 ${clockOf(eventMinute)}`;
  return formatGameTime(eventMinute);
}

function describeInteract(event: LifeEvent, currentMinute: number): string {
  const time = eventTime(event.atMinute, currentMinute);
  const label = ACTIVITIES[event.activity].label;
  if (event.outcome === 'rejected') {
    const reason =
      event.message === '呼……' ? '我睡得正香，没听见' : `我${event.message ?? '没去'}`;
    return `${time} 你让我去${label}，${reason}`;
  }
  if (event.outcome === 'ignored') {
    return `${time} 你让我去${label}，我正在做呢`;
  }
  return `${time} 你让我去${label}`;
}

function describeEvent(event: LifeEvent, currentMinute: number): string {
  if (event.type === 'interact') return describeInteract(event, currentMinute);

  const time = eventTime(event.atMinute, currentMinute);
  const label = ACTIVITIES[event.activity].label;
  if (event.type === 'interrupt') return `${time} ${label}被打断了`;

  const ended = event.endedAtMinute;
  const started = event.startedAtMinute;
  if (ended === undefined || started === undefined || ended <= started) {
    return `${time} ${label}`;
  }
  return `${time} ${DURATION_PHRASES[event.activity](durationText(ended - started))}`;
}

function recentEvents(events: LifeEvent[], currentMinute: number): string[] {
  const lines: string[] = [];
  let total = 0;
  for (let i = events.length - 1; i >= 0 && lines.length < MAX_RECENT_EVENTS; i--) {
    const event = events[i];
    if (event.type !== 'end' && event.type !== 'interrupt' && event.type !== 'interact') {
      continue;
    }
    const line = describeEvent(event, currentMinute).slice(0, MAX_LINE);
    if (total + line.length > MAX_RECENT_CHARS) break;
    lines.unshift(line);
    total += line.length;
  }
  return lines;
}

export function buildChatContext(
  state: LifeState,
  name: string,
  awaySummary?: string | null,
): ChatContext {
  const summary = awaySummary?.replace(/\s+/g, ' ').trim().slice(0, MAX_AWAY_SUMMARY);
  return {
    name: cleanName(name),
    now: {
      atMinute: state.minute,
      timeLabel: formatGameTime(state.minute),
      activity: state.activity ? ACTIVITIES[state.activity.kind].label : '休息',
      fullness: Math.round(state.fullness),
      energy: Math.round(state.energy),
      mood: Math.round(state.mood),
    },
    ...(summary ? { awaySummary: summary } : {}),
    recent: recentEvents(state.events, state.minute),
  };
}