import { describe, expect, it } from 'vitest';
import { createClock, setClockSpeed, tickClock } from '../src/sim/clock';

const T0 = 1_000_000;

describe('游戏时钟', () => {
  it('×1 时现实 60 秒推进 1 分钟', () => {
    const clock = createClock(100, T0);
    expect(tickClock(clock, T0 + 59_999).minute).toBe(100);
    expect(tickClock(clock, T0 + 60_000).minute).toBe(101);
  });

  it('×60 时现实 1 秒推进 1 分钟', () => {
    const clock = createClock(100, T0, 60);
    const tick = tickClock(clock, T0 + 1_000);
    expect(tick.minute).toBe(101);
    expect(tick.clock.exactMinute).toBeCloseTo(101, 6);
  });

  it('×600 时现实 1 秒推进 10 分钟', () => {
    const clock = createClock(100, T0, 600);
    const tick = tickClock(clock, T0 + 1_000);
    expect(tick.minute).toBe(110);
    expect(tick.clock.exactMinute).toBeCloseTo(110, 6);
  });

  it('×600 时约 2.4 分钟过完一整天', () => {
    const clock = createClock(0, T0, 600);
    expect(tickClock(clock, T0 + 144_000).minute).toBe(1440);
  });

  it('切换倍速前先按旧倍速结算，不回退', () => {
    const clock = createClock(100, T0);
    const changed = setClockSpeed(clock, 60, T0 + 30_000);
    expect(changed.speed).toBe(60);
    expect(changed.exactMinute).toBeCloseTo(100.5, 6);
    expect(tickClock(changed, T0 + 31_000).minute).toBe(101);

    const backwards = tickClock(changed, T0 + 20_000);
    expect(backwards.clock.exactMinute).toBeCloseTo(100.5, 6);
    expect(backwards.minute).toBe(100);
  });
});