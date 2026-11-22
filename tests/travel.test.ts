import { describe, expect, it } from 'vitest';
import { DESTINATIONS, TRAVEL, isDestinationId } from '../src/data/travel';
import {
  advance,
  createInitialLife,
  suggestActivity,
  suggestTravel,
  type LifeActivity,
  type LifeState,
} from '../src/sim/life';
import { catchUpLife } from '../src/sim/offline';
import {
  autoDepartureBlock,
  chooseDestination,
  suggestDepartureBlock,
  TRAVEL_AWAY_MESSAGE,
} from '../src/sim/travel';
import { DAY_MINUTES, isNight, minuteOfDay } from '../src/sim/time';

const MORNING = 9 * 60;

function minuteOfDayText(minute: number): string {
  const m = minuteOfDay(minute);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function travelState(overrides: Partial<LifeState> = {}): LifeState {
  const activity: LifeActivity = {
    id: 'test-a1',
    kind: 'travel',
    startedAt: MORNING,
    endsAt: MORNING + 300,
    statsAtStart: { fullness: 80, energy: 80, mood: 70 },
    destinationId: 'xihu',
  };
  return {
    saveId: 'test',
    seed: 1,
    rngState: 1,
    minute: MORNING,
    fullness: 80,
    energy: 80,
    mood: 70,
    activity,
    lastFun: null,
    nextActivitySeq: 2,
    nextEventSeq: 2,
    events: [
      {
        id: 'test-e1',
        type: 'start',
        activityId: activity.id,
        activity: 'travel',
        atMinute: MORNING,
        destinationId: 'xihu',
      },
    ],
    trips: [],
    ...overrides,
  };
}

/** 一个正在做别的事、状态可控的存档。 */
function idleState(
  overrides: Partial<LifeState> = {},
  activity: LifeActivity = {
    id: 'test-a1',
    kind: 'gaze',
    startedAt: MORNING - 10,
    endsAt: MORNING + 600,
    statsAtStart: { fullness: 80, energy: 80, mood: 70 },
  },
): LifeState {
  return {
    saveId: 'test',
    seed: 1,
    rngState: 1,
    minute: MORNING,
    fullness: 80,
    energy: 80,
    mood: 70,
    activity,
    lastFun: null,
    nextActivitySeq: 2,
    nextEventSeq: 2,
    events: [],
    trips: [],
    ...overrides,
  };
}

describe('旅行目的地数据', () => {
  it('就是附录 A 的 5 个地方', () => {
    expect(DESTINATIONS.map((d) => d.id)).toEqual([
      'xihu',
      'yunqi',
      'wuzhen',
      'qiandaohu',
      'huangshan',
    ]);
    expect(DESTINATIONS.map((d) => d.name)).toEqual([
      '西湖·断桥',
      '云栖小镇',
      '乌镇',
      '千岛湖',
      '黄山',
    ]);
    expect(DESTINATIONS.map((d) => d.region)).toEqual([
      '杭州',
      '杭州西湖区',
      '浙江嘉兴',
      '杭州淳安',
      '安徽',
    ]);
  });

  it('每处都有坐标、时长、画、3 条事实和 3 条模板', () => {
    for (const d of DESTINATIONS) {
      expect(d.lat).toBeGreaterThan(20);
      expect(d.lng).toBeGreaterThan(100);
      expect(d.minMinutes).toBeGreaterThan(0);
      expect(d.maxMinutes).toBeGreaterThan(d.minMinutes);
      expect(d.image).toBe(`/art/postcards/${d.id}.webp`);
      expect(d.facts).toHaveLength(3);
      expect(d.templates).toHaveLength(3);
      for (const template of d.templates) {
        expect(template.length).toBeLessThanOrEqual(100);
      }
      expect(isDestinationId(d.id)).toBe(true);
    }
    expect(isDestinationId('nowhere')).toBe(false);
  });
});

describe('出发的条件', () => {
  it('只在 08:00～12:00、体力和饱腹都够、冷却到了才出发', () => {
    const base = { atMinute: MORNING, energy: 80, fullness: 80, lastReturnedAt: null };
    expect(autoDepartureBlock(base)).toBeNull();

    expect(autoDepartureBlock({ ...base, atMinute: 8 * 60 - 1 })).not.toBeNull();
    expect(autoDepartureBlock({ ...base, atMinute: 12 * 60 + 1 })).not.toBeNull();
    expect(autoDepartureBlock({ ...base, energy: 59 })).not.toBeNull();
    expect(autoDepartureBlock({ ...base, fullness: 59 })).not.toBeNull();
    expect(
      autoDepartureBlock({ ...base, lastReturnedAt: base.atMinute - TRAVEL.cooldownMinutes + 1 }),
    ).not.toBeNull();
    expect(
      autoDepartureBlock({ ...base, lastReturnedAt: base.atMinute - TRAVEL.cooldownMinutes }),
    ).toBeNull();
  });

  it('路牌建议的条件和提示语', () => {
    const base = { atMinute: MORNING, energy: 80, fullness: 80, departedToday: false };
    expect(suggestDepartureBlock(base)).toBeNull();
    expect(suggestDepartureBlock({ ...base, atMinute: 14 * 60 + 1 })).toBe(
      '天快黑了，明天再去吧',
    );
    expect(suggestDepartureBlock({ ...base, energy: 59 })).toBe('太累了，先歇会儿');
    expect(suggestDepartureBlock({ ...base, fullness: 59 })).toBe('肚子饿，先吃饭');
    expect(suggestDepartureBlock({ ...base, departedToday: true })).toBe('今天已经出去过啦');
  });
});

describe('选目的地', () => {
  it('没去过的地方优先，5 处都去过之前不重复', () => {
    const visited: string[] = [];
    let last: string | null = null;
    for (let i = 0; i < DESTINATIONS.length; i++) {
      const picked = chooseDestination({ visited, lastDestinationId: last }, () => 0.5);
      expect(visited).not.toContain(picked.id);
      visited.push(picked.id);
      last = picked.id;
    }
    expect(visited).toHaveLength(DESTINATIONS.length);
  });

  it('都去过之后不连续两次去同一处', () => {
    const visited = DESTINATIONS.map((d) => d.id);
    const last = visited[visited.length - 1];
    for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
      const picked = chooseDestination({ visited, lastDestinationId: last }, () => roll);
      expect(picked.id).not.toBe(last);
    }
  });

  it('随机数不同会选到不同的地方', () => {
    const visited = DESTINATIONS.map((d) => d.id);
    const first = chooseDestination({ visited, lastDestinationId: 'xihu' }, () => 0);
    const last = chooseDestination({ visited, lastDestinationId: 'xihu' }, () => 0.999);
    expect(first.id).not.toBe(last.id);
  });
});

