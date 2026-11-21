"use strict";
const { app, BrowserWindow, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const entry = path.resolve(__dirname, "..", "index.html");

// Keep Chromium's profile beside the portable executable, not in AppData.
// Never persist encryption keys or plaintext through the main process.
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  const userData = path.join(process.env.PORTABLE_EXECUTABLE_DIR, "CyberEncryptionData");
  try {
    fs.mkdirSync(userData, { recursive: true });
    fs.accessSync(userData, fs.constants.W_OK);
    app.setPath("userData", userData);
  } catch (err) {
    console.error("Cannot write portable profile next to executable:", err);
    process.exit(1);
  }
}

app.setAppUserModelId("com.kaviansh.cyberencryption");
app.whenReady().then(() => {
  const profile = session.defaultSession;

  // Offline by design: deny ALL outbound HTTP(S), WebSocket and FTP traffic.
  profile.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*", "ftp://*/*"] },
    (_details, callback) => callback({ cancel: true })
  );

  const trustedPage = require("node:url").pathToFileURL(entry).href;
  const allowClipboardRead = (contents, permission) =>
    permission === "clipboard-read" && contents?.getURL() === trustedPage;
  profile.setPermissionRequestHandler((contents, permission, callback) => {
    callback(allowClipboardRead(contents, permission));
  });
  profile.setPermissionCheckHandler((contents, permission) => {
    return allowClipboardRead(contents, permission);
  });

  // Let the OS show a native Save As dialog for Blob: download links.
  profile.on("will-download", (_event, item) => {
    item.setSaveDialogOptions({ title: "Save encrypted or decrypted file" });
  });

  const win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 780,
    minHeight: 630,
    backgroundColor: "#0d1220",
    autoHideMenuBar: true,
    title: "Cyber Encryption • Offline Portable",
    webPreferences: {
      preload: path.join(__dirname, "preload.bundle.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
      webviewTag: false
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== trustedPage) event.preventDefault();
  });
  win.webContents.on("will-attach-webview", event => event.preventDefault());
  win.loadFile(entry);
});

app.on("window-all-closed", () => app.quit());
