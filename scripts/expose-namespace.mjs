#!/usr/bin/env node
/**
 * dsh-background — host settings-exposure helper.
 *
 * DSH's `dsh-host-apiproxy` only exposes settings namespaces that are listed in
 * its `WEB_SETTINGS_NAMESPACES` allowlist. A namespace outside that list is
 * rejected with `settings-not-exposed`, so browser writes silently fail and the
 * settings UI rolls back. This script patches the running DSH installation
 * (the npx/pnpm cache copy of `dsh-host-apiproxy`) to add `ui-background` to
 * the allowlist. It is idempotent and safe to re-run.
 *
 * This allowlist only exists on DSH 0.1.x. DSH 0.2.x — the desktop app included —
 * exposes every registered namespace through `dsh-api-settings-controller`, so
 * there is nothing to patch. Pass `--if-present` to turn that into a skip
 * instead of an error (scripts/install.mjs does).
 *
 * After running it, restart `dsh web` for the change to take effect.
 *
 * Usage:
 *   node scripts/expose-namespace.mjs              # auto-detect the dsh install
 *   node scripts/expose-namespace.mjs <file>       # patch a specific file
 *   node scripts/expose-namespace.mjs --if-present # DSH 0.2.x: skip, do not fail
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const NAMESPACE = "ui-background";

function candidateRoots() {
  const roots = [];
  const home = homedir();
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA;
    if (local) roots.push(join(local, "npm-cache", "_npx"));
    roots.push(join(home, "AppData", "Local", "npm-cache", "_npx"));
  } else {
    roots.push(join(home, ".npm", "_npx"));
    roots.push(join(home, ".cache", "npm", "_npx"));
  }
  return [...new Set(roots)];
}

function walk(dir, depth, out) {
  if (depth <= 0) return;
  let names;
  try {
    names = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of names) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    out.push(full);
    walk(full, depth - 1, out);
  }
}

function findTargetFile() {
  for (const root of candidateRoots()) {
    if (!existsSync(root)) continue;
    const dirs = [];
    walk(root, 2, dirs);
    for (const dir of dirs) {
      const candidate = join(dir, "node_modules", "@deepseek-ai", "dsh-host-apiproxy", "lib", "index.js");
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function patchFile(file, ifPresent) {
  const text = readFileSync(file, "utf8");
  const header = "const WEB_SETTINGS_NAMESPACES = [";
  const start = text.indexOf(header);
  if (start < 0) {
    if (ifPresent) {
      console.log(
        `[dsh-background] ${file} has no WEB_SETTINGS_NAMESPACES — nothing to do.\n` +
          "                That allowlist only exists on DSH 0.1.x; DSH 0.2.x exposes\n" +
          "                every registered namespace through dsh-api-settings-controller."
      );
      return true;
    }
    console.error(
      `[dsh-background] cannot locate WEB_SETTINGS_NAMESPACES in ${file}\n` +
        "  That allowlist only exists on DSH 0.1.x. If this is a DSH 0.2.x install,\n" +
        "  no action is needed — the namespace is exposed automatically."
    );
    return false;
  }
  const end = text.indexOf("];", start);
  if (end < 0) {
    console.error(`[dsh-background] malformed WEB_SETTINGS_NAMESPACES in ${file}`);
    return false;
  }
  const block = text.slice(start, end + 2);
  if (block.includes(`"${NAMESPACE}"`)) {
    console.log(`[dsh-background] "${NAMESPACE}" is already exposed in ${file} — nothing to do.`);
    return true;
  }
  const anchor = '"web-search-deepseek"';
  const anchorIdx = block.indexOf(anchor);
  let patched;
  if (anchorIdx >= 0) {
    patched = block.slice(0, anchorIdx) + `"${NAMESPACE}",\n\t` + block.slice(anchorIdx);
  } else {
    const closing = block.lastIndexOf("]");
    patched = block.slice(0, closing) + `\t"${NAMESPACE}",\n` + block.slice(closing);
  }
  writeFileSync(file, text.slice(0, start) + patched + text.slice(end + 2), "utf8");
  console.log(`[dsh-background] patched ${file}: added "${NAMESPACE}" to WEB_SETTINGS_NAMESPACES.`);
  console.log("[dsh-background] Restart `dsh web` for the change to take effect.");
  return true;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: node scripts/expose-namespace.mjs [file] [--if-present]\n" +
      "\n" +
      "  file           patch this dsh-host-apiproxy/lib/index.js instead of auto-detecting\n" +
      "  --if-present   treat \"nothing to patch\" as a skip (DSH 0.2.x needs no allowlist)"
  );
  process.exit(0);
}
const ifPresent = args.includes("--if-present");
const explicit = args.find((arg) => !arg.startsWith("-"));

const target = explicit ?? findTargetFile();
if (!target) {
  if (ifPresent) {
    console.log(
      "[dsh-background] dsh-host-apiproxy was not found — nothing to do.\n" +
        "                DSH 0.2.x (including the desktop app) does not use this allowlist,\n" +
        "                so this step is skipped."
    );
    process.exit(0);
  }
  console.error(
    "[dsh-background] could not locate dsh-host-apiproxy.\n" +
      "  DSH 0.2.x does not use this allowlist and needs no action here.\n" +
      "  On DSH 0.1.x, point the script at your copy explicitly:\n" +
      "    node scripts/expose-namespace.mjs <path-to>/@deepseek-ai/dsh-host-apiproxy/lib/index.js"
  );
  process.exit(1);
}
if (!patchFile(target, ifPresent)) process.exit(ifPresent ? 0 : 1);
