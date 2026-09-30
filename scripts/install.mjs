#!/usr/bin/env node
/**
 * dsh-background — one-command installer.
 *
 * Runs the full install for you:
 *   1. packages the plugin tarball (pnpm pack)
 *   2. installs it into a DSH profile (dsh plugin --profile <name> add)
 *   3. exposes the `ui-background` namespace in the host allowlist
 *      — only DSH 0.1.x needs this; on 0.2.x it is skipped (see below)
 *   4. verifies the plugin landed in both `dependencies` and `dsh.profile.bundles`
 *
 * Usage:
 *   node scripts/install.mjs                    # defaults to the desktop profile (DSH 0.2.x)
 *   node scripts/install.mjs --profile web      # install into another profile
 *
 * Version lines — the plugin and DSH must match:
 *   DSH 0.2.x  (desktop app / new web runtime) -> plugin 0.2.x -> profile "desktop" or "web"
 *   DSH 0.1.x  (old web runtime)               -> plugin 0.1.x -> profile "web"
 * This checkout builds 0.2.x. DSH 0.1.x users should use the v0.1.9 tag instead.
 *
 * If the `dsh` command is not on your PATH, set DSH_CMD first:
 *   set DSH_CMD=npx @deepseek-ai/dsh                       (Windows cmd)
 *   $env:DSH_CMD = "npx @deepseek-ai/dsh"                  (Windows PowerShell)
 *   export DSH_CMD='npx @deepseek-ai/dsh'                  (macOS / Linux)
 *
 * Desktop users usually do not need this script at all: install from inside the app
 * (Settings -> Plugins -> Add plugin) instead.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const DSH_CMD = process.env.DSH_CMD || "dsh";
const PKG_NAME = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).name;

function has(cmd) {
  try {
    execFileSync(isWin ? "where" : "which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function fail(msg) {
  console.error(`\n[dsh-background] ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: isWin, ...opts });
  if (result.status !== 0) {
    fail(`command failed (exit ${result.status ?? "?"}): ${cmd} ${args.join(" ")}`);
  }
}

// ---- args ------------------------------------------------------------------
const argv = process.argv.slice(2);
let profile = "desktop";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--profile") {
    profile = argv[++i];
    if (!profile) fail("--profile needs a value, e.g. --profile desktop");
  } else if (argv[i] === "--help" || argv[i] === "-h") {
    console.log(
      "Usage: node scripts/install.mjs [--profile <name>]\n" +
        "\n" +
        "  --profile <name>   DSH profile to install into (default: desktop)\n" +
        "                     DSH 0.2.x desktop app -> desktop\n" +
        "                     DSH 0.2.x web runtime -> web\n" +
        "                     DSH 0.1.x web runtime -> web (use the v0.1.9 tag instead)"
    );
    process.exit(0);
  }
}

// ---- prerequisites ---------------------------------------------------------
console.log("[dsh-background] checking prerequisites…");

if (!has("node")) fail("Node.js not found. Install it from https://nodejs.org first.");
if (!has("pnpm")) {
  fail(
    "pnpm not found — it is needed to build the tarball. Install it with one of:\n" +
      "  npm install -g pnpm\n" +
      "  # or, if you use Corepack:\n" +
      "  corepack enable\n" +
      "\n" +
      "(Installing from inside the desktop app does not need pnpm.)"
  );
}
if (!has("dsh") && !process.env.DSH_CMD) {
  fail(
    "The `dsh` command was not found on your PATH.\n" +
      "If you launch DSH through npx, set DSH_CMD first, then re-run:\n" +
      '  set DSH_CMD=npx @deepseek-ai/dsh        (Windows cmd)\n' +
      '  $env:DSH_CMD = "npx @deepseek-ai/dsh"   (Windows PowerShell)\n' +
      "  export DSH_CMD='npx @deepseek-ai/dsh'   (macOS / Linux)\n" +
      "\n" +
      "On the desktop app, point DSH_CMD at the CLI bundled with the app:\n" +
      '  Windows: $env:DSH_CMD = "<install dir>\\resources\\runtime\\cli\\bin\\dsh.cmd"'
  );
}

// ---- package ---------------------------------------------------------------
console.log("\n[dsh-background] building the plugin tarball…");
run("pnpm", ["pack", "--pack-destination", "."], { cwd: ROOT });

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const tarball = join(ROOT, `${pkg.name}-${pkg.version}.tgz`);
if (!existsSync(tarball)) {
  fail(`expected tarball not found: ${tarball}`);
}
console.log(`[dsh-background] tarball ready: ${tarball} (v${pkg.version})`);
console.log(
  "[dsh-background] note: this build targets DSH 0.2.x. DSH 0.1.x needs the v0.1.9 release."
);

// ---- install ---------------------------------------------------------------
console.log(`\n[dsh-background] installing into profile "${profile}"…`);
const dshCmd = (process.env.DSH_CMD || "dsh").split(/\s+/);
run(dshCmd[0], [...dshCmd.slice(1), "plugin", "--profile", profile, "add", tarball]);

// ---- expose namespace (0.1.x only; skipped elsewhere) ----------------------
console.log("\n[dsh-background] checking whether the settings allowlist step is needed…");
{
  const result = spawnSync("node", [join(ROOT, "scripts", "expose-namespace.mjs"), "--if-present"], {
    stdio: "inherit",
    shell: isWin
  });
  if (result.status !== 0) {
    console.warn(
      "[dsh-background] allowlist helper did not complete; on DSH 0.2.x this step is not needed.\n" +
        "                If you are on DSH 0.1.x, re-run: node scripts/expose-namespace.mjs"
    );
  }
}

// ---- verify ----------------------------------------------------------------
console.log("\n[dsh-background] verifying the profile manifest…");
const dshHome = process.env.DSH_HOME || join(homedir(), ".dsh");
const manifestPath = join(dshHome, "profiles", profile, "package.json");
if (!existsSync(manifestPath)) {
  console.warn(`[dsh-background] could not read ${manifestPath} — verify the install manually.`);
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const inDependencies = Boolean(manifest.dependencies?.[PKG_NAME]);
  const bundles = manifest.dsh?.profile?.bundles ?? [];
  const inBundles = bundles.includes(PKG_NAME);
  console.log(`  dependencies["${PKG_NAME}"]: ${inDependencies ? "yes" : "NO"}`);
  console.log(`  dsh.profile.bundles contains it: ${inBundles ? "yes" : "NO"}`);
  if (!inDependencies || !inBundles) {
    console.warn(
      "[dsh-background] the profile manifest looks incomplete. " +
        "Expected the plugin in both `dependencies` and `dsh.profile.bundles`."
    );
  }
}

// ---- done ------------------------------------------------------------------
const isDesktop = profile === "desktop";
console.log("\n✅ Install finished!");
console.log("Next steps:");
if (isDesktop) {
  console.log("  1. Restart the desktop app (or reload the window), or click \"Enable now\" in Settings → Plugins");
  console.log("  2. Configure:  Settings → General → Background");
  console.log("\n  No allowlist step is needed on DSH 0.2.x.");
} else {
  console.log("  1. Restart DSH:            dsh web");
  console.log("  2. Open the app:           http://127.0.0.1:3080  (hard-refresh with Ctrl+F5)");
  console.log("  3. Configure:              Settings → General → Background");
  console.log("\n  On DSH 0.1.x remember to run: node scripts/expose-namespace.mjs");
}
