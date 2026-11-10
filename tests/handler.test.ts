import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../functions/handler';

function post(body: unknown): Request {
  return new Request('http://local/functions/v1/app', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function setKey(key: string | undefined): void {
  (globalThis as Record<string, unknown>).Deno = {
    env: { get: (name: string) => (name === 'LLM_API_KEY' ? key : undefined) },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as Record<string, unknown>).Deno;
});

describe('聊天 Function', () => {
  it('拒绝非 POST', async () => {
    const res = await handler(new Request('http://local/'));
    expect(res.status).toBe(405);
  });

  it('拒绝坏输入', async () => {
    setKey('test-key');
    expect((await handler(post({}))).status).toBe(400);
    expect((await handler(post({ message: 'x'.repeat(501) }))).status).toBe(400);
    expect((await handler(post({ message: 'hi', history: 'no' }))).status).toBe(400);
    expect((await handler(post({ message: 'hi', history: [{ role: 'system', content: 'x' }] }))).status).toBe(400);
  });

  it('缺 Key 返回稳定错误码而不泄环境', async () => {
    setKey(undefined);
    const res = await handler(post({ message: 'hi' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, code: 'service_not_configured' });
  });

  it('有 Key 时透传过滤后的回复', async () => {
    setKey('test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: ' 嘎，你好呀 ' } }] }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const res = await handler(post({ message: 'hi', history: [{ role: 'user', content: '早' }] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, reply: '嘎，你好呀' });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call[0])).toBe('https://api.deepseek.com/chat/completions');
    const sent = JSON.parse((call[1] as RequestInit).body as string);
    expect(sent.messages[0].role).toBe('system');
    expect(sent.messages.at(-1)).toEqual({ role: 'user', content: 'hi' });
  });

  it('上游失败不泄原始错误', async () => {
    setKey('test-key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('secret detail', { status: 500 })));
    const res = await handler(post({ message: 'hi' }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, code: 'upstream_error' });
  });

  it('上游网络异常走 unavailable', async () => {
    setKey('test-key');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('boom'); }));
    const res = await handler(post({ message: 'hi' }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, code: 'upstream_unavailable' });
  });
});