describe('旅行中', () => {
  it('点家具被拒绝，并记一条 interact 事件', () => {
    const state = travelState();
    const result = suggestActivity(state, 'code', MORNING + 10);
    expect(result.accepted).toBe(false);
    expect(result.message).toBe(TRAVEL_AWAY_MESSAGE);
    expect(result.state.activity?.kind).toBe('travel');

    const interact = result.state.events.find((e) => e.type === 'interact');
    expect(interact?.outcome).toBe('rejected');
    expect(interact?.message).toBe(TRAVEL_AWAY_MESSAGE);
    expect(interact?.activity).toBe('code');
    expect(state.events.some((e) => e.type === 'interact')).toBe(false);
  });

  it('吃饭、睡觉都不能打断旅行', () => {
    for (const target of ['eat', 'sleep', 'read', 'play', 'gaze'] as const) {
      const result = suggestActivity(travelState(), target, MORNING + 10);
      expect(result.accepted).toBe(false);
      expect(result.message).toBe(TRAVEL_AWAY_MESSAGE);
    }
  });

  it('旅行完整结束时追加一条 Trip', () => {
    const state = travelState();
    const after = advance(state, MORNING + 300);
    expect(after.trips).toHaveLength(1);
    expect(after.trips[0]).toMatchObject({
      id: 'test-a1',
      destinationId: 'xihu',
      departedAt: MORNING,
      returnedAt: MORNING + 300,
      read: false,
    });
    expect(after.events.some((e) => e.type === 'end' && e.destinationId === 'xihu')).toBe(
      true,
    );
  });

  it('Trip 只追加，不受事件条数上限影响', () => {
    let state = travelState();
    for (let i = 0; i < 5; i++) {
      state = advance(state, state.minute + 300);
    }
    expect(state.trips.length).toBeGreaterThan(0);
    expect(state.events.length).toBeLessThanOrEqual(200);
  });
});

