import { describe, expect, it } from 'vitest';
import { WATER, clipPath } from '../src/data/water';

function insidePolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - xi) + xi) inside = !inside;
  }
  return inside;
}

describe('水域遮罩', () => {
  it('每个场景都有水域，多边形顶点在画面内', () => {
    for (const regions of Object.values(WATER)) {
      expect(regions.length).toBeGreaterThan(0);
      for (const region of regions) {
        expect(region.polygon.length).toBeGreaterThanOrEqual(3);
        for (const [x, y] of region.polygon) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('涟漪中心都落在各自水域内', () => {
    for (const regions of Object.values(WATER)) {
      for (const region of regions) {
        expect(region.ripples.length).toBeGreaterThan(0);
        for (const r of region.ripples) {
          expect(insidePolygon(r.x, r.y, region.polygon)).toBe(true);
        }
      }
    }
  });

  it('clip-path 输出百分比多边形', () => {
    expect(clipPath(WATER.interior[0])).toMatch(/^polygon\((\d+(\.\d+)?% \d+(\.\d+)?%)(, )?/);
  });
});