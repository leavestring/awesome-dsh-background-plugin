# DSH Background

> 为 [DSH Web](https://github.com/deepseek-ai/deepseek-harness) 提供可上传图片 / 预设氛围的背景设置插件。
> A DSH Cordis plugin that gives your DSH Web workspace a customizable background — presets or your own image, persisted across restarts.

---

## English

A DSH Cordis plugin that lets you set a custom background for the DSH Web GUI — pick from three atmosphere presets (Aurora / Ember / Paper) or upload your own image (JPG / PNG / WEBP / GIF). Images are compressed in-browser (max edge 1600px, WEBP output), written straight into DSH settings on upload, and restored automatically after restarts. Fine-tune presence, dark overlay, soft focus, fit mode and focal position with a live preview.

> ⚠️ Before the plugin can persist settings, `ui-background` must be added to the host-side allowlist — see [安装 Installation](#安装-installation), step 3.

---

# DSH Background（中文）

## 功能 Features

- 🖼️ **上传图片**：JPG / PNG / WEBP / GIF，浏览器本地 Canvas 压缩（长边 ≤ 1600px，WEBP 输出），写入 DSH 设置，**上传即自动保存**，重启后自动恢复
- 🎨 **预设氛围**：极光（aurora）、余烬（ember）、宣纸（paper）一键切换，点击即时生效
- 🎚️ **细调**：图像存在感、暗色遮罩、柔焦、适配方式（铺满 / 完整显示 / 拉伸）、焦点位置，实时预览
- 🔄 **实时预览**：设置面板内所见即所得，保存前可随时放弃
- 🌐 **双语**：中文 / English locale

背景层为浏览器内固定图层，不修改任何对话内容；关闭「启用」或点击「恢复默认」即可移除。

---

## 安装 Installation

### 1. 打包插件

```bash
git clone https://github.com/<your-name>/dsh-background.git
cd dsh-background
pnpm pack --pack-destination .
```

### 2. 安装到 DSH profile

```bash
dsh plugin --profile web add ./dsh-background-plugin-0.1.6.tgz
```

### 3. 暴露命名空间（重要，仅首次需要）

DSH 的 `dsh-host-apiproxy` 只允许**白名单内**的 settings 命名空间被浏览器读写。不在白名单时，保存会被静默拒绝（`settings-not-exposed`），表现为「点击启用后一保存又变回未启用」。

执行仓库内辅助脚本，把 `ui-background` 加入白名单（幂等，可重复运行）：

```bash
node scripts/expose-namespace.mjs
```

如果脚本找不到 dsh 安装位置，手动传入路径：

```bash
node scripts/expose-namespace.mjs <path-to>/@deepseek-ai/dsh-host-apiproxy/lib/index.js
```

> 手动改法：在 `WEB_SETTINGS_NAMESPACES` 数组中（`"ui-theme"` 之后）加入 `"ui-background"`。

### 4. 重启并刷新

```bash
dsh web
```

然后打开 `http://127.0.0.1:3080`（必要时 Ctrl+F5 强刷），进入 **设置 → 通用设置 → 背景** 即可使用。

---

## 使用 Usage

1. 打开 **设置（Settings）→ 通用设置（General）→ 背景（Background）**
2. 点一个预设，或上传一张图片（上传后无需点保存，立即生效并持久化）
3. 拖动「图像存在感 / 暗色遮罩 / 柔焦」滑块实时预览，满意后点 **保存背景**
4. 想移除：点「恢复默认」，或关闭「已启用」开关后保存

---

## 目录结构 Structure

```
dsh-background/
├── lib/
│   ├── index.js               # Host 插件：注册 ui-background 设置命名空间与 schema
│   └── client.js              # 浏览器端：背景图层、设置行、上传压缩、持久化
├── scripts/
│   └── expose-namespace.mjs   # 辅助脚本：把 ui-background 加入 Host 暴露白名单
├── cordis.patch.yml           # DSH bundle 补丁：注册插件条目
├── package.json               # 插件元数据（dsh.client 注入信息）
├── CHANGELOG.md
└── LICENSE                    # MIT
```

## 工作原理 How it works

- Host 侧 `lib/index.js` 通过 `@deepseek-ai/dsh-settings` 注册命名空间 `ui-background` 与 Schemastery schema。
- 浏览器侧 `lib/client.js` 在 `settings.general.item` 插槽注册「背景」设置行；通过 `settingsScope` 读写持久化设置。
- 背景层是一个 `position: fixed; z-index: 0` 的图层（`#dsh-background-layer`），背景激活时把 `--dsw-alias-bg-base` 置为透明，让对话主区透出背景，侧栏 / 消息气泡 / 输入框保持不透明。
- 图片经 Canvas 压缩为 dataURL 后写入 DSH 设置文档（`~/.dsh/settings.yaml`），不上传任何服务器。

## 开发 Development

```bash
node --check lib/client.js && node --check lib/index.js   # 语法检查
pnpm pack --pack-destination .                            # 打包
```

## License

[MIT](./LICENSE)
