import { sendChat, type ChatTurn } from '../ai/client';
import type { ChatContext } from '../ai/context';
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
  const form = overlay.querySelector<HTMLFormElement>('.chat-form')!;
  const input = overlay.querySelector<HTMLInputElement>('input')!;
  const history: ChatTurn[] = [];
  let busy = false;

  function append(role: ChatTurn['role'], content: string): void {
    const el = document.createElement('div');
    el.className = role === 'user' ? 'msg msg-user' : 'msg msg-duck';
    el.textContent = content;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function refreshNow(context = options.getContext()): void {
    nowLine.textContent = `${context.now.timeLabel} · 我在${context.now.activity}`;
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    busy = true;
    input.value = '';
    input.disabled = true;
    append('user', message);
    loading.hidden = false;
    const context = options.getContext();
    refreshNow(context);
    const { reply } = await sendChat(message, history.slice(-12), loadAiConfig(), context);
    loading.hidden = true;
    append('assistant', reply);
    history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
    refreshNow();
    busy = false;
    input.disabled = false;
    input.focus();
  });

  return {
    open() {
      overlay.hidden = false;
      refreshNow();
      input.focus();
    },
  };
}