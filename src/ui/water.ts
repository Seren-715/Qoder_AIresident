import {
  SCENE_REF_H,
  SCENE_REF_W,
  WATER,
  glintEnvelope,
  interpByDepth,
  regionDepth,
  ringShape,
  waveOffset,
  type WaterSpec,
} from '../data/water';
import { PROPS, type PropSpec } from '../data/props';
import { assetUrl, type SceneId } from '../data/scene';

export interface LilyAnchor {
  x: number;
  y: number;
  rx: number;
  phase: number;
  lastEmitted: number;
}

export interface WaterController {
  setScene(id: SceneId): void;
  setReduced(reduced: boolean): void;
  setPaused(paused: boolean): void;
  destroy(): void;
}

interface Glint {
  x: number;
  y: number;
  birth: number;
  life: number;
  drift: number;
  arch: number;
  regionIndex: number;
}

const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;
const MASK_COLS = 128;

class MaskSampler {
  private grid: Uint8Array;
  private cols: number;
  private rows: number;

  constructor(mask: HTMLImageElement) {
    const ratio = mask.naturalHeight / Math.max(1, mask.naturalWidth);
    this.cols = MASK_COLS;
    this.rows = Math.max(1, Math.round(MASK_COLS * ratio));
    const tmp = document.createElement('canvas');
    tmp.width = this.cols;
    tmp.height = this.rows;
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    this.grid = new Uint8Array(this.cols * this.rows);
    if (!tctx) return;
    tctx.drawImage(mask, 0, 0, this.cols, this.rows);
    const data = tctx.getImageData(0, 0, this.cols, this.rows).data;
    for (let i = 0; i < this.cols * this.rows; i++) this.grid[i] = data[i * 4 + 3];
  }

  isWater(xRef: number, yRef: number): boolean {
    const x = Math.floor((xRef / SCENE_REF_W) * this.cols);
    const y = Math.floor((yRef / SCENE_REF_H) * this.rows);
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    return this.grid[y * this.cols + x] > 128;
  }
}

function lilyAnchorsFor(scene: SceneId): LilyAnchor[] {
  if (scene !== 'exterior') return [];
  return PROPS[scene].props
    .filter((p: PropSpec) => p.motion === 'bob' && p.ripples)
    .map((p) => ({
      x: ((p.left + p.width / 2) / 100) * SCENE_REF_W,
      y: ((p.top + p.height / 2) / 100) * SCENE_REF_H,
      rx: ((p.width / 2) / 100) * SCENE_REF_W,
      phase: -(p.delay ?? 0),
      lastEmitted: -1,
    }));
}

