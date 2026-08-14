# DSH Background

> 为 [DSH Web](https://github.com/deepseek-ai/deepseek-harness) 提供可上传图片 / 预设氛围的背景设置插件，设置持久化，重启不丢失。

[English](README.md) | **简体中文**

---

## 功能

- 🖼️ **上传图片**：JPG / PNG / WEBP / GIF，浏览器本地 Canvas 压缩（长边 ≤ 1600px，WEBP 输出），**上传即自动写入 DSH 设置**，无需再点保存，重启后自动恢复
- 🎨 **预设氛围**：极光（aurora）、余烬（ember）、宣纸（paper）一键切换，点击即时生效
- 🎚️ **细调**：图像存在感、暗色遮罩、柔焦、适配方式（铺满 / 完整显示 / 拉伸）、焦点位置，全部实时预览
- 🔄 **实时预览**：设置面板内所见即所得，保存前可随时放弃
- 🌐 **双语界面**：中文 / English

背景层是浏览器内的固定图层，不修改任何对话内容；关闭「已启用」开关或点击「恢复默认」即可移除。

## 截图

*待补充 —— 欢迎通过 PR 添加。*

## 安装

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

### 4. 重启并刷新

```bash
dsh web
```

打开 `http://127.0.0.1:3080`（必要时 Ctrl+F5 强刷），进入 **设置 → 通用设置 → 背景**。

## 使用

1. 打开 **设置 → 通用设置 → 背景**
2. 点一个预设，或上传一张图片（上传后立即生效并持久化，无需点保存）
3. 拖动「图像存在感 / 暗色遮罩 / 柔焦」滑块实时预览，满意后点 **保存背景** 持久化参数
4. 想移除背景：点 **恢复默认**，或关闭「已启用」开关后保存

## 工作原理

- Host 侧插件（`lib/index.js`）通过 `@deepseek-ai/dsh-settings` 注册 `ui-background` 命名空间与 Schemastery schema。
- 浏览器侧插件（`lib/client.js`）在 `settings.general.item` 插槽注册「背景」设置行，并通过 DSH `settingsScope` 读写设置。
- 背景层是一个 `position: fixed; z-index: 0` 的图层（`#dsh-background-layer`）。背景激活时把 `--dsw-alias-bg-base` 覆盖为 `transparent`，让对话主区透出背景；侧栏、消息气泡、输入框保持各自不透明表面。
- 图片经 Canvas 压缩为 dataURL 后写入 DSH 设置文档（`~/.dsh/settings.yaml`），不上传任何服务器。

## 目录结构

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

## 开发

```bash
node --check lib/client.js && node --check lib/index.js   # 语法检查
pnpm pack --pack-destination .                            # 打包
```

## 许可证

[MIT](./LICENSE)
