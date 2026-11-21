"use strict";
// Real desktop integration check: AES-GCM text round trip plus encrypted QR.
// Requires "npm run bundle" beforehand.
const assert = require("node:assert/strict");
const { _electron: electron } = require("playwright-core");

(async () => {
  const desktop = await electron.launch({ args: ["."] });
  try {
    const page = await desktop.firstWindow();
    await page.locator("#inputText").fill("Cyber Encryption portable smoke test");
    await page.getByRole("button", { name: /Generate Key/i }).click();
    await page.locator("#encryptBtn").click();
    await page.waitForFunction(() => document.querySelector("#outputText").value.includes(":"));
    const encrypted = await page.locator("#outputText").inputValue();
    assert.match(encrypted, /^[a-f0-9]{24}:[a-f0-9]{32,}$/);
    await page.getByRole("button", { name: /Show encrypted QR/i }).click();
    await page.locator(".ce-qr-dialog img").waitFor({ state: "visible" });
    assert.match(await page.locator(".ce-qr-dialog img").getAttribute("src"), /^data:image\/png;base64,/);
    await page.getByRole("button", { name: "Close" }).click();
    await page.locator("#inputText").fill(encrypted);
    await page.locator("#decryptBtn").click();
    await page.waitForFunction(() => document.querySelector("#outputText").value === "Cyber Encryption portable smoke test");
    await page.getByRole("button", { name: /Show encrypted QR/i }).click();
    assert.equal(await page.locator(".ce-qr-backdrop").isHidden(), true, "QR should refuse normal plaintext");
    console.log("Desktop smoke test: AES round trip + QR OK");
  } finally {
    await desktop.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
