import json, math, os, shutil, numpy as np, cv2
from PIL import Image
REPO = "/home/user/qoder_airesident"
SUG = {  # suggested motion parameters (period s, amplitude deg, delay s, layer)
 "herb": (1.0, 8, 0, "back"), "lantern": (1.25, 6, 0, "back"), "flowers": (0.9, 8, 0, "back"),
 "photo-1": (0.8, 7, 0, "back"), "photo-2": (0.8, 7, 0, "back"), "photo-3": (0.8, 7, 0, "back"),
 "photo-4": (0.8, 7, 0, "back"), "photo-5": (0.8, 7, 0, "back"), "photo-6": (0.8, 7, 0, "back"),
 "cloud-a": (70, 0, 0, "back"), "cloud-b": (55, 0, -20, "back"), "cloud-c": (62, 0, -35, "back"),
 "door-lantern": (3.6, 2.5, 0, "back"), "cloth-1": (2.8, 3, 0, "back"), "cloth-2": (3.3, 3, -1.1, "back"),
 "plants-left": (4.3, 1.5, 0, "front"), "daisies": (3.1, 2.2, -0.7, "front"), "flowers-yellow": (2.7, 2.5, -1.5, "front"),
 "flowers-white": (2.9, 2.5, -0.4, "back"), "path-flowers-white": (3.0, 2.5, -1.9, "back"),
 "path-flowers-yellow": (2.6, 2.5, -0.9, "back"), "reeds-right": (3.9, 1.8, -1.3, "back"), "reeds-pond": (3.5, 2.0, -2.2, "front"),
}
out = {}
for scene, d, srcname in (("interior", "out/int", "room-interior"), ("exterior", "out/ext", "room-exterior")):
    meta = json.load(open(f"{d}/meta.json"))
    dst = f"{REPO}/public/art/props/{scene}"; os.makedirs(dst, exist_ok=True)
    items = []
    for name, m in meta.items():
        Image.open(f"{d}/{name}.png").save(f"{dst}/{name}.png", optimize=True)
        per, amp, delay, layer = SUG[name]
        it = {"id": name, "image": f"art/props/{scene}/{name}.png", "left": m["left"], "top": m["top"], "width": m["width"], "height": m["height"],
              "originX": m["originX"], "originY": m["originY"], "motion": m["motion"],
              "trigger": "hover" if scene == "interior" else "auto", "period": per, "layer": layer}
        if m["motion"] == "drift": it.update({"driftMin": m["driftMin"], "driftMax": m["driftMax"], "delay": delay}); it.pop("originX"); it.pop("originY")
        else:
            it["amplitude"] = amp
            if scene == "exterior": it["delay"] = delay
        items.append(it)
    out[scene] = {"background": f"art/{srcname}-clean.webp", "props": items}
    os.makedirs(f"{REPO}/docs/art/source", exist_ok=True)
    shutil.copy(f"{d}/clean.png", f"{REPO}/docs/art/source/{srcname}-clean.png")
    im = Image.open(f"{d}/clean.png").convert("RGB").resize((1600, 900), Image.LANCZOS)
    im.save(f"{REPO}/public/art/{srcname}-clean.webp", "WEBP", quality=82, method=4)
json.dump(out, open(f"{REPO}/docs/art/props.json", "w"), indent=2, ensure_ascii=False)

def frames(d, crop, scale, n, fn):
    meta = json.load(open(f"{d}/meta.json")); clean = cv2.imread(f"{d}/clean.png"); H, W = clean.shape[:2]
    spr = {}
    for name, m in meta.items():
        s = cv2.imread(f"{d}/{name}.png", cv2.IMREAD_UNCHANGED); bx0, by0, bx1, by1 = m["px"]
        c = np.zeros((H, W, 4), np.uint8); c[by0:by1, bx0:bx1] = s; spr[name] = c
    x0, y0, x1, y1 = crop; res = []
    for i in range(n):
        o = clean.astype(np.float32)
        for name, m in meta.items():
            px, py = map(float, m["pivot_px"]); v = fn(name, m, i / n)
            if m["motion"] == "swing": M = cv2.getRotationMatrix2D((px, py), v, 1)
            elif m["motion"] == "skew": t = math.tan(math.radians(v)); M = np.float32([[1, -t, t * py], [0, 1, 0]])
            else: M = np.float32([[1, 0, v], [0, 1, 0]])
            c = cv2.warpAffine(spr[name], M, (W, H), flags=cv2.INTER_LINEAR); a = c[:, :, 3:4] / 255.0
            o = c[:, :, :3] * a + o * (1 - a)
        f = cv2.cvtColor(o[y0:y1, x0:x1].astype(np.uint8), cv2.COLOR_BGR2RGB)
        res.append(Image.fromarray(f).resize((int((x1 - x0) * scale), int((y1 - y0) * scale)), Image.LANCZOS))
    return res

def save(fr, path, ms):
    pal = fr[0].quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE)
    q = [f.quantize(palette=pal, dither=Image.NONE) for f in fr]
    q[0].save(path, save_all=True, append_images=q[1:], duration=ms, loop=0, optimize=True)
    print(path, os.path.getsize(path) // 1024, "KB")

def hover(name, m, t):   # everything nudged at once, then settling (demo only)
    per, amp, _, _ = SUG[name]; T = t * 3.0
    return amp * math.exp(-1.2 * T) * math.sin(2 * math.pi * T / per + (hash(name) % 7) * 0.4) if t < 0.9 else 0
save(frames("out/int", (600, 0, 1460, 500), 0.62, 30, hover), f"{REPO}/docs/art/props-demo-interior.gif", 100)

LOOP = 6.0
def wind(name, m, t):    # periods snapped to divisors of the loop so the demo GIF loops cleanly
    per, amp, delay, _ = SUG[name]
    if m["motion"] == "drift":
        lo, hi = m["driftMin"] * 1672 / 100, m["driftMax"] * 1672 / 100
        return (lo + hi) / 2 + (hi - lo) / 2 * math.sin(2 * math.pi * (t + (hash(name) % 5) / 5))
    k = max(1, round(LOOP / per))
    return amp * math.sin(2 * math.pi * (t * k + delay / per))
fr = frames("out/ext", (0, 0, 1672, 941), 0.36, 36, wind)
save(fr, f"{REPO}/docs/art/props-demo-exterior.gif", 166)
fr2 = frames("out/ext", (1260, 500, 1672, 941), 0.8, 30, wind)
save(fr2, f"{REPO}/docs/art/props-demo-exterior-closeup.gif", 200)
