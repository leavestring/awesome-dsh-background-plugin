# Changelog

All notable changes to this project are documented in this file.

## [0.2.1] - 2026-09-29

### Fixed
- The background now shows on the DSH Desktop shell. Two 0.2.x layout facts broke
  the reveal rules even though the layer itself was applied correctly:
  - `#root` no longer holds the layout frame directly: DSH wraps it in a slot
    root element (`<div data-slot="root" style="display: contents">`), so the
    child combinator `#root > [class*="_frame"]` matched nothing. The frame
    rules now use a descendant combinator.
  - On Windows the Desktop shell paints the layout frame with
    `background: var(--dsw-specific-sidebar-fill)` (rule
    `[data-windows-titlebar] .BynINW_frame`, `#1b1b1c` in the dark theme), a
    token this plugin never overrode — the frame stayed opaque and covered the
    layer. The frame element and its `::before` are now cleared directly, which
    leaves the sidebar's own surface untouched.

## [0.2.0] - 2026-09-29

### Changed
- **Ported to DSH 0.2.x.** The plugin now targets DSH `0.2.0-rc.2` and installs
  into the desktop app as well as the web profile.
- Host half: the settings namespace is no longer registered imperatively with
  `settingsNamespace()` / `ctx.settings.register()`. DSH 0.2.x serves one
  namespace per profile entry, so the entry id (`ui-background`) is the
  namespace and `lib/index.js` now exports the `Config` schema directly, with
  every field marked `volatile()`. The settings surface opts out of the
  automatic page with `settings.configure({ auto: false })`.
- Client half: `ctx.settingsScope.bind()` was replaced by
  `ctx.configForms.get("ui-background")`; the `settingsScope` service no longer
  exists in 0.2.x. The snapshot contract (`getSnapshot` / `subscribe` / `set` /
  `unset`, and `value` / `revision` / `writable`) is unchanged, so the row,
  presets, upload and live preview needed no other edits.
- `dsh.client.inject` drops `@deepseek-ai/dsh-client-runtime` (removed in 0.2.x)
  and `@deepseek-ai/dsh-client-ui-slots` (no longer a browser plugin package in
  0.2.x). Peer declarations now follow the official 0.2.x convention.
- `@deepseek-ai/dsh-settings` is no longer imported; the host schema only needs
  `@deepseek-ai/schemastery`.

## [0.1.9] - 2026-08-14

### Fixed
- The enabled/disabled toggle and preset selection now persist immediately,
  so closing and reopening the settings panel no longer reverts a background
  you just turned off (or a preset you just picked).

## [0.1.8] - 2026-08-14

### Changed
- Removed the decorative "/2025" year from the settings preview card kicker
  ("PERSONAL SPACE / 2025" → "PERSONAL SPACE").

## [0.1.7] - 2026-08-14

### Fixed
- The active-background stacking rule no longer forces `position: relative;
  z-index: 1` onto every sibling of the background layer. It now targets only
  `#root` / `#app`, so DSH floating menus rendered through `createPortal` into
  `<body>` (e.g. the message "more" menu) keep their fixed positioning and stay
  clickable while a background is active.

## [0.1.6] - 2026-08-14

### Fixed
- Uploaded images now persist immediately: `enabled`, `image`, `fileName` and
  `preset` are written to DSH settings the moment an image is chosen, so the
  background survives a restart even without pressing "Save".
- Reduced compression cap from 2200px to 1600px and quality 0.86 → 0.82, keeping
  the stored data URL small and the write reliable.

## [0.1.5] - 2026-08-14

### Fixed
- The active-background marker on `<body>` was set via `toggleAttribute`, which
  produced an empty attribute value, so every `body[data-dsh-background-active=true]`
  CSS rule failed to match and the conversation area stayed opaque. The marker is
  now `setAttribute(..., "true")` and the CSS selectors were relaxed to
  presence-based matching.
- Dialogue area (conversation root, details panel, layout frame) now reveals the
  background by overriding `--dsw-alias-bg-base` to `transparent` while active;
  sidebar, message bubbles and the composer keep their own surfaces.

## [0.1.4] - 2026-08-14

### Fixed
- Background layer visibility through the DSH shell frame.

## [0.1.3] - 2026-08-14

### Fixed
- Save loop now compares against the latest scope snapshot per field and writes
  `enabled` last, avoiding mid-save reload races.

## [0.1.2] - 2026-08-14

### Fixed
- Clicking a preset now immediately activates the background, switches the
  source atomically, and clears any previously uploaded image.
- Preset selection no longer requires a separate toggle.

## [0.1.1] - 2026-08-14

### Fixed
- Settings row rendering: `useSyncExternalStore` now uses bound subscribe /
  getSnapshot callbacks.

## [0.1.0] - 2026-08-14

### Added
- Initial release: background settings row under Settings → General with
  presets, local image upload (Canvas compression), live preview and
  persistence through the DSH settings scope.
