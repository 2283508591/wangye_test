# 网页_test · 星际漫游

**在线访问：[打开星际漫游](https://2283508591.github.io/wangye_test/)**

公开网页，电脑与手机均可直接打开，无需 GitHub 账号。

参考 https://motionsites.ai/?prompt=space-voyage 制作的独立沉浸式行星探索网页，支持电脑、平板与手机。

## 运行

需要 Node.js，无需安装依赖：

```sh
npm run dev
```

浏览器打开 http://localhost:4173 。静态部署使用 `dist` 目录。

## 交互

- 默认进入火星。点击中央入口或“启程”，飞往下一颗行星。
- 飞行分为入口展开、接近星球、穿云、俯冲落地；落地后文字与入口重新浮现。
- 行星导航与“星球 / 目录”可以选择八大行星，同样使用飞行转场。
- 电脑左右方向键、手机左右滑动可切换行星。
- “关于”展示介绍；Escape 关闭面板，菜单支持键盘焦点约束。
- 底部按钮暂停或恢复环境动画；遵循系统减少动画偏好。
- `#earth`、`#mars` 等地址片段可直接进入指定目的地。
- 全部页面文案、行星资料、按钮和无障碍标签均使用中文。

## 文件

- `dist/index.html`：页面结构与无障碍标签。
- `dist/styles.css`：中文排版与电脑、平板、手机、横屏布局。
- `dist/app.js`：行星预览、菜单和操作逻辑。
- `dist/flight.js`：三维星球镜头、云层着色器、航拍至地表的投影转场。
- `dist/assets`：本地字体、纹理、背景与三维渲染模块，无运行时 CDN 依赖。
- `server.cjs`：本地静态服务器。
- `.openai/hosting.json`：Sites 静态部署配置。

## 参考与素材

按参考站公开的 Space Voyage 海报与约 5.9 秒动画重建视觉和飞入体验，未取得原作品源码。菜单与参考未展示的行星场景为补全实现。背景通过内置 imagegen 编辑、生成；地表俯冲采用航拍与地面图像的动态投影和过渡。

- 参考页面：https://motionsites.ai/?prompt=space-voyage
- 行星纹理：https://www.solarsystemscope.com/textures/
- 地球纹理：https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg
- Three.js 0.180.0：https://github.com/mrdoob/three.js
- Inter、Anton、Noto Sans SC：Google Fonts，本地保存。

## 图像制作记录

工具：内置 imagegen。

火星地面：编辑参考海报，移除 logo、导航、中央地球入口、行星列表、大标题与参数；无缝补全原位置地貌，保留左侧橙色日落、红色沙漠、右侧台地、远处雾气与暗色前景；输出无文字无 UI 的 4:3 背景。保存：`dist/assets/mars-landscape.webp`。

地球地面：编辑地球参考帧，移除 logo、导航、文字、鼠标与点击标记；保留单棵金合欢树、远山、橙色日落云层、金绿色草原和暗色土地；输出无文字无 UI 的 4:3 背景。保存：`dist/assets/earth-landscape.webp`。

地球航拍：参考已完成的地球草原场景，生成同一环境的高空俯视画面。夕阳下的非洲草原、蜿蜒的小径和单棵金合欢树，摄影级真实质感，从数百米高空向下看，保持地面图的金绿与暖橙色调，无文字无界面。保存：`dist/assets/earth-aerial.webp`。

火星航拍：参考已完成的火星地面场景，生成同一环境的高空俯视画面。辽阔的铁锈色沙漠、自然侵蚀的台地、河床与峡谷，暖色低角度阳光与长阴影，从数百米高空向下看，摄影级真实质感，无文字无界面。保存：`dist/assets/mars-aerial.webp`。

## 验证

使用真实 Chromium / Edge 检查电脑、平板、手机和横屏布局、资源加载、中文文案及交互。包含 1920×1080、1440×1000、1366×768、1024×768、768×1024、600×800、430×932、390×844、375×667、320×568、844×390；检查飞行各阶段画面、目录选择、返回入口、面板、暂停与减少动画模式。

## GitHub Pages 发布

本仓库使用 `main` 分支保存完整源码，`gh-pages` 分支保存可公开访问的静态网站。

本地启动：`npm run dev`。网页文件位于 `dist/`，更新后将 `dist/` 内容发布到 `gh-pages` 分支。该分支根目录包含 `.nojekyll`，资源按静态文件直接提供。

电脑和手机均可直接访问 GitHub Pages 提供的网址，无需下载项目或启动本地服务器。
更新网站时，在仓库根目录完成修改后执行：

```sh
git add .
git commit -m "更新网页"
git push origin main
git subtree push --prefix dist origin gh-pages
```

GitHub 会自动重新发布 `gh-pages` 分支，无需另外购买服务器。