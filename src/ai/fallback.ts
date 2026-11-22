import type { ChatContext } from './context';

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

function hash(message: string): number {
  let value = 0;
  for (const ch of message) value = (value * 31 + ch.codePointAt(0)!) >>> 0;
  return value;
}

function contextReply(message: string, context: ChatContext): string | null {
  const { now } = context;
  const traveling = /^在(.+)旅行$/.exec(now.activity)?.[1];

  if (traveling) {
    if (/在干嘛|做什么|干什么|在做什么|忙什么|在吗/.test(message)) {
      return `我在${traveling}呢，晚点回来讲给你听。`;
    }
    if (/旅行|出门|明信片|外面|好玩/.test(message)) {
      return `我在${traveling}，路上看到好多东西，回去讲给你听。`;
    }
  }

  if (/在干嘛|做什么|干什么|在做什么|忙什么/.test(message)) {
    if (now.activity === '睡觉') return '呼……我在睡觉呢。';
    if (now.activity === '吃饭') return '我在吃饭呢，嘎。';
    if (now.activity === '看书') return '我在看书，正看到有意思的地方。';
    if (now.activity === '写代码') return '我在写代码，刚被一个 bug 卡住。';
    if (now.activity === '发呆') return '我在窗边发呆，看云飘过去。';
    if (now.activity === '打滚') return '我在地毯上打滚，可圆了。';
    return `我在${now.activity}，陪你待一会儿。`;
  }

  if (/饿|吃|饭|零食/.test(message)) {
    if (now.activity === '吃饭') return '正在吃饭呢，嘎。';
    if (now.fullness < 30) return '有点饿了，等下就去饭碗那边。';
    return '还不饿，饭碗里还有吃的。';
  }

  if (/睡|困|累|休息/.test(message)) {
    if (now.activity === '睡觉') return '呼……我睡着呢。';
    if (now.energy < 30) return '有点困了，想回床上躺一会儿。';
    return '还不困，先陪你待会儿。';
  }

  if (/看书|读书|书/.test(message)) {
    if (now.activity === '看书') return '正在看书呢。';
    return '想找本书翻翻，你要一起看吗？';
  }

  if (/代码|写|工作|bug/i.test(message)) {
    if (now.activity === '写代码') return '正在写代码，别催我。';
    return '等会儿去写两行，先陪你聊。';
  }

  return null;
}

export function pickFallback(message: string, context?: ChatContext): string {
  if (context) {
    const reply = contextReply(message, context);
    if (reply) return reply;
  }

  const code = hash(message);
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => message.includes(keyword))) {
      return rule.replies[code % rule.replies.length];
    }
  }

  const generic = GENERIC[code % GENERIC.length];
  if (!context) return generic;
  const activity = context.now.activity.startsWith('在')
    ? context.now.activity
    : `在${context.now.activity}`;
  return `我${activity}。${generic}`;
}