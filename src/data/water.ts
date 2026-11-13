import type { SceneId } from './scene';

/** 水域矩形（% 相对场景宽高）。 */
export interface WaterRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WaveParams {
  wavelength: number;
  period: number;
  weight?: number;
  phase?: number;
}

export interface RingParams {
  every: number;
  life: number;
  alpha: number;
  grow: number;
  flatten: number;
  lineWidth: number;
}

/** 每帧水面画布需要的全部参数；数值都按 1600×900 参考像素给出。 */
export interface WaterSpec {
  mask: string;
  regions: WaterRegion[];
  ampTop: number;
  ampBottom: number;
  strip: number;
  wave1: WaveParams;
  wave2: WaveParams;
  glints: number;
  glintLife: number;
  glintAlpha: number;
  glintColor: string;
  glintLengthTop: number;
  glintLengthBottom: number;
  glintThicknessTop: number;
  glintThicknessBottom: number;
  rings?: RingParams;
}

export const SCENE_REF_W = 1600;
export const SCENE_REF_H = 900;

export const WATER: Record<SceneId, WaterSpec> = {
  interior: {
    mask: 'art/props/interior/water-mask.png',
    regions: [
      { left: 0.0, top: 76.33, width: 21.19, height: 21.33 },
      { left: 86.56, top: 52.0, width: 11.88, height: 23.22 },
    ],
    ampTop: 0.5,
    ampBottom: 1.4,
    strip: 2,
    wave1: { wavelength: 46, period: 3.8 },
    wave2: { wavelength: 17, period: 2.3, weight: 0.45, phase: 0.3 },
    glints: 9,
    glintLife: 3.2,
    glintAlpha: 0.5,
    glintColor: '#f4fbf6',
    glintLengthTop: 9,
    glintLengthBottom: 20,
    glintThicknessTop: 1.2,
    glintThicknessBottom: 2.4,
  },
  exterior: {
    mask: 'art/props/exterior/water-mask.png',
    regions: [{ left: 32.75, top: 71.56, width: 67.25, height: 28.44 }],
    ampTop: 0.5,
    ampBottom: 2.2,
    strip: 2,
    wave1: { wavelength: 46, period: 3.8 },
    wave2: { wavelength: 17, period: 2.3, weight: 0.45, phase: 0.3 },
    glints: 26,
    glintLife: 3.2,
    glintAlpha: 0.5,
    glintColor: '#f4fbf6',
    glintLengthTop: 9,
    glintLengthBottom: 30,
    glintThicknessTop: 1.2,
    glintThicknessBottom: 2.4,
    rings: { every: 7, life: 3.2, alpha: 0.35, grow: 26, flatten: 0.3, lineWidth: 1.6 },
  },
};

/** 0（区域顶）→ 1（区域底）的线性深度。 */
export function regionDepth(yRef: number, region: WaterRegion): number {
  const topRef = (region.top / 100) * SCENE_REF_H;
  const bottomRef = ((region.top + region.height) / 100) * SCENE_REF_H;
  if (bottomRef === topRef) return 0;
  return Math.min(1, Math.max(0, (yRef - topRef) / (bottomRef - topRef)));
}

/** 水域横条在 yRef 处、时间 t 秒时的水平偏移（参考像素）。 */
export function waveOffset(yRef: number, t: number, region: WaterRegion, spec: WaterSpec): number {
  const amp = spec.ampTop + (spec.ampBottom - spec.ampTop) * regionDepth(yRef, region);
  const w1 = spec.wave1;
  const w2 = spec.wave2;
  const a1 = Math.sin(2 * Math.PI * (yRef / w1.wavelength - t / w1.period));
  const a2 = Math.sin(2 * Math.PI * (yRef / w2.wavelength + t / w2.period + (w2.phase ?? 0)));
  return amp * (a1 + (w2.weight ?? 0) * a2);
}

/** [top, bottom] 端点按深度线性插值。 */
export function interpByDepth(top: number, bottom: number, depth: number): number {
  return top + (bottom - top) * depth;
}

/** sin² 淡入淡出包络（0→1→0）。 */
export function glintEnvelope(age: number, life: number): number {
  if (life <= 0 || age < 0 || age > life) return 0;
  const s = Math.sin((Math.PI * age) / life);
  return s * s;
}

/** 荷叶扁椭圆涟漪：给定生命比例（0..1），返回 {rx, alpha}。 */
export function ringShape(depth: number, grow: number, alpha: number): { radius: number; alpha: number } {
  const d = Math.min(1, Math.max(0, depth));
  return { radius: grow * d, alpha: alpha * (1 - d) };
}
