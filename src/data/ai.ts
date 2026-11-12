export const AI_PROVIDERS = [
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  {
    id: 'qwen',
    label: 'Qwen（通义）',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
] as const;

export type ProviderId = (typeof AI_PROVIDERS)[number]['id'] | 'custom';

export const TRUSTED_HOSTS = ['api.deepseek.com', 'dashscope.aliyuncs.com'];

export interface AiConfig {
  baseUrl: string;
  model: string;
}

export const DEFAULT_CONFIG: AiConfig = {
  baseUrl: AI_PROVIDERS[0].baseUrl,
  model: AI_PROVIDERS[0].model,
};

export const MAX_MODEL_LENGTH = 64;

export function isTrustedBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && TRUSTED_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function providerOf(baseUrl: string): ProviderId {
  return AI_PROVIDERS.find((p) => p.baseUrl === baseUrl)?.id ?? 'custom';
}