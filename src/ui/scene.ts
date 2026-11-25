import { buildChatContext } from '../ai/context';
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
import { activityLine, travelReturnLine } from '../data/chatter';
import { DESTINATIONS } from '../data/travel';
import { createClock, setClockSpeed, SPEEDS, tickClock, type GameClock, type Speed } from '../sim/clock';
import {
  advance,
  createStarterLife,
  markTripRead,
  suggestActivity,
  suggestTravel,
  type LifeState,
} from '../sim/life';
import { catchUpLife, catchUpTarget, summarizeAway, type AwaySummary } from '../sim/offline';
import { formatClock, formatDateLabel, toGameMinute } from '../sim/time';
import { clearChatHistory } from '../storage/chat';
import { clearLife, DEFAULT_NAME, loadLife, saveLife } from '../storage/life';
import { clearPostcards } from '../storage/postcards';
import { mountChat } from './chat';
import { mountPostcards } from './postcards';
import { mountSettings } from './settings';
import { renderProps, sceneBackground } from './props';
import { tintCss, tintForMinute } from './tint';
import { mountWater, type WaterController } from './water';

const SPEED_LABELS: Record<Speed, string> = { 1: '×1', 60: '×60', 600: '×600' };
const STAT_LABELS = { fullness: '饱腹', energy: '体力', mood: '心情' } as const;
const HINT_DURATION_MS = 3000;
const HINT_SESSION_KEY = 'ai-resident-hints-shown';
const INTRO_SESSION_KEY = 'ai-resident-intro-seen';

const BOWL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11h18a9 9 0 0 1-18 0z" fill="#e9b949" stroke="#6b4224" stroke-width="1.6"/><path d="M8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4" fill="none" stroke="#6b4224" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const MOON_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3a8 8 0 1 0 5 13A9 9 0 0 1 16 3z" fill="#8fc79a" stroke="#4d6b48" stroke-width="1.6"/></svg>`;
const HEART_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="#e89ab0" stroke="#8a3d52" stroke-width="1.6"/></svg>`;
const GEAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="#fbe9c8" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>`;

