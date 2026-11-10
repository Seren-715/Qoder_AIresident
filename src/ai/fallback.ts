const GENERIC = [
  '嘎？我在听呢，你慢慢说。',
  '嗯嗯，我把这句话记在小本本上了。',
  '陪你坐一会儿，也挺好。',
  '今天的小屋很安静，适合聊天。',
];

const RULES: { keywords: string[]; replies: string[] }[] = [
  {
    keywords: ['吃', '饿', '饭', '零食'],
    replies: ['说到吃的，我饭碗里的锅巴还香着呢。', '嘎，陪我吃一口好不好？'],
  },
  {
    keywords: ['睡', '困', '累', '休息'],
    replies: ['困了就去床上躺一会儿，我帮你看着家。', '打个盹儿，梦里也有小池塘。'],
  },
  {
    keywords: ['玩', '无聊', '滚', '游戏'],
    replies: ['要不要看我在地上打滚？可圆了。', '无聊的话，我们去窗边数云朵吧。'],
  },
  {
    keywords: ['你好', '嗨', '在吗', '名字'],
    replies: ['嘎，你好呀，我是住在这棵大树里的小黄鸭。', '在呢在呢，找我聊天吗？'],
  },
  {
    keywords: ['旅行', '出门', '明信片', '外面'],
    replies: ['等我收拾好小背包，就出门给你寄明信片。', '门外那条小路，通向好多好地方。'],
  },
];

export function pickFallback(message: string): string {
  let hash = 0;
  for (const ch of message) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  for (const rule of RULES) {
    if (rule.keywords.some((k) => message.includes(k))) {
      return rule.replies[hash % rule.replies.length];
    }
  }
  return GENERIC[hash % GENERIC.length];
}