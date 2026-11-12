import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendChat } from '../src/ai/client';
import { pickFallback } from '../src/ai/fallback';

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
});