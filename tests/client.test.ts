import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendChat, sendPostcard } from '../src/ai/client';
import type { ChatContext } from '../src/ai/context';
import { pickFallback } from '../src/ai/fallback';

const CONTEXT: ChatContext = {
  name: 'Qoduck',
  now: {
    atMinute: 12 * 60,
    timeLabel: '1 月 1 日 12:00',
    activity: '看书',
    fullness: 70,
    energy: 80,
    mood: 70,
  },
  recent: ['11:30 看了 30 分钟书'],
};

afterEach(() => vi.unstubAllGlobals());

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('聊天客户端', () => {
  it('成功时返回模型回复', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: true, reply: '嘎！' })));
    expect(await sendChat('hi', [])).toEqual({ reply: '嘎！', fallback: false });
  });

  it('服务未配置时静默走模板', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: false, code: 'service_not_configured' }, 503)));
    const result = await sendChat('我饿了', []);
    expect(result.fallback).toBe(true);
    expect(result.reply).toBe(pickFallback('我饿了'));
  });

  it('网络失败时静默走模板', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const result = await sendChat('你好', []);
    expect(result.fallback).toBe(true);
    expect(result.reply).toBe(pickFallback('你好'));
  });

  it('坏 payload 时静默走模板', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: true, reply: 42 })));
    expect((await sendChat('hi', [])).fallback).toBe(true);
  });

  it('登录页 HTML 不当作成功', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>login</html>', {
      headers: { 'Content-Type': 'text/html' },
    })));
    expect((await sendChat('hi', [])).fallback).toBe(true);
  });

  it('把 API 配置随请求传给 Function', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse({ ok: true, reply: '嘎' }));
    vi.stubGlobal('fetch', fetchMock);
    const config = { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' };
    await sendChat('hi', [], config);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.config).toEqual(config);
  });

  it('把操作和上下文随请求传给 Function', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => jsonResponse({ ok: true, reply: '嘎' }));
    vi.stubGlobal('fetch', fetchMock);
    await sendChat('在干嘛', [], undefined, CONTEXT);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.operation).toBe('chat');
    expect(body.context).toEqual(CONTEXT);
  });

  it('429 限流时静默走模板', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ ok: false, code: 'rate_limited' }, 429)),
    );
    const result = await sendChat('你好', []);
    expect(result.fallback).toBe(true);
    expect(result.reply).toBe(pickFallback('你好'));
  });

  it('失败时用带上下文的模板兜底', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const result = await sendChat('在干嘛', [], undefined, CONTEXT);
    expect(result.fallback).toBe(true);
    expect(result.reply).toBe(pickFallback('在干嘛', CONTEXT));
    expect(result.reply).toContain('看书');
  });
});

describe('明信片客户端', () => {
  const TRIP = {
    destination: '乌镇',
    region: '浙江嘉兴',
    facts: ['乌镇是江南水乡古镇。'],
    departedLabel: '11 月 22 日 09:20',
    returnedLabel: '11 月 22 日 16:05',
    hours: 6.75,
  };

  it('成功时返回模型文案', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: true, text: '乌篷船摇得很稳。' })));
    expect(await sendPostcard(TRIP)).toBe('乌篷船摇得很稳。');
  });

  it('429 限流时静默返回 null（保留模板）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ ok: false, code: 'rate_limited' }, 429)),
    );
    expect(await sendPostcard(TRIP)).toBeNull();
  });

  it('拒答、坏 payload、网络失败都静默返回 null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ ok: false, code: 'postcard_rejected' }, 502)),
    );
    expect(await sendPostcard(TRIP)).toBeNull();

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ ok: true, text: 42 })));
    expect(await sendPostcard(TRIP)).toBeNull();

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await sendPostcard(TRIP)).toBeNull();
  });

  it('登录页 HTML 不当作成功', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } })),
    );
    expect(await sendPostcard(TRIP)).toBeNull();
  });

  it('带上 operation、行程、上下文和 API 配置', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse({ ok: true, text: '嘎' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const config = { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' };
    await sendPostcard(TRIP, config, CONTEXT);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.operation).toBe('postcard');
    expect(body.trip).toEqual(TRIP);
    expect(body.context).toEqual(CONTEXT);
    expect(body.config).toEqual(config);
  });
});