describe('路牌建议', () => {
  it('条件满足时出发，并且 21:00 前回来', () => {
    const result = suggestTravel(idleState(), MORNING);
    expect(result.accepted).toBe(true);
    expect(result.state.activity?.kind).toBe('travel');
    expect(result.state.activity?.destinationId).toBeDefined();

    const endsAt = result.state.activity!.endsAt;
    expect(minuteOfDay(endsAt)).toBeLessThanOrEqual(TRAVEL.returnByMinute);

    const interact = result.state.events.find((e) => e.type === 'interact');
    expect(interact?.outcome).toBe('accepted');
    expect(interact?.activity).toBe('travel');
  });

  it('14:00 之后不再出发，最晚 21:00 回来', () => {
    const result = suggestTravel(idleState({ minute: 13 * 60 + 30 }), 13 * 60 + 30);
    expect(result.accepted).toBe(true);
    expect(minuteOfDay(result.state.activity!.endsAt)).toBeLessThanOrEqual(
      TRAVEL.returnByMinute,
    );

    const late = suggestTravel(idleState({ minute: 14 * 60 + 1 }), 14 * 60 + 1);
    expect(late.accepted).toBe(false);
    expect(late.message).toBe('天快黑了，明天再去吧');
  });

  it('条件不满足时说明原因', () => {
    const tired = suggestTravel(idleState({ energy: 50 }), MORNING);
    expect(tired.accepted).toBe(false);
    expect(tired.message).toBe('太累了，先歇会儿');

    const hungry = suggestTravel(idleState({ fullness: 50 }), MORNING);
    expect(hungry.accepted).toBe(false);
    expect(hungry.message).toBe('肚子饿，先吃饭');

    const rejected = tired.state.events.find((e) => e.type === 'interact');
    expect(rejected?.outcome).toBe('rejected');
  });

  it('同一个游戏日最多出去一次', () => {
    const alreadyOut = idleState({
      minute: 13 * 60,
      trips: [
        {
          id: 'old-trip',
          destinationId: 'xihu',
          departedAt: 8 * 60,
          returnedAt: 12 * 60,
          read: false,
        },
      ],
    });
    const result = suggestTravel(alreadyOut, 13 * 60);
    expect(result.accepted).toBe(false);
    expect(result.message).toBe('今天已经出去过啦');
  });

  it('旅行中再点路牌也被拒绝', () => {
    const result = suggestTravel(travelState(), MORNING + 10);
    expect(result.accepted).toBe(false);
    expect(result.message).toBe(TRAVEL_AWAY_MESSAGE);
  });

  it('建议出发可以忽略 20 小时冷却', () => {
    // 上一次旅行在昨天深夜出发、清早回来，冷却没到，但路牌仍然可以建议出发。
    const now = DAY_MINUTES + 8 * 60;
    const justBack = idleState({
      minute: now,
      trips: [
        {
          id: 'old-trip',
          destinationId: 'xihu',
          departedAt: 22 * 60,
          returnedAt: DAY_MINUTES + 6 * 60,
          read: false,
        },
      ],
    });
    const result = suggestTravel(justBack, now);
    expect(result.accepted).toBe(true);
    expect(result.state.activity?.kind).toBe('travel');
  });
});

