import {
  EXTERIOR_DOOR,
  FURNITURE,
  IDLE_SPOT,
  INTERIOR_DOOR,
  SCENES,
  assetUrl,
  duckUrl,
  type DuckPose,
  type SceneId,
} from '../data/scene';
import { WATER, clipPath } from '../data/water';
import { mountChat } from './chat';
import { mountSettings } from './settings';
import { renderProps, sceneBackground } from './props';

export function mountScene(root: HTMLElement): void {
  root.innerHTML = `
    <header class="top">
      <h1>小黄鸭的家</h1>
      <p class="tagline">给只活在聊天框里的 AI 一个看得见的家</p>
    </header>
    <div class="scene" role="group" aria-label="小黄鸭的树洞小屋">
      <img class="scene-bg" alt="" />
      <div class="water-layer"></div>
      <div class="props props-back"></div>
      <div class="duck" role="button" tabindex="0" aria-label="和小黄鸭聊天">
        <div class="bubble"></div>
        <img class="duck-img" alt="小黄鸭" />
      </div>
      <div class="props props-front"></div>
      <button type="button" class="hotspot hotspot-door" aria-label="进入小屋"></button>
      <button type="button" class="hotspot hotspot-door-in" aria-label="走出小屋"></button>
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

  const sceneEl = root.querySelector<HTMLElement>('.scene')!;
  const bg = root.querySelector<HTMLImageElement>('.scene-bg')!;
  const waterLayer = root.querySelector<HTMLElement>('.water-layer')!;
  const propsBack = root.querySelector<HTMLElement>('.props-back')!;
  const propsFront = root.querySelector<HTMLElement>('.props-front')!;
  const door = root.querySelector<HTMLButtonElement>('.hotspot-door')!;
  const doorIn = root.querySelector<HTMLButtonElement>('.hotspot-door-in')!;
  const duck = root.querySelector<HTMLElement>('.duck')!;
  const duckImg = root.querySelector<HTMLImageElement>('.duck-img')!;
  const bubble = root.querySelector<HTMLElement>('.bubble')!;
  const caption = root.querySelector<HTMLElement>('.caption')!;
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-scene]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentScene: SceneId = 'interior';

  function setDuck(anchor: { x: number; y: number }, pose: DuckPose, text: string): void {
    duck.style.left = `${anchor.x}%`;
    duck.style.top = `${anchor.y}%`;
    duckImg.src = duckUrl(pose);
    bubble.textContent = text;
  }

  const spotButtons: HTMLButtonElement[] = [];
  for (const spot of Object.values(FURNITURE)) {
    if (!spot.action) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot hotspot-spot';
    btn.setAttribute('aria-label', spot.name);
    btn.style.left = `${spot.action.area.left}%`;
    btn.style.top = `${spot.action.area.top}%`;
    btn.style.width = `${spot.action.area.width}%`;
    btn.style.height = `${spot.action.area.height}%`;
    btn.addEventListener('click', () => setDuck(spot.anchor, spot.action!.pose, spot.action!.bubble));
    sceneEl.appendChild(btn);
    spotButtons.push(btn);
  }

  door.style.left = `${EXTERIOR_DOOR.left}%`;
  door.style.top = `${EXTERIOR_DOOR.top}%`;
  door.style.width = `${EXTERIOR_DOOR.width}%`;
  door.style.height = `${EXTERIOR_DOOR.height}%`;
  door.addEventListener('click', () => show('interior'));
  doorIn.style.left = `${INTERIOR_DOOR.left}%`;
  doorIn.style.top = `${INTERIOR_DOOR.top}%`;
  doorIn.style.width = `${INTERIOR_DOOR.width}%`;
  doorIn.style.height = `${INTERIOR_DOOR.height}%`;
  doorIn.addEventListener('click', () => show('exterior'));

  function show(id: SceneId): void {
    currentScene = id;
    const scene = SCENES[id];
    bg.src = assetUrl(sceneBackground(id));
    renderProps(propsBack, propsFront, id, reducedMotion.matches);
    waterLayer.innerHTML = WATER[id]
      .map(
        (region) => `
        <div class="water" style="clip-path: ${clipPath(region)}">
          <div class="water-flow"></div>
          <div class="water-flow water-flow-b"></div>
          ${region.ripples
            .map(
              (r) =>
                `<span class="ripple" style="left:${r.x}%;top:${r.y}%;width:${r.width}%;animation-delay:${r.delay}s"></span>`,
            )
            .join('')}
        </div>`,
      )
      .join('');
    caption.textContent = scene.caption;
    duck.style.display = id === 'interior' ? '' : 'none';
    door.style.display = id === 'exterior' ? '' : 'none';
    doorIn.style.display = id === 'interior' ? '' : 'none';
    for (const btn of spotButtons) btn.style.display = id === 'interior' ? '' : 'none';
    for (const btn of buttons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.scene === id));
    }
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => show(btn.dataset.scene as SceneId));
  }
  reducedMotion.addEventListener('change', () => {
    renderProps(propsBack, propsFront, currentScene, reducedMotion.matches);
  });
  setDuck(FURNITURE[IDLE_SPOT.furniture].anchor, IDLE_SPOT.pose, IDLE_SPOT.bubble);
  const chat = mountChat();
  mountSettings(sceneEl);
  duck.addEventListener('click', () => chat.open());
  duck.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chat.open();
    }
  });
  show('interior');
}