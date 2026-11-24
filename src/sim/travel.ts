import { DESTINATIONS, TRAVEL, type Destination } from '../data/travel';
import { minuteOfDay } from './time';

export interface TravelMemory {
  /** 已经去过的目的地 id，按时间先后。 */
  visited: string[];
  /** 上一次去的地方，用来避免连续两次去同一处。 */
  lastDestinationId: string | null;
}

/** 旅行中点家具时的气泡文案。 */
export const TRAVEL_AWAY_MESSAGE = '它出门旅行了，还没回来';

/**
 * 选目的地：先去没去过的地方；都去过之后随机，但不连续两次去同一处。
 */
export function chooseDestination(memory: TravelMemory, random: () => number): Destination {
  const unvisited = DESTINATIONS.filter((d) => !memory.visited.includes(d.id));
  let pool = unvisited;
  if (pool.length === 0) {
    pool = DESTINATIONS.filter((d) => d.id !== memory.lastDestinationId);
    if (pool.length === 0) pool = DESTINATIONS;
  }
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

/** 在目的地的时长范围里取一个整数分钟。 */
export function pickTravelMinutes(destination: Destination, random: () => number): number {
  const span = destination.maxMinutes - destination.minMinutes + 1;
  return destination.minMinutes + Math.min(span - 1, Math.floor(random() * span));
}

/** 距离「最晚 21:00 回来」还有多少分钟。 */
export function minutesUntilReturnDeadline(atMinute: number): number {
  const now = minuteOfDay(atMinute);
  if (now <= TRAVEL.returnByMinute) return TRAVEL.returnByMinute - now;
  return TRAVEL.returnByMinute + 24 * 60 - now;
}

export interface DepartureInput {
  atMinute: number;
  energy: number;
  fullness: number;
  /** 上一次回来的时间，没有旅行过就是 null。 */
  lastReturnedAt: number | null;
}

/** 自动出发的条件检查。返回被拒绝的原因，条件都满足时返回 null。 */
export function autoDepartureBlock(input: DepartureInput): string | null {
  const now = minuteOfDay(input.atMinute);
  if (now < TRAVEL.departStartMinute || now > TRAVEL.departEndMinute) {
    return '现在不是出门的时候';
  }
  if (input.energy < TRAVEL.energyAtLeast) return '太累了，先歇会儿';
  if (input.fullness < TRAVEL.fullnessAtLeast) return '肚子饿，先吃饭';
  if (
    input.lastReturnedAt !== null &&
    input.atMinute - input.lastReturnedAt < TRAVEL.cooldownMinutes
  ) {
    return '刚回来，先在家待会儿';
  }
  return null;
}

export interface SuggestDepartureInput {
  atMinute: number;
  energy: number;
  fullness: number;
  /** 当天是不是已经出过门。 */
  departedToday: boolean;
}

/** 点路牌建议出发的条件检查。返回被拒绝的原因，条件都满足时返回 null。 */
export function suggestDepartureBlock(input: SuggestDepartureInput): string | null {
  const now = minuteOfDay(input.atMinute);
  if (now < TRAVEL.departStartMinute || now > TRAVEL.suggestEndMinute) {
    return '天快黑啦，点右上角 ×600 到明早再去吧';
  }
  if (input.energy < TRAVEL.energyAtLeast) return '太累了，先歇会儿';
  if (input.fullness < TRAVEL.fullnessAtLeast) return '肚子饿，先吃饭';
  if (input.departedToday) return '今天已经出去过啦';
  return null;
}
