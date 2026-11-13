import type { SceneId } from './scene';

export type PropMotion = 'swing' | 'skew' | 'drift' | 'bob';
export type PropTrigger = 'hover' | 'auto';
export type PropLayer = 'back' | 'front';

export interface PropSpec {
  id: string;
  image: string;
  left: number;
  top: number;
  width: number;
  height: number;
  originX?: number;
  originY?: number;
  motion: PropMotion;
  trigger: PropTrigger;
  period: number;
  layer: PropLayer;
  amplitude?: number;
  travelFrom?: number;
  travelTo?: number;
  delay?: number;
  bobY?: number;
  ripples?: boolean;
}

export interface SceneProps {
  background: string;
  props: PropSpec[];
}

export const PROPS: Record<SceneId, SceneProps> = {
  interior: {
    background: 'art/room-interior-clean.webp',
    props: [
      { id: 'herb', image: 'art/props/interior/herb.png', left: 45.39, top: 3.29, width: 5.2, height: 19.66, originX: 49.4, originY: 0.5, motion: 'swing', trigger: 'hover', period: 1.0, layer: 'back', amplitude: 8 },
      { id: 'lantern', image: 'art/props/interior/lantern.png', left: 53.17, top: 2.98, width: 4.13, height: 19.34, originX: 47.8, originY: 0.5, motion: 'swing', trigger: 'hover', period: 1.25, layer: 'back', amplitude: 6 },
      { id: 'flowers', image: 'art/props/interior/flowers.png', left: 59.45, top: 4.78, width: 5.56, height: 17.75, originX: 49.5, originY: 1.2, motion: 'swing', trigger: 'hover', period: 0.9, layer: 'back', amplitude: 8 },
      { id: 'photo-1', image: 'art/props/interior/photo-1.png', left: 72.25, top: 33.16, width: 4.49, height: 8.29, originX: 54.7, originY: 17.9, motion: 'swing', trigger: 'hover', period: 0.8, layer: 'back', amplitude: 7 },
      { id: 'photo-2', image: 'art/props/interior/photo-2.png', left: 76.79, top: 33.69, width: 3.59, height: 9.25, originX: 48.3, originY: 16.1, motion: 'swing', trigger: 'hover', period: 0.8, layer: 'back', amplitude: 7 },
      { id: 'photo-3', image: 'art/props/interior/photo-3.png', left: 80.38, top: 32.62, width: 4.37, height: 8.61, originX: 43.8, originY: 19.8, motion: 'swing', trigger: 'hover', period: 0.8, layer: 'back', amplitude: 7 },
      { id: 'photo-4', image: 'art/props/interior/photo-4.png', left: 72.79, top: 42.93, width: 4.01, height: 7.97, originX: 56.7, originY: 17.3, motion: 'swing', trigger: 'hover', period: 0.8, layer: 'back', amplitude: 7 },
      { id: 'photo-5', image: 'art/props/interior/photo-5.png', left: 76.79, top: 43.68, width: 3.71, height: 7.86, originX: 50.0, originY: 20.3, motion: 'swing', trigger: 'hover', period: 0.8, layer: 'back', amplitude: 7 },
      { id: 'photo-6', image: 'art/props/interior/photo-6.png', left: 80.5, top: 42.72, width: 4.07, height: 8.08, originX: 42.6, originY: 23.7, motion: 'swing', trigger: 'hover', period: 0.8, layer: 'back', amplitude: 7 },
    ],
  },
  exterior: {
    background: 'art/room-exterior-clean.webp',
    props: [
      { id: 'cloud-a', image: 'art/props/exterior/cloud-a.png', left: 75.0, top: 8.08, width: 11.66, height: 7.76, motion: 'drift', trigger: 'auto', period: 46.9, layer: 'back', delay: -19.1, travelFrom: 57.78, travelTo: 100.0 },
      { id: 'cloud-b', image: 'art/props/exterior/cloud-b.png', left: 69.26, top: 19.87, width: 6.76, height: 4.46, motion: 'drift', trigger: 'auto', period: 69.0, layer: 'back', delay: -25.1, travelFrom: 51.67, travelTo: 100.0 },
      { id: 'cloud-c', image: 'art/props/exterior/cloud-c.png', left: 90.31, top: 16.26, width: 7.24, height: 4.99, motion: 'drift', trigger: 'auto', period: 38.7, layer: 'back', delay: -29.9, travelFrom: 57.42, travelTo: 100.0 },
      { id: 'door-lantern', image: 'art/props/exterior/door-lantern.png', left: 47.85, top: 35.39, width: 2.81, height: 8.08, originX: 46.8, originY: 6.6, motion: 'swing', trigger: 'auto', period: 3.6, layer: 'back', amplitude: 2.5, delay: 0 },
      { id: 'cloth-1', image: 'art/props/exterior/cloth-1.png', left: 54.55, top: 41.66, width: 3.41, height: 7.86, originX: 50.9, originY: 21.6, motion: 'skew', trigger: 'auto', period: 2.8, layer: 'back', amplitude: 3, delay: 0 },
      { id: 'cloth-2', image: 'art/props/exterior/cloth-2.png', left: 58.73, top: 42.08, width: 3.17, height: 7.44, originX: 47.2, originY: 18.6, motion: 'skew', trigger: 'auto', period: 3.3, layer: 'back', amplitude: 3, delay: -1.1 },
      { id: 'plants-left', image: 'art/props/exterior/plants-left.png', left: 0.0, top: 70.67, width: 12.92, height: 29.33, originX: 46.3, originY: 99.6, motion: 'skew', trigger: 'auto', period: 4.3, layer: 'front', amplitude: 1.5, delay: 0 },
      { id: 'daisies', image: 'art/props/exterior/daisies.png', left: 12.44, top: 84.48, width: 8.85, height: 15.52, originX: 48.6, originY: 99.3, motion: 'skew', trigger: 'auto', period: 3.1, layer: 'front', amplitude: 2.2, delay: -0.7 },
      { id: 'flowers-yellow', image: 'art/props/exterior/flowers-yellow.png', left: 22.85, top: 88.74, width: 5.62, height: 9.25, originX: 48.9, originY: 100.0, motion: 'skew', trigger: 'auto', period: 2.7, layer: 'front', amplitude: 2.5, delay: -1.5 },
      { id: 'flowers-white', image: 'art/props/exterior/flowers-white.png', left: 27.99, top: 77.15, width: 4.37, height: 4.99, originX: 50.7, originY: 89.4, motion: 'skew', trigger: 'auto', period: 2.9, layer: 'back', amplitude: 2.5, delay: -0.4 },
      { id: 'path-flowers-white', image: 'art/props/exterior/path-flowers-white.png', left: 88.4, top: 55.79, width: 4.25, height: 4.89, originX: 47.9, originY: 91.3, motion: 'skew', trigger: 'auto', period: 3.0, layer: 'back', amplitude: 2.5, delay: -1.9 },
      { id: 'path-flowers-yellow', image: 'art/props/exterior/path-flowers-yellow.png', left: 84.99, top: 60.36, width: 3.77, height: 4.46, originX: 49.2, originY: 90.5, motion: 'skew', trigger: 'auto', period: 2.6, layer: 'back', amplitude: 2.5, delay: -0.9 },
      { id: 'reeds-right', image: 'art/props/exterior/reeds-right.png', left: 88.04, top: 54.94, width: 11.96, height: 21.57, originX: 51.5, originY: 90.1, motion: 'skew', trigger: 'auto', period: 3.9, layer: 'back', amplitude: 1.8, delay: -1.3 },
      { id: 'reeds-pond', image: 'art/props/exterior/reeds-pond.png', left: 89.17, top: 81.83, width: 10.83, height: 16.26, originX: 60.2, originY: 94.8, motion: 'skew', trigger: 'auto', period: 3.5, layer: 'front', amplitude: 2.0, delay: -2.2 },
      { id: 'lily-1', image: 'art/props/exterior/lily-1.png', left: 74.76, top: 74.18, width: 5.92, height: 3.51, originX: 50, originY: 50, motion: 'bob', trigger: 'auto', period: 3.6, delay: 0, layer: 'back', bobY: 0.14, amplitude: 0.9, ripples: true },
      { id: 'lily-2', image: 'art/props/exterior/lily-2.png', left: 78.11, top: 77.47, width: 5.2, height: 4.04, originX: 50, originY: 50, motion: 'bob', trigger: 'auto', period: 4.3, delay: -1.2, layer: 'back', bobY: 0.14, amplitude: 0.9, ripples: true },
      { id: 'lily-3', image: 'art/props/exterior/lily-3.png', left: 82.54, top: 80.13, width: 4.55, height: 3.51, originX: 50, originY: 50, motion: 'bob', trigger: 'auto', period: 3.9, delay: -2.5, layer: 'back', bobY: 0.14, amplitude: 0.9, ripples: true },
      { id: 'lily-4', image: 'art/props/exterior/lily-4.png', left: 45.33, top: 81.08, width: 4.25, height: 3.08, originX: 50, originY: 50, motion: 'bob', trigger: 'auto', period: 4.6, delay: -0.6, layer: 'back', bobY: 0.14, amplitude: 0.9, ripples: true },
      { id: 'lily-5', image: 'art/props/exterior/lily-5.png', left: 40.61, top: 81.51, width: 7.89, height: 6.38, originX: 50, originY: 50, motion: 'bob', trigger: 'auto', period: 4.1, delay: -3.1, layer: 'back', bobY: 0.14, amplitude: 0.9, ripples: true },
      { id: 'lily-6', image: 'art/props/exterior/lily-6.png', left: 49.34, top: 86.4, width: 3.83, height: 2.87, originX: 50, originY: 50, motion: 'bob', trigger: 'auto', period: 3.4, delay: -1.9, layer: 'back', bobY: 0.14, amplitude: 0.9, ripples: true },
    ],
  },
};

const DECAY_SWING_LENGTH = 2600;
const DECAY_TAU = 0.64;

export function swingAngle(t: number, period: number, amplitude: number): number {
  return amplitude * Math.exp(-t / DECAY_TAU) * Math.sin((2 * Math.PI * t) / period);
}

export function swingKeyframes(period: number, amplitude: number): Keyframe[] {
  const steps = 65;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * DECAY_SWING_LENGTH;
    frames.push({
      transform: `rotate(${swingAngle(t / 1000, period, amplitude).toFixed(3)}deg)`,
      offset: i / steps,
    });
  }
  return frames;
}

export const SWING_DURATION_MS = DECAY_SWING_LENGTH;