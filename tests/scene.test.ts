import { describe, expect, it } from 'vitest';
import { EXTERIOR_DOOR, FURNITURE, IDLE_SPOT, INTERIOR_DOOR, SCENES, type FurnitureId } from '../src/data/scene';
import { PROPS } from '../src/data/props';

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

  it('两个场景都有底图和说明', () => {
    for (const [id, scene] of Object.entries(SCENES)) {
      expect(PROPS[id as keyof typeof PROPS].background).toMatch(/^art\/room-(interior|exterior)-clean\.webp$/);
      expect(scene.caption.length).toBeGreaterThan(0);
    }
  });

  it('书架动作落位在书架旁的地面，不在层架上', () => {
    const { anchor } = FURNITURE.bookshelf;
    expect(anchor.x).toBeGreaterThan(17);
    expect(anchor.x).toBeLessThan(28);
    expect(anchor.y).toBeGreaterThan(72);
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

  it('内景门热点完整落在画面内', () => {
    expect(INTERIOR_DOOR.left).toBeGreaterThanOrEqual(0);
    expect(INTERIOR_DOOR.top).toBeGreaterThanOrEqual(0);
    expect(INTERIOR_DOOR.left + INTERIOR_DOOR.width).toBeLessThanOrEqual(100);
    expect(INTERIOR_DOOR.top + INTERIOR_DOOR.height).toBeLessThanOrEqual(100);
  });

  it('除门以外每件家具都有动作、气泡和画面内的热点区域', () => {
    for (const [id, spot] of Object.entries(FURNITURE)) {
      if (id === 'door') {
        expect(spot.action).toBeUndefined();
        continue;
      }
      expect(spot.action).toBeDefined();
      expect(spot.action!.bubble.length).toBeGreaterThan(0);
      const a = spot.action!.area;
      expect(a.left).toBeGreaterThanOrEqual(0);
      expect(a.top).toBeGreaterThanOrEqual(0);
      expect(a.left + a.width).toBeLessThanOrEqual(100);
      expect(a.top + a.height).toBeLessThanOrEqual(100);
    }
  });

  it('家具木牌文字与 Spec 2.4 一致', () => {
    expect(FURNITURE.bed.action!.hint).toBe('叫它去睡觉');
    expect(FURNITURE.bowl.action!.hint).toBe('叫它去吃饭');
    expect(FURNITURE.bookshelf.action!.hint).toBe('叫它去看书');
    expect(FURNITURE.desk.action!.hint).toBe('叫它去写代码');
    expect(FURNITURE.window.action!.hint).toBe('叫它去发会儿呆');
    expect(FURNITURE.rug.action!.hint).toBe('叫它去打个滚');
  });

  it('门牌区分屋内屋外', () => {
    expect(SCENES.interior.doorSign).toBe('出门看看 →');
    expect(SCENES.exterior.doorSign).toBe('← 回家');
  });
});