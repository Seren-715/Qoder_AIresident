"""Cut props out of a flat background: sprites + patched background + placement data + check image."""
import sys, json, math, numpy as np, cv2
src, outdir, cfgpath = sys.argv[1:4]
cfg = json.load(open(cfgpath))
opts = cfg.pop("_opts", {})
img = cv2.imread(src, cv2.IMREAD_COLOR)
H, W = img.shape[:2]
lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(int)
allmask = np.zeros((H, W), np.uint8)
meta, masks = {}, {}

def region_of(o):
    r = np.zeros((H, W), np.uint8)
    for x0, y0, x1, y1 in o.get("rects", []):
        r[max(y0, 0):y1, max(x0, 0):x1] = 255
    if "poly" in o:
        cv2.fillPoly(r, [np.array(o["poly"], np.int32)], 255)
    for ex in o.get("exclude", []):
        if len(ex) == 4 and not isinstance(ex[0], list): r[ex[1]:ex[3], ex[0]:ex[2]] = 0
        else: cv2.fillPoly(r, [np.array(ex, np.int32)], 0)
    return r

def bgdiff(o):
    d = np.full((H, W), 999, int)
    for x, y in o["bg"]:
        c = np.median(img[y - 4:y + 5, x - 4:x + 5].reshape(-1, 3), axis=0)
        d = np.minimum(d, np.abs(img.astype(int) - c.astype(int)).max(axis=2))
    return d

def fill_holes(m):
    ff = cv2.copyMakeBorder(m, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
    # image edges act as walls so shapes cut by the frame still count as closed
    ys, xs = np.where(m > 0)
    if len(xs):
        if xs.min() == 0: ff[:, 0] = 255
        if ys.max() == H - 1: ff[-1, :] = 255
        if xs.max() == W - 1: ff[:, -1] = 255
    for cx, cy in ((0, 0), (ff.shape[1] - 1, 0), (0, ff.shape[0] - 1), (ff.shape[1] - 1, ff.shape[0] - 1)):
        if ff[cy, cx] == 0: cv2.floodFill(ff, None, (cx, cy), 128)
    return np.where(ff[1:-1, 1:-1] == 128, 0, 255).astype(np.uint8)

# thin lines (strings) that must stay in the background rather than move with a prop
band = np.zeros((H, W), np.uint8)
for ln in opts.get("keep_lines", []):
    cv2.polylines(band, [np.array(ln["pts"], np.int32)], False, 255, ln.get("width", 5), cv2.LINE_8)
    for x0, y0, x1, y1 in ln.get("skip", []): band[y0:y1, x0:x1] = 0

for name, o in cfg.items():
    reg = region_of(o)
    if o.get("method", "grabcut") == "grabcut":
        d = bgdiff(o)
        gc = np.full((H, W), cv2.GC_BGD, np.uint8)
        gc[reg > 0] = cv2.GC_PR_BGD
        gc[(reg > 0) & (d > o.get("pr", 22))] = cv2.GC_PR_FGD
        gc[(reg > 0) & (d > o.get("fg", 55))] = cv2.GC_FGD
        cv2.grabCut(img, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_MASK)
        m = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8) * 255
    else:  # outline: dark strokes + colours unlike the background, then fill enclosed areas
        m = (lum < o.get("dark", 95))
        if "bg" in o: m |= bgdiff(o) > o.get("fg", 45)
        m = (m & (reg > 0)).astype(np.uint8) * 255
    k = o.get("close", 5)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    m = fill_holes(m) & reg
    if o.get("green_only"):  # drop rocks / water that got enclosed: keep plant-coloured or outline pixels only
        B, G, R = [img[:, :, i].astype(int) for i in range(3)]
        m = m & (((np.minimum(R, G) - B > o["green_only"]) | (lum < o.get("dark", 95))).astype(np.uint8) * 255)
    if o.get("core_open"):  # drop thin attachments (strings) but keep the body's exact edge
        core = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (o["core_open"],) * 2))
        g = o.get("core_grow", 3) * 2 + 1
        m = m & cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (g, g)))
    if o.get("open"):
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (o["open"],) * 2))
    m = m & ~band
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= o.get("minarea", 60): keep[lab == i] = 255
    m = keep
    masks[name] = m
    allmask |= m
    # alpha: solid on the object, fading out across the rim that the background patch covers,
    # so that at rest sprite + patched background reproduces the original picture
    rim = (opts.get("hole", 9) - 1) / 2
    dist = cv2.distanceTransform(255 - m, cv2.DIST_L2, 5)
    a = (np.clip(1 - dist / (rim + 0.5), 0, 1) * 255).astype(np.uint8)
    ys, xs = np.where(a > 0)
    bx0, by0 = max(xs.min() - 1, 0), max(ys.min() - 1, 0)
    bx1, by1 = min(xs.max() + 2, W), min(ys.max() + 2, H)
    cv2.imwrite(f"{outdir}/{name}.png", np.dstack([img[by0:by1, bx0:bx1], a[by0:by1, bx0:bx1]]))
    px, py = o["pivot"]
    meta[name] = {"motion": o["motion"], "left": round(bx0 / W * 100, 2), "top": round(by0 / H * 100, 2),
                  "width": round((bx1 - bx0) / W * 100, 2), "height": round((by1 - by0) / H * 100, 2),
                  "originX": round((px - bx0) / (bx1 - bx0) * 100, 1), "originY": round((py - by0) / (by1 - by0) * 100, 1),
                  "px": [int(bx0), int(by0), int(bx1), int(by1)], "pivot_px": [px, py], "amp": o.get("amp", 6)}
    for kx in ("driftMin", "driftMax"):
        if kx in o: meta[name][kx] = round(o[kx] / W * 100, 2)

