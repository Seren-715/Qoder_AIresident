# GPT 生图提示词：树洞小屋

> **当前用第三版（横版）**，在本节。第二版（竖版）保留在后面作记录。

---

## 第三版：横版（11-10）

第二版生成的竖版图画风已经对了，这一版只改三件事：

1. **改成横版**：作品是网页，主要在电脑上看。手机竖屏时，前端只显示画面的一部分，并自动对准鸭子所在的位置。
2. **电脑朝向**：屏幕朝墙、凳子朝镜头，鸭子坐上去时是**背对我们写代码**，看得到它在敲键盘。
3. **家具摆放更合理**：鸭子要用的东西都放在它够得着的高度——树节孔窗移到阁楼床边，记忆墙移到门边和任务公告板并排（「旅行角」：揭任务 → 出门 → 回来钉明信片），高处只挂提灯和干草药作装饰；东西都要落在地面、桌面或墙上，不要悬空；阁楼加矮栏杆，绳梯从阁楼的开口垂下来；书架嵌进阁楼下方的壁龛里。

布局线框图：[`layout-treehouse-landscape.png`](layout-treehouse-landscape.png)。黄色编号是鸭子出现的位置，红色虚线框留给界面。

### 怎么生成（推荐「改图」，不要从零开始）

画风已经满意了，最稳的做法是**在上次那个对话里**，或新开对话时**上传上次那张竖版图**，让 GPT 以它为画风基准重新构图：

1. 上传上次满意的竖版图，再上传横版线框图。
2. 说明：「第一张图只参考画风，第二张图只参考家具位置。」
3. 在对话里说「**请生成横版图片**」（GPT 横版一般是 1536×1024，约 3:2；前端会裁成 16:9，上下各留一点余量即可）。
4. 粘贴下面的提示词。

### 英文提示词

```
Please generate a LANDSCAPE (horizontal) image.

Use the first image I uploaded ONLY as the art style reference (keep exactly the same line work, flat coloring, paper grain and muted palette). Use the second image ONLY as the layout reference for where furniture goes. Do not copy the second image's colors or labels.

A cozy web game background: a dollhouse cutaway view of the INSIDE of a hollow old tree beside a pond, seen from a slightly high angle, like looking into a dollhouse with the front wall removed. Curved warm wooden inner walls with growth rings. No characters, no animals, no ducks.

Layout from left to right:
- Upper left: a wooden plank loft with a low wooden railing, a small bed with a dusty-blue quilt on it. Right next to the bed, at loft height, a round knothole window letting in soft light, so the bed is beside the window. A rope ladder hangs down from an opening at the right edge of the loft to the floor.
- Lower left, under the loft: a bookshelf built into a niche in the wall, packed with old books and scrolls.
- Upper center: the hollow narrows upward like a dome; nothing is mounted high on the walls. Only a lantern and a few bundles of dried herbs hang from the top on strings.
- Center: a small desk made from a tree stump, standing against the back wall. On it, a tiny old laptop whose SCREEN FACES THE WALL (we see the back of the laptop lid), a desk lamp and a mug. A small round stool in front of the desk, on the viewer's side, so someone sitting there would be seen from behind.
- Right side, a small travel corner near the doorway, everything mounted LOW on the wall at the height of a small duck: a cork board with pinned task cards and a hand-drawn map, and next to it a memory wall of postcards and instant photos hanging on two strings of twine with tiny clips.
- Far right: a big arched doorway formed by tree roots, opening onto the pond, with lily pads and a small wooden dock visible outside.
- Floor: packed earth and thick roots. A round woven straw rug in the center. In the lower left corner, a small pool of clear pond water between the roots with duckweed, and a small food bowl on the floor beside it.
- Every object rests on the floor, a table, a shelf or the wall; nothing floats in the air.
- Everything a small duck needs to use is placed low, within its reach. Leave small empty spots on the bed, on the stool, in the middle of the rug, at the edge of the pool and next to the bowl. Keep the top-left corner, top-right corner and bottom-center edge simple, because UI will cover them.

Art style: same as the reference image. Hand-drawn picture-book illustration, thin dark brown outlines of even weight, slightly wobbly. Flat color fills, shadows only one slightly darker flat shade, no gradients, no glossy highlights, no realistic lighting. Subtle paper grain. Muted low-saturation palette of warm wood browns, beige, moss green and dusty blue.

Avoid: portrait composition, exterior view, characters or animals, mushroom stairs, stone walls, floating objects, a laptop screen facing the viewer, thick cartoon outlines, vector clip-art look, 3D rendering, saturated colors, text, labels, watermark, UI buttons.
```

