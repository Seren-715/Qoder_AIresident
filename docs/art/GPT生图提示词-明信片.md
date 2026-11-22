# GPT 生图提示词：旅行明信片（6 张）

> 用途：明信片上半部分的画，对应 `docs/spec/phase3-旅行与明信片.md` 第 2 节的 6 个固定目的地。
> 这 6 张也是以后接入真实地图后的永久兜底图。

## 规格

| 项目 | 要求 |
|---|---|
| 比例 | 横版 3:2（GPT 选 1536×1024） |
| 内容 | 只有风景，**没有角色、动物、鸭子**，没有文字、招牌、标注 |
| 画风 | 和屋外全景图完全一致 |
| 交付 | 把原图发给 Claude。Claude 裁成 3:2，导出 `public/art/postcards/<id>.webp`（1200×800） |

## 生成方法

1. **每张图都新开一个对话**，不要在同一个对话里连续生成，也不要拿上一张去改，否则画风会漂移。
2. 上传 `public/art/room-exterior.webp`（屋外全景定稿）作为画风参考。
3. 粘贴下面的「通用部分」，再接上对应目的地的「画面」一段。
4. 只差一点时，用文末「如果只差一点」里的一句话修改，**最多改一次**；还不行就新开对话重来。

---

## 通用部分（每张都贴）

```
Please generate a LANDSCAPE image with a 3:2 aspect ratio.

Use the image I uploaded ONLY as the art style reference: keep exactly the same thin dark brown wobbly outlines, flat coloring with one darker flat shade for shadows, subtle paper grain and the muted warm low-saturation palette. Do not copy its content or layout.

This is the picture side of a travel postcard in a cozy web game: a scenic view of a real place, simplified and drawn like a page from a picture book. Recognizable landmarks, but no realistic photo detail. One clear focal point, a calm natural composition, from one consistent slightly elevated viewpoint. No characters, no people, no animals, no ducks. No text, no signs, no labels.

Art style: same as the reference image. Hand-drawn picture-book illustration, thin dark brown outlines of even weight, slightly wobbly. Flat color fills, shadows only one slightly darker flat shade, no gradients, no glossy highlights, no realistic lighting. Subtle paper grain. Muted palette: warm browns, beige, moss and sage green, dusty blue water, pale sky, tiny accents of coral red and mustard yellow.

Avoid: photorealism, 3D rendering, thick cartoon outlines, vector clip-art look, saturated colors, dramatic lighting, lens flare, people, animals, text, Chinese characters, signboards, watermark, borders, frames, stamps, portrait orientation.

The scene:
```

---

## 6 个目的地的画面

### 1. `xihu` 西湖·断桥

```
West Lake in Hangzhou, seen from the lakeshore: the low stone arch of Broken Bridge at the end of a willow-lined causeway in the middle ground, calm dusty-blue lake water with a single small wooden rowing boat, weeping willows hanging over the water in the foreground left, soft layered hills in the background with a slender pagoda on top of one hill. Early spring, a few pale pink peach blossoms among the willows.
```

### 2. `yunqi` 云栖小镇

```
A quiet valley town among bamboo forests and tea hills near Hangzhou: a narrow stone path through tall green bamboo in the foreground, a small clear stream beside it, and in the middle of the valley a few low modern exhibition halls with simple flat roofs and big windows, softly blended into the landscape. A few small colorful pennant flags on poles near the halls (no writing). Rounded tea-terrace hills behind, pale sky with soft clouds.
```

### 3. `wuzhen` 乌镇

```
An ancient Jiangnan water town: a narrow canal running into the distance, both sides lined with old houses with white walls, dark grey tiled roofs and wooden windows, some houses on stilts over the water. A small black-roofed wooden boat with an arched canopy floats on the canal. A humpbacked stone arch bridge crosses the canal in the middle ground. Red paper lanterns (no writing) hang under a few eaves. Calm reflections in the water.
```

### 4. `qiandaohu` 千岛湖

```
A huge clear lake dotted with many small round green islands, seen from a gentle hilltop: islands of different sizes scattered across the dusty-blue water toward the horizon, a small white ferry boat leaving a soft wake between two islands, layered blue-green mountains on the far shore, a few pine branches framing the top-left corner of the view.
```

### 5. `moganshan` 莫干山

```
A cool mountain bamboo forest: an old stone stairway winding up through a dense sea of tall bamboo, a small clear stream with a little waterfall falling over mossy rocks beside the stairs, and half-hidden among the bamboo on the slope an old stone villa with a red-tiled roof and a wooden balcony. Dappled light shown only with flat lighter patches, summer feeling.
```

### 6. `huangshan` 黄山

