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
 * After running it, restart `dsh web` for the change to take effect.
 *
 * Usage:
 *   node scripts/expose-namespace.mjs            # auto-detect the dsh install
 *   node scripts/expose-namespace.mjs <file>     # patch a specific file
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

function patchFile(file) {
  const text = readFileSync(file, "utf8");
  const header = "const WEB_SETTINGS_NAMESPACES = [";
  const start = text.indexOf(header);
  if (start < 0) {
    console.error(`[dsh-background] cannot locate WEB_SETTINGS_NAMESPACES in ${file}`);
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

const explicit = process.argv[2];
const target = explicit ?? findTargetFile();
if (!target) {
  console.error(
    "[dsh-background] could not locate dsh-host-apiproxy.\n" +
      "  Run: node scripts/expose-namespace.mjs <path-to>/dsh-host-apiproxy/lib/index.js"
  );
  process.exit(1);
}
if (!patchFile(target)) process.exit(1);
