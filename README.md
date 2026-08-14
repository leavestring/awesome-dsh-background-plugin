# DSH Background

> A DSH Cordis plugin that gives your DSH Web workspace a customizable background — atmosphere presets or your own image, persisted across restarts.

**[English](README.md)** | [简体中文](README.zh-CN.md)

---

## Features

- 🖼️ **Upload your own image** — JPG / PNG / WEBP / GIF, compressed in-browser (max edge 1600px, WEBP output). The image is written into DSH settings **immediately on upload** and restored automatically after restarts — no separate save step needed.
- 🎨 **Atmosphere presets** — Aurora, Ember, Paper; one click to switch, takes effect instantly.
- 🎚️ **Fine tuning** — image presence, dark overlay, soft focus, fit mode (fill / contain / stretch) and focal position, all with a live preview.
- 🔄 **Live preview** — what you see in the settings panel is what you get; discard anytime before saving.
- 🌐 **Bilingual UI** — 中文 / English.

The background is a fixed browser layer; conversation content is never modified. Disable it (or click *Restore default*) to remove it.

## Screenshots

*Coming soon — open a PR if you would like to add one.*

## Installation

### 1. Build the plugin

```bash
git clone https://github.com/<your-name>/dsh-background.git
cd dsh-background
pnpm pack --pack-destination .
```

### 2. Install into a DSH profile

```bash
dsh plugin --profile web add ./dsh-background-plugin-0.1.6.tgz
```

### 3. Expose the settings namespace (required, first install only)

DSH's `dsh-host-apiproxy` only allows **allowlisted** settings namespaces to be read and written by the browser. If the namespace is missing, saves are silently rejected (`settings-not-exposed`) — you see the toggle flip back to "disabled" right after saving.

Run the bundled helper script to add `ui-background` to the allowlist (idempotent, safe to re-run):

```bash
node scripts/expose-namespace.mjs
```

If the script cannot locate your dsh installation, pass the file path explicitly:

```bash
node scripts/expose-namespace.mjs <path-to>/@deepseek-ai/dsh-host-apiproxy/lib/index.js
```

> Manual alternative: add `"ui-background"` to the `WEB_SETTINGS_NAMESPACES` array (right after `"ui-theme"`) inside the file above.

### 4. Restart and refresh

```bash
dsh web
```

Open `http://127.0.0.1:3080` (hard-refresh with Ctrl+F5 if needed), then go to **Settings → General → Background**.

## Usage

1. Open **Settings → General → Background**.
2. Click a preset, or upload an image (it is persisted immediately — no need to hit Save).
3. Drag the *Image presence / Dark overlay / Soft focus* sliders to preview live, then press **Save background** to persist the tuning.
4. To remove the background: click **Restore default**, or turn off the **Enabled** switch and save.

## How it works

- The host plugin (`lib/index.js`) registers the `ui-background` namespace with a Schemastery schema via `@deepseek-ai/dsh-settings`.
- The browser plugin (`lib/client.js`) registers the *Background* row in the `settings.general.item` slot and reads/writes settings through the DSH `settingsScope`.
- The background is a `position: fixed; z-index: 0` layer (`#dsh-background-layer`). While active, `--dsw-alias-bg-base` is overridden to `transparent` so the conversation area reveals the background; the sidebar, message bubbles and the composer keep their own surfaces.
- Images are compressed to a data URL by Canvas and stored in the DSH settings document (`~/.dsh/settings.yaml`). Nothing is uploaded to any server.

## Project structure

```
dsh-background/
├── lib/
│   ├── index.js               # Host plugin: registers the ui-background namespace + schema
│   └── client.js              # Browser plugin: background layer, settings row, upload, persistence
├── scripts/
│   └── expose-namespace.mjs   # Helper: adds ui-background to the host allowlist
├── cordis.patch.yml           # DSH bundle patch: registers the plugin entry
├── package.json               # Plugin metadata (dsh.client injection)
├── CHANGELOG.md
└── LICENSE                    # MIT
```

## Development

```bash
node --check lib/client.js && node --check lib/index.js   # syntax check
pnpm pack --pack-destination .                            # build tarball
```

## License

[MIT](./LICENSE)