```
Huangshan mountains above a sea of clouds: sharp granite peaks rising out of soft white flat clouds that flow between them, a twisted old pine tree growing out of a rock crack on the left cliff edge with one long branch reaching out like a welcoming arm, a narrow stone stairway with a simple railing carved along the cliff in the foreground, distant peaks fading into pale blue.
```

### 5（第二版）`moganshan` 莫干山：第一次结果画风偏了

**第一次的问题**：画得太细、太暗，像动画电影的背景，不像屋外全景那种简单的绘本画。

| 偏在哪 | 原因 | 第二版怎么改 |
|---|---|---|
| 几百根竹子、每片叶子都画出来 | 写了「茂密的竹海」，竹子本身又全是细线 | 只画几丛竹子，叶子画成成团的扁平色块，像参考图里树冠的画法 |
| 整体暗绿、没有天空 | 画面被竹子塞满，像在隧道里 | 视角拉远，上方留出淡色天空，远处是圆圆的山 |
| 光斑、渐变 | 写了「透下来的光斑」 | 删掉光斑，只用一种深一档的扁平阴影 |
| 石屋砖块、石阶纹理很细 | 没限制细节 | 明确要求「大块面、少细节」 |

**生成方法**：新开对话，上传 `room-exterior.webp`，**不要贴通用部分**，直接贴下面这整段（已经包含通用要求，并加强了「简单」）。

```
Please generate a LANDSCAPE image with a 3:2 aspect ratio.

Use the image I uploaded as the art style reference and match it closely: the same thin dark brown slightly wobbly outlines, the same flat color fills with only one darker flat shade for shadows, the same subtle paper grain, the same light and airy muted palette, and the same LEVEL OF SIMPLICITY. Look at how the reference draws tree crowns: big rounded clumps of flat green with a few outline bumps, not individual leaves. Draw all foliage in this scene the same way.

This is the picture side of a travel postcard in a cozy web game, drawn like a simple children's picture book page. Big simple shapes, very few small details, plenty of calm empty space. No characters, no people, no animals, no ducks. No text, no signs.

The scene: Moganshan mountain in summer, seen from a gentle open viewpoint, not from inside a dense forest. In the foreground, an old stone stairway (drawn as a few large simple steps, no brick texture) climbs gently from the bottom center toward the right. Beside the stairs on the left, a small clear stream with one short little waterfall over two or three big rounded mossy rocks. Left and right edges: just a few clumps of bamboo, maybe six to eight stalks on each side, with leaves drawn as soft rounded clumps of flat green like the tree crowns in the reference. In the middle ground on a green slope, a small old stone villa with a red-tiled roof and a wooden balcony, clearly visible, about the same size as the shed in the reference. Background: soft rounded green hills fading to pale sage, and a pale cream-blue sky with one or two simple clouds taking up the top quarter of the image.

Colors: light and warm like the reference: pale sky, beige stone, sage and moss greens (not dark olive), dusty blue water, coral red roof.

Avoid: a dense wall of bamboo, a tunnel-like forest, hundreds of thin lines, individual leaves, dappled light spots, sun rays, gradients, dark or gloomy colors, detailed brick or stone texture, anime film background style, realistic painting, photorealism, 3D rendering, thick cartoon outlines, saturated colors, people, animals, text, watermark, borders, portrait orientation.
```

**如果还是太细**：不要在原图上改，再新开一次，在场景描述最后加一句：`Even simpler: half as many objects, larger shapes.`

**另外**：`yunqi` 云栖小镇的画面也有竹林，生成时如果也出现一整面密竹，按这里同样的方法改：竹子只画几丛，叶子画成成团的扁平色块，上方留出天空。

---

## 如果只差一点（只改一次）

| 问题 | 补一句 |
|---|---|
| 画了人或动物 | 「保持其他完全不变，去掉画面里所有的人和动物。」 |
| 出现文字 | 「保持其他完全不变，去掉所有文字和招牌上的字。」 |
| 太写实、像照片 | 不要修改，新开对话重来，并在场景描述末尾加一句：`Keep it very simple, like a children's picture book page.` |
| 颜色太艳 | 不要修改，新开对话重来，在场景描述末尾加一句：`Use the same muted low-saturation colors as the reference image.` |
| 竖版或方图 | 新开对话，第一句改成 `Please generate a WIDE horizontal image, 1536×1024.` |

## 验收（Claude 处理时检查）

- [ ] 6 张放在一起看，描边、颜色、纸张颗粒和屋外全景一致。
- [ ] 没有人、动物、文字。
- [ ] 缩到 375px 宽的手机明信片（约 330×220）时，一眼能认出是什么地方。
