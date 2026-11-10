import { describe, expect, it } from 'vitest';
import { WIND, windMask, windOrigin } from '../src/data/wind';

describe('风效遮罩', () => {
  it('每个场景都有风效区域，且完整落在画面内', () => {
    for (const regions of Object.values(WIND)) {
      expect(regions.length).toBeGreaterThan(0);
      for (const r of regions) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(100);
        expect(r.y + r.h).toBeLessThanOrEqual(100);
        expect(r.dur).toBeGreaterThan(0);
        expect(['plant', 'hang', 'cloud']).toContain(r.kind);
      }
    }
  });

  it('外景有云、内景有悬挂香草束', () => {
    expect(WIND.exterior.some((r) => r.kind === 'cloud')).toBe(true);
    expect(WIND.interior.some((r) => r.kind === 'hang')).toBe(true);
  });

  it('悬挂物绕顶部摆、植物绕根部摆', () => {
    const hang = WIND.interior.find((r) => r.kind === 'hang')!;
    const plant = WIND.exterior.find((r) => r.kind === 'plant')!;
    expect(windOrigin(hang).oy).toBe(hang.y);
    expect(windOrigin(plant).oy).toBe(plant.y + plant.h);
  });

  it('遮罩为羽化椭圆且核心不透明', () => {
    const mask = windMask(WIND.exterior[0]);
    expect(mask).toMatch(/^radial-gradient\(ellipse .+% .+% at .+% .+%, #000 72%, transparent 94%\)$/);
  });
});