### 中文对照（供核对）

```
请生成一张横版图片。

第一张上传的图只作为画风参考（线条、扁平上色、纸张颗粒、低饱和配色完全保持一致）；第二张图只作为家具位置参考，不要照抄它的颜色和文字标注。

网页游戏背景：池塘边老树的树洞「内部」，娃娃屋剖面视角，略从上方看进去。弧形暖色木头内壁，有年轮。没有任何角色、动物或鸭子。

从左到右：
- 左上：带矮木栏杆的木板阁楼，上面有一张盖着雾蓝色被子的小床；床边、和阁楼同一高度有一个圆形树节孔窗，透进柔和的光；阁楼右侧开口处垂下一架绳梯到地面。
- 左下（阁楼下方）：嵌在墙壁壁龛里的书架，塞满旧书和卷轴。
- 中上方：树洞向上收窄成穹顶，高处墙上不挂任何东西，只从顶上用绳子垂下一盏提灯和几束干草药。
- 中间：靠后墙的树墩小书桌，桌上一台小旧笔记本电脑，屏幕朝墙（我们看到的是电脑背面）、台灯和马克杯；书桌前、靠观众这一侧放一张小圆凳，坐在上面的人是背对我们的。
- 右侧靠近门的「旅行角」，所有东西都挂在**小鸭子够得着的低处**：一块软木任务板，钉着任务卡片和手绘地图；旁边是记忆墙，两串麻绳和小夹子挂着明信片和拍立得。
- 最右：树根形成的大拱门，通向池塘，门外有荷叶和小木码头。
- 地面：压实的泥土和粗树根，中央一块圆形草编地毯；左下角树根之间一小汪清澈池水和浮萍，旁边地上一个小饭碗。
- 所有东西都放在地面、桌面、架子或墙上，不要悬空。
- 小鸭子要用的东西都放在它够得着的低处。床上、凳子上、地毯中央、水边、饭碗旁各留一小块空位。左上角、右上角和底部中间保持简单，界面会盖在那里。

画风：和参考图一致。手绘绘本插画，深棕色细描边，粗细统一、略带手抖；扁平上色，阴影只用深一档的纯色，无渐变、无高光、无写实光影；淡淡纸张颗粒；低饱和的暖木棕、米色、苔绿、雾蓝。

不要：竖版构图、外景、角色或动物、蘑菇台阶、石头墙、悬空物件、屏幕朝向观众的电脑、粗卡通描边、矢量剪贴画风、3D 渲染、高饱和色、文字、标注、水印、界面按钮。
```

### 如果只差一点

- 电脑还是朝着镜头：「保持其他不变，把笔记本电脑转过来，屏幕朝墙，我们只看到电脑背面。」
- 凳子位置不对：「保持其他不变，把小圆凳放到书桌前、靠近观众的一侧。」
- 某个东西悬空：「保持其他不变，把 XX 放到地上 / 桌上。」

---

# 第二版：竖版（已被第三版取代）

## 1. 上次两张图的问题

