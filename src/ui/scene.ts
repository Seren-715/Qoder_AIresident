import { FURNITURE, IDLE_SPOT, SCENES, assetUrl, duckUrl, type SceneId } from '../data/scene';

export function mountScene(root: HTMLElement): void {
  root.innerHTML = `
    <header class="top">
      <h1>小黄鸭的家</h1>
      <p class="tagline">给只活在聊天框里的 AI 一个看得见的家</p>
    </header>
    <div class="scene" role="img" aria-label="小黄鸭的树洞小屋">
      <img class="scene-bg" alt="" />
      <div class="duck">
        <div class="bubble"></div>
        <img class="duck-img" alt="小黄鸭" />
      </div>
    </div>
    <div class="controls">
      <div class="switch" role="group" aria-label="切换场景">
        <button type="button" data-scene="interior">屋内</button>
        <button type="button" data-scene="exterior">屋外</button>
      </div>
      <p class="caption"></p>
    </div>
    <footer class="foot">第一阶段开发中 · 场景美术预览</footer>
  `;

  const bg = root.querySelector<HTMLImageElement>('.scene-bg')!;
  const duck = root.querySelector<HTMLElement>('.duck')!;
  const duckImg = root.querySelector<HTMLImageElement>('.duck-img')!;
  const bubble = root.querySelector<HTMLElement>('.bubble')!;
  const caption = root.querySelector<HTMLElement>('.caption')!;
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-scene]');

  const spot = FURNITURE[IDLE_SPOT.furniture].anchor;
  duck.style.left = `${spot.x}%`;
  duck.style.top = `${spot.y}%`;
  duckImg.src = duckUrl(IDLE_SPOT.pose);
  bubble.textContent = IDLE_SPOT.bubble;

  function show(id: SceneId): void {
    const scene = SCENES[id];
    bg.src = assetUrl(scene.image);
    caption.textContent = scene.caption;
    duck.style.display = id === 'interior' ? '' : 'none';
    for (const btn of buttons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.scene === id));
    }
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => show(btn.dataset.scene as SceneId));
  }
  show('interior');
}