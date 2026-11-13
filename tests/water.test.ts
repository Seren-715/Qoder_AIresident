import { describe, expect, it } from 'vitest';
import {
  SCENE_REF_H,
  SCENE_REF_W,
  WATER,
  glintEnvelope,
  interpByDepth,
  regionDepth,
  ringShape,
  waveOffset,
} from '../src/data/water';

function regionTopRef(top: number): number {
  return (top / 100) * SCENE_REF_H;
}

describe('水域参数', () => {
  it('每个场景都有遮罩和至少一块矩形水域', () => {
    for (const spec of Object.values(WATER)) {
      expect(spec.mask).toMatch(/^art\/props\/(interior|exterior)\/water-mask\.png$/);
      expect(spec.regions.length).toBeGreaterThan(0);
      for (const r of spec.regions) {
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.top).toBeGreaterThanOrEqual(0);
        expect(r.left + r.width).toBeLessThanOrEqual(100);
        expect(r.top + r.height).toBeLessThanOrEqual(100);
        expect(r.width).toBeGreaterThan(0);
        expect(r.height).toBeGreaterThan(0);
      }
    }
  });

  it('内外景水面参数：振幅上限、条纹 2、双层波', () => {
    expect(WATER.exterior.ampBottom).toBe(2.2);
    expect(WATER.interior.ampBottom).toBe(1.4);
    for (const spec of Object.values(WATER)) {
      expect(spec.ampTop).toBe(0.5);
      expect(spec.strip).toBe(2);
      expect(spec.wave1).toEqual({ wavelength: 46, period: 3.8 });
      expect(spec.wave2).toMatchObject({ wavelength: 17, period: 2.3, weight: 0.45 });
      expect(spec.glintColor).toBe('#f4fbf6');
    }
  });

  it('反光数量与场景匹配，屋外有涟漪参数', () => {
    expect(WATER.exterior.glints).toBe(26);
    expect(WATER.interior.glints).toBe(9);
    expect(WATER.exterior.rings).toEqual({
      every: 7,
      life: 3.2,
      alpha: 0.35,
      grow: 26,
      flatten: 0.3,
      lineWidth: 1.6,
    });
    expect(WATER.interior.rings).toBeUndefined();
  });
});

describe('偏移公式', () => {
  const exterior = WATER.exterior;
  const region = exterior.regions[0];

  it('区域上沿 ampTop、下沿 ampBottom，中间线性', () => {
    expect(regionDepth(regionTopRef(region.top), region)).toBe(0);
    expect(regionDepth(regionTopRef(region.top + region.height), region)).toBe(1);
    expect(regionDepth(regionTopRef(region.top) - 10, region)).toBe(0);
    expect(regionDepth(regionTopRef(region.top + region.height) + 10, region)).toBe(1);
    const mid = regionTopRef(region.top) + ((region.height / 100) * SCENE_REF_H) / 2;
    expect(regionDepth(mid, region)).toBeCloseTo(0.5, 5);
  });

  it('t=0、y=0 时主副波都从可预测的相位起算', () => {
    const offset = waveOffset(0, 0, region, exterior);
    const manual =
      exterior.ampTop *
      (Math.sin(0) + exterior.wave2.weight! * Math.sin(2 * Math.PI * 0.3));
    expect(offset).toBeCloseTo(manual, 6);
  });

  it('同一 y 上偏移随时间呈周期，t 与 t+wave1.period 相差一个主波周期', () => {
    const y = regionTopRef(region.top + region.height * 0.5);
    const t = 1.7;
    const a = waveOffset(y, t, region, exterior);
    const b = waveOffset(y, t + exterior.wave1.period, region, exterior);
    const c = waveOffset(y, t + exterior.wave2.period * 2, region, exterior);
    expect(Math.abs(a - b)).toBeGreaterThan(0);
    expect(Math.abs(a - c)).toBeGreaterThan(0);
  });

  it('偏移幅度上限：不超过区域下沿的 ampBottom × (1 + weight)', () => {
    const bottom = regionTopRef(region.top + region.height);
    const cap = exterior.ampBottom * (1 + exterior.wave2.weight!);
    for (let i = 0; i < 200; i++) {
      const t = i * 0.05;
      expect(Math.abs(waveOffset(bottom, t, region, exterior))).toBeLessThanOrEqual(cap + 1e-9);
    }
  });

  it('不同区域按各自上下沿计算振幅', () => {
    const [r1, r2] = WATER.interior.regions;
    const topR1 = regionDepth(regionTopRef(r1.top), r1);
    const topR2 = regionDepth(regionTopRef(r2.top), r2);
    expect(topR1).toBe(0);
    expect(topR2).toBe(0);
    const midR1 = regionDepth(regionTopRef(r1.top + r1.height / 2), r1);
    const midR2 = regionDepth(regionTopRef(r2.top + r2.height / 2), r2);
    expect(midR1).toBeCloseTo(0.5, 5);
    expect(midR2).toBeCloseTo(0.5, 5);
  });
});

describe('反光与涟漪辅助函数', () => {
  it('sin² 包络：端点为 0，中点最大', () => {
    expect(glintEnvelope(0, 3.2)).toBe(0);
    expect(glintEnvelope(3.2, 3.2)).toBeCloseTo(0, 6);
    expect(glintEnvelope(1.6, 3.2)).toBeCloseTo(1, 6);
    expect(glintEnvelope(-0.1, 3.2)).toBe(0);
    expect(glintEnvelope(4, 3.2)).toBe(0);
  });

  it('长度与粗细按深度线性插值', () => {
    expect(interpByDepth(9, 30, 0)).toBe(9);
    expect(interpByDepth(9, 30, 1)).toBe(30);
    expect(interpByDepth(9, 30, 0.5)).toBeCloseTo(19.5, 6);
    expect(interpByDepth(1.2, 2.4, 0.5)).toBeCloseTo(1.8, 6);
  });

  it('涟漪随生命比例线性扩大、透明度线性衰减', () => {
    expect(ringShape(0, 26, 0.35)).toEqual({ radius: 0, alpha: 0.35 });
    expect(ringShape(1, 26, 0.35)).toEqual({ radius: 26, alpha: 0 });
    expect(ringShape(0.5, 26, 0.35)).toEqual({ radius: 13, alpha: 0.175 });
    expect(ringShape(2, 26, 0.35)).toEqual({ radius: 26, alpha: 0 });
    expect(ringShape(-1, 26, 0.35)).toEqual({ radius: 0, alpha: 0.35 });
  });
});

describe('参考分辨率', () => {
  it('参数按 1600×900 给出，用于等比缩放', () => {
    expect(SCENE_REF_W).toBe(1600);
    expect(SCENE_REF_H).toBe(900);
  });
});