export function mountScene(root: HTMLElement): void {
  root.innerHTML = `
    <div class="stage">
      <div class="scene" role="group" aria-label="小黄鸭的树洞小屋">
        <img class="scene-bg" alt="" />
        <canvas class="water-canvas" aria-hidden="true"></canvas>
        <div class="scene-tint" aria-hidden="true"></div>
        <div class="props props-back"></div>
        <div class="duck" role="button" tabindex="0" aria-label="和小黄鸭聊天">
          <div class="bubble"></div>
          <img class="duck-img" alt="小黄鸭" />
          <span class="duck-tag">点我聊聊</span>
        </div>
        <div class="duck-hit" aria-hidden="true"></div>
        <div class="props props-front"></div>
        <button type="button" class="hotspot hotspot-door" aria-label="进入小屋"><span class="hotspot-tag"></span></button>
        <button type="button" class="hotspot hotspot-door-in" aria-label="走出小屋"><span class="hotspot-tag"></span></button>
        <button type="button" class="hotspot hotspot-photo-wall" aria-label="看看明信片"><span class="hotspot-tag">看看明信片</span></button>
        <button type="button" class="hotspot hotspot-mailbox" aria-label="信箱"><span class="hotspot-tag">信箱</span><span class="mail-dot" hidden></span></button>
        <button type="button" class="hotspot hotspot-signpost" aria-label="路牌"><span class="hotspot-tag">建议它出去走走</span></button>
        <img class="road-duck" alt="" role="button" tabindex="0" aria-label="和小黄鸭聊天" hidden />
        <div class="travel-note" role="button" tabindex="0" aria-label="和小黄鸭聊天" hidden><span class="travel-note-text"></span></div>
        <div class="chrome">
          <div class="note cal-note">
            <div class="cal-time">--:--</div>
            <div class="cal-date"></div>
            <div class="cal-travel" hidden></div>
            <div class="cal-row" data-stat="fullness">${BOWL_ICON}<span class="cal-bar"><i></i></span></div>
            <div class="cal-row" data-stat="energy">${MOON_ICON}<span class="cal-bar"><i></i></span></div>
            <div class="cal-row" data-stat="mood">${HEART_ICON}<span class="cal-bar"><i></i></span></div>
          </div>
          <div class="wood-buttons">
            <button type="button" class="wood-btn speed-btn" aria-label="快进" title="快进">×1</button>
            <button type="button" class="wood-btn gear-btn" aria-label="游戏设置" title="设置">${GEAR_ICON}</button>
          </div>
          <button type="button" class="wood-btn help-btn" aria-label="看看这里能点什么" title="看看这里能点什么">?</button>
          <div class="note away" role="status" aria-live="polite" hidden>
            <strong>你不在的时候</strong>
            <p class="away-body"></p>
            <button type="button" class="away-close">知道啦</button>
            <button type="button" class="away-mail" hidden>去邮箱看看</button>
          </div>
          <div class="sign-bubble" role="status" hidden></div>
        </div>
        <div class="intro" hidden>
          <div class="intro-sign" role="dialog" aria-label="小黄鸭的家">
            <h2>小黄鸭的家</h2>
            <p>给只活在聊天框里的 AI 一个看得见的家</p>
            <button type="button" class="intro-go">推门进去</button>
          </div>
        </div>
      </div>
      <aside class="side-panel">
        <div class="side-slot"></div>
        <p class="rotate-hint">横过来看更舒服</p>
      </aside>
    </div>
  `;

  const stageEl = root.querySelector<HTMLElement>('.stage')!;
  const sceneEl = root.querySelector<HTMLElement>('.scene')!;
  const chromeEl = root.querySelector<HTMLElement>('.chrome')!;
  const bg = root.querySelector<HTMLImageElement>('.scene-bg')!;
  const waterCanvas = root.querySelector<HTMLCanvasElement>('.water-canvas')!;
  const tintEl = root.querySelector<HTMLElement>('.scene-tint')!;
  const propsBack = root.querySelector<HTMLElement>('.props-back')!;
  const propsFront = root.querySelector<HTMLElement>('.props-front')!;
  const door = root.querySelector<HTMLButtonElement>('.hotspot-door')!;
  const doorIn = root.querySelector<HTMLButtonElement>('.hotspot-door-in')!;
  const duck = root.querySelector<HTMLElement>('.duck')!;
  const duckHit = root.querySelector<HTMLElement>('.duck-hit')!;
  const duckImg = root.querySelector<HTMLImageElement>('.duck-img')!;
  const bubble = root.querySelector<HTMLElement>('.bubble')!;
  const calNote = root.querySelector<HTMLElement>('.cal-note')!;
  const calTime = root.querySelector<HTMLElement>('.cal-time')!;
  const calDate = root.querySelector<HTMLElement>('.cal-date')!;
  const calTravel = root.querySelector<HTMLElement>('.cal-travel')!;
  const calRows = {
    fullness: root.querySelector<HTMLElement>('.cal-row[data-stat="fullness"]')!,
    energy: root.querySelector<HTMLElement>('.cal-row[data-stat="energy"]')!,
    mood: root.querySelector<HTMLElement>('.cal-row[data-stat="mood"]')!,
  };
  const calFills = {
    fullness: calRows.fullness.querySelector<HTMLElement>('i')!,
    energy: calRows.energy.querySelector<HTMLElement>('i')!,
    mood: calRows.mood.querySelector<HTMLElement>('i')!,
  };
  const speedBtn = root.querySelector<HTMLButtonElement>('.speed-btn')!;
  const gearBtn = root.querySelector<HTMLButtonElement>('.gear-btn')!;
  const helpBtn = root.querySelector<HTMLButtonElement>('.help-btn')!;
  const away = root.querySelector<HTMLElement>('.away')!;
  const awayBody = root.querySelector<HTMLElement>('.away-body')!;
  const awayClose = root.querySelector<HTMLButtonElement>('.away-close')!;
  const awayMail = root.querySelector<HTMLButtonElement>('.away-mail')!;
  const photoWall = root.querySelector<HTMLButtonElement>('.hotspot-photo-wall')!;
  const mailbox = root.querySelector<HTMLButtonElement>('.hotspot-mailbox')!;
  const mailDot = root.querySelector<HTMLElement>('.mail-dot')!;
  const mailboxTag = mailbox.querySelector<HTMLElement>('.hotspot-tag')!;
  const signpost = root.querySelector<HTMLButtonElement>('.hotspot-signpost')!;
  const signBubble = root.querySelector<HTMLElement>('.sign-bubble')!;
  const roadDuck = root.querySelector<HTMLImageElement>('.road-duck')!;
  const travelNote = root.querySelector<HTMLElement>('.travel-note')!;
  const travelNoteText = root.querySelector<HTMLElement>('.travel-note-text')!;
  const intro = root.querySelector<HTMLElement>('.intro')!;
  const introGo = root.querySelector<HTMLButtonElement>('.intro-go')!;
  const sideSlot = root.querySelector<HTMLElement>('.side-slot')!;
  const portraitQuery = window.matchMedia('(max-width: 600px) and (orientation: portrait)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentScene: SceneId = 'interior';
  let hintTimer: number | null = null;
  let signTimer: number | null = null;

  function newSeed(): number {
    return (Math.random() * 0x100000000) >>> 0;
  }

  function newSaveId(): string {
    return `s${Date.now().toString(36)}-${Math.floor(Math.random() * 0x100000000).toString(36)}`;
  }

  const loaded = loadLife();
  let name = DEFAULT_NAME;
  let life: LifeState;
  let awaySummary: AwaySummary | null = null;
  let awaySummaryText: string | null = null;
  if (loaded) {
    name = loaded.name;
    const realNow = toGameMinute(Date.now());
    const target = catchUpTarget(loaded.state.minute, loaded.aheadMinutes, realNow);
    const result = catchUpLife(loaded.state, target);
    life = result.state;
    awaySummary = summarizeAway(name, result);
    awaySummaryText = awaySummary?.body ?? null;
  } else {
    life = createStarterLife({
      seed: newSeed(),
      atMinute: toGameMinute(Date.now()),
      saveId: newSaveId(),
    });
  }
  let chatterText: string | null = null;
  let chatterTimer: number | null = null;
  let lastActivityId: string | null = life.activity?.id ?? null;
  let lastTripCount = life.trips.length;
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

  function noteActivityChange(): void {
    const id = life.activity?.id ?? null;
    if (id === lastActivityId) return;
    lastActivityId = id;
    const returned = life.trips.length > lastTripCount;
    lastTripCount = life.trips.length;
    const activity = life.activity;
    if (!activity) return;
    const line =
      returned && activity.kind !== 'travel'
        ? travelReturnLine(activity.id)
        : activityLine(activity.kind, activity.id);
    chatterText = line;
    if (chatterTimer !== null) window.clearTimeout(chatterTimer);
    chatterTimer = window.setTimeout(() => {
      chatterTimer = null;
      chatterText = null;
      renderLife();
    }, 6000);
  }

  function renderChrome(): void {
    const tint = tintForMinute(life.minute);
    tintEl.style.backgroundColor = tintCss(tint);
    sceneEl.classList.toggle('is-night', tint.opacity >= 0.25);
    calTime.textContent = formatClock(life.minute);
    calDate.textContent = formatDateLabel(life.minute);

    if (life.activity?.kind === 'travel' && life.activity.destinationId) {
      const destination = DESTINATIONS.find((d) => d.id === life.activity!.destinationId);
      calTravel.textContent = `旅行中 · ${destination?.name ?? '远方'}`;
      calTravel.hidden = false;
    } else {
      calTravel.hidden = true;
    }

    const stats = { fullness: life.fullness, energy: life.energy, mood: life.mood };
    for (const key of ['fullness', 'energy', 'mood'] as const) {
      const value = Math.round(stats[key]);
      calFills[key].style.width = `${value}%`;
      calRows[key].dataset.value = `${STAT_LABELS[key]} ${value}`;
    }
    speedBtn.textContent = SPEED_LABELS[clock.speed];
  }

  function updateBadges(): void {
    const unread = life.trips.filter((trip) => !trip.read).length;
    mailDot.hidden = unread === 0;
    mailDot.textContent = String(unread);
    mailboxTag.textContent = unread > 0 ? `信箱 · ${unread} 张新明信片` : '信箱';
    awayMail.hidden = unread === 0;
  }

  function updateTravelUi(): void {
    const activity = life.activity;
    const traveling = activity?.kind === 'travel';
    const destination =
      activity?.kind === 'travel' && activity.destinationId
        ? DESTINATIONS.find((d) => d.id === activity.destinationId)
        : undefined;

    travelNote.hidden = !(traveling && currentScene === 'interior');
    if (traveling && activity) {
      travelNoteText.textContent = `去${destination?.name ?? '远方'}了，大概 ${formatClock(
        activity.endsAt,
      )} 回来`;
    }

    const nearRoad =
      activity?.kind === 'travel' &&
      (life.minute - activity.startedAt <= 30 || activity.endsAt - life.minute <= 30);
    roadDuck.hidden = !(nearRoad && currentScene === 'exterior');
    if (!roadDuck.hidden) roadDuck.src = duckUrl('travel');
  }

  function showSignBubble(text: string): void {
    signBubble.textContent = text;
    signBubble.hidden = false;
    if (signTimer !== null) window.clearTimeout(signTimer);
    signTimer = window.setTimeout(() => {
      signBubble.hidden = true;
      signTimer = null;
    }, 3500);
  }

  function suggestBySign(): void {
    const result = suggestTravel(life, life.minute);
    life = result.state;
    renderLife();
    const destination =
      life.activity?.kind === 'travel' && life.activity.destinationId
        ? DESTINATIONS.find((d) => d.id === life.activity!.destinationId)
        : undefined;
    showSignBubble(result.message ?? (destination ? `去${destination.name}啦` : '出门走走吧'));
  }

  function renderLife(message: string | null = null): void {
    noteActivityChange();
    const activity = life.activity;
    const line = message ?? chatterText;
    if (activity?.kind === 'travel') {
      // 出门旅行中：鸭子、点击区都藏起来，别挡住门；只在有回复时留一个气泡。
      setDuck(FURNITURE.door.anchor, 'sit', line ?? '');
      duckImg.style.display = 'none';
      duckHit.style.display = 'none';
      duck.style.visibility = 'hidden';
      bubble.style.visibility = 'visible';
      duck.classList.remove('is-hovered');
    } else {
      duckImg.style.display = '';
      duckHit.style.display = currentScene === 'interior' ? '' : 'none';
      duck.style.visibility = '';
      bubble.style.visibility = '';
      const furniture = activity ? ACTIVITIES[activity.kind].furniture : undefined;
      const spot = furniture ? FURNITURE[furniture] : undefined;
      if (spot?.action) {
        setDuck(spot.anchor, spot.action.pose, line ?? spot.action.bubble);
      } else {
        setDuck(
          FURNITURE[IDLE_SPOT.furniture].anchor,
          IDLE_SPOT.pose,
          line ?? IDLE_SPOT.bubble,
        );
      }
    }
    renderChrome();
    updateTravelUi();
    updateBadges();
  }

  function suggest(id: FurnitureId): void {
    const target = activityAtFurniture(id);
    if (!target) return;
    const result = suggestActivity(life, target, life.minute);
    life = result.state;
    renderLife(result.message);
  }

  function persist(): void {
    saveLife(name, life, life.minute - toGameMinute(Date.now()));
  }

  function setSpeed(next: Speed): void {
    clock = setClockSpeed(clock, next, Date.now());
    renderChrome();
  }

  function restart(): void {
    clearLife();
    clearPostcards();
    clearChatHistory();
    if (chatterTimer !== null) {
      window.clearTimeout(chatterTimer);
      chatterTimer = null;
    }
    chatterText = null;
    name = DEFAULT_NAME;
    life = createStarterLife({
      seed: newSeed(),
      atMinute: toGameMinute(Date.now()),
      saveId: newSaveId(),
    });
    lastActivityId = life.activity?.id ?? null;
    lastTripCount = life.trips.length;
    clock = createClock(life.minute, Date.now());
    away.hidden = true;
    awaySummaryText = null;
    renderLife();
    persist();
  }

  function showHints(): void {
    sceneEl.classList.add('hints-on');
    if (hintTimer !== null) window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      sceneEl.classList.remove('hints-on');
      hintTimer = null;
    }, HINT_DURATION_MS);
  }

  function autoPlayHintsOnce(): void {
    try {
      if (window.sessionStorage.getItem(HINT_SESSION_KEY)) return;
      window.sessionStorage.setItem(HINT_SESSION_KEY, '1');
    } catch {
      return;
    }
    window.setTimeout(showHints, 600);
  }

  function placeNotes(): void {
    const parent = portraitQuery.matches ? sideSlot : chromeEl;
    if (calNote.parentElement !== parent) parent.appendChild(calNote);
    if (away.parentElement !== parent) parent.appendChild(away);
    stageEl.classList.toggle('is-portrait', portraitQuery.matches);
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
    btn.innerHTML = `<span class="hotspot-tag">${spot.name} · ${spot.action.hint}</span>`;
    btn.addEventListener('click', () => suggest(id));
    sceneEl.appendChild(btn);
    spotButtons.push(btn);
  }

  door.style.left = `${EXTERIOR_DOOR.left}%`;
  door.style.top = `${EXTERIOR_DOOR.top}%`;
  door.style.width = `${EXTERIOR_DOOR.width}%`;
  door.style.height = `${EXTERIOR_DOOR.height}%`;
  door.querySelector('.hotspot-tag')!.textContent = SCENES.exterior.doorSign;
  door.addEventListener('click', () => show('interior'));
  doorIn.style.left = `${INTERIOR_DOOR.left}%`;
  doorIn.style.top = `${INTERIOR_DOOR.top}%`;
  doorIn.style.width = `${INTERIOR_DOOR.width}%`;
  doorIn.style.height = `${INTERIOR_DOOR.height}%`;
  doorIn.querySelector('.hotspot-tag')!.textContent = SCENES.interior.doorSign;
  doorIn.addEventListener('click', () => show('exterior'));

  photoWall.style.left = '70.5%';
  photoWall.style.top = '32%';
  photoWall.style.width = '16%';
  photoWall.style.height = '20%';
  mailbox.style.left = '63.8%';
  mailbox.style.top = '45.5%';
  mailbox.style.width = '6.4%';
  mailbox.style.height = '15.5%';
  signpost.style.left = '70.6%';
  signpost.style.top = '44%';
  signpost.style.width = '8.4%';
  signpost.style.height = '16%';

  function show(id: SceneId): void {
    currentScene = id;
    duck.classList.remove('is-hovered');
    bg.src = assetUrl(sceneBackground(id));
    renderProps(propsBack, propsFront, id, reducedMotion.matches);
    water.setScene(id);
    duck.style.display = id === 'interior' ? '' : 'none';
    duckHit.style.display = id === 'interior' ? '' : 'none';
    door.style.display = id === 'exterior' ? '' : 'none';
    doorIn.style.display = id === 'interior' ? '' : 'none';
    photoWall.style.display = id === 'interior' ? '' : 'none';
    mailbox.style.display = id === 'exterior' ? '' : 'none';
    signpost.style.display = id === 'exterior' ? '' : 'none';
    for (const btn of spotButtons) btn.style.display = id === 'interior' ? '' : 'none';
    renderLife();
  }

  speedBtn.addEventListener('click', () => {
    const index = SPEEDS.indexOf(clock.speed);
    setSpeed(SPEEDS[(index + 1) % SPEEDS.length]);
  });
  helpBtn.addEventListener('click', showHints);
  mountSettings(sceneEl, { onRestart: restart, trigger: gearBtn });
  const postcards = mountPostcards({
    getTrips: () => life.trips,
    getName: () => name,
    getContext: () => buildChatContext(life, name, awaySummaryText),
    onRead: (tripId) => {
      const next = markTripRead(life, tripId);
      if (next === life) return;
      life = next;
      persist();
      updateBadges();
    },
  });
  photoWall.addEventListener('click', () => postcards.openAlbum());
  mailbox.addEventListener('click', () => postcards.openUnread());
  signpost.addEventListener('click', suggestBySign);
  awayMail.addEventListener('click', () => {
    away.hidden = true;
    show('exterior');
    postcards.openUnread();
  });
  reducedMotion.addEventListener('change', () => {
    renderProps(propsBack, propsFront, currentScene, reducedMotion.matches);
    water.setReduced(reducedMotion.matches);
  });
  portraitQuery.addEventListener('change', placeNotes);
  const chat = mountChat({
    getContext: () => buildChatContext(life, name, awaySummaryText),
    container: sceneEl,
  });
  awayClose.addEventListener('click', () => {
    away.hidden = true;
  });
  if (awaySummary) {
    awayBody.textContent = awaySummary.body;
    away.hidden = false;
  }
  function setDuckHover(on: boolean): void {
    duck.classList.toggle('is-hovered', on);
  }
  duckHit.addEventListener('mouseenter', () => setDuckHover(true));
  duckHit.addEventListener('mouseleave', () => setDuckHover(false));
  travelNote.addEventListener('click', () => chat.open());
  travelNote.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chat.open();
    }
  });
  roadDuck.addEventListener('click', () => chat.open());
  roadDuck.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chat.open();
    }
  });
  duckHit.addEventListener('click', () => chat.open());
  duck.addEventListener('click', () => chat.open());
  duck.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chat.open();
    }
  });

  let introOpen = false;
  try {
    introOpen = !window.sessionStorage.getItem(INTRO_SESSION_KEY);
  } catch {
    introOpen = false;
  }
  intro.hidden = !introOpen;

  introGo.addEventListener('click', () => {
    intro.hidden = true;
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
    } catch {
      // 浏览器禁用 sessionStorage 时下次会话再看到一次也无妨。
    }
    show('interior');
    autoPlayHintsOnce();
  });

  placeNotes();
  show(introOpen ? 'exterior' : 'interior');
  persist();
  if (!introOpen) autoPlayHintsOnce();

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