export function mountWater(
  canvas: HTMLCanvasElement,
  bgImage: HTMLImageElement,
  initialScene: SceneId,
  initialReduced: boolean,
): WaterController {
  const ctx = canvas.getContext('2d');
  let scene = initialScene;
  let spec: WaterSpec = WATER[scene];
  let reduced = initialReduced;
  let paused = false;
  let raf = 0;
  let lastFrame = 0;
  let startTs = performance.now();
  let glints: Glint[] = [];
  let rings: { x: number; y: number; birth: number; rx: number }[] = [];
  let lilies: LilyAnchor[] = lilyAnchorsFor(scene);
  let maskImage: HTMLImageElement | null = null;
  let maskSampler: MaskSampler | null = null;
  let destroyed = false;

  function resetClock(): void {
    startTs = performance.now();
    lastFrame = 0;
  }

  function rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  function spawnGlint(now: number): Glint | null {
    if (!spec.regions.length) return null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const regionIndex = Math.floor(Math.random() * spec.regions.length);
      const region = spec.regions[regionIndex];
      const xRef = rand((region.left / 100) * SCENE_REF_W, ((region.left + region.width) / 100) * SCENE_REF_W);
      const yRef = rand((region.top / 100) * SCENE_REF_H, ((region.top + region.height) / 100) * SCENE_REF_H);
      if (maskSampler && !maskSampler.isWater(xRef, yRef)) continue;
      return {
        x: xRef,
        y: yRef,
        birth: now - rand(0, spec.glintLife),
        life: spec.glintLife * rand(0.7, 1.3),
        drift: rand(6, 12) * (Math.random() < 0.5 ? -1 : 1),
        arch: rand(0.6, 1.4),
        regionIndex,
      };
    }
    return null;
  }

  function seedGlints(now: number): void {
    glints = [];
    for (let i = 0; i < spec.glints; i++) {
      const g = spawnGlint(now);
      if (g) glints.push(g);
    }
  }

  function loadMask(): void {
    maskSampler = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (destroyed) return;
      try {
        maskSampler = new MaskSampler(img);
      } catch {
        maskSampler = null;
      }
    };
    img.src = assetUrl(spec.mask);
    maskImage = img;
  }

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function drawStrips(now: number, sx: number, sy: number): void {
    if (!bgImage.complete || !bgImage.naturalWidth) return;
    const bgNW = bgImage.naturalWidth;
    const bgNH = bgImage.naturalHeight;
    for (const region of spec.regions) {
      const yTop = (region.top / 100) * SCENE_REF_H;
      const yBot = ((region.top + region.height) / 100) * SCENE_REF_H;
      const xLeft = (region.left / 100) * SCENE_REF_W;
      const xRight = ((region.left + region.width) / 100) * SCENE_REF_W;
      const srcX = (xLeft / SCENE_REF_W) * bgNW;
      const srcW = ((xRight - xLeft) / SCENE_REF_W) * bgNW;
      const dstX = xLeft * sx;
      const dstW = (xRight - xLeft) * sx;
      for (let y = yTop; y < yBot; y += spec.strip) {
        const offset = waveOffset(y, now, region, spec);
        const srcY = (y / SCENE_REF_H) * bgNH;
        const srcH = Math.min((spec.strip / SCENE_REF_H) * bgNH, bgNH - srcY);
        if (srcH <= 0) continue;
        ctx!.drawImage(bgImage, srcX, srcY, srcW, srcH, dstX + offset * sx, y * sy, dstW, spec.strip * sy + 0.5);
      }
    }
  }

  function drawGlints(now: number, sx: number, sy: number): void {
    ctx!.lineCap = 'round';
    ctx!.strokeStyle = spec.glintColor;
    for (let i = 0; i < glints.length; i++) {
      const g = glints[i];
      const age = now - g.birth;
      if (age > g.life) {
        const replacement = spawnGlint(now);
        if (replacement) glints[i] = replacement;
        continue;
      }
      const env = glintEnvelope(age, g.life);
      if (env <= 0.01) continue;
      const region = spec.regions[g.regionIndex] ?? spec.regions[0];
      const depth = regionDepth(g.y, region);
      const len = interpByDepth(spec.glintLengthTop, spec.glintLengthBottom, depth) * sx;
      const th = interpByDepth(spec.glintThicknessTop, spec.glintThicknessBottom, depth) * sx;
      const progress = age / g.life;
      const cx = g.x * sx + (progress - 0.5) * g.drift * sx;
      const cy = g.y * sy;
      ctx!.globalAlpha = env * spec.glintAlpha;
      ctx!.lineWidth = th;
      ctx!.beginPath();
      ctx!.moveTo(cx - len / 2, cy);
      ctx!.quadraticCurveTo(cx, cy - g.arch * sy, cx + len / 2, cy);
      ctx!.stroke();
    }
    ctx!.globalAlpha = 1;
  }

  function drawRings(now: number, sx: number, sy: number): void {
    const ringsSpec = spec.rings;
    if (!ringsSpec) return;
    for (const l of lilies) {
      const cycleIndex = Math.floor((now + l.phase) / ringsSpec.every);
      if (cycleIndex !== l.lastEmitted) {
        l.lastEmitted = cycleIndex;
        rings.push({ x: l.x, y: l.y, birth: now, rx: l.rx });
      }
    }
    rings = rings.filter((r) => now - r.birth < ringsSpec.life);
    if (!rings.length) return;
    ctx!.strokeStyle = '#ffffff';
    ctx!.lineWidth = ringsSpec.lineWidth * sx;
    for (const r of rings) {
      const depth = (now - r.birth) / ringsSpec.life;
      for (const lag of [0, 0.4]) {
        const d = depth - lag;
        if (d < 0 || d > 1) continue;
        const shape = ringShape(d, ringsSpec.grow, ringsSpec.alpha);
        const rx = r.rx + shape.radius;
        const ry = rx * ringsSpec.flatten;
        ctx!.globalAlpha = shape.alpha;
        ctx!.beginPath();
        ctx!.ellipse(r.x * sx, r.y * sy, rx * sx, ry * sy, 0, 0, Math.PI * 2);
        ctx!.stroke();
      }
    }
    ctx!.globalAlpha = 1;
  }

  function frame(ts: number): void {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (reduced || paused || document.hidden) return;
    if (ts - lastFrame < FRAME_MS) return;
    lastFrame = ts;
    if (!ctx) return;
    resize();
    const now = (ts - startTs) / 1000;
    const sx = canvas.width / SCENE_REF_W;
    const sy = canvas.height / SCENE_REF_H;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStrips(now, sx, sy);
    drawGlints(now, sx, sy);
    drawRings(now, sx, sy);
    if (maskImage && maskImage.complete && maskImage.naturalWidth) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function applyReduced(): void {
    if (!ctx) return;
    if (reduced) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function visibilityHandler(): void {
    if (document.hidden) {
      paused = true;
    } else {
      paused = false;
      resetClock();
    }
  }

  loadMask();
  seedGlints(0);
  if (ctx && !reduced) raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', visibilityHandler);

  return {
    setScene(id) {
      if (id === scene) return;
      scene = id;
      spec = WATER[id];
      lilies = lilyAnchorsFor(id);
      rings = [];
      loadMask();
      resetClock();
      seedGlints(0);
      applyReduced();
    },
    setReduced(v) {
      reduced = v;
      if (ctx) {
        if (v) {
          applyReduced();
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
        } else if (!raf && !destroyed) {
          resetClock();
          raf = requestAnimationFrame(frame);
        }
      }
    },
    setPaused(v) {
      paused = v;
      if (!v) resetClock();
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibilityHandler);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
