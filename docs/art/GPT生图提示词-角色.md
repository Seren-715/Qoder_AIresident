# GPT 生图提示词：Qoduck 角色贴图

> 背景已定稿：屋内（树洞内部横版）、屋外（树林边的树屋横版）。
> 目标：画出和背景**同一画风**的 Qoduck，再画出各个活动的姿态贴图。

按三步走，每一步都**新开对话**，不连环改图（见 [`README.md`](README.md) 的定稿规则）。

---

## 第 1 步：定稿标准形象

先画一张标准形象，之后所有姿态都以它为参考。

**上传**：① 官方 Qoduck 图（形象参考）；② 屋内定稿图（画风参考）。

```
Please generate a SQUARE image.

Draw the character from the first image I uploaded (the Qoduck mascot) in the art style of the second image I uploaded.

Keep the character's design exactly: a round, chubby bright yellow body with almost no neck; a big flat orange beak that takes up a large part of the face; thick black slightly grumpy eyebrows and small black eyes; a small tuft of feathers sticking up on top of the head; small orange webbed feet; tiny stubby wings.

Change only the rendering to match the second image: thin dark brown outlines of even weight, slightly wobbly like drawn with a fine pen; flat colors with just one slightly darker flat shade for shadows; no gradients, no glossy highlights; subtle paper grain; the yellow slightly muted and warm so it sits well in the room.

Show the character standing, facing the viewer at a slight three-quarter angle, seen from slightly above (the same camera angle as the room). Full body, centered, alone, on a plain solid white background. No ground shadow, no text, no other objects.
```

拿到满意的一张就停，保存为 `duck-base.png`。

---

## 第 2 步：一张图画完所有姿态（姿态表）

**为什么一张图画完**：分开生成的话，每张鸭子的大小、比例、颜色都会有点不一样；画在同一张图里，GPT 会自动保持一致。之后再切开。

**上传**：① `duck-base.png`（形象和画风参考）。

```
Please generate a LANDSCAPE image.

A character pose sheet of the duck in the image I uploaded. Same character, same art style, same size and proportions in every pose: thin dark brown wobbly outlines, flat muted colors, one darker flat shade for shadows, subtle paper grain. Plain solid white background. The poses are arranged in a neat grid of 2 rows and 4 columns, evenly spaced, not overlapping, each pose clearly separated with plenty of white space around it. All poses seen from slightly above, the same camera angle. No ground shadows, no furniture, no props except the ones listed, no text, no labels, no numbers.

Row 1:
1. Sleeping: curled up lying on its side, eyes closed, peaceful.
2. Eating: bending forward with its beak pointing down as if eating from a bowl on the ground (no bowl drawn), cheeks puffed.
3. Reading: sitting, holding an open book with both wings, looking at the book.
4. Coding: seen from BEHIND, sitting, wings raised slightly forward as if typing on a keyboard (no laptop drawn), its tuft visible.

Row 2:
5. Daydreaming: sitting, seen from the side, legs stretched forward, gazing into the distance with a relaxed face.
6. Playing: lying on its back, wiggling happily, feet in the air.
7. Swimming: floating on water, only the upper body drawn, the bottom edge cut flat with two or three small ripple lines.
8. Leaving on a trip: seen from BEHIND, walking away, carrying a small brown backpack with a rolled blanket on top.
```

### 姿态和文件名

| 编号 | 文件名 | 用在哪 | 阶段 |
|---|---|---|---|
| 1 | `sleep.png` | 屋内 · 阁楼床上 | 第一阶段 |
| 2 | `eat.png` | 屋内 · 饭碗旁 | 第一阶段 |
| 3 | `read.png` | 屋内 · 书桌前的凳子上 | 第一阶段 |
| 4 | `code.png` | 屋内 · 书桌前的凳子上（背对镜头） | 第一阶段 |
| 5 | `gaze.png` | 屋内 · 水池边 | 第一阶段 |
| 6 | `play.png` | 屋内 · 地毯上 | 第一阶段 |
| 7 | `swim.png` | 屋内水池 / 屋外池塘 | 可选 |
| 8 | `leave.png` | 屋外 · 小路远端 | 第三阶段 |

### 刻意不画进图里的东西

- **地面阴影**：代码里在鸭子脚下加一个半透明椭圆，大小位置都好调。
- **💤、❤️、✨ 这类符号**：用代码飘出来，不画死在贴图上。
- **饭碗、书桌、电脑**：背景里已经有了，贴图只画鸭子，靠位置对上。

---

## 第 3 步：抠图和切图

1. **去背景**：把白底变透明。可以试着直接让 GPT 生成「transparent background」；不行的话，用任意在线抠图工具（搜「去除图片背景」）处理整张姿态表。
2. **切图**：把每个姿态单独裁出来，四周留一点点透明边，按上表文件名保存。
3. **不要单独缩放**：8 张都从同一张姿态表上直接裁下来，保持原始比例（躺着的本来就比坐着的矮），之后在代码里用同一个缩放系数控制鸭子大小。
4. 放进代码仓库的 `public/assets/duck/`。

切图和缩放也可以交给 Qoder：把姿态表放进仓库，让它写一个小脚本按格子切开。

---

## 如果只差一点（第 2 步）

一次只改一处，最多改一次；改坏了就重新生成。

- 某个姿态的鸭子和其他的不像：「保持其他姿态不变，只重画第 N 个，让它和其他姿态是同一只鸭子、同样大小。」
- 画了家具或道具：「保持姿态不变，去掉所有家具和道具，只留鸭子和白底。」
- 背面姿态画成了正面：「保持其他不变，第 N 个改成背对我们，看不到脸，只看到后脑勺和翘起的绒毛。」

---

## 放进背景里试一下

贴图做好后，先别急着全部定稿：挑 `read.png` 贴到屋内图的凳子位置看看大小和角度合不合适。**鸭子大约和书桌前的小凳一样高**比较合适。不合适的话，只需要在代码里调大小，不用重画。
