export const SPEEDS = [1, 60, 600] as const;

export type Speed = (typeof SPEEDS)[number];

export interface GameClock {
  exactMinute: number;
  speed: Speed;
  lastMs: number;
}

export function createClock(startMinute: number, nowMs: number, speed: Speed = 1): GameClock {
  return { exactMinute: startMinute, speed, lastMs: nowMs };
}

export function tickClock(
  clock: GameClock,
  nowMs: number,
): { clock: GameClock; minute: number } {
  const elapsed = Math.max(0, nowMs - clock.lastMs);
  const exactMinute = clock.exactMinute + (elapsed / 60000) * clock.speed;
  return {
    clock: { ...clock, lastMs: nowMs, exactMinute },
    minute: Math.floor(exactMinute),
  };
}

export function setClockSpeed(clock: GameClock, speed: Speed, nowMs: number): GameClock {
  return { ...tickClock(clock, nowMs).clock, speed };
}