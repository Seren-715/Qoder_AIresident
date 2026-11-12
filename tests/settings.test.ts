import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/data/ai';
import { loadAiConfig, saveAiConfig } from '../src/storage/settings';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

afterEach(() => store.clear());

describe('API 配置存储', () => {
  it('无存档时用默认配置', () => {
    expect(loadAiConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('保存后能读回', () => {
    const config = { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' };
    saveAiConfig(config);
    expect(loadAiConfig()).toEqual(config);
  });

  it('坏 JSON、错版本、不可信地址都回默认', () => {
    store.set('ai-resident-settings', '{bad');
    expect(loadAiConfig()).toEqual(DEFAULT_CONFIG);
    store.set('ai-resident-settings', JSON.stringify({ version: 99, config: DEFAULT_CONFIG }));
    expect(loadAiConfig()).toEqual(DEFAULT_CONFIG);
    store.set(
      'ai-resident-settings',
      JSON.stringify({ version: 1, config: { baseUrl: 'https://evil.example.com', model: 'x' } }),
    );
    expect(loadAiConfig()).toEqual(DEFAULT_CONFIG);
  });
});