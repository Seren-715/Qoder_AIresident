# GPT 生图提示词：树洞小屋（第二版）

> 第一版提示词交给 GPT 后，两张结果都不对。这一版针对那两张图的问题重写，按「画面格式 → 视角 → 场景 → 画风 → 禁止项」排序，越靠前 GPT 越重视。
> **建议用英文版**：GPT 生图对英文的风格词理解更准。中文版供你核对内容。

---

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
- Leave small empty spots on the bed, in front of the desk, in the middle of the rug, at the edge of the water and next to the bowl. Keep the four corners of the image simple.

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
