# GPT 生图提示词：屋外全景

> 布局线框图：[`layout-outdoor-landscape.png`](layout-outdoor-landscape.png)。黄色字母是鸭子在屋外出现的位置，红色虚线框留给界面。
> 画风基准：已经定稿的**屋内横版图**（树洞内部那张）。

---

## 1. 布局思路

从左到右一条小路贯穿画面，树屋在中间，池塘在树屋正前方：

| 区域 | 内容 | 作用 |
|---|---|---|
| 左 | 木栅栏围起来的菜园：三块种着菜的菜畦 + 一块空地，旁边一个小工具棚和水壶 | 种菜（可选玩法，见第 4 节） |
| 中 | 大树，树根拱门朝向我们，树干上能看到阁楼的小圆窗 | 和屋内对应：屋内右边的门就是这道拱门 |
| 中前 | 池塘和一条伸进水里的小码头 | 和屋内门外看到的码头是同一个 |
| 右 | 门边一个红色邮箱；路牌；小路蜿蜒着往右上方延伸，消失在远山里 | 旅行：鸭子从这里出发、从这里回来；明信片寄到邮箱 |

**视角**：和屋内不同，屋外是「略高的斜侧视角」，能看到天空和远山，小路才能延伸到远方。画风保持一致即可。

### 鸭子在屋外的位置

| 编号 | 位置 | 活动 |
|---|---|---|
| A | 菜园里 | 浇水 / 种菜（可选） |
| B | 码头尽头 | 坐着发呆、看水 |
| C | 池塘水面 | 游泳 |
| D | 邮箱旁 | 取明信片 |
| E | 小路远端 | 出发 / 回家（贴图缩小，表示走远了） |

---

## 2. 生成方法

1. 上传**屋内横版图**（只作画风参考），再上传屋外线框图（只作布局参考）。
2. 说明：「第一张只参考画风，第二张只参考位置关系，不要照抄它的颜色和文字。」
3. 明确说「**请生成横版图片**」。
4. 粘贴下面的提示词。

---

## 3. 提示词

### 英文（推荐）

```
Please generate a LANDSCAPE (horizontal) image.

Use the first image I uploaded ONLY as the art style reference: keep exactly the same thin dark brown wobbly outlines, flat coloring with one darker flat shade for shadows, paper grain texture and muted warm palette. Use the second image ONLY as the layout reference. Do not copy its colors, shapes or text labels.

A cozy web game background: the outside of a little duck's home, seen from a slightly elevated three-quarter view so we can see the sky and distant hills. No characters, no animals, no ducks.

Layout from left to right:
- Center: a big old tree with a wide leafy crown. At its base, an arched doorway formed by the roots faces the viewer. A small round window is visible on the trunk higher up. The tree trunk is smooth bark only: no mushrooms, no shelf fungi, no stairs on the trunk.
- A dirt path runs horizontally across the whole image, passing right in front of the tree door, between the tree and the pond.
- Foreground center, directly in front of the tree: a calm pond with lily pads, and a short wooden dock going from the path out into the water.
- Left: a small vegetable garden with a low wooden fence: three garden beds with growing vegetables (carrots, cabbages, tomatoes on sticks) and one empty bed of bare soil; a tiny wooden tool shed with a watering can beside it.
- Right: a small red mailbox on a post beside the path, near the tree door; a wooden signpost with blank arrow boards (no writing); the path winds to the upper right, getting narrower and disappearing into soft distant hills, suggesting a long journey.
- Background: soft distant hills on the right, a pale sky with a few simple clouds.
- Foreground edges: reeds and wildflowers in the bottom left, reeds and stones in the bottom right.
- Leave small empty spots: inside the garden, at the end of the dock, on the open water, beside the mailbox, and on the far part of the path. Keep the top-left corner, top-right corner and bottom-center edge simple, because UI will cover them.

Art style: same as the reference image. Hand-drawn picture-book illustration, thin dark brown outlines of even weight, slightly wobbly. Flat color fills, shadows only one slightly darker flat shade, no gradients, no glossy highlights, no realistic lighting. Subtle paper grain. Muted low-saturation palette: warm wood browns, beige, moss and sage green, dusty blue water, pale sky, with tiny accents of coral red and mustard yellow.

Avoid: portrait composition, interior view, characters or animals, mushrooms or shelf fungi on the tree, stairs on the trunk, stone house, text on the signpost, labels, thick cartoon outlines, vector clip-art look, 3D rendering, saturated colors, watermark, UI buttons.
```

