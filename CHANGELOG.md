# Changelog

All notable changes to this project are documented in this file.

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
