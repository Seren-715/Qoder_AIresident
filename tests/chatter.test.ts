import { describe, expect, it } from 'vitest';
import type { ActivityId } from '../src/data/life';
import {
  ACTIVITY_LINES,
  TRAVEL_RETURN_LINES,
  activityLine,
  travelReturnLine,
} from '../src/data/chatter';

const KINDS: ActivityId[] = ['sleep', 'eat', 'read', 'code', 'play', 'gaze', 'travel'];

describe('自发说话模板', () => {
  it('每种活动 4～6 句，句子不为空', () => {
    for (const kind of KINDS) {
      const lines = ACTIVITY_LINES[kind];
      expect(lines.length, kind).toBeGreaterThanOrEqual(4);
      expect(lines.length, kind).toBeLessThanOrEqual(6);
      expect(new Set(lines).size, kind).toBe(lines.length);
      for (const line of lines) expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('旅行回来有 4～6 句', () => {
    expect(TRAVEL_RETURN_LINES.length).toBeGreaterThanOrEqual(4);
    expect(TRAVEL_RETURN_LINES.length).toBeLessThanOrEqual(6);
  });

  it('按活动 id 稳定选择同一句', () => {
    for (const kind of KINDS) {
      const first = activityLine(kind, 'save-a12');
      expect(activityLine(kind, 'save-a12')).toBe(first);
      expect(ACTIVITY_LINES[kind]).toContain(first);
    }
    expect(travelReturnLine('save-a12')).toBe(travelReturnLine('save-a12'));
    expect(TRAVEL_RETURN_LINES).toContain(travelReturnLine('save-a12'));
  });

  it('不同活动 id 能落到不同句子', () => {
    const picked = new Set(
      Array.from({ length: 20 }, (_, i) => activityLine('code', `save-a${i}`)),
    );
    expect(picked.size).toBeGreaterThan(1);
    const returns = new Set(
      Array.from({ length: 20 }, (_, i) => travelReturnLine(`save-a${i}`)),
    );
    expect(returns.size).toBeGreaterThan(1);
  });
});