### 中文对照

```
请生成一张横版图片。

第一张上传的图只作为画风参考：深棕色手抖细描边、扁平上色（阴影只用深一档的纯色）、纸张颗粒、低饱和暖色调，完全保持一致。第二张图只作为位置关系参考，不要照抄它的颜色、形状和文字。

网页游戏背景：一只小鸭子的家的「外面」，略高的斜侧视角，能看到天空和远山。画面里没有任何角色、动物或鸭子。

从左到右：
- 中间：一棵树冠茂密的老树，树根形成的拱门朝向我们，树干高处能看到一个小圆窗。树干只有树皮：不要蘑菇、不要层状菌、不要树干上的台阶。
- 一条土路横贯整个画面，从树屋门前经过，位于树和池塘之间。
- 前景中间、树屋正前方：一片平静的池塘，有荷叶；一条短短的木码头从路边伸进水里。
- 左边：低矮木栅栏围着的小菜园，三块菜畦种着菜（胡萝卜、白菜、搭着竹竿的番茄），还有一块空着的泥土地；旁边一个小木工具棚和一个水壶。
- 右边：门边路旁一个立在木桩上的红色小邮箱；一个木头路牌，箭头板上没有字；小路往右上方蜿蜒，越来越窄，消失在远处柔和的山丘里，让人感觉通向很远的地方。
- 背景：右侧远处柔和的山丘，淡淡的天空和几朵简单的云。
- 前景边缘：左下角芦苇和野花，右下角芦苇和石头。
- 留出空位：菜园里、码头尽头、开阔的水面、邮箱旁、小路远端。左上角、右上角和底部中间保持简单，界面会盖在那里。

画风：和参考图一致。手绘绘本插画，深棕色细描边，粗细统一、略带手抖；扁平上色，阴影只用深一档的纯色，无渐变、无高光、无写实光影；淡淡纸张颗粒；低饱和配色：暖木棕、米色、苔绿和鼠尾草绿、雾蓝色水面、淡色天空，极少量珊瑚红和芥末黄点缀。

不要：竖版构图、室内、角色或动物、树上的蘑菇或层状菌、树干上的台阶、石头房子、路牌上的文字、标注、粗卡通描边、矢量剪贴画风、3D 渲染、高饱和色、水印、界面按钮。
```

### 如果只差一点

- 树上又长出蘑菇台阶：「保持其他不变，去掉树干上所有蘑菇和台阶，只保留树皮。」
- 路没有通向远方：「保持其他不变，让右边的小路往右上方蜿蜒，越来越窄，消失在远山里。」
- 路牌上有字：「保持其他不变，把路牌上的文字全部去掉，只留空白木板。」

---

## 4. 对排期的影响（需要你决定）

屋外场景本身只是多一张背景图和一个「屋内 / 屋外」切换按钮，工作量约 1 小时，可以放进**第三阶段（旅行）**：鸭子从右边小路出发、从小路回来、明信片寄到邮箱，正好需要这个场景。

**菜园是新玩法**，不在原来的必做清单里。按每天 1～2 小时的预算，建议：

- **必做**：屋外场景 + 旅行出发 / 回家 + 邮箱收明信片。
- **最好有（P1）**：菜园。最简单的做法是「鸭子自己去浇水，菜慢慢长大，成熟后变成食物，吃饭时自动吃掉」，约 2～3 小时。
- 在那之前，菜园先作为背景装饰画在图里，不影响以后加功能。