| | 第一张（细节多、偏吉卜力） | 第二张（干净矢量） | 我们要的 |
|---|---|---|---|
| 画面 | 树**外面**的风景 | 树**外面**的风景 | 树洞**里面**的房间 |
| 比例 | 横屏 | 横屏 | **竖屏** |
| 视角 | 平视远景 | 平视远景 | **斜上方俯视，像看一个拆掉前墙的娃娃屋** |
| 线条 | 细碎、很多纹理线 | 很粗、像剪贴画 | 细、统一粗细、深棕色、略带手抖 |
| 上色 | 有渐变和大量纹理 | 纯色、太干净太空 | 扁平色块 + 只深一档的阴影色，带一点纸张颗粒 |
| 色调 | 绿色饱和 | 绿色饱和 | **低饱和**：暖灰、米色、木头棕、苔绿 |
| 内容密度 | 风景很满 | 太空 | **室内小物件很多**，杂而不乱 |
| 其他 | 画了鸭子；出现了蘑菇台阶 | 画了鸭子 | **不要角色**；**不要蘑菇台阶** |

最关键的一个词是 **dollhouse cutaway（拆掉前墙的娃娃屋剖面）**，它能同时解决「画成外景」和「视角不对」两个问题。

---

## 2. 生成前的设置

1. **尺寸选竖版**（GPT 里一般是 1024×1536，约 2:3）。只在提示词里写「竖屏」不够，最好在对话里明确说「请生成竖版图片」。前端会按 9:16 裁切，上下各留一点余量即可。
2. **不要上传那款游戏的截图当参考图**，否则容易连内容一起模仿。可以上传我们的布局线框图 `layout-boathouse.png` 当**构图参考**，并说明「只参考家具位置，不参考画风」。
3. **新开一个对话**再生成，避免上一轮的外景图影响结果。

---

## 3. 提示词（英文，推荐）

```
Please generate a PORTRAIT (vertical) image.

A mobile game home-screen background: a dollhouse cutaway view of the INSIDE of a hollow old tree beside a pond, seen from a high angle looking down into the room, like looking into a dollhouse with the front wall removed. We see the floor and the inner walls, not the outside of the tree. No characters, no animals, no ducks.

The room: curved warm wooden inner walls with visible growth rings and bark texture. Two levels.
- Upper level: a wooden plank loft built against the inner wall, with a small bed and a dusty-blue quilt; a rope ladder hangs down to the floor; a round knothole window high up lets in a soft beam of light; next to the loft, postcards and instant photos hang on twine with tiny wooden clips.
- Middle: on the left, a bookshelf carved into a niche in the wall, packed with old books and scrolls; in the middle, a small desk made from a tree stump with a tiny old laptop showing a few lines of code, a desk lamp and a mug; on the right wall, a cork board with pinned task cards and a hand-drawn map.
- Floor: packed earth and thick tree roots, a round woven straw rug in the middle; in the lower left, a small pool of clear pond water between the roots with a few duckweed leaves, and a small food bowl beside it; in the lower right, an arched doorway between the roots opening onto the pond, with lily pads and a small wooden dock visible outside.
- Foreground: a few curved roots and reeds at the bottom edge for depth.
- Many small handmade objects: clay jars, dried flowers, a yarn ball, small potted plants, rope, a lantern. Cluttered but tidy, lived-in.
- Everything a small duck needs to use is placed low, within its reach. Leave small empty spots on the bed, in front of the desk, in the middle of the rug, at the edge of the water and next to the bowl. Keep the four corners of the image simple.

Art style: hand-drawn picture-book illustration for a cozy idle mobile game. Thin dark brown outlines of even weight, slightly wobbly and imperfect like drawn with a fine pen. Flat color fills; shadows are just one slightly darker flat shade, no gradients, no glossy highlights, no realistic lighting. Subtle paper grain texture. Muted, low-saturation palette: warm grey, beige, ochre and natural wood brown, moss and sage green, dusty blue, with tiny accents of coral red and mustard yellow. Simple, charming shapes; calm, quiet, cozy mood.

Avoid: exterior landscape view, eye-level view, horizontal composition, characters or animals, shelf mushrooms or mushroom stairs, stone walls, thick cartoon outlines, vector clip-art look, glossy or 3D rendering, painterly textures, saturated colors, text, watermark, UI buttons.
```

