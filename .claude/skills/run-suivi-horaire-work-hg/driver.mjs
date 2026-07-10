#!/usr/bin/env node
// Line-based REPL driver for driving Suivi horaire in a headless Chromium
// session. Mirrors the chromium-cli command vocabulary (nav / wait-for /
// click / fill / press / screenshot / console) since chromium-cli itself
// isn't installed in this environment. Reads commands from stdin, one per
// line; prints "OK <cmd> ..." or "ERROR: <message>" for each.
//
// Usage:
//   node .claude/skills/run-suivi-horaire-work-hg/driver.mjs <<'EOF'
//   nav http://localhost:3000/register
//   fill input[type="email"] test@example.com
//   ...
//   EOF

import { chromium } from "playwright";
import { createInterface } from "node:readline";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";

const SCREENSHOT_DIR = process.env.DRIVER_SCREENSHOT_DIR || "/tmp/suivi-horaire-screenshots";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const PRE_INSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";

let browser;
let page;
let shotCount = 0;

async function ensurePage() {
  if (page) return page;
  const launchOptions = { args: ["--no-sandbox"] };
  if (existsSync(PRE_INSTALLED_CHROMIUM)) {
    launchOptions.executablePath = PRE_INSTALLED_CHROMIUM;
  }
  browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error(`[console.error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => console.error(`[pageerror] ${err.message}`));
  return page;
}

async function handle(line) {
  const [cmd, ...rest] = line.split(" ");
  const arg = rest.join(" ");
  const p = await ensurePage();

  switch (cmd) {
    case "nav": {
      await p.goto(arg, { waitUntil: "domcontentloaded", timeout: 30000 });
      console.log(`OK nav ${arg}`);
      return;
    }
    case "wait-for": {
      if (arg.startsWith("text=")) {
        await p.getByText(arg.slice(5), { exact: false }).first().waitFor({ timeout: 15000 });
      } else {
        await p.waitForSelector(arg, { timeout: 15000 });
      }
      console.log(`OK wait-for ${arg}`);
      return;
    }
    case "click": {
      await p.click(arg, { timeout: 10000 });
      console.log(`OK click ${arg}`);
      return;
    }
    case "fill": {
      const [selector, ...valueParts] = rest;
      await p.fill(selector, valueParts.join(" "), { timeout: 10000 });
      console.log(`OK fill ${selector}`);
      return;
    }
    case "press": {
      await p.keyboard.press(arg);
      console.log(`OK press ${arg}`);
      return;
    }
    case "wait-ms": {
      await p.waitForTimeout(Number(arg) || 500);
      console.log(`OK wait-ms ${arg}`);
      return;
    }
    case "screenshot": {
      shotCount += 1;
      const name = arg || `shot-${shotCount}`;
      const file = path.join(SCREENSHOT_DIR, `${name}.png`);
      await p.screenshot({ path: file, fullPage: true });
      copyFileSync(file, path.join(SCREENSHOT_DIR, "screenshot.png"));
      console.log(`OK screenshot ${file}`);
      return;
    }
    case "text": {
      const content = await p.locator(arg).first().textContent();
      console.log(`TEXT ${content}`);
      return;
    }
    case "url": {
      console.log(`URL ${p.url()}`);
      return;
    }
    case "eval": {
      const result = await p.evaluate(arg);
      console.log(`OK eval ${JSON.stringify(result)}`);
      return;
    }
    case "quit": {
      await browser.close();
      process.exit(0);
      return;
    }
    default:
      console.log(`unknown command: ${cmd}`);
  }
}

// Commands are queued and processed strictly in order. This matters because
// readline's "close" event fires as soon as stdin (the heredoc) is fully
// read — which happens almost instantly — well before an async command like
// "nav" or "wait-for" has actually finished. Exiting on "close" without
// draining the queue first kills the browser mid-navigation and produces no
// output at all.
const queue = [];
let processing = false;
let stdinClosed = false;

async function drainQueue() {
  if (processing) return;
  processing = true;
  while (queue.length) {
    const line = queue.shift();
    try {
      await handle(line);
    } catch (err) {
      console.error(`ERROR: ${err.message}`);
    }
  }
  processing = false;
  if (stdinClosed) await maybeExit();
}

async function maybeExit() {
  if (processing || queue.length > 0) return;
  if (browser) await browser.close();
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", (raw) => {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return;
  queue.push(line);
  drainQueue();
});

rl.on("close", () => {
  stdinClosed = true;
  maybeExit();
});
