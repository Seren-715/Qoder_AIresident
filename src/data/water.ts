import type { SceneId } from './scene';

export interface Ripple {
  x: number;
  y: number;
  delay: number;
  width: number;
}

export interface WaterRegion {
  polygon: [number, number][];
  ripples: Ripple[];
}

export const WATER: Record<SceneId, WaterRegion[]> = {
  interior: [
    {
      polygon: [
        [0, 76], [6, 77], [11, 80], [16, 85], [20, 90], [21.5, 95], [21, 100], [0, 100],
      ],
      ripples: [
        { x: 10, y: 88, delay: 0, width: 8 },
        { x: 16, y: 94, delay: 1.6, width: 7 },
        { x: 5, y: 82, delay: 3.1, width: 6 },
      ],
    },
    {
      polygon: [
        [87, 55], [91, 50], [97, 49], [100, 51], [100, 65], [92, 65], [91, 70], [89, 74],
        [87, 72], [86.5, 62],
      ],
      ripples: [
        { x: 93, y: 57, delay: 0.8, width: 6 },
        { x: 97, y: 62, delay: 2.4, width: 5 },
      ],
    },
  ],
  exterior: [
    {
      polygon: [
        [33, 91], [36, 84], [42, 78], [50, 73], [56, 69.5], [57, 74], [60, 82], [66, 82],
        [69, 74], [69, 68.5], [74, 69.5], [82, 73], [88, 78], [94, 81], [98, 83], [96, 85],
        [90, 88], [84, 92], [78, 96], [70, 99], [60, 100], [40, 100], [34, 97],
      ],
      ripples: [
        { x: 45, y: 86, delay: 0, width: 10 },
        { x: 60, y: 90, delay: 1.2, width: 11 },
        { x: 75, y: 84, delay: 2.3, width: 9 },
        { x: 88, y: 86, delay: 3.4, width: 8 },
        { x: 52, y: 78, delay: 4.1, width: 7 },
      ],
    },
  ],
};

export function clipPath(region: WaterRegion): string {
  return `polygon(${region.polygon.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;
}