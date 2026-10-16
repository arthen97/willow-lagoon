# 地球，请回答 / EARTH, DO YOU COPY?

## 远征流程

1. 找到银白植物，保持 E 采集能捕获氧气的虚构生物凝胶「蓝息质」。
2. 带回营地，保持 E 插入采集罐，完成密封后释放氧气。
3. 第一罐回收达到 28 L 后，按 R 接通地球，接受任务并标记地点。
4. 按地球线索依次回收洞穴菌床、肺囊共生、潮汐气孔样本；每次都需回营地插罐交付。
5. H 补给宇航服；T 使用采集罐应急转气。通话内可展开现实世界新闻频道。

地球任务是预先编写的虚构剧情；新闻来自独立的实时新闻数据。现有存档保留，任务链从第一次地球确认开始。

# 地球，请回答 · 异星集氧生存

[**开始试玩 / Play**](https://arthen97.github.io/willow-lagoon/)

在一座陌生星球的岛屿上采集氧气，装进背罐，带回零号营地，换取继续探索和接通地球的机会。

## 操作

- **WASD**：按镜头方向移动；**鼠标**：转动视角。
- **Shift**：冲刺；**Space**：跳跃；**Esc**：暂停／释放鼠标。
- **E**：采集／互动，部分植物需要按住；**Q**：扫描；**J**：线索日志。
- **T**：把背罐氧气转入宇航服。
- 回营地：**E** 卸罐，**H** 补给，**R** 接通地球。
- 手机提供触控摇杆与操作按钮。建议电脑开启浏览器硬件加速游玩。

## 生存循环

氧气持续下降，跑跳会额外消耗。花朵开合、露液喂养共生植物、压力取气、洞内放置抽气器和回收废弃氧气罐提供不同的采集方式。收集的气体先进入背罐；需要应急换气，或带回营地充装。氧气耗尽会返回营地，保留线索并损失部分携带资源。

中文环境与字幕，英语主角吐槽。背景音乐和岛外／洞内环境声来自 Merouter ElevenLabs，进洞会渐变切换，配音时自动降低背景音量。

## 地球中继

GitHub Pages 为静态站点。GitHub Actions 每 6 小时从 GDELT／BBC 获取真实新闻标题，并通过 Merouter Eleven v4 生成英语播报；网页展示实际抓取时间、来源链接，过期或断线时明确显示存档。不会把虚构剧情当作新闻。

TTS 凭证仅保存在仓库的 `MEROUTER_SERVICE_KEY` Actions Secret。浏览器和公开源码不含密钥。缺少凭证时仍显示新闻文字。可在 Actions 手动执行 **Publish game and Earth relay** 刷新；关闭该工作流可停止定时播报生成。

## 本地运行

需要 Node.js 22 或更新版本。

```sh
npm ci
npm start
```

打开 http://127.0.0.1:4173 。本地实时新闻配音需要环境变量 `MEROUTER_SERVICE_KEY`。

```sh
npm run build
```

生成 `dist/` 静态目录。数据刷新：`npm run refresh:earth`。

## 资产与内容

山体、洞穴、岩石遗迹和草丛使用带纹理的 CC0 公网资产；营地设备、植物、肖像与宇航员使用 Meshy 资产。原始岸边场景还包含已署名的 CC BY 模型及早期项目资产。详见 [完整资产署名](ASSET_CREDITS.md) 与 [资产清单](assets/world/manifest.json)。

TRAPPIST-1 e 的行星身份来自公开天文资料；这里的生态、遗迹、未来年代及名人留言均为虚构讽刺。配音为原创演员音色，没有仿冒名人声音。

这是持续开发中的网页试玩版。首次打开需下载模型与贴图；移动设备表现取决于 GPU 和可用内存。公开仓库提供试玩源码，不代表所有项目原创内容额外授予开源许可；第三方资产按各自许可使用。

## 序章与雕像交互

首次开始远征先播放可跳过的 CG 序章；主菜单可随时重播。中文剧情字幕、英语幽默旁白。菜单支持鼠标、Tab 和上下方向键。靠近石膏像后停稳，按 F 或点击敲击按钮，触发晃动、岩屑和主角吐槽；三次敲击可揭开背后线索。E 仍可读取留言。

React Bits Tech Text 的来源及许可证见资产说明。运行 `node scripts/build-opening.mjs` 可重新打包 UI；Pages 构建也会自动执行。

出品片头使用全英文 **AN ARTHEN PRODUCTION**，位于 CG 序章之前。首次更新后会展示，主菜单「故事序章」可重播。集氧植物、洞穴菌床、营地指示灯增强辉光；暂停 → 游戏设置 → 辉光强度可调整或关闭。

### 2026-10-16 · 蓝绿色环境与持续目标指引

地面 4K PBR 贴图以 2 米为周期铺设，保留色彩细节并强化法线，使用最高可用各向异性过滤。环境调整为饱和蓝绿色，降低近景雾和运动模糊。开场标题与菜单居中，生存指南按需展开。任务栏显示采集、插罐、通话三个步骤，导航保留屏幕外目标方向、距离和地图任务圈。

### 2026-10-16 · 地球，请回答

游戏更名为《地球，请回答 / EARTH, DO YOU COPY?》。开场、暂停菜单与序章片尾同步更新；现有存档兼容。全新蓝绿异星海报通过 Merouter 的 `mj-fast-imagine-v8.1` 生成，实际生成提示确认 `--v 8.1`，采用第 4 张独立画面。

### 2026-10-16 · 自然光照与对岸大气

移除地表青蓝染色，恢复岩土与苔绿贴图色彩；统一天空、日光与水面高光方向，关闭额外轮廓光和近景光柱，降低辉光与局部发光。晴天雾范围改为 85–2100 米，对岸山体重新处于可见范围，风暴时渐变至 25–850 米。飞书文案见 `docs/feishu-intro.md`，介绍图见 `assets/social/earth-do-you-copy-intro.jpg`。

### Horizon, cool atmosphere and bird flocks

Moved the added distant cliff meshes to 1.05–1.5 km away; bounded the footprint of wide scanned cliff assets near the island and cave. Preserved the original distant island. Cooler daylight, sky and shadows retain natural terrain colors. The existing bird silhouettes now form three continuous orbiting flocks (24 birds). English promotional artwork: `assets/social/earth-do-you-copy-intro-en.jpg`.

### 2026-10-17 · Continuous shoreline and subdued overcast light

Removed the added offshore scan slabs and the detached outer ring of cliffs. The original complete island asset provides the lake horizon. Two small cave outcrops are embedded 38% of their actual height into the terrain. Reduced sun intensity 3.2 → 1.8, default exposure 1.00 → 0.85, ambient environment 0.45 → 0.30 and bloom 0.28 → 0.22; darkened the sky and haze consistently. Bird flocks and the English poster are retained.

### 2026-10-17 · Painted cel shading and ink contours

Hand-painted ground albedo replaces the photographic ground colour map. Standard and physical materials retain their existing texture identity but use softened colour detail, suppressed surface micro-normal/specular noise and stepped diffuse lighting. A depth-aware post-process adds restrained silhouette strokes, with lighter foliage lines and distance fade; strength is adjustable in settings. Water colours use a gentle painted tonal treatment. All movement, terrain heights, collisions, oxygen rules, bone animation and simulation modules are unchanged.

### 2026-10-17 · Lit ink materials

Cel shading now modifies only diffuse lighting before Three composes specular, transmission, sheen and clearcoat. Authored roughness/metalness maps and wet-surface coatings remain active; shadow response no longer has an artificial brightness floor. The overcast HDR is prefiltered with PMREM for environment reflections and subtly blended into the atmospheric sky. Default environment intensity is 0.52 and bloom is 0.32 with a 1.10 HDR threshold, retaining subdued exposure and the ink contours. This change touches rendering only; simulation and gameplay files are unchanged.
