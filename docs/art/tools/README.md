# 切图工具（美术用，不属于游戏代码）

Claude 用来从定稿背景里切物件的脚本，留作存档，方便以后单独重切某一件。游戏本身不依赖这里的任何文件。

- `props.py`：按配置把物件抠成透明贴图，补好底图，输出位置数据和检查图。
- `int.json` / `ext.json`：屋内 / 屋外每个物件的选区、支点和动作类型（坐标按 1672×941 的源图）。
- `*.views`：检查图要截取的区域。
- `export.py`：把结果导出到 `public/art/` 和 `docs/art/props.json`，并合成演示动图（里面的路径是 Claude 工作环境的，换环境要改）。

依赖：Python 3、`opencv-python-headless`、`numpy`、`Pillow`。

```bash
python3 props.py <源图.png> <输出目录> <配置.json>
```
