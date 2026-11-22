# GPT 生图提示词：屋外全景

> 布局线框图：[`layout-outdoor-landscape.png`](layout-outdoor-landscape.png)。黄色字母是鸭子在屋外出现的位置，红色虚线框留给界面。
> 画风基准：已经定稿的**屋内横版图**（树洞内部那张）。

---

## 第二版（11-10）：针对第一次生成结果的修改

### 第一次结果的问题

| 问题 | 原因 | 这一版怎么改 |
|---|---|---|
| 整体「怪」 | 构图完全对称：树在正中、码头笔直朝下、池塘居中，像一张示意图 | 改成不对称：池塘移到树屋**右前方**，码头**斜着**伸进水里 |
| 视角混乱 | 树是正面平视，池塘和码头却像从正上方看 | 统一成「略高的斜侧视角」，所有东西都按同一个角度画 |
| 一棵树太突兀 | 大树孤零零立在空旷草地上，不像有人（鸭）住的地方 | 树屋长在**一片树林的边缘**，是其中最老最大的一棵；树林左密右疏，右边留出开阔地给旅行的小路 |
| 窗户里是树叶贴图 | GPT 把叶子画进了玻璃里 | 窗户玻璃反射天空、透出屋里的暖光；树叶来自**旁边真实垂下的树枝** |
| 太空、没生活感 | 屋内图小物件很多，屋外几乎没有 | 门口加提灯、木柴堆、小长凳、花盆、晾衣绳 |
| 门和屋内对不上 | 屋内是没有门板的树根拱门，屋外画成了普通木门 | 只有树根拱门，**没有门板**；门洞里只透出暖光和地毯一角，不画家具 |

布局线框图已同步更新：[`layout-outdoor-landscape.png`](layout-outdoor-landscape.png)。

### 生成方法

**新开一个对话**（避免受上一张影响），上传：① 屋内定稿图（画风参考）；② 更新后的屋外线框图（布局参考）。说「请生成横版图片」，再粘贴下面的提示词。

### 英文提示词（第二版）

```
Please generate a LANDSCAPE (horizontal) image.

Use the first image I uploaded ONLY as the art style reference: keep exactly the same thin dark brown wobbly outlines, flat coloring with one darker flat shade for shadows, paper grain texture and muted warm palette. Use the second image ONLY as the layout reference. Do not copy its colors, shapes or text labels.

A cozy web game background: the outside of a little duck's home at the edge of a small forest, seen from one consistent slightly elevated three-quarter view (everything drawn from the same angle). An asymmetric, natural composition, not a centered diagram. No characters, no animals, no ducks.

- The home: the oldest and biggest tree at the edge of a forest, slightly left of center. Other smaller trees and bushes stand behind it and to its left, forming a forest backdrop that thins out toward the right. The home tree's roots form an open arched doorway with NO door. Through the doorway we only see a soft warm dim interior and the edge of a round woven straw rug on the floor; no shelves, jars or furniture visible inside. Higher on the trunk, a small round window: its glass reflects the sky and shows a warm light from inside, and a real leafy branch of the tree hangs beside it. No leaves painted inside the glass. Smooth bark only: no mushrooms, no shelf fungi, no stairs on the trunk.
- Lived-in details at the door: a hanging lantern, a small stack of firewood, a little wooden bench, flower pots, a short laundry line between the tree and a post.
- A dirt path passes in front of the door and runs across the image: to the left it leads to the garden; to the right it winds toward the upper right, getting narrower and disappearing between soft distant hills, suggesting a long journey.
- Left: a small vegetable garden with a low wooden fence at the forest edge: three beds of growing vegetables (carrots, cabbages, tomatoes on sticks) and one bed of bare soil, a tiny tool shed and a watering can.
- Right of the door: a small red mailbox on a post beside the path, and a wooden signpost with blank arrow boards (no writing).
- Foreground, to the right front of the tree: a calm pond with lily pads; a short wooden dock goes diagonally from the path into the water.
- Background: soft distant hills on the right, a pale sky with a few simple clouds.
- Foreground edges: reeds and wildflowers bottom left, reeds and stones bottom right.
- Leave small empty spots: inside the garden, at the end of the dock, on the open water, beside the mailbox, and on the far part of the path. Keep the top-left corner, top-right corner and bottom-center edge simple, because UI will cover them.

Art style: same as the reference image. Hand-drawn picture-book illustration, thin dark brown outlines of even weight, slightly wobbly. Flat color fills, shadows only one slightly darker flat shade, no gradients, no glossy highlights, no realistic lighting. Subtle paper grain. Muted low-saturation palette: warm wood browns, beige, moss and sage green, dusty blue water, pale sky, with tiny accents of coral red and mustard yellow.

Avoid: a door or door panel in the doorway, furniture visible through the doorway, symmetric centered composition, a lone tree in an empty field, a dock pointing straight at the viewer, mixed perspectives, leaves drawn inside the window glass, portrait composition, interior view, characters or animals, mushrooms or shelf fungi on the tree, stairs on the trunk, text on the signpost, labels, thick cartoon outlines, vector clip-art look, 3D rendering, saturated colors, watermark, UI buttons.
```

