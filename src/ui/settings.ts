import {
  AI_PROVIDERS,
  DEFAULT_CONFIG,
  isTrustedBaseUrl,
  MAX_MODEL_LENGTH,
  providerOf,
  type AiConfig,
} from '../data/ai';
import { loadAiConfig, saveAiConfig } from '../storage/settings';

export interface SettingsOptions {
  onRestart?: () => void;
  /** 面板入口按钮；不传就在场景里自己创建一个。 */
  trigger?: HTMLElement;
}

export function mountSettings(sceneEl: HTMLElement, options: SettingsOptions = {}): void {
  let gear = options.trigger;
  if (!gear) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gear';
    btn.textContent = '设置';
    btn.setAttribute('aria-label', '游戏设置');
    sceneEl.appendChild(btn);
    gear = btn;
  }

  const overlay = document.createElement('div');
  overlay.className = 'settings';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="settings-card" role="dialog" aria-label="游戏设置">
      <header class="settings-head">
        <strong>游戏设置</strong>
        <button type="button" class="settings-close" aria-label="关闭设置">×</button>
      </header>
      <div class="settings-menu">
        <button type="button" class="settings-item">配置API</button>
        <button type="button" class="settings-item settings-restart">重新开始</button>
      </div>
      <form class="settings-form" hidden>
        <label>服务商
          <select class="cfg-provider">
            ${AI_PROVIDERS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('')}
            <option value="custom">自定义</option>
          </select>
        </label>
        <label>接口地址
          <input type="url" class="cfg-base" required />
        </label>
        <label>模型名
          <input type="text" class="cfg-model" maxlength="${MAX_MODEL_LENGTH}" required />
        </label>
        <p class="settings-note">Key 由站长在 Sites Secret 配置，不经过这里。为保护 Key，接口地址只支持 DeepSeek / Qwen 官方域名。</p>
        <p class="settings-error" hidden></p>
        <div class="settings-actions">
          <button type="button" class="settings-back">返回</button>
          <button type="submit">保存</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const menu = overlay.querySelector<HTMLElement>('.settings-menu')!;
  const form = overlay.querySelector<HTMLFormElement>('.settings-form')!;
  const provider = overlay.querySelector<HTMLSelectElement>('.cfg-provider')!;
  const base = overlay.querySelector<HTMLInputElement>('.cfg-base')!;
  const model = overlay.querySelector<HTMLInputElement>('.cfg-model')!;
  const error = overlay.querySelector<HTMLElement>('.settings-error')!;

  function close(): void {
    overlay.hidden = true;
  }
  function showMenu(): void {
    form.hidden = true;
    menu.hidden = false;
    error.hidden = true;
  }
  function fill(config: AiConfig): void {
    provider.value = providerOf(config.baseUrl);
    base.value = config.baseUrl;
    model.value = config.model;
  }

  gear.addEventListener('click', () => {
    overlay.hidden = false;
    showMenu();
  });
  overlay.querySelector<HTMLButtonElement>('.settings-close')!.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });
  overlay.querySelector<HTMLButtonElement>('.settings-item')!.addEventListener('click', () => {
    menu.hidden = true;
    form.hidden = false;
    fill(loadAiConfig());
  });
  overlay.querySelector<HTMLButtonElement>('.settings-restart')!.addEventListener('click', () => {
    if (!options.onRestart) return;
    if (!window.confirm('确定要重新开始吗？小黄鸭现在的生活记录会被清空。')) return;
    options.onRestart();
    close();
  });
  overlay.querySelector<HTMLButtonElement>('.settings-back')!.addEventListener('click', showMenu);
  provider.addEventListener('change', () => {
    const preset = AI_PROVIDERS.find((p) => p.id === provider.value);
    if (preset) {
      base.value = preset.baseUrl;
      model.value = preset.model;
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const config: AiConfig = { baseUrl: base.value.trim().replace(/\/+$/, ''), model: model.value.trim() };
    if (!isTrustedBaseUrl(config.baseUrl)) {
      error.textContent = '为保护 Key，接口地址只支持 DeepSeek / Qwen 官方域名。';
      error.hidden = false;
      return;
    }
    if (!config.model || config.model.length > MAX_MODEL_LENGTH) {
      error.textContent = '模型名不能为空，且不超过 64 字。';
      error.hidden = false;
      return;
    }
    saveAiConfig(config);
    showMenu();
  });

  fill(DEFAULT_CONFIG);
}