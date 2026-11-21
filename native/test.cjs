"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright-core");
const exe = path.join(__dirname, "dist", "Cyber-Encryption-1.2.1-Windows-Portable.exe");
if (!fs.existsSync(exe)) throw Error("Native EXE not found");
const child = spawn(exe, [], {
  env: { ...process.env, CYBER_UI_TEST: "1" }, stdio: "ignore"
});
let browser;
const sleep = n => new Promise(r => setTimeout(r, n));
(async () => {
  for (let n = 0; n < 80; n++) {
    if (child.exitCode !== null) throw new Error("App exited at startup: " + child.exitCode);
    try {
      browser = await chromium.connectOverCDP("http://127.0.0.1:9223", { timeout: 900 });
      break;
    } catch { await sleep(450); }
  }
  if (!browser) throw Error("Could not connect to native WebView2 CI test port");
  let page;
  for (let i = 0; i < 40; i++) {
    page = browser.contexts().flatMap(c => c.pages())
      .find(p => p.url().startsWith("https://cyber-encryption.invalid/"));
    if (page) break;
    await sleep(250);
  }
  if (!page) throw Error("Native window did not load embedded offline HTML");
  assert.equal(await page.evaluate(() => window.isSecureContext && !!crypto.subtle), true);

  assert.equal(await page.locator("#ce-about-button").innerText(), "v1.2.1");
  assert.equal(await page.locator(".ce-window-controls button").count(), 3);
  assert.equal(await page.locator(".topbar").count(), 1);
  await page.locator("#ce-about-button").click();
  assert.match(await page.locator(".ce-about-dialog").innerText(), /Version 1\.2\.1/);
  await page.locator(".ce-about-dialog button").click();
  assert.equal(await page.locator(".ce-about-overlay").isHidden(), true);

  // Theme must visibly change computed colors and survive relaunch/reload.
  await page.evaluate(() => localStorage.setItem("ce_theme", "dark"));
  await page.reload();
  await page.locator("#ce-about-button").waitFor();
  assert.equal(await page.locator("#themeLabel").innerText(), "Dark");
  const dark = await page.locator(".app").evaluate(el => getComputedStyle(el).backgroundImage);
  await page.locator("#themeToggle").click();
  assert.equal(await page.locator("#themeLabel").innerText(), "Green");
  assert.equal(await page.evaluate(() => localStorage.getItem("ce_theme")), "pink");
  const green = await page.locator(".app").evaluate(el => getComputedStyle(el).backgroundImage);
  assert.notEqual(dark, green, "theme toggle must visually update the app background");
  await page.reload();
  await page.locator("#ce-about-button").waitFor();
  assert.equal(await page.locator("#themeLabel").innerText(), "Green");
  assert.equal(await page.locator(".app").evaluate(el => getComputedStyle(el).backgroundImage), green);
  await page.locator("#themeToggle").click();
  assert.equal(await page.locator("#themeLabel").innerText(), "Dark");

  assert.equal(await page.locator("#ce-qr").getAttribute("aria-label"), "Show encrypted text as QR code");
  await page.locator("#inputText").fill("Lightweight native portable AES-GCM");
  await page.getByRole("button", { name: "Generate a new encryption key" }).click();
  await page.locator("#encryptBtn").click();
  await page.waitForFunction(() => document.querySelector("#outputText").value.includes(":"));
  const ciphertext = await page.locator("#outputText").inputValue();
  assert.match(ciphertext, /^[a-f0-9]{24}:[a-f0-9]{32,}$/);
  await page.locator("#ce-qr").click();
  await page.locator(".ce-qr-dialog img").waitFor({ state: "visible" });
  assert.match(await page.locator(".ce-qr-dialog img").getAttribute("src"), /^data:image\/png;base64,/);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator("#ce-transfer").click();
  assert.equal(await page.locator("#inputText").inputValue(), ciphertext);
  await page.locator("#decryptBtn").click();
  await page.waitForFunction(() =>
    document.querySelector("#outputText").value === "Lightweight native portable AES-GCM");
  await page.locator("#ce-qr").click();
  assert.equal(await page.locator(".ce-qr-overlay").isHidden(), true);

  // Export is intentionally ciphertext-only, and text clearing never affects keys.
  assert.equal(await page.locator("#ce-export-text").getAttribute("aria-label"), "Save encrypted text as TXT");
  await page.locator("#ce-export-text").click();
  assert.equal(await page.locator("#toast").innerText(), "Only encrypted text can be exported");
  await page.locator("#ce-clear-text").click();
  assert.equal(await page.locator("#inputText").inputValue(), "");
  assert.equal(await page.locator("#outputText").inputValue(), "");
  assert.equal(await page.locator("#keyBox").getAttribute("data-full-key") !== null, true);
  assert.equal(await page.locator("#ce-paste").getAttribute("aria-label"), "Paste clipboard into input");

  await page.locator("#inputText").fill("Private data stays on this device");
  await page.locator("#encryptBtn").click();
  await page.waitForFunction(() => document.querySelector("#outputText").value.includes(":"));
  await page.screenshot({ path: path.join(__dirname, "screenshot.png"),
    fullPage: true, animations: "disabled" });
  console.log("PASS: native host, secure offline origin, AES-GCM, encrypted QR, transfer, screenshot");
  console.log("EXE bytes:", fs.statSync(exe).size);
})().catch(error => { console.error(error); process.exitCode = 1; })
.finally(async () => {
  if (browser) await browser.close().catch(() => {});
  child.kill();
});
