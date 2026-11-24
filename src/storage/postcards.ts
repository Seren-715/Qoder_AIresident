export const POSTCARDS_KEY = 'ai-resident-postcards';
const MAX_TEXT = 400;

export interface PostcardStoryEntry {
  text: string;
  source: 'model' | 'template';
}

export type PostcardCache = Record<string, PostcardStoryEntry>;

export function loadPostcardCache(): PostcardCache {
  try {
    const raw = localStorage.getItem(POSTCARDS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
    const cache: PostcardCache = {};
    for (const [tripId, value] of Object.entries(data as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const entry = value as Record<string, unknown>;
      if (typeof entry.text !== 'string' || !entry.text.trim() || entry.text.length > MAX_TEXT) {
        continue;
      }
      if (entry.source !== 'model' && entry.source !== 'template') continue;
      cache[tripId] = { text: entry.text, source: entry.source };
    }
    return cache;
  } catch {
    return {};
  }
}

export function savePostcardStory(tripId: string, entry: PostcardStoryEntry): void {
  try {
    const cache = loadPostcardCache();
    cache[tripId] = entry;
    localStorage.setItem(POSTCARDS_KEY, JSON.stringify(cache));
  } catch {
    // 存储不可用时只在本次会话里显示，不打断界面。
  }
}

export function clearPostcards(): void {
  try {
    localStorage.removeItem(POSTCARDS_KEY);
  } catch {
    // 忽略清理失败。
  }
}