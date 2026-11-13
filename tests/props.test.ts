import { describe, expect, it } from 'vitest';
import {
  PROPS,
  SWING_DURATION_MS,
  swingAngle,
  swingKeyframes,
} from '../src/data/props';

const allProps = Object.values(PROPS).flatMap((scene) => scene.props);

function expectPercent(value: number): void {
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(100);
}

describe('物件分层数据', () => {
  it('两个场景都使用美术交付的净底图', () => {
    expect(PROPS.interior.background).toBe('art/room-interior-clean.webp');
    expect(PROPS.exterior.background).toBe('art/room-exterior-clean.webp');
  });

  it('物件 id 唯一，贴图路径与场景目录对应', () => {
    expect(new Set(allProps.map((prop) => prop.id)).size).toBe(allProps.length);
    for (const [scene, data] of Object.entries(PROPS)) {
      for (const prop of data.props) {
        expect(prop.image).toMatch(new RegExp(`^art/props/${scene}/[a-z0-9-]+\\.png$`));
      }
    }
  });

  it('贴图位置、尺寸和支点均为有效百分比', () => {
    for (const prop of allProps) {
      expectPercent(prop.left);
      expectPercent(prop.top);
      expectPercent(prop.left + prop.width);
      expectPercent(prop.top + prop.height);
      expect(prop.width).toBeGreaterThan(0);
      expect(prop.height).toBeGreaterThan(0);
      if (prop.originX !== undefined) expectPercent(prop.originX);
      if (prop.originY !== undefined) expectPercent(prop.originY);
    }
  });

  it('内景九件均为后层悬停摆动', () => {
    expect(PROPS.interior.props).toHaveLength(9);
    for (const prop of PROPS.interior.props) {
      expect(prop).toMatchObject({ motion: 'swing', trigger: 'hover', layer: 'back' });
      expect(prop.amplitude).toBeGreaterThan(0);
    }
  });

  it('外景十四件使用独立周期，前景仅四丛植物', () => {
    expect(PROPS.exterior.props).toHaveLength(14);
    expect(PROPS.exterior.props.filter((prop) => prop.layer === 'front').map((prop) => prop.id))
      .toEqual(['plants-left', 'daisies', 'flowers-yellow', 'reeds-pond']);
    for (const prop of PROPS.exterior.props) {
      expect(prop.trigger).toBe('auto');
      expect(prop.period).toBeGreaterThan(0);
      expect(typeof prop.delay).toBe('number');
    }
  });

  it('摆动与斜切有正幅度，云的左右边缘范围有效', () => {
    for (const prop of allProps) {
      if (prop.motion === 'drift') {
        expect(prop.travelFrom).toBeDefined();
        expect(prop.travelTo).toBeDefined();
        expect(prop.travelFrom!).toBeGreaterThanOrEqual(0);
        expect(prop.travelFrom!).toBeLessThan(prop.travelTo!);
        expect(prop.travelTo!).toBeLessThanOrEqual(100);
      } else {
        expect(prop.amplitude).toBeGreaterThan(0);
      }
    }
  });

  it('云的负延迟让初始位置贴合原图，速度保持在交付范围内', () => {
    const clouds = PROPS.exterior.props.filter((prop) => prop.motion === 'drift');
    expect(clouds).toHaveLength(3);
    for (const cloud of clouds) {
      const progress = -cloud.delay! / cloud.period;
      const initialLeft = cloud.travelFrom! + (cloud.travelTo! - cloud.travelFrom!) * progress;
      const speed = (cloud.travelTo! - cloud.travelFrom!) / cloud.period;
      const roundedSpeed = Number(speed.toFixed(1));
      expect(initialLeft).toBeCloseTo(cloud.left, 1);
      expect(roundedSpeed).toBeGreaterThanOrEqual(0.7);
      expect(roundedSpeed).toBeLessThanOrEqual(1.1);
    }
  });
});

describe('悬停衰减摆动', () => {
  it('从静止开始，后期幅度明显衰减', () => {
    expect(swingAngle(0, 0.8, 7)).toBe(0);
    const early = Math.max(...Array.from({ length: 21 }, (_, i) => Math.abs(swingAngle(i * 0.01, 0.8, 7))));
    const late = Math.max(...Array.from({ length: 21 }, (_, i) => Math.abs(swingAngle(2 + i * 0.01, 0.8, 7))));
    expect(late).toBeLessThan(early * 0.1);
    expect(Math.abs(swingAngle(SWING_DURATION_MS / 1000, 0.8, 7))).toBeLessThan(0.15);
  });

  it('关键帧完整覆盖一次动画并回到近静止', () => {
    const frames = swingKeyframes(0.8, 7) as (Keyframe & { offset: number })[];
    expect(frames).toHaveLength(66);
    expect(frames[0]).toEqual({ transform: 'rotate(0.000deg)', offset: 0 });
    expect(frames[9].transform).toBe(`rotate(${swingAngle(0.36, 0.8, 7).toFixed(3)}deg)`);
    expect(frames[9].transform).not.toBe('rotate(0.000deg)');
    expect(frames.at(-1)!.offset).toBe(1);
    expect(frames.at(-1)!.transform).toMatch(/^rotate\(-?0\.\d{3}deg\)$/);
    for (let i = 1; i < frames.length; i += 1) {
      expect(frames[i].offset).toBeGreaterThan(frames[i - 1].offset);
    }
  });

  it('不同物件使用各自的周期与幅度', () => {
    expect(swingAngle(0.2, 0.8, 7)).not.toBe(swingAngle(0.2, 1.25, 6));
    expect(swingAngle(0.2, 0.8, 7)).toBeCloseTo(7 * Math.exp(-0.2 / 0.64));
  });
});
