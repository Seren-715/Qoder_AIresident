export type FurnitureId =
  | 'bed'
  | 'bowl'
  | 'bookshelf'
  | 'desk'
  | 'window'
  | 'rug'
  | 'door';

export type DuckPose =
  | 'sleep'
  | 'eat'
  | 'read'
  | 'back'
  | 'sit'
  | 'play'
  | 'swim'
  | 'travel';

export interface Anchor {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FurnitureAction {
  pose: DuckPose;
  bubble: string;
  area: Rect;
}

export const FURNITURE: Record<
  FurnitureId,
  { name: string; anchor: Anchor; action?: FurnitureAction }
> = {
  bed: {
    name: '床',
    anchor: { x: 17, y: 28 },
    action: { pose: 'sleep', bubble: '在床上睡觉', area: { left: 3, top: 16, width: 21, height: 17 } },
  },
  bowl: {
    name: '饭碗',
    anchor: { x: 28, y: 87 },
    action: { pose: 'eat', bubble: '在吃饭', area: { left: 18, top: 76, width: 12, height: 16 } },
  },
  bookshelf: {
    name: '书架',
    anchor: { x: 11, y: 70 },
    action: { pose: 'read', bubble: '在看书', area: { left: 3, top: 40, width: 14, height: 27 } },
  },
  desk: {
    name: '书桌',
    anchor: { x: 48, y: 60 },
    action: { pose: 'back', bubble: '在电脑前写代码', area: { left: 36, top: 42, width: 22, height: 24 } },
  },
  window: {
    name: '窗户',
    anchor: { x: 29.5, y: 34 },
    action: { pose: 'sit', bubble: '在窗边发呆', area: { left: 24, top: 10, width: 10, height: 19 } },
  },
  rug: {
    name: '地毯',
    anchor: { x: 48, y: 80 },
    action: { pose: 'play', bubble: '在地毯上打滚', area: { left: 32, top: 69, width: 33, height: 23 } },
  },
  door: { name: '门', anchor: { x: 90, y: 72 } },
};

export type SceneId = 'interior' | 'exterior';

export const SCENES: Record<SceneId, { label: string; image: string; caption: string }> = {
  interior: {
    label: '屋内',
    image: 'art/room-interior.webp',
    caption: '树洞小屋：点床、书架、书桌、窗户、饭碗或地毯，小黄鸭会过去做对应的事。',
  },
  exterior: {
    label: '屋外',
    image: 'art/room-exterior.webp',
    caption: '小屋外面：菜地、池塘和一条通往远方的小路。点一下树洞门，进屋看看。',
  },
};

export const EXTERIOR_DOOR = { left: 41, top: 41, width: 9, height: 20 };

export const IDLE_SPOT: { furniture: FurnitureId; pose: DuckPose; bubble: string } = {
  furniture: 'rug',
  pose: 'sit',
  bubble: '在地毯上发呆',
};

export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}

export function duckUrl(pose: DuckPose): string {
  return assetUrl(`art/duck-${pose}.png`);
}