---

## 4. 提示词（中文，供核对）

```
请生成一张竖版图片。

手机游戏主界面背景：一棵池塘边老树的树洞「内部」，用娃娃屋剖面图的方式呈现——从斜上方往下看，像一个拆掉了前墙的娃娃屋，能看到地面和内壁，而不是树的外面。画面里没有任何角色、动物或鸭子。

房间：弧形的暖色木头内壁，能看到年轮和树皮纹理。上下两层。
- 上层：贴着内壁搭了一个木板阁楼，上面有一张小床，盖着雾蓝色被子；一架绳梯垂到地面；高处一个圆形树节孔当窗户，透进一束柔和的光；阁楼旁用麻绳和小木夹挂着明信片和拍立得照片。
- 中间：左边是嵌在树壁凹槽里的书架，塞满旧书和卷轴；中间是一张树墩做的小书桌，上面有一台小小的旧笔记本电脑（屏幕亮着几行代码）、台灯和一个马克杯；右边墙上是一块软木板，钉着任务卡片和手绘地图。
- 地面：压实的泥土和粗壮的树根，中央一块圆形草编地毯；左下角树根之间有一小汪清澈的池水，漂着几片浮萍，旁边放着一个小饭碗；右下角树根之间是一道拱形门洞，通向池塘，门外能看到荷叶和小木码头。
- 前景：画面最下方几根弯曲的树根和芦苇，制造层次。
- 很多手工小物件：陶罐、干花、毛线团、小盆栽、麻绳、提灯。杂而不乱，有生活感。
- 床上、书桌前、地毯中央、水边、饭碗旁各留一小块空位。四个角落保持简单。

画风：治愈系放置手游的手绘绘本插画。深棕色细描边，粗细统一，像细钢笔画的，略带不完美的手抖感。扁平上色；阴影只用深一档的纯色，没有渐变、没有高光、没有写实光影。淡淡的纸张颗粒质感。低饱和柔和配色：暖灰、米色、赭石和原木棕、苔绿和鼠尾草绿、雾蓝，极少量珊瑚红和芥末黄点缀。造型简单可爱，气氛安静温暖。

不要：外景、平视视角、横版构图、角色或动物、蘑菇或蘑菇台阶、石头墙、粗卡通描边、矢量剪贴画风、光泽感或 3D 渲染、厚涂笔触、高饱和色、文字、水印、界面按钮。
```

---

## 5. 生成后怎么改（直接在同一个对话里说）

GPT 支持在上一张的基础上修改。**先说「保持构图和内容不变」**，再说要改的一点，一次只改一两处：

| 看到的问题 | 对 GPT 说 |
|---|---|
| 又画成了外景 | 「这是树洞外面。我要的是树洞**里面**的房间，像拆掉前墙的娃娃屋，从斜上方看进去。」 |
| 视角太平 | 「保持内容不变，把视角改成从更高的斜上方往下看，让地面占画面下半部分。」 |
| 太写实 / 太多纹理 | 「保持构图不变，改成扁平上色，去掉渐变和细碎纹理，阴影只用深一档的纯色。」 |
| 太像矢量剪贴画 | 「保持构图不变，描边改细、改成深棕色并带一点手绘抖动，加一点纸张颗粒，多加一些小物件。」 |
| 颜色太鲜艳 | 「保持构图不变，整体降低饱和度，往暖灰、米色、苔绿方向调。」 |
| 画了鸭子 | 「保持其他不变，把画面里的鸭子去掉，那个位置留空。」 |
| 出现蘑菇台阶 | 「保持其他不变，把树上的蘑菇台阶换成绳梯。」 |

---

## 6. 拿到满意的一张之后

1. 这张就是**风格基准图**。后面生成鸭子姿态贴图时，把它作为参考图上传，说「参考这张图的画风」。
2. 把图放进项目的 `public/assets/room.png`，让 Qoder 按 Spec 0.3 节标出各个锚点的坐标。
