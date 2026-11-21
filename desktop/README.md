# Windows portable edition

This is a separate Electron desktop shell around the **unchanged** root `index.html`.
It includes Chromium, runs without installation or a network connection, and
preserves the original CE1 file format and the original text encryption format.

## Build locally

On Windows, install Node.js 24+ and run:

```powershell
npm install
npm test
npm run bundle
npm run smoke
npm run screenshot
npm run build:portable
```

The unsigned portable `.exe` appears in `dist/`. The actual desktop
screenshot appears in `desktop/screenshot.png` (generated, not checked in).
Building requires internet to download build dependencies; **using the app does not**.

## Security boundaries

- Only `index.html` is loaded. External navigation, popups, and outgoing HTTP,
  HTTPS, WebSockets and FTP are blocked in the Electron process.
- Node integration and webviews are disabled; renderer sandbox and context
  isolation are enabled.
- The original crypto implementation is untouched: AES-256-GCM with random IVs,
  PBKDF2/SHA-256 (200,000 rounds) for passphrases.
- The QR option accepts only ciphertext-shaped text, up to 1,800 characters.
  It does **not** display or transmit passphrases or raw keys.
- The app does not implement auto-update, remote APIs, cloud sync, or telemetry.
- With portable builds, Chromium's preferences/cache are saved to
  `CyberEncryptionData/` alongside the EXE. Delete that directory to reset
  local settings. The original app stores no encryption key or plaintext there.
  Use a writable location or USB drive when running the EXE.
- A forgotten passphrase or lost raw key cannot be recovered.
- Decrypted data and copied secrets can remain in files, process memory or the
  clipboard. Treat them accordingly.
- No independent security audit or Windows code signature is claimed.

The project is MIT licensed. See the root `LICENSE`.
