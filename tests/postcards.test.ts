import { describe, expect, it } from 'vitest';
import { DESTINATIONS } from '../src/data/travel';
import { hashText, pickTemplate, visitedCount } from '../src/data/postcards';

describe('明信片模板', () => {
  it('hash 稳定、非负', () => {
    expect(hashText('trip-1')).toBe(hashText('trip-1'));
    expect(hashText('trip-1')).not.toBe(hashText('trip-2'));
    expect(hashText('')).toBeGreaterThanOrEqual(0);
  });

  it('同一张明信片每次都选同一条模板', () => {
    for (const destination of DESTINATIONS) {
      const first = pickTemplate('save-a3', destination.templates);
      expect(pickTemplate('save-a3', destination.templates)).toBe(first);
      expect(destination.templates).toContain(first);
    }
  });

  it('不同明信片会落到不同模板，空模板回空串', () => {
    const templates = DESTINATIONS[0].templates;
    const picked = new Set(
      Array.from({ length: 20 }, (_, i) => pickTemplate(`trip-${i}`, templates)),
    );
    expect(picked.size).toBeGreaterThan(1);
    expect(pickTemplate('trip', [])).toBe('');
  });

  it('数去过几处不重复', () => {
    expect(visitedCount([])).toBe(0);
    expect(visitedCount(['xihu', 'xihu', 'wuzhen'])).toBe(2);
  });
});