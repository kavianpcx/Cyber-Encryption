# Cyber Encryption (Offline Pro)

## Lightweight Windows Portable (v1.2.0)

**New:** A native Windows x64 application in a **single small EXE**, without Electron or a bundled Chromium engine. It uses the WebView2 Runtime provided by Windows 11. No installation or internet connection is required to use the app. On Windows 10, WebView2 may need to be installed separately once.

[**Download lightweight Windows EXE (v1.2.0)**](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.2.0) · [Build instructions](./native/README.md)

![Real screenshot of the lightweight native desktop application](https://github.com/kavianpcx/Cyber-Encryption/releases/download/v1.2.0/Cyber-Encryption-Native-v1.2.0.png)

The new app has its own window, icon, minimize/maximize/close controls, icon-only utility buttons, an improved scrollbar, and local encrypted-text QR output. The original `index.html` is **unchanged**, and files encrypted with the original app remain compatible. The Windows profile directory `CyberEncryptionData` is created next to the EXE.

The previous [Electron v1.1.0 release](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.1.0) is still available as a legacy fallback, but is much larger.

---

An **open-source, offline** encryption and decryption app for text and files, built with HTML/CSS/JavaScript and the Web Crypto API.

**Two ways to use it:**
- **Original browser app:** open [`index.html`](./index.html) in a modern browser. The original web app is preserved unchanged.
- **Windows portable app (v1.1.0):** download a self-contained Windows x64 EXE from [GitHub Releases](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.1.0). No installer and no internet needed to run it.

## Desktop screenshot

![Real Cyber Encryption desktop screenshot](https://github.com/kavianpcx/Cyber-Encryption/releases/download/v1.1.0/Cyber-Encryption-desktop.png)

*Captured automatically from the running Electron app during the Windows release build. The image becomes available when the release finishes.*

## Features

| Feature | Original HTML | Windows portable |
| --- | :---: | :---: |
| Offline text encryption and decryption | ✅ | ✅ |
| Offline file encryption and decryption | ✅ | ✅ |
| AES-256-GCM, random IV, authentication tag | ✅ | ✅ |
| Generated/imported 256-bit key | ✅ | ✅ |
| Passphrase mode (PBKDF2 / SHA-256) | ✅ | ✅ |
| Dark/pink theme, drag and drop | ✅ | ✅ |
| Encrypted-text QR display and PNG export | — | ✅ |
| Move output to input in one click | — | ✅ |
| Dedicated native file-saving experience | Browser | ✅ |
| Self-contained Windows executable | — | ✅ |

**QR privacy:** The portable QR feature only accepts ciphertext-shaped hex output (max 1,800 characters). It never QR-encodes a raw key or an ordinary plaintext message. A recipient must still possess the matching key or passphrase. QR generation runs locally without an API or CDN.

## Quick start

### Browser (original version)
1. Download the project and open `index.html`.
2. Enter text or select a file.
3. Choose **Default Key** (generate/import key) or **Passphrase**.
4. Encrypt or decrypt. Copy text results, or download the result for files.

### Windows portable
1. Download `Cyber-Encryption-1.1.0-Windows-Portable.exe` from [Releases](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.1.0).
2. Put it in a writable folder, optionally on a USB drive, and run it. No installation is necessary.
3. The app uses the same encryption formats as the HTML version. Use **Show encrypted QR** for short encrypted text, or **Use output as input** to reverse a workflow.

The unsigned EXE may trigger a Windows SmartScreen warning. Verify the release source before running; no code-signing or third-party audit is claimed.

## Compatibility and encryption formats

The desktop app **loads the original `index.html` without editing it**. Files encrypted by either app can be decrypted by the other (when the same key mode and key/passphrase are used).

- Cipher: AES-256-GCM, 96-bit random IV and a 128-bit authentication tag.
- Passphrases: PBKDF2 with SHA-256, 200,000 iterations and a random 16-byte salt.
- Text (raw key): `iv_hex:ciphertext_and_tag_hex`
- Text (passphrase): `salt_hex:iv_hex:ciphertext_and_tag_hex`
- Files: `CE1` magic bytes + one-byte mode + (optional salt) + IV + ciphertext/tag. Encrypted files use `.enc`.

**Important:** The generated raw key is not backed up for you. Keep it separately and securely; losing it or forgetting the passphrase makes the corresponding ciphertext unrecoverable. Decrypted files and clipboard contents are plaintext. File processing is in memory and limited by device resources.

## Privacy and offline behavior

All encryption and QR creation happen on the device. The browser version uses no remote scripts. The desktop version bundles Chromium, disables Node integration, sandboxing escape routes and popup/navigation to external pages, and blocks outgoing HTTP/HTTPS/WebSocket/FTP requests. There is no login, cloud sync, auto-update or telemetry.

The portable desktop app saves Chromium's local preferences/cache in a `CyberEncryptionData/` folder beside the EXE (not in your normal AppData folder); remove this folder to reset settings. Keys and input text are held in memory by the original app rather than intentionally persisted in the profile. Avoid untrusted machines, insecure clipboards, and sharing your key. This is **not an independent security audit**.

## Development and releases

The standalone HTML file needs no build step. For the desktop app, see [desktop build instructions](./desktop/README.md). GitHub Actions builds and tests the Windows EXE, takes a real screenshot, and publishes the release from the main branch. Dependencies are downloaded **at build time**, not at runtime. The complete source is available in this repository.

## License

MIT © 2026 Kavian Sherkatfar. See [LICENSE](./LICENSE).
