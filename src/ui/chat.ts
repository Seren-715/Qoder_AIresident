import { sendChat, type ChatTurn } from '../ai/client';
import type { ChatContext } from '../ai/context';
import { loadChatHistory, saveChatHistory } from '../storage/chat';
import { loadAiConfig } from '../storage/settings';

export interface ChatPanel {
  open(): void;
}

export interface ChatOptions {
  getContext: () => ChatContext;
  /** 聊天面板挂到哪；默认整页。 */
  container?: HTMLElement;
}

export function mountChat(options: ChatOptions): ChatPanel {
  const overlay = document.createElement('div');
  overlay.className = 'chat';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="chat-sheet" role="dialog" aria-label="和小黄鸭聊天">
      <header class="chat-head">
        <strong>和小黄鸭聊天</strong>
        <button type="button" class="chat-close" aria-label="关闭聊天">×</button>
      </header>
      <p class="chat-now"></p>
      <div class="chat-log"></div>
      <p class="chat-loading" hidden>小黄鸭想了想…</p>
      <div class="chat-suggest" hidden>
        <button type="button" class="chat-suggest-btn">你刚才在干嘛？</button>
        <button type="button" class="chat-suggest-btn">写代码卡住了，帮我理一理</button>
        <button type="button" class="chat-suggest-btn">最近出去玩有什么新鲜事？</button>
      </div>
      <form class="chat-form">
        <input type="text" maxlength="500" placeholder="跟它说点什么…" aria-label="聊天输入" />
        <button type="submit">发送</button>
      </form>
    </div>
  `;
  (options.container ?? document.body).appendChild(overlay);

  const log = overlay.querySelector<HTMLElement>('.chat-log')!;
  const nowLine = overlay.querySelector<HTMLElement>('.chat-now')!;
  const loading = overlay.querySelector<HTMLElement>('.chat-loading')!;
  const suggest = overlay.querySelector<HTMLElement>('.chat-suggest')!;
  const form = overlay.querySelector<HTMLFormElement>('.chat-form')!;
  const input = overlay.querySelector<HTMLInputElement>('input')!;
  const history: ChatTurn[] = loadChatHistory();
  let busy = false;

  function append(role: ChatTurn['role'], content: string): void {
    const el = document.createElement('div');
    el.className = role === 'user' ? 'msg msg-user' : 'msg msg-duck';
    el.textContent = content;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  for (const turn of history) append(turn.role, turn.content);

  function refreshNow(context = options.getContext()): void {
    const activity = context.now.activity.startsWith('在')
      ? context.now.activity
      : `在${context.now.activity}`;
    nowLine.textContent = `${context.now.timeLabel} · 我${activity}`;
  }

  function close(): void {
    overlay.hidden = true;
  }

  overlay.querySelector<HTMLButtonElement>('.chat-close')!.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  async function send(message: string): Promise<void> {
    if (!message || busy) return;
    busy = true;
    input.value = '';
    input.disabled = true;
    append('user', message);
    suggest.hidden = true;
    loading.hidden = false;
    const context = options.getContext();
    refreshNow(context);
    const { reply } = await sendChat(message, history.slice(-12), loadAiConfig(), context);
    loading.hidden = true;
    append('assistant', reply);
    history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
    saveChatHistory(history);
    refreshNow();
    busy = false;
    input.disabled = false;
    input.focus();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void send(input.value.trim());
  });
  for (const button of overlay.querySelectorAll<HTMLButtonElement>('.chat-suggest-btn')) {
    button.addEventListener('click', () => void send(button.textContent?.trim() ?? ''));
  }

  return {
    open() {
      overlay.hidden = false;
      refreshNow();
      suggest.hidden = log.children.length > 0;
      input.focus();
    },
  };
}