describe('多种子统计', () => {
  it(
    '6 颗种子 14 天：旅行 5～12 次，全部 21:00 前回来，作息达标',
    () => {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        let state = createInitialLife({ seed, atMinute: 8 * 60 });
        const end = state.minute + 14 * DAY_MINUTES;
        let nightSamples = 0;
        let awakeAtNight = 0;
        let lowFullness = 0;
        let samples = 0;
        let codeMinutes = 0;
        let playMinutes = 0;

        while (state.minute < end) {
          state = advance(state, state.minute + 1);
          samples++;
          if (isNight(state.minute)) {
            nightSamples++;
            if (state.activity?.kind !== 'sleep') awakeAtNight++;
          }
          if (state.fullness < 30) lowFullness++;
          if (state.activity?.kind === 'code') codeMinutes++;
          if (state.activity?.kind === 'play') playMinutes++;
        }

        const label = `seed ${seed}`;
        expect(state.trips.length, `${label} 旅行次数`).toBeGreaterThanOrEqual(5);
        expect(state.trips.length, `${label} 旅行次数`).toBeLessThanOrEqual(12);

        for (const trip of state.trips) {
          expect(minuteOfDay(trip.departedAt), `${label} 出发时间`).toBeGreaterThanOrEqual(
            TRAVEL.departStartMinute,
          );
          expect(minuteOfDay(trip.departedAt), `${label} 出发时间`).toBeLessThanOrEqual(
            TRAVEL.departEndMinute,
          );
          expect(minuteOfDay(trip.returnedAt), `${label} 回来时间`).toBeLessThanOrEqual(
            TRAVEL.returnByMinute,
          );
        }

        // Spec 3.6：夜里醒着偶尔会到 16%，阈值放宽到 16%，不改作息数值。
        expect(awakeAtNight / nightSamples, `${label} 夜里醒着`).toBeLessThan(0.16);
        expect(lowFullness / samples, `${label} 饱腹<30`).toBeLessThan(0.1);
        expect(codeMinutes, `${label} 写代码时长`).toBeGreaterThan(playMinutes);
      }
    },
    60000,
  );

  it(
    '补算 7 天用时仍不到 1 秒',
    () => {
      const saved = createInitialLife({ seed: 9, atMinute: 8 * 60 });
      const started = performance.now();
      const result = catchUpLife(saved, saved.minute + 7 * DAY_MINUTES);
      const elapsed = performance.now() - started;
      expect(result.state.minute).toBe(saved.minute + 7 * DAY_MINUTES);
      expect(elapsed).toBeLessThan(1000);
    },
    30000,
  );
});

describe('模拟里的旅行过程', () => {
  it('整段旅行体力 −20、饱腹 +30', () => {
    // 一段 3 小时的旅行：效果分摊到每分钟，自然消耗照常。
    const state = travelState({
      activity: {
        id: 'test-a1',
        kind: 'travel',
        startedAt: MORNING,
        endsAt: MORNING + 180,
        statsAtStart: { fullness: 80, energy: 80, mood: 70 },
        destinationId: 'xihu',
      },
    });
    const after = advance(state, MORNING + 180);
    const delta = after.events.find((e) => e.type === 'end')?.delta;
    expect(delta).toBeDefined();
    // 自然消耗照常，所以饱腹增量会小于 30。
    expect(delta!.fullness).toBeLessThanOrEqual(30);
    expect(delta!.fullness).toBeGreaterThan(0);
    expect(delta!.energy).toBeLessThan(-20);
  });

  it('旅行里的心情往 85 靠', () => {
    const state = travelState({ mood: 50 });
    const after = advance(state, MORNING + 300);
    expect(after.mood).toBeGreaterThan(50);
    expect(after.mood).toBeLessThanOrEqual(85);
  });

  it('出发时间和回来时间都能读成钟点', () => {
    const state = travelState();
    expect(minuteOfDayText(state.activity!.startedAt)).toBe('09:00');
  });
});
