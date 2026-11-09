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

export const FURNITURE: Record<FurnitureId, { name: string; anchor: Anchor }> = {
  bed: { name: '床', anchor: { x: 17, y: 28 } },
  bowl: { name: '饭碗', anchor: { x: 26, y: 86 } },
  bookshelf: { name: '书架', anchor: { x: 11, y: 70 } },
  desk: { name: '书桌', anchor: { x: 48, y: 60 } },
  window: { name: '窗户', anchor: { x: 27, y: 32 } },
  rug: { name: '地毯', anchor: { x: 48, y: 80 } },
  door: { name: '门', anchor: { x: 90, y: 72 } },
};

export type SceneId = 'interior' | 'exterior';

export const SCENES: Record<SceneId, { label: string; image: string; caption: string }> = {
  interior: {
    label: '屋内',
    image: 'art/room-interior.webp',
    caption: '树洞小屋：床、书架、书桌、地毯和饭碗，都是小黄鸭自己布置的。',
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