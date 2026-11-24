import { sendPostcard } from '../ai/client';
import type { ChatContext } from '../ai/context';
import { startPostcardStory } from '../ai/postcard';
import { pickTemplate, visitedCount } from '../data/postcards';
import { assetUrl } from '../data/scene';
import { DESTINATIONS } from '../data/travel';
import type { Trip } from '../sim/life';
import { formatGameTime, formatShortDate } from '../sim/time';
import { loadAiConfig } from '../storage/settings';
import { loadPostcardCache, savePostcardStory, type PostcardStoryEntry } from '../storage/postcards';

export interface PostcardOptions {
  getTrips: () => Trip[];
  getName: () => string;
  /** 打开一张明信片时调用，用来把 Trip 标记成已读。 */
  onRead: (tripId: string) => void;
  /** 给模型的聊天上下文（名字、现在、最近）。 */
  getContext: () => ChatContext;
}

export interface PostcardPanel {
  openUnread(): void;
  openAlbum(): void;
}

export function mountPostcards(options: PostcardOptions): PostcardPanel {
  const overlay = document.createElement('div');
  overlay.className = 'postcards';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="postcard-card" role="dialog" aria-label="明信片">
      <button type="button" class="postcard-close" aria-label="关闭明信片">×</button>
      <div class="postcard-single">
        <div class="postcard-image-wrap">
          <img class="postcard-image" alt="" />
        </div>
        <div class="postcard-body">
          <div class="postmark">
            <span class="postmark-name"></span>
            <span class="postmark-date"></span>
          </div>
          <p class="postcard-text"></p>
          <p class="postcard-sign"></p>
        </div>
      </div>
      <div class="album" hidden>
        <header class="album-head">
          <strong class="album-title">明信片</strong>
          <span class="album-count"></span>
        </header>
        <div class="album-grid"></div>
        <p class="album-empty" hidden>还没有明信片，等它出门旅行吧。</p>
      </div>
      <div class="postcard-actions">
        <button type="button" class="postcard-back" hidden>返回相册</button>
        <button type="button" class="postcard-next" hidden>下一张</button>
        <button type="button" class="postcard-close-btn">合上</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const single = overlay.querySelector<HTMLElement>('.postcard-single')!;
  const album = overlay.querySelector<HTMLElement>('.album')!;
  const image = overlay.querySelector<HTMLImageElement>('.postcard-image')!;
  const postmarkName = overlay.querySelector<HTMLElement>('.postmark-name')!;
  const postmarkDate = overlay.querySelector<HTMLElement>('.postmark-date')!;
  const text = overlay.querySelector<HTMLElement>('.postcard-text')!;
  const sign = overlay.querySelector<HTMLElement>('.postcard-sign')!;
  const nextBtn = overlay.querySelector<HTMLButtonElement>('.postcard-next')!;
  const backBtn = overlay.querySelector<HTMLButtonElement>('.postcard-back')!;
  const grid = overlay.querySelector<HTMLElement>('.album-grid')!;
  const albumCount = overlay.querySelector<HTMLElement>('.album-count')!;
  const albumEmpty = overlay.querySelector<HTMLElement>('.album-empty')!;
  let queue: Trip[] = [];
  let currentTripId: string | null = null;
  let swapTimer: number | null = null;

  function tripName(trip: Trip): string {
    return DESTINATIONS.find((d) => d.id === trip.destinationId)?.name ?? '远方';
  }

  function close(): void {
    overlay.hidden = true;
    currentTripId = null;
  }

  function showSingle(): void {
    single.hidden = false;
    album.hidden = true;
  }

  function setStory(tripId: string, entry: PostcardStoryEntry): void {
    if (currentTripId !== tripId) return;
    if (text.textContent === entry.text) return;
    if (swapTimer !== null) window.clearTimeout(swapTimer);
    text.classList.add('is-swapping');
    swapTimer = window.setTimeout(() => {
      swapTimer = null;
      if (currentTripId !== tripId) return;
      text.textContent = entry.text;
      text.classList.remove('is-swapping');
    }, 180);
  }

  function renderTrip(trip: Trip, fromAlbum = false): void {
    const destination = DESTINATIONS.find((d) => d.id === trip.destinationId);
    showSingle();
    currentTripId = trip.id;
    if (swapTimer !== null) window.clearTimeout(swapTimer);
    swapTimer = null;
    text.classList.remove('is-swapping');
    postmarkDate.textContent = formatShortDate(trip.returnedAt);
    options.onRead(trip.id);
    nextBtn.hidden = queue.length === 0;
    backBtn.hidden = !fromAlbum;
    overlay.hidden = false;

    if (!destination) {
      image.removeAttribute('src');
      image.alt = '';
      text.textContent = '这次旅行太远了，只记得一路上的风。';
      postmarkName.textContent = '远方';
      sign.textContent = `—— ${options.getName()}`;
      return;
    }

    const template = pickTemplate(trip.id, destination.templates);
    const job = startPostcardStory({
      tripId: trip.id,
      template,
      cached: loadPostcardCache()[trip.id],
      request: () =>
        sendPostcard(
          {
            destination: destination.name,
            region: destination.region,
            facts: destination.facts,
            departedLabel: formatGameTime(trip.departedAt),
            returnedLabel: formatGameTime(trip.returnedAt),
            hours: Math.round(((trip.returnedAt - trip.departedAt) / 60) * 100) / 100,
          },
          loadAiConfig(),
          options.getContext(),
        ),
      isCurrent: () => currentTripId === trip.id && !overlay.hidden,
      onUpdate: (entry) => setStory(trip.id, entry),
      save: savePostcardStory,
    });
    image.src = assetUrl(destination.image.replace(/^\/+/, ''));
    image.alt = destination.name;
    text.textContent = job.initial.text;
    postmarkName.textContent = destination.name;
    sign.textContent = `—— ${options.getName()}`;
  }

  function unreadTrips(): Trip[] {
    return options
      .getTrips()
      .filter((trip) => !trip.read)
      .slice()
      .sort((a, b) => a.returnedAt - b.returnedAt);
  }

  function renderAlbum(): void {
    const trips = options.getTrips().slice().sort((a, b) => b.returnedAt - a.returnedAt);
    single.hidden = true;
    album.hidden = false;
    backBtn.hidden = true;
    grid.textContent = '';
    albumEmpty.hidden = trips.length > 0;
    const visited = visitedCount(trips.map((trip) => trip.destinationId));
    albumCount.textContent = visited >= DESTINATIONS.length ? `${visited}/${DESTINATIONS.length} 都去过了` : '';
    for (const trip of trips) {
      const destination = DESTINATIONS.find((d) => d.id === trip.destinationId);
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'album-item';
      item.innerHTML = `
        <img class="album-thumb" alt="" />
        <span class="album-name"></span>
        <span class="album-date"></span>
      `;
      const thumb = item.querySelector<HTMLImageElement>('.album-thumb')!;
      if (destination) thumb.src = assetUrl(destination.image.replace(/^\/+/, ''));
      thumb.alt = tripName(trip);
      item.querySelector('.album-name')!.textContent = tripName(trip);
      item.querySelector('.album-date')!.textContent = formatShortDate(trip.returnedAt);
      if (!trip.read) item.classList.add('is-unread');
      item.addEventListener('click', () => {
        queue = [];
        renderTrip(trip, true);
      });
      grid.appendChild(item);
    }
    overlay.hidden = false;
  }

  nextBtn.addEventListener('click', () => {
    const trip = queue.shift();
    if (trip) renderTrip(trip);
  });
  backBtn.addEventListener('click', renderAlbum);
  overlay.querySelector('.postcard-close')!.addEventListener('click', close);
  overlay.querySelector('.postcard-close-btn')!.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  return {
    openUnread() {
      queue = unreadTrips();
      const trip = queue.shift();
      if (trip) renderTrip(trip);
      else renderAlbum();
    },
    openAlbum() {
      queue = [];
      renderAlbum();
    },
  };
}