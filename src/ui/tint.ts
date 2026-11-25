import { DAY_MINUTES, minuteOfDay } from '../sim/time';

export interface SceneTint {
  r: number;
  g: number;
  b: number;
  opacity: number;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const NIGHT: Rgb = { r: 26, g: 42, b: 92 };
const WARM: Rgb = { r: 255, g: 150, b: 70 };
const CLEAR: Rgb = { r: 255, g: 190, b: 120 };

interface Frame {
  minute: number;
  color: Rgb;
  opacity: number;
}

/** 22:00–04:00 深蓝；05:00–07:00、17:00–19:00 暖橙；其余白天/过渡。 */
const FRAMES: Frame[] = [
  { minute: 0, color: NIGHT, opacity: 0.35 },
  { minute: 4 * 60, color: NIGHT, opacity: 0.35 },
  { minute: 5 * 60, color: WARM, opacity: 0.12 },
  { minute: 7 * 60, color: WARM, opacity: 0.12 },
  { minute: 8 * 60, color: CLEAR, opacity: 0 },
  { minute: 16 * 60, color: CLEAR, opacity: 0 },
  { minute: 17 * 60, color: WARM, opacity: 0.12 },
  { minute: 19 * 60, color: WARM, opacity: 0.12 },
  { minute: 20 * 60, color: CLEAR, opacity: 0 },
  { minute: 22 * 60, color: NIGHT, opacity: 0.35 },
  { minute: DAY_MINUTES, color: NIGHT, opacity: 0.35 },
];

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** 按游戏分钟给出场景色调，关键帧之间线性插值。 */
export function tintForMinute(minute: number): SceneTint {
  const m = minuteOfDay(minute);
  for (let i = 0; i < FRAMES.length - 1; i++) {
    const from = FRAMES[i];
    const to = FRAMES[i + 1];
    if (m < from.minute || m > to.minute) continue;
    const span = to.minute - from.minute;
    const t = span === 0 ? 0 : (m - from.minute) / span;
    return {
      r: Math.round(from.color.r + (to.color.r - from.color.r) * t),
      g: Math.round(from.color.g + (to.color.g - from.color.g) * t),
      b: Math.round(from.color.b + (to.color.b - from.color.b) * t),
      opacity: round3(from.opacity + (to.opacity - from.opacity) * t),
    };
  }
  return { ...NIGHT, opacity: 0.35 };
}

export function tintCss(tint: SceneTint): string {
  return `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${tint.opacity})`;
}