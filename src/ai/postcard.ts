import type { PostcardStoryEntry } from '../storage/postcards';

export interface PostcardStoryJob {
  initial: PostcardStoryEntry;
  /** 后台请求的完成信号；命中缓存时为 null。 */
  pending: Promise<void> | null;
}

export interface PostcardStoryOptions {
  tripId: string;
  template: string;
  cached?: PostcardStoryEntry;
  /** 返回合格文案，失败/超时返回 null。 */
  request: () => Promise<string | null>;
  /** 当前是否还在看这张明信片。 */
  isCurrent: () => boolean;
  onUpdate: (entry: PostcardStoryEntry) => void;
  save: (tripId: string, entry: PostcardStoryEntry) => void;
}

/**
 * 先给模板故事，后台问模型；成功且还在看这张就替换，并写入缓存。
 * 失败也把模板写进缓存，避免每次打开都重复请求。
 */
export function startPostcardStory(options: PostcardStoryOptions): PostcardStoryJob {
  if (options.cached) return { initial: options.cached, pending: null };

  const initial: PostcardStoryEntry = { text: options.template, source: 'template' };
  const pending = (async () => {
    let text: string | null = null;
    try {
      text = await options.request();
    } catch {
      text = null;
    }
    const entry: PostcardStoryEntry = text ? { text, source: 'model' } : initial;
    options.save(options.tripId, entry);
    if (text && options.isCurrent()) options.onUpdate(entry);
  })();

  return { initial, pending };
}