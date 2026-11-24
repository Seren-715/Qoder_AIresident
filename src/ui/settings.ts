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
        <button type="button" class="settings-item settings-restart">重新开始</button>
        <p class="settings-note">AI 对话与明信片由站长托管，网络繁忙时会自动切换为离线回应。</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function close(): void {
    overlay.hidden = true;
  }

  gear.addEventListener('click', () => {
    overlay.hidden = false;
  });
  overlay.querySelector<HTMLButtonElement>('.settings-close')!.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });
  overlay.querySelector<HTMLButtonElement>('.settings-restart')!.addEventListener('click', () => {
    if (!options.onRestart) return;
    if (!window.confirm('确定要重新开始吗？小黄鸭现在的生活记录会被清空。')) return;
    options.onRestart();
    close();
  });
}