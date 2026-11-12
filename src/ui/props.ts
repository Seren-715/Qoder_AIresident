import {
  PROPS,
  swingKeyframes,
  SWING_DURATION_MS,
  type PropSpec,
} from '../data/props';
import { assetUrl, type SceneId } from '../data/scene';

function buildProp(spec: PropSpec, reduced: boolean): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'prop';
  img.alt = '';
  img.src = assetUrl(spec.image);
  img.style.left = `${spec.left}%`;
  img.style.top = `${spec.top}%`;
  img.style.width = `${spec.width}%`;
  img.style.height = `${spec.height}%`;
  img.style.transformOrigin = `${spec.originX ?? 50}% ${spec.originY ?? 50}%`;

  if (spec.trigger === 'auto' && !reduced) {
    img.style.setProperty('--dur', `${spec.period}s`);
    img.style.setProperty('--delay', `${spec.delay ?? 0}s`);
    img.classList.add(`prop-auto-${spec.motion}`);
    if (spec.motion === 'drift') {
      img.style.setProperty('--min', String(spec.driftMin ?? 0));
      img.style.setProperty('--max', String(spec.driftMax ?? 0));
    } else {
      img.style.setProperty('--amp', String(spec.amplitude ?? 0));
    }
  }

  if (spec.trigger === 'hover' && spec.motion === 'swing' && !reduced) {
    const play = () => {
      if (img.dataset.swinging === '1') return;
      img.dataset.swinging = '1';
      const animation = img.animate(swingKeyframes(spec.period, spec.amplitude ?? 0), {
        duration: SWING_DURATION_MS,
        easing: 'linear',
      });
      animation.onfinish = () => {
        img.dataset.swinging = '0';
        img.style.transform = '';
      };
    };
    img.classList.add('prop-hover');
    img.addEventListener('pointerenter', play);
    img.addEventListener('click', play);
  }

  return img;
}

export function renderProps(
  backEl: HTMLElement,
  frontEl: HTMLElement,
  scene: SceneId,
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
): void {
  backEl.replaceChildren();
  frontEl.replaceChildren();
  for (const spec of PROPS[scene].props) {
    const img = buildProp(spec, reduced);
    (spec.layer === 'front' ? frontEl : backEl).appendChild(img);
  }
}

export function sceneBackground(scene: SceneId): string {
  return PROPS[scene].background;
}