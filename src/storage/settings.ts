import { DEFAULT_CONFIG, isTrustedBaseUrl, MAX_MODEL_LENGTH, type AiConfig } from '../data/ai';

const KEY = 'ai-resident-settings';
const VERSION = 1;

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const data = JSON.parse(raw) as { version?: unknown; config?: Partial<AiConfig> };
    if (data.version !== VERSION) return DEFAULT_CONFIG;
    const { baseUrl, model } = data.config ?? {};
    if (typeof baseUrl !== 'string' || typeof model !== 'string') return DEFAULT_CONFIG;
    if (!isTrustedBaseUrl(baseUrl) || !model.trim() || model.length > MAX_MODEL_LENGTH) {
      return DEFAULT_CONFIG;
    }
    return { baseUrl, model };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAiConfig(config: AiConfig): void {
  localStorage.setItem(KEY, JSON.stringify({ version: VERSION, config }));
}