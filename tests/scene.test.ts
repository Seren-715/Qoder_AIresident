import { describe, expect, it } from 'vitest';
import { EXTERIOR_DOOR, FURNITURE, IDLE_SPOT, SCENES, type FurnitureId } from '../src/data/scene';

const SPEC_IDS: FurnitureId[] = ['bed', 'bowl', 'bookshelf', 'desk', 'window', 'rug', 'door'];

describe('场景数据', () => {
  it('家具清单与 Spec 0.3 一致', () => {
    expect(Object.keys(FURNITURE).sort()).toEqual([...SPEC_IDS].sort());
  });

  it('家具锚点都在画面百分比范围内', () => {
    for (const { anchor } of Object.values(FURNITURE)) {
      expect(anchor.x).toBeGreaterThanOrEqual(0);
      expect(anchor.x).toBeLessThanOrEqual(100);
      expect(anchor.y).toBeGreaterThanOrEqual(0);
      expect(anchor.y).toBeLessThanOrEqual(100);
    }
  });

  it('两个场景都有图和说明', () => {
    for (const scene of Object.values(SCENES)) {
      expect(scene.image).toMatch(/^art\/room-(interior|exterior)\.webp$/);
      expect(scene.caption.length).toBeGreaterThan(0);
    }
  });

  it('开局 idle 位置指向存在的家具', () => {
    expect(FURNITURE[IDLE_SPOT.furniture]).toBeDefined();
  });

  it('外景门热点完整落在画面内', () => {
    expect(EXTERIOR_DOOR.left).toBeGreaterThanOrEqual(0);
    expect(EXTERIOR_DOOR.top).toBeGreaterThanOrEqual(0);
    expect(EXTERIOR_DOOR.left + EXTERIOR_DOOR.width).toBeLessThanOrEqual(100);
    expect(EXTERIOR_DOOR.top + EXTERIOR_DOOR.height).toBeLessThanOrEqual(100);
  });
});