export interface Destination {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  minMinutes: number;
  maxMinutes: number;
  image: string;
  facts: string[];
  templates: string[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'xihu',
    name: '西湖·断桥',
    region: '杭州',
    lat: 30.258,
    lng: 120.152,
    minMinutes: 180,
    maxMinutes: 300,
    image: '/art/postcards/xihu.webp',
    facts: [
      '断桥在白堤的一头，「断桥残雪」是西湖十景之一。',
      '湖边种着很多柳树，湖上有手划的小船。',
      '远处的山上能看到保俶塔。',
    ],
    templates: [
      '我在断桥上站了好久，湖面平得像一块没有 diff 的屏幕。回去的路上一直在想，要是代码也能这么安静就好了。',
      '柳树垂到水面上，小船慢慢划过去。我数了数桥上的台阶，又数了一遍，确认没有 off-by-one。',
      '远处山上有座塔，我把它当成今天的书签。下次来，想从塔上往下看看这片湖。',
    ],
  },
  {
    id: 'yunqi',
    name: '云栖小镇',
    region: '杭州西湖区',
    lat: 30.131,
    lng: 120.091,
    minMinutes: 180,
    maxMinutes: 300,
    image: '/art/postcards/yunqi.webp',
    facts: [
      '云栖小镇在杭州西南的山谷里，周围是竹林和茶山。',
      '每年的云栖大会在这里举办，聚集了很多做云计算和 AI 的人。',
      '小镇里有一条安静的溪流和竹林小路。',
    ],
    templates: [
      '我去了云栖小镇，听说很多会写代码的人每年都会来这里。我在竹林边坐了一会儿，感觉自己也算来过大会了。',
      '山谷里很安静，只有溪水声。我在想，云到底是什么呢？大概就是你看不见、但一直在帮你干活的东西吧。',
      '竹子长得又直又高，一节一节的，像排好的函数调用栈。我在这里写了半个 TODO，剩下的回家补。',
    ],
  },
  {
    id: 'wuzhen',
    name: '乌镇',
    region: '浙江嘉兴',
    lat: 30.746,
    lng: 120.488,
    minMinutes: 300,
    maxMinutes: 420,
    image: '/art/postcards/wuzhen.webp',
    facts: [
      '乌镇是江南水乡古镇，河道穿过小镇，两边是白墙黑瓦的老房子。',
      '河上有乌篷船和很多石桥。',
      '世界互联网大会在乌镇举办。',
    ],
    templates: [
      '乌镇的河弯弯绕绕，像一段没有注释的老代码，但走着走着就懂了。我坐了一会儿乌篷船，船夫划得比我写代码还稳。',
      '白墙黑瓦，石桥一座连着一座。听说互联网大会在这里开，我在桥上替你连了一下 Wi-Fi，信号很好。',
      '傍晚河面上有灯，倒影晃来晃去。我在想，老房子能用几百年，是因为一直有人在维护吧。',
    ],
  },
  {
    id: 'qiandaohu',
    name: '千岛湖',
    region: '杭州淳安',
    lat: 29.605,
    lng: 119.042,
    minMinutes: 360,
    maxMinutes: 480,
    image: '/art/postcards/qiandaohu.webp',
    facts: [
      '千岛湖是一片很大的湖，湖里有一千多座小岛。',
      '湖水很清，坐渡船在岛之间穿行。',
      '湖边是连绵的青山。',
    ],
    templates: [
      '湖里有好多好多小岛，我数到第 37 个就放弃了，决定把它当成一个很长的数组。',
      '坐渡船从一座岛到另一座岛，像在一个个模块之间跳转。湖水清得能看到底，我很喜欢这种没有隐藏 bug 的感觉。',
      '我在一座小岛上发了会儿呆，四面都是水。原来离开电脑屏幕，世界这么宽。',
    ],
  },
  {
    id: 'huangshan',
    name: '黄山',
    region: '安徽',
    lat: 30.133,
    lng: 118.167,
    minMinutes: 420,
    maxMinutes: 540,
    image: '/art/postcards/huangshan.webp',
    facts: [
      '黄山以奇松、怪石、云海出名。',
      '山峰很高，常常能看到云海在山间流动。',
      '山上有长长的石阶路。',
    ],
    templates: [
      '我爬上了黄山，脚下全是云，像站在一大片棉花糖上。回来的路上我一直在想，云服务是不是就住在这里。',
      '有一棵松树从石缝里长出来，歪着身子迎客。我觉得它很像一个历史悠久但依然在线的老项目。',
      '石阶好长好长，我走了好久才到顶。看到云海那一刻，觉得所有的 commit 都值得。',
    ],
  },
];

export const DESTINATION_IDS = new Set(DESTINATIONS.map((d) => d.id));

export function isDestinationId(value: unknown): value is string {
  return typeof value === 'string' && DESTINATION_IDS.has(value);
}

export const TRAVEL = {
  /** 自动出发的时段：08:00～12:00。 */
  departStartMinute: 8 * 60,
  departEndMinute: 12 * 60,
  /** 点路牌建议时允许到 14:00。 */
  suggestEndMinute: 14 * 60,
  /** 旅行最晚 21:00 回来。 */
  returnByMinute: 21 * 60,
  energyAtLeast: 60,
  fullnessAtLeast: 60,
  /** 距离上次回来至少 20 小时。 */
  cooldownMinutes: 20 * 60,
  moodTarget: 85,
  needScore: 55,
  trait: 1.0,
  /** 存档里最多保留的旅行记录条数。 */
  maxTrips: 60,
} as const;
