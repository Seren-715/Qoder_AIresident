import { ACTIVITIES, activityAtFurniture } from '../data/life';
import {
  EXTERIOR_DOOR,
  FURNITURE,
  IDLE_SPOT,
  INTERIOR_DOOR,
  SCENES,
  assetUrl,
  duckUrl,
  type DuckPose,
  type FurnitureId,
  type SceneId,
} from '../data/scene';
import { createClock, setClockSpeed, SPEEDS, tickClock, type GameClock, type Speed } from '../sim/clock';
import { advance, createInitialLife, suggestActivity, type LifeState } from '../sim/life';
import { catchUpLife, summarizeAway, type AwaySummary } from '../sim/offline';
import { formatGameTime, toGameMinute } from '../sim/time';
import { clearLife, DEFAULT_NAME, loadLife, saveLife } from '../storage/life';
import { mountChat } from './chat';
import { mountSettings } from './settings';
import { renderProps, sceneBackground } from './props';
import { mountWater, type WaterController } from './water';

export function mountScene(root: HTMLElement): void {
  root.innerHTML = `
    <header class="top">
      <h1>小黄鸭的家</h1>
      <p class="tagline">给只活在聊天框里的 AI 一个看得见的家</p>
    </header>
    <div class="life" aria-label="小黄鸭的生活状态">
      <span class="life-time"></span>
      <div class="life-bars">
        <div class="life-bar" data-stat="fullness">
          <span>饱腹</span>
          <span class="life-track" role="progressbar" aria-label="饱腹" aria-valuemin="0" aria-valuemax="100"><i></i></span>
        </div>
        <div class="life-bar" data-stat="energy">
          <span>体力</span>
          <span class="life-track" role="progressbar" aria-label="体力" aria-valuemin="0" aria-valuemax="100"><i></i></span>
        </div>
        <div class="life-bar" data-stat="mood">
          <span>心情</span>
          <span class="life-track" role="progressbar" aria-label="心情" aria-valuemin="0" aria-valuemax="100"><i></i></span>
        </div>
      </div>
    </div>
    <div class="away" role="status" aria-live="polite" hidden>
      <strong>你不在的时候</strong>
      <p class="away-body"></p>
      <button type="button" class="away-close">知道啦</button>
    </div>
    <div class="scene" role="group" aria-label="小黄鸭的树洞小屋">
      <img class="scene-bg" alt="" />
      <canvas class="water-canvas" aria-hidden="true"></canvas>
      <div class="props props-back"></div>
      <div class="duck" role="button" tabindex="0" aria-label="和小黄鸭聊天">
        <div class="bubble"></div>
        <img class="duck-img" alt="小黄鸭" />
      </div>
      <div class="duck-hit" aria-hidden="true"></div>
      <div class="props props-front"></div>
      <button type="button" class="hotspot hotspot-door" aria-label="进入小屋"></button>
      <button type="button" class="hotspot hotspot-door-in" aria-label="走出小屋"></button>
    </div>
    <div class="controls">
      <div class="switch-group">
        <div class="switch" role="group" aria-label="切换场景">
          <button type="button" data-scene="interior">屋内</button>
          <button type="button" data-scene="exterior">屋外</button>
        </div>
        <div class="switch speed" role="group" aria-label="快进">
          <button type="button" data-speed="1" aria-pressed="true">×1</button>
          <button type="button" data-speed="60" aria-pressed="false">×60</button>
          <button type="button" data-speed="600" aria-pressed="false">×600</button>
        </div>
      </div>
      <p class="caption"></p>
    </div>
    <footer class="foot">第一阶段开发中 · 场景美术预览</footer>
  `;

  const sceneEl = root.querySelector<HTMLElement>('.scene')!;
  const bg = root.querySelector<HTMLImageElement>('.scene-bg')!;
  const waterCanvas = root.querySelector<HTMLCanvasElement>('.water-canvas')!;
  const propsBack = root.querySelector<HTMLElement>('.props-back')!;
  const propsFront = root.querySelector<HTMLElement>('.props-front')!;
  const door = root.querySelector<HTMLButtonElement>('.hotspot-door')!;
  const doorIn = root.querySelector<HTMLButtonElement>('.hotspot-door-in')!;
  const duck = root.querySelector<HTMLElement>('.duck')!;
  const duckHit = root.querySelector<HTMLElement>('.duck-hit')!;
  const duckImg = root.querySelector<HTMLImageElement>('.duck-img')!;
  const bubble = root.querySelector<HTMLElement>('.bubble')!;
  const caption = root.querySelector<HTMLElement>('.caption')!;
  const lifeTime = root.querySelector<HTMLElement>('.life-time')!;
  const lifeFills = {
    fullness: root.querySelector<HTMLElement>('[data-stat="fullness"] i')!,
    energy: root.querySelector<HTMLElement>('[data-stat="energy"] i')!,
    mood: root.querySelector<HTMLElement>('[data-stat="mood"] i')!,
  };
  const lifeTracks = {
    fullness: root.querySelector<HTMLElement>('[data-stat="fullness"] .life-track')!,
    energy: root.querySelector<HTMLElement>('[data-stat="energy"] .life-track')!,
    mood: root.querySelector<HTMLElement>('[data-stat="mood"] .life-track')!,
  };
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-scene]');
  const speedButtons = root.querySelectorAll<HTMLButtonElement>('[data-speed]');
  const away = root.querySelector<HTMLElement>('.away')!;
  const awayBody = root.querySelector<HTMLElement>('.away-body')!;
  const awayClose = root.querySelector<HTMLButtonElement>('.away-close')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentScene: SceneId = 'interior';

  function newSeed(): number {
    return (Math.random() * 0x100000000) >>> 0;
  }

  const loaded = loadLife();
  let name = DEFAULT_NAME;
  let life: LifeState;
  let awaySummary: AwaySummary | null = null;
  if (loaded) {
    name = loaded.name;
    const result = catchUpLife(loaded.state, toGameMinute(Date.now()));
    life = result.state;
    awaySummary = summarizeAway(name, result);
  } else {
    life = createInitialLife({ seed: newSeed(), atMinute: toGameMinute(Date.now()) });
  }
  let clock: GameClock = createClock(life.minute, Date.now());
  const water: WaterController = mountWater(waterCanvas, bg, 'interior', reducedMotion.matches);

  function setDuck(anchor: { x: number; y: number }, pose: DuckPose, text: string): void {
    duck.style.left = `${anchor.x}%`;
    duck.style.top = `${anchor.y}%`;
    duckHit.style.left = `${anchor.x}%`;
    duckHit.style.top = `${anchor.y}%`;
    duckImg.src = duckUrl(pose);
    bubble.textContent = text;
  }

  function renderLife(message: string | null = null): void {
    const activity = life.activity;
    if (activity) {
      const spot = FURNITURE[ACTIVITIES[activity.kind].furniture];
      if (spot.action) setDuck(spot.anchor, spot.action.pose, message ?? spot.action.bubble);
    } else {
      setDuck(
        FURNITURE[IDLE_SPOT.furniture].anchor,
        IDLE_SPOT.pose,
        message ?? IDLE_SPOT.bubble,
      );
    }
    lifeTime.textContent = formatGameTime(life.minute);
    const stats = { fullness: life.fullness, energy: life.energy, mood: life.mood };
    for (const key of ['fullness', 'energy', 'mood'] as const) {
      const value = Math.round(stats[key]);
      lifeFills[key].style.width = `${value}%`;
      lifeTracks[key].setAttribute('aria-valuenow', String(value));
    }
  }

  function suggest(id: FurnitureId): void {
    const target = activityAtFurniture(id);
    if (!target) return;
    const result = suggestActivity(life, target, life.minute);
    life = result.state;
    renderLife(result.message);
  }

  function persist(): void {
    saveLife(name, life);
  }

  function setSpeed(next: Speed): void {
    clock = setClockSpeed(clock, next, Date.now());
    for (const btn of speedButtons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.speed === String(next)));
    }
  }

  function restart(): void {
    clearLife();
    name = DEFAULT_NAME;
    life = createInitialLife({ seed: newSeed(), atMinute: toGameMinute(Date.now()) });
    clock = createClock(life.minute, Date.now());
    away.hidden = true;
    for (const btn of speedButtons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.speed === '1'));
    }
    renderLife();
    persist();
  }

  const spotButtons: HTMLButtonElement[] = [];
  for (const id of Object.keys(FURNITURE) as FurnitureId[]) {
    const spot = FURNITURE[id];
    if (!spot.action) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot hotspot-spot';
    btn.setAttribute('aria-label', spot.name);
    btn.style.left = `${spot.action.area.left}%`;
    btn.style.top = `${spot.action.area.top}%`;
    btn.style.width = `${spot.action.area.width}%`;
    btn.style.height = `${spot.action.area.height}%`;
    btn.addEventListener('click', () => suggest(id));
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
    water.setScene(id);
    caption.textContent = scene.caption;
    duck.style.display = id === 'interior' ? '' : 'none';
    duckHit.style.display = id === 'interior' ? '' : 'none';
    door.style.display = id === 'exterior' ? '' : 'none';
    doorIn.style.display = id === 'interior' ? '' : 'none';
    for (const btn of spotButtons) btn.style.display = id === 'interior' ? '' : 'none';
    for (const btn of buttons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.scene === id));
    }
    renderLife();
  }

  for (const btn of buttons) {
    btn.addEventListener('click', () => show(btn.dataset.scene as SceneId));
  }
  for (const btn of speedButtons) {
    btn.addEventListener('click', () => {
      const next = Number(btn.dataset.speed) as Speed;
      if (!SPEEDS.includes(next)) return;
      setSpeed(next);
    });
  }
  reducedMotion.addEventListener('change', () => {
    renderProps(propsBack, propsFront, currentScene, reducedMotion.matches);
    water.setReduced(reducedMotion.matches);
  });
  const chat = mountChat();
  mountSettings(sceneEl, { onRestart: restart });
  awayClose.addEventListener('click', () => {
    away.hidden = true;
  });
  if (awaySummary) {
    awayBody.textContent = awaySummary.body;
    away.hidden = false;
  }
  duckHit.addEventListener('click', () => chat.open());
  duck.addEventListener('click', () => chat.open());
  duck.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chat.open();
    }
  });
  show('interior');
  persist();

  window.setInterval(() => {
    const tick = tickClock(clock, Date.now());
    clock = tick.clock;
    if (tick.minute <= life.minute) return;
    life = advance(life, tick.minute);
    renderLife();
  }, 250);

  window.setInterval(persist, 10_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist();
  });
  window.addEventListener('pagehide', persist);
}