hd = opts.get("hole", 9)
hole = cv2.dilate(allmask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (hd, hd)))
clean = cv2.inpaint(img, hole, opts.get("radius", 7), cv2.INPAINT_TELEA).astype(np.float32)
hf = img.astype(np.float32) - cv2.GaussianBlur(img, (0, 0), 5).astype(np.float32)
soft = cv2.GaussianBlur(hole, (0, 0), 2).astype(np.float32)[:, :, None] / 255.0
for name, o in cfg.items():
    if "donor" not in o: continue
    dx, dy = o["donor"]
    x0, y0, x1, y1 = meta[name]["px"]
    x0, y0, x1, y1 = max(x0 - 8, 0), max(y0 - 8, 0), min(x1 + 8, W), min(y1 + 8, H)
    clean[y0:y1, x0:x1] += hf[y0 + dy:y1 + dy, x0 + dx:x1 + dx] * soft[y0:y1, x0:x1]
if band.any():
    b = cv2.GaussianBlur(cv2.dilate(band, np.ones((3, 3), np.uint8)), (0, 0), 0.8).astype(np.float32)[:, :, None] / 255.0
    clean = img.astype(np.float32) * b + clean * (1 - b)
clean = np.clip(clean, 0, 255).astype(np.uint8)
cv2.imwrite(f"{outdir}/clean.png", clean)
json.dump(meta, open(f"{outdir}/meta.json", "w"), indent=1, ensure_ascii=False)

def compose(sign):
    out = clean.astype(np.float32)
    for name, m in meta.items():
        s = cv2.imread(f"{outdir}/{name}.png", cv2.IMREAD_UNCHANGED)
        bx0, by0, bx1, by1 = m["px"]
        c = np.zeros((H, W, 4), np.uint8); c[by0:by1, bx0:bx1] = s
        px, py = map(float, m["pivot_px"]); amp = m["amp"] * sign
        if sign:
            if m["motion"] == "swing": M = cv2.getRotationMatrix2D((px, py), amp, 1)
            elif m["motion"] == "skew": t = math.tan(math.radians(amp)); M = np.float32([[1, -t, t * py], [0, 1, 0]])
            else: M = np.float32([[1, 0, (m.get("driftMax", 2) if sign > 0 else m.get("driftMin", -2)) * W / 100], [0, 1, 0]])
            c = cv2.warpAffine(c, M, (W, H), flags=cv2.INTER_LINEAR)
        a = c[:, :, 3:4] / 255.0
        out = c[:, :, :3] * a + out * (1 - a)
    return out.astype(np.uint8)

rest = compose(0)
print("rest vs original: mean abs diff %.3f" % np.abs(rest.astype(int) - img.astype(int)).mean())
for i, (x0, y0, x1, y1) in enumerate(json.load(open(cfgpath + ".views"))):
    ch = np.zeros((y1 - y0, x1 - x0, 3), np.uint8)
    yy, xx = np.mgrid[0:y1 - y0, 0:x1 - x0]
    ch[:] = np.where((((xx // 10) + (yy // 10)) % 2)[:, :, None] > 0, (255, 0, 255), (255, 255, 255))
    spr = np.zeros((H, W, 4), np.uint8)
    for name, m in meta.items():
        s = cv2.imread(f"{outdir}/{name}.png", cv2.IMREAD_UNCHANGED); bx0, by0, bx1, by1 = m["px"]
        reg = spr[by0:by1, bx0:bx1]; reg[:] = np.where(s[:, :, 3:4] > reg[:, :, 3:4], s, reg)
    a = spr[y0:y1, x0:x1, 3:4] / 255.0
    ch = (spr[y0:y1, x0:x1, :3] * a + ch * (1 - a)).astype(np.uint8)
    cut = lambda im: im[y0:y1, x0:x1]
    row1 = np.hstack([cut(img), ch, cut(clean)])
    row2 = np.hstack([cut(rest), cut(compose(1)), cut(compose(-1))])
    cv2.imwrite(f"{outdir}/check{i}.png", np.vstack([row1, row2]))
