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
  img.dataset.propId = spec.id;
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
      img.style.setProperty('--from', `${spec.travelFrom!}%`);
      img.style.setProperty('--to', `${spec.travelTo!}%`);
    } else if (spec.motion === 'bob') {
      img.style.setProperty('--bob', `${((spec.bobY ?? 0) / spec.height) * 100}%`);
      img.style.setProperty('--amp', String(spec.amplitude ?? 0));
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
  let cloudLayer: HTMLDivElement | undefined;
  if (scene === 'exterior') {
    cloudLayer = document.createElement('div');
    cloudLayer.className = 'props-clouds';
    const maskImage = `url("${assetUrl('art/props/exterior/sky-mask.png')}")`;
    cloudLayer.style.maskImage = maskImage;
    cloudLayer.style.setProperty('-webkit-mask-image', maskImage);
    backEl.appendChild(cloudLayer);
  }
  for (const spec of PROPS[scene].props) {
    const img = buildProp(spec, reduced);
    const target = spec.layer === 'front' ? frontEl : spec.motion === 'drift' ? cloudLayer! : backEl;
    target.appendChild(img);
  }
}

export function sceneBackground(scene: SceneId): string {
  return PROPS[scene].background;
}