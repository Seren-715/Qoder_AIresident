import type { ActivityId } from './life';
import { hashText } from './postcards';

export const ACTIVITY_LINES: Record<ActivityId, string[]> = {
  sleep: ['再睡五分钟……', '梦里有会游泳的代码。', '呼……呼……', '被窝里最舒服了。', '先眯一会儿，等我醒。'],
  eat: ['这口饭真香。', '吃饭的时候不想 bug。', '锅里还有点锅巴。', '慢慢吃，不着急。'],
  read: ['这一页真有意思。', '书里也有人写代码。', '看到一句喜欢的话。', '再读一章就休息。'],
  code: [
    '这个小 bug 躲不过我的眼睛。',
    '先写个注释，再慢慢改。',
    '跑通了，松一口气。',
    '今天的代码挺听话。',
    '重构一下，让它更顺眼。',
  ],
  play: ['打个滚，圆滚滚的。', '地毯真软。', '翻个身，继续滚。', '运动一下再干活。'],
  gaze: ['云飘过去了。', '发呆也是正经事。', '窗外的风很轻。', '什么都没想，真好。'],
  travel: ['背上小背包，出发啦。', '路上有风，也有好风景。', '替你去看看外面。', '不着急，慢慢走。'],
};

export const TRAVEL_RETURN_LINES = [
  '我回来啦，带了一张明信片。',
  '外面真好玩，进门先喝口水。',
  '回来啦，路上想明白了一个 bug。',
  '到家了，还是小屋最舒服。',
];

export function activityLine(kind: ActivityId, activityId: string): string {
  const lines = ACTIVITY_LINES[kind];
  return lines[hashText(activityId) % lines.length];
}

export function travelReturnLine(activityId: string): string {
  return TRAVEL_RETURN_LINES[hashText(activityId) % TRAVEL_RETURN_LINES.length];
}