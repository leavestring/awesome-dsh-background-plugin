<p align="center">
  <img src="screenshots/banner.png" alt="DSH Background" width="100%" />
</p>

# DSH Background

> 为 [DSH Web](https://github.com/deepseek-ai/deepseek-harness) 提供可上传图片 / 预设氛围的背景设置插件，设置持久化，重启不丢失。

**简体中文** | [English](README.en.md)

[![Release v0.1.9](https://img.shields.io/badge/release-v0.1.9-5B4CF0?style=flat-square)](https://github.com/leavestring/awesome-dsh-background-plugin/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-0B7285?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![DSH Web](https://img.shields.io/badge/DSH-Web-5B4CF0?style=flat-square)](cordis.patch.yml)
[![GitHub Stars](https://img.shields.io/github/stars/leavestring/awesome-dsh-background-plugin?style=flat-square&logo=github&label=Stars)](https://github.com/leavestring/awesome-dsh-background-plugin)

---

## 为什么需要它？

DSH Web 默认只有一套主题色背景。如果你和我一样，希望自己的工作空间**不再千篇一律**，可能已经试过：

- **直接改主题文件 / CSS** —— 不可行。DSH 是插件化架构，主题走 CSS 变量，任何更新都会覆盖你的修改；
- **用油猴脚本 / 浏览器插件改样式** —— 侵入性强、要写选择器、还要跟着 DSH 版本走，维护成本高；
- **放弃个性化** —— 长时间盯着单调的纯色界面，容易疲劳也缺少归属感。

这个插件通过 DSH 官方的 Cordis 插件机制，把「背景」变成**设置页里的一个正式设置项**，并解决了实现过程中最棘手的三个坑：

1. **设置保存被静默拒绝** —— DSH 的 Host 只允许白名单内的设置命名空间被浏览器读写，否则一点保存就回滚。插件附带了 `expose-namespace.mjs` 一键脚本，把 `ui-background` 加入白名单；
2. **对话区盖住背景** —— DSH 的对话主区、详情面板、布局框架都有不透明背景。插件在背景激活时让这些页面级容器透出背景层，同时保留侧栏、消息气泡、输入框的原有表面；
3. **图片上传即丢** —— 大图写设置文档慢、重启就消失。插件在浏览器端把图片压缩到 1600px / WEBP 后再写入设置，**上传即自动持久化**，重启后原样恢复。

## 截图

暗色模式 + 自定义图片背景：

![暗色模式自定义背景](screenshots/dark-mode-image.png)

浅色模式 + 自定义图片背景：

![浅色模式自定义背景](screenshots/light-mode-image.png)

## 功能

- 🖼️ **上传你自己的图片**：支持 JPG / PNG / WEBP / GIF，浏览器本地 Canvas 压缩（长边 ≤ 1600px，WEBP 输出，兼顾画质与体积）。**上传即自动保存**，无需再点保存按钮，重启后自动恢复。
- 🎨 **三种预设氛围**：极光（aurora）、余烬（ember）、宣纸（paper），一键切换、点击即时生效，不想找图也能快速换个心情。
- 🎚️ **五维细调**：图像存在感（透明度）、暗色遮罩（保证前景可读）、柔焦（模糊）、适配方式（铺满 / 完整显示 / 拉伸）、焦点位置（居中 / 顶部 / 底部 / 左侧 / 右侧）。
- 🔄 **实时预览**：设置面板内所见即所得，拖动滑块即时看到对话区的效果；不满意随时「放弃修改」。
- 🔒 **隐私友好**：图片只在你自己的浏览器里处理，压缩后写入本地设置文档，**不会上传到任何服务器**。
- 🌐 **双语界面**：中文 / English。
- 🧩 **低侵入、可随时移除**：背景是浏览器内一个固定图层，不修改、不遮挡任何对话内容；关闭「已启用」开关或点击「恢复默认」即可完全移除，不留痕迹。
- 🌗 **主题兼容**：浅色 / 深色主题下都正常工作（附带的暗色模式截图就是真实效果）。

## 安装

### ⚡ 一键安装（推荐，小白友好）

只需要一条命令，脚本会自动完成「打包 → 安装 → 白名单」全部步骤：

```bash
# 1. 拿到代码：GitHub 页面点 Code → Download ZIP 解压，或执行：
git clone https://github.com/leavestring/awesome-dsh-background-plugin.git
cd dsh-background

# 2. 一键安装（默认装到 web profile）：
node scripts/install.mjs

# 3. 重启 DSH：
dsh web
```

然后打开 `http://127.0.0.1:3080`（**Ctrl+F5 强刷**，清掉旧缓存），进入 **设置 → 通用设置 → 背景** 即可使用。

> 装到其他 profile：`node scripts/install.mjs --profile 你的profile名`
>
> 如果提示 `dsh` 命令找不到（你是用 npx 启动 DSH 的）：
> - Windows PowerShell：`$env:DSH_CMD = "npx @deepseek-ai/dsh"` 后重新运行
> - macOS / Linux：`export DSH_CMD='npx @deepseek-ai/dsh'` 后重新运行

### 🧑‍🔧 手动安装（想了解每一步在做什么）

**第 1 步：打包插件** —— 把源码打包成可安装的 `.tgz`：

```bash
pnpm pack --pack-destination .
```

**第 2 步：安装到 DSH profile** —— 装进你的 DSH 配置：

```bash
dsh plugin --profile web add ./awesome-dsh-background-plugin-0.1.9.tgz
```

**第 3 步：暴露命名空间（重要，仅首次需要）**

DSH 的 `dsh-host-apiproxy` 只允许**白名单内**的 settings 命名空间被浏览器读写。命名空间不在白名单时，保存会被静默拒绝（`settings-not-exposed`），表现就是：点「启用」后一保存又变回「未启用」。

运行仓库内辅助脚本，把 `ui-background` 加入白名单（幂等，可重复运行）：

```bash
node scripts/expose-namespace.mjs
```

如果脚本找不到 dsh 安装位置，手动传入文件路径：

```bash
node scripts/expose-namespace.mjs <path-to>/@deepseek-ai/dsh-host-apiproxy/lib/index.js
```

> 手动改法：在上面的文件里，往 `WEB_SETTINGS_NAMESPACES` 数组（`"ui-theme"` 之后）加入 `"ui-background"`。

**第 4 步：重启并刷新**

```bash
dsh web
```

打开 `http://127.0.0.1:3080`（必要时 Ctrl+F5 强刷），进入 **设置 → 通用设置 → 背景**。

### ❓ 常见问题（FAQ）

| 现象 | 解决 |
|---|---|
| 提示 `pnpm not found` | 安装 pnpm：`npm install -g pnpm`（或用 Corepack：`corepack enable`） |
| 提示 `dsh` 命令找不到 | 设置 `DSH_CMD` 环境变量后重跑（见上方一键安装说明） |
| 点「启用」保存后又变回「未启用」 | 白名单未生效：重跑 `node scripts/expose-namespace.mjs`，或按手动安装第 3 步手动添加 |
| 页面还是旧样子 / 背景不显示 | **Ctrl+F5 强刷**（浏览器缓存了旧版本），或重启 `dsh web` |
| 上传的图片重启后消失 | 确认插件是 **0.1.6 及以上**（上传即自动保存）；旧版本需点「保存背景」 |
## 使用

1. 打开 **设置 → 通用设置 → 背景**
2. 点一个预设，或上传一张图片（上传后立即生效并持久化，无需点保存）
3. 拖动「图像存在感 / 暗色遮罩 / 柔焦」滑块实时预览，满意后点 **保存背景** 持久化参数
4. 想移除背景：点 **恢复默认**，或关闭「已启用」开关后保存

## 工作原理

- Host 侧插件（`lib/index.js`）通过 `@deepseek-ai/dsh-settings` 注册 `ui-background` 命名空间与 Schemastery schema，让背景设置成为 DSH 设置体系的一部分。
- 浏览器侧插件（`lib/client.js`）在 `settings.general.item` 插槽注册「背景」设置行，并通过 DSH `settingsScope` 读写设置，与官方设置项使用同一套持久化机制。
- 背景层是一个 `position: fixed; z-index: 0` 的图层（`#dsh-background-layer`），始终位于页面最底层。背景激活时：
  - 把 `--dsw-alias-bg-base` 覆盖为 `transparent`，让对话主区、详情面板、布局框架透出背景；
  - 侧栏、消息气泡、输入框使用各自的专用变量，保持不透明，保证可读性与功能区分；
  - 通过 `createPortal` 渲染到 `<body>` 的下拉菜单（如消息「更多」菜单）保持原有定位与层级，点击不受影响。
- 图片经 Canvas 压缩为 dataURL 后写入 DSH 设置文档（`~/.dsh/settings.yaml`），全程本地处理，不上传任何服务器。

## 目录结构

```
dsh-background/
├── lib/
│   ├── index.js               # Host 插件：注册 ui-background 设置命名空间与 schema
│   └── client.js              # 浏览器端：背景图层、设置行、上传压缩、持久化
├── scripts/
│   ├── install.mjs            # 一键安装脚本（打包 + 安装 + 白名单）
│   └── expose-namespace.mjs   # 辅助脚本：把 ui-background 加入 Host 暴露白名单
├── screenshots/               # 仓库展示截图
├── cordis.patch.yml           # DSH bundle 补丁：注册插件条目
├── package.json               # 插件元数据（dsh.client 注入信息）
├── CHANGELOG.md
└── LICENSE                    # MIT
```

## 开发

```bash
node --check lib/client.js && node --check lib/index.js   # 语法检查
pnpm pack --pack-destination .                            # 打包
```

## 许可证

[MIT](./LICENSE)