### 中文对照（第二版）

```
请生成一张横版图片。

第一张图只作画风参考（深棕色手抖细描边、扁平上色、阴影只用深一档纯色、纸张颗粒、低饱和暖色调，完全保持一致）；第二张图只作位置关系参考，不照抄颜色、形状和文字。

网页游戏背景：小鸭子的家的外面，位于一片小树林的边缘。整张图用同一个「略高的斜侧视角」画，构图自然、不对称，不要像居中的示意图。没有任何角色、动物或鸭子。

- 家：树林边缘最老最大的一棵树，位置略偏左。它后面和左边有其他较小的树和灌木，形成树林背景，越往右越稀疏。树根形成敞开的拱门，没有门板。门洞里只看到柔和的暖光和地上圆形草编地毯的一角，不要画架子、罐子或其他家具。树干高处一个小圆窗：玻璃反射天空、透出屋里的暖光，旁边垂下一根真实的带叶树枝。玻璃里不要画树叶。树干只有树皮：不要蘑菇、层状菌或台阶。
- 门口的生活细节：一盏挂着的提灯、一小堆木柴、一张小木长凳、几个花盆、树和木桩之间一段晾衣绳。
- 一条土路从门前经过、横贯画面：往左通向菜园；往右向右上方蜿蜒，越来越窄，消失在远处柔和的山丘之间，像通向很远的地方。
- 左边：树林边上低矮木栅栏围着的小菜园，三块菜畦（胡萝卜、白菜、搭竹竿的番茄）和一块空泥地，一个小工具棚和水壶。
- 门的右边：路旁木桩上一个红色小邮箱；一个木头路牌，箭头板上没有字。
- 前景、树屋右前方：一片平静的池塘和荷叶；一条短木码头从路边斜着伸进水里。
- 背景：右侧远处柔和的山丘，淡色天空和几朵简单的云。
- 前景边缘：左下芦苇和野花，右下芦苇和石头。
- 留空位：菜园里、码头尽头、开阔水面、邮箱旁、小路远端。左上角、右上角和底部中间保持简单，界面会盖在那里。

画风：和参考图一致（同上）。

不要：门洞里的门板、门洞里能看到的家具、对称居中构图、空旷草地上孤零零一棵树、正对镜头的码头、混乱的透视、画在窗玻璃里的树叶、竖版、室内、角色或动物、树上的蘑菇或层状菌、树干台阶、路牌文字、标注、粗卡通描边、矢量剪贴画风、3D 渲染、高饱和色、水印、界面按钮。
```

### 如果只差一点

- 画了门、门洞里的东西和屋内对不上（第二版第一次生成就出现了，原因是第二版最初写了「敞开的小木门」，已修正）：
  「保持画面其他部分完全不变，只修改树根拱门：去掉门板，变成没有门的敞开拱门；门洞里只保留柔和的暖光和地上圆形草编地毯的一角，去掉里面的架子和罐子。」
- 窗户又是贴图：「保持其他不变，窗玻璃里不要树叶，改成反射天空和透出暖光，在窗户旁边画一根真实垂下的树枝。」
- 还是像一棵孤树：「保持其他不变，在大树后面和左边加一片较小的树和灌木，让它看起来长在树林边缘。」
- 码头还是正对镜头：「保持其他不变，把码头改成从路边斜着伸进水里。」

---

## 屋内外对齐（11-10）

两张图单独看都没问题，放在一起有三处对不上：

| 对不上的地方 | 屋内图 | 屋外图 |
|---|---|---|
| 门在哪面墙 | 门在**右侧墙**上（屋内是「拆掉前墙」的视角，前墙上的东西看不到） | 门在树干**正面**、朝着我们 |
| 门外是什么 | 门外紧挨着就是池塘和码头 | 门外是土路和草地，池塘在右前方，隔着一段距离 |
| 门洞里面 | — | 一块平涂的黄色，像贴上去的，没有纵深 |

**统一的设定**：门开在树干的**右侧**，朝向右边的小路、邮箱和池塘（出门就是旅行的方向）。屋外图把门挪到树干右侧，屋内图把门外的景色改成「先是土路，再远一点是池塘和码头」。

### 改屋外图（在生成屋外图的对话里）

```
Keep everything else in the image exactly the same. Move the arched root doorway from the front of the trunk to the RIGHT side of the trunk, so we see it at an angle, facing right toward the mailbox, the path and the pond. Remove the old doorway on the front and fill it with plain bark. Inside the new doorway, show depth instead of a flat color: a dim warm interior getting darker toward the inside, a hint of the curved wooden inner wall and the edge of a round woven straw rug on the floor.
```

### 改屋内图（在生成屋内图的对话里）

```
Keep everything else in the image exactly the same. Only change the view through the arched doorway on the right: right outside the doorway there is a strip of dirt path and grass, and the pond with a small wooden dock is a little further away beyond the path, matching the outside of the house.
```

顺便可以一起改：「同时把书桌上的笔记本电脑转过来，屏幕朝墙，我们只看到电脑背面。」

---

# 第一版（已被第二版取代）

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
