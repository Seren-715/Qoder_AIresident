import type { SceneId } from './scene';

export type WindKind = 'plant' | 'hang' | 'cloud';

export interface WindRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: WindKind;
  delay: number;
  dur: number;
  amp?: number;
}

export const WIND: Record<SceneId, WindRegion[]> = {
  exterior: [
    { x: 72, y: 5, w: 16, h: 12, kind: 'cloud', delay: 0, dur: 52 },
    { x: 67, y: 17, w: 11, h: 10, kind: 'cloud', delay: -18, dur: 64 },
    { x: 88, y: 14, w: 11, h: 10, kind: 'cloud', delay: -30, dur: 46 },
    { x: 15, y: 0, w: 56, h: 32, kind: 'plant', delay: 0, dur: 7.5, amp: 0.45 },
    { x: 0, y: 7, w: 16, h: 31, kind: 'plant', delay: -2.5, dur: 8.5, amp: 0.6 },
    { x: 52, y: 26, w: 36, h: 16, kind: 'plant', delay: -4, dur: 9, amp: 0.6 },
    { x: 3, y: 49, w: 11, h: 8, kind: 'plant', delay: -1, dur: 5.5 },
    { x: 13, y: 48, w: 11, h: 9, kind: 'plant', delay: -2.2, dur: 6 },
    { x: 3, y: 57, w: 12, h: 9, kind: 'plant', delay: -3.4, dur: 5.8 },
    { x: 50, y: 48, w: 7, h: 12, kind: 'plant', delay: -1.6, dur: 6.4 },
    { x: 0, y: 75, w: 18, h: 25, kind: 'plant', delay: -0.8, dur: 6.8 },
    { x: 28, y: 90, w: 14, h: 10, kind: 'plant', delay: -3, dur: 6.2 },
    { x: 86, y: 55, w: 14, h: 25, kind: 'plant', delay: -2, dur: 7.2 },
    { x: 78, y: 88, w: 22, h: 12, kind: 'plant', delay: -4.5, dur: 6.6 },
  ],
  interior: [
    { x: 45, y: 3, w: 6, h: 20, kind: 'hang', delay: 0, dur: 6.5 },
    { x: 59, y: 3, w: 6, h: 19, kind: 'hang', delay: -2.8, dur: 7.2 },
    { x: 2, y: 21, w: 7, h: 12, kind: 'plant', delay: -1.2, dur: 6.8 },
    { x: 10, y: 38, w: 7, h: 12, kind: 'plant', delay: -3.1, dur: 7.4 },
    { x: 37, y: 36, w: 5, h: 12, kind: 'plant', delay: -2, dur: 6.2 },
    { x: 26, y: 13, w: 6, h: 13, kind: 'plant', delay: -4.2, dur: 8 },
  ],
};

export function windMask(r: WindRegion): string {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  return `radial-gradient(ellipse ${r.w / 2}% ${r.h / 2}% at ${cx}% ${cy}%, #000 72%, transparent 94%)`;
}

export function windOrigin(r: WindRegion): { ox: number; oy: number } {
  return { ox: r.x + r.w / 2, oy: r.kind === 'hang' ? r.y : r.y + r.h };
}