"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { _electron: electron } = require("playwright-core");
(async () => {
  const desktop = await electron.launch({ args: ["."] });
  try {
    const page = await desktop.firstWindow();
    await page.locator("#inputText").fill("Encrypt locally. Share securely. Stay offline.");
    await page.getByRole("button", { name: /Generate Key/i }).click();
    await page.locator("#encryptBtn").click();
    await page.waitForFunction(() => document.querySelector("#outputText").value.includes(":"));
    await page.locator(".ce-portable-pill").waitFor({ state: "attached" });
    const target = path.join(__dirname, "screenshot.png");
    await page.screenshot({ path: target, fullPage: true, animations: "disabled" });
    console.log("Saved authentic Electron screenshot to " + target);
  } finally {
    await desktop.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
