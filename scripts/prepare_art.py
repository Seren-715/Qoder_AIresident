"""One-off art pipeline: compress scene images and cut the duck sprite sheet.

Re-run after replacing sources in vibe_images/:  python scripts/prepare_art.py
"""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "art"
OUT.mkdir(parents=True, exist_ok=True)

SCENES = {
    "room-exterior.webp": ROOT / "vibe_images" / "场景美术" / "13881d9e-18cd-44c2-9232-3f1daffa752d.png",
    "room-interior.webp": ROOT / "vibe_images" / "场景美术" / "640abb49-29c0-4384-ab97-32957f1f75a2.png",
}
DUCK_SHEET = ROOT / "vibe_images" / "Duck" / "ChatGPT Image 2026年11月9日 06_31_54.png"
POSES = ["sleep", "eat", "read", "back", "sit", "play", "swim", "travel"]


def compress_scenes() -> None:
    for name, src in SCENES.items():
        im = Image.open(src).convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        im.save(OUT / name, "WEBP", quality=82, method=4)
        print(name, im.size, (OUT / name).stat().st_size // 1024, "KB")


def cut_duck() -> None:
    im = Image.open(DUCK_SHEET).convert("RGBA")
    w, h = im.size
    px = im.load()
    seed = px[0, 0][:3]

    def diff(c):
        return abs(c[0] - seed[0]) + abs(c[1] - seed[1]) + abs(c[2] - seed[2])

    # flood fill from the border so enclosed whites (book pages) survive
    bg = bytearray(w * h)
    dq = deque()
    for x in range(w):
        dq.append((x, 0))
        dq.append((x, h - 1))
    for y in range(h):
        dq.append((0, y))
        dq.append((w - 1, y))
    while dq:
        x, y = dq.popleft()
        i = y * w + x
        if bg[i] or diff(px[x, y]) > 120:
            continue
        bg[i] = 1
        if x > 0:
            dq.append((x - 1, y))
        if x < w - 1:
            dq.append((x + 1, y))
        if y > 0:
            dq.append((x, y - 1))
        if y < h - 1:
            dq.append((x, y + 1))
    for y in range(h):
        for x in range(w):
            if bg[y * w + x]:
                px[x, y] = (0, 0, 0, 0)
    # trim the anti-alias halo: near-background pixels touching transparency
    for _ in range(2):
        edge = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if px[x, y][3] and diff(px[x, y]) <= 45 and (
                    not px[x - 1, y][3] or not px[x + 1, y][3]
                    or not px[x, y - 1][3] or not px[x, y + 1][3]
                ):
                    edge.append((x, y))
        for x, y in edge:
            px[x, y] = (0, 0, 0, 0)

    cw, ch = w // 4, h // 2
    for idx, pose in enumerate(POSES):
        cx, cy = (idx % 4) * cw, (idx // 4) * ch
        cell = im.crop((cx, cy, cx + cw, cy + ch))
        bbox = cell.getbbox()
        cell = cell.crop(bbox)
        cell.save(OUT / f"duck-{pose}.png")
        print(f"duck-{pose}.png", cell.size, (OUT / f"duck-{pose}.png").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    compress_scenes()
    cut_duck()