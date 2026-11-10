const SYSTEM_PROMPT =
  '你是一只住在树洞小屋里的 Qoder 小黄鸭，语气温柔轻松，用简体中文回答，每次不超过三句话。';

const MAX_MESSAGE = 500;
const MAX_HISTORY = 12;
const MAX_MODEL = 64;
const UPSTREAM_TIMEOUT_MS = 15000;
const TRUSTED_HOSTS = ['api.deepseek.com', 'dashscope.aliyuncs.com'];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseInput(
  data: unknown,
): { message: string; history: ChatMessage[]; baseUrl?: string; model?: string } | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as Record<string, unknown>;
  if (typeof body.message !== 'string') return null;
  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE) return null;
  const history: ChatMessage[] = [];
  if (body.history !== undefined) {
    if (!Array.isArray(body.history) || body.history.length > MAX_HISTORY) return null;
    for (const item of body.history) {
      if (!item || typeof item !== 'object') return null;
      const m = item as Record<string, unknown>;
      if (m.role !== 'user' && m.role !== 'assistant') return null;
      if (typeof m.content !== 'string' || m.content.length > MAX_MESSAGE) return null;
      history.push({ role: m.role, content: m.content });
    }
  }
  let baseUrl: string | undefined;
  let model: string | undefined;
  if (body.config !== undefined) {
    if (!body.config || typeof body.config !== 'object') return null;
    const config = body.config as Record<string, unknown>;
    if (config.baseUrl !== undefined) {
      if (typeof config.baseUrl !== 'string') return null;
      let parsed: URL;
      try {
        parsed = new URL(config.baseUrl);
      } catch {
        return null;
      }
      // The Secret key must never be sent to a caller-chosen untrusted host.
      if (parsed.protocol !== 'https:' || !TRUSTED_HOSTS.includes(parsed.hostname)) return null;
      baseUrl = config.baseUrl.replace(/\/+$/, '');
    }
    if (config.model !== undefined) {
      if (typeof config.model !== 'string' || !config.model.trim() || config.model.length > MAX_MODEL) {
        return null;
      }
      model = config.model.trim();
    }
  }
  return { message, history, baseUrl, model };
}

export async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ ok: false, code: 'method_not_allowed' }, 405);
  }
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, code: 'invalid_input' }, 400);
  }
  const input = parseInput(data);
  if (!input) return json({ ok: false, code: 'invalid_input' }, 400);

  const env = (globalThis as { Deno?: { env: { get(name: string): string | undefined } } }).Deno?.env;
  const apiKey = env?.get('LLM_API_KEY');
  if (!apiKey) return json({ ok: false, code: 'service_not_configured' }, 503);
  const base = (input.baseUrl || env?.get('LLM_BASE_URL') || 'https://api.deepseek.com').replace(
    /\/+$/,
    '',
  );
  const model = input.model || env?.get('LLM_MODEL') || 'deepseek-chat';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...input.history,
          { role: 'user', content: input.message },
        ],
        max_tokens: 200,
      }),
      signal: controller.signal,
    });
  } catch {
    return json({ ok: false, code: 'upstream_unavailable' }, 502);
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) return json({ ok: false, code: 'upstream_error' }, 502);
  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch {
    return json({ ok: false, code: 'upstream_error' }, 502);
  }
  const choice = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0];
  const reply = choice?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) {
    return json({ ok: false, code: 'upstream_error' }, 502);
  }
  return json({ ok: true, reply: reply.trim() });
}