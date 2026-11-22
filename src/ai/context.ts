import { ACTIVITIES, type ActivityId } from '../data/life';
import type { LifeEvent, LifeState } from '../sim/life';
import { formatGameTime, minuteOfDay } from '../sim/time';

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
  recent: string[];
}

export const MAX_RECENT_EVENTS = 8;
export const MAX_RECENT_CHARS = 600;
const MAX_NAME = 20;
const MAX_LINE = 80;

const PHRASES: Record<ActivityId, (minutes: number) => string> = {
  sleep: (minutes) => `睡了 ${minutes} 分钟`,
  eat: (minutes) => `吃了 ${minutes} 分钟饭`,
  read: (minutes) => `看了 ${minutes} 分钟书`,
  code: (minutes) => `写了 ${minutes} 分钟代码`,
  play: (minutes) => `打了 ${minutes} 分钟滚`,
  gaze: (minutes) => `发了 ${minutes} 分钟呆`,
};

function cleanName(name: string): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  return (clean || 'Qoduck').slice(0, MAX_NAME);
}

function clockOf(minute: number): string {
  const m = minuteOfDay(minute);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function describeEvent(event: LifeEvent): string {
  const time = clockOf(event.atMinute);
  const label = ACTIVITIES[event.activity].label;
  if (event.type === 'interrupt') return `${time} ${label}被打断了`;

  const ended = event.endedAtMinute;
  const started = event.startedAtMinute;
  if (ended === undefined || started === undefined || ended <= started) {
    return `${time} ${label}`;
  }
  return `${time} ${PHRASES[event.activity](ended - started)}`;
}

function recentEvents(events: LifeEvent[]): string[] {
  const lines: string[] = [];
  let total = 0;
  for (let i = events.length - 1; i >= 0 && lines.length < MAX_RECENT_EVENTS; i--) {
    const event = events[i];
    if (event.type !== 'end' && event.type !== 'interrupt') continue;
    const line = describeEvent(event).slice(0, MAX_LINE);
    if (total + line.length > MAX_RECENT_CHARS) break;
    lines.unshift(line);
    total += line.length;
  }
  return lines;
}

export function buildChatContext(state: LifeState, name: string): ChatContext {
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
    recent: recentEvents(state.events),
  };
}