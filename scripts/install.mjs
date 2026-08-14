#!/usr/bin/env node
/**
 * dsh-background — one-command installer.
 *
 * For first-time users (and the impatient). Runs the full install for you:
 *   1. packages the plugin tarball (pnpm pack)
 *   2. installs it into a DSH profile (dsh plugin --profile <name> add)
 *   3. exposes the `ui-background` namespace in the host allowlist
 *
 * Usage:
 *   node scripts/install.mjs                  # install into the default "web" profile
 *   node scripts/install.mjs --profile myapp  # install into another profile
 *
 * If the `dsh` command is not on your PATH, set DSH_CMD first:
 *   set DSH_CMD=npx @deepseek-ai/dsh                       (Windows cmd)
 *   $env:DSH_CMD = "npx @deepseek-ai/dsh"                  (Windows PowerShell)
 *   export DSH_CMD='npx @deepseek-ai/dsh'                  (macOS / Linux)
 *
 * After it finishes, restart DSH (`dsh web`) and hard-refresh the browser.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const DSH_CMD = process.env.DSH_CMD || "dsh";

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
let profile = "web";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--profile") {
    profile = argv[++i];
    if (!profile) fail("--profile needs a value, e.g. --profile web");
  } else if (argv[i] === "--help" || argv[i] === "-h") {
    console.log("Usage: node scripts/install.mjs [--profile <name>]");
    process.exit(0);
  }
}

// ---- prerequisites ---------------------------------------------------------
console.log("[dsh-background] checking prerequisites…");

if (!has("node")) fail("Node.js not found. Install it from https://nodejs.org first.");
if (!has("pnpm")) {
  fail(
    "pnpm not found. Install it with one of:\n" +
      "  npm install -g pnpm\n" +
      "  # or, if you use Corepack:\n" +
      "  corepack enable"
  );
}
if (!has("dsh") && !process.env.DSH_CMD) {
  fail(
    "The `dsh` command was not found on your PATH.\n" +
      "If you launch DSH through npx, set DSH_CMD first, then re-run:\n" +
      '  set DSH_CMD=npx @deepseek-ai/dsh        (Windows cmd)\n' +
      '  $env:DSH_CMD = "npx @deepseek-ai/dsh"   (Windows PowerShell)\n' +
      "  export DSH_CMD='npx @deepseek-ai/dsh'   (macOS / Linux)"
  );
}

// ---- package ---------------------------------------------------------------
console.log("\n[dsh-background] building the plugin tarball…");
run("pnpm", ["pack", "--pack-destination", "."], { cwd: ROOT });

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const tarball = join(ROOT, `awesome-dsh-background-plugin-${pkg.version}.tgz`);
if (!existsSync(tarball)) {
  fail(`expected tarball not found: ${tarball}`);
}
console.log(`[dsh-background] tarball ready: ${tarball}`);

// ---- install ---------------------------------------------------------------
console.log(`\n[dsh-background] installing into profile "${profile}"…`);
const dshCmd = (process.env.DSH_CMD || "dsh").split(/\s+/);
run(dshCmd[0], [...dshCmd.slice(1), "plugin", "--profile", profile, "add", tarball]);

// ---- expose namespace ------------------------------------------------------
console.log("\n[dsh-background] exposing the ui-background namespace…");
run("node", [join(ROOT, "scripts", "expose-namespace.mjs")]);

// ---- done ------------------------------------------------------------------
console.log("\n✅ Install finished!");
console.log("Next steps:");
console.log("  1. Restart DSH:            dsh web");
console.log("  2. Open the app:           http://127.0.0.1:3080  (hard-refresh with Ctrl+F5)");
console.log("  3. Configure:              Settings → General → Background");
