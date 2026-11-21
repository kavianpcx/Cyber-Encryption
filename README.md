# Cyber Encryption

Free, open-source **offline AES-256-GCM encryption** for text and files. The original single-file browser application and the lightweight Windows portable edition are both included.

## Windows portable — v1.2.1 (latest)

[**Download the Windows x64 portable EXE**](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.2.1) · [All releases](https://github.com/kavianpcx/Cyber-Encryption/releases) · [Native build instructions](./native/README.md)

![Screenshot captured from the real v1.2.1 Windows app](https://github.com/kavianpcx/Cyber-Encryption/releases/download/v1.2.1/Cyber-Encryption-Native-v1.2.1.png)

The new version fixes the double titlebar. It opens in a **compact, resizable 960 × 700 window**, with a single unified titlebar and native minimize / maximize / close behavior. The toolbar shows the **current version (v1.2.1)**; click it for the About dialog.

### Desktop features

- **Dark and Green themes** with visible color changes and locally retained preference. The original browser file still offers its original Dark and Pink themes.
- Accessible icon buttons with tooltips for key actions, copy, ciphertext-only QR and transfer.
- AES-256-GCM text and file encryption; compatible with the original \`index.html\` encrypted formats.
- Show or download a QR PNG of **short encrypted text only** (not plaintext or keys).
- Transfer output to input, paste from clipboard on demand, and clear input/output text without clearing the encryption key.
- Export **encrypted text only** as a \`.txt\` file. Plaintext is deliberately rejected by this button.
- Shortcuts: **Ctrl+Enter** encrypt, **Ctrl+Shift+Enter** decrypt while typing.
- All program assets embedded in a single native \`.exe\`; **no Electron or bundled browser engine**.

The compact executable relies on **Microsoft Edge WebView2 Runtime already provided on most Windows 11 systems**. On Windows 10 or systems without it, install [Microsoft's official WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) once. The app itself does not use the internet. It creates a portable \`CyberEncryptionData\` settings/cache folder next to the EXE; use a writable folder or USB drive.

## Original browser app

The repository root [\`index.html\`](./index.html) is **preserved unchanged**. Open it directly in a modern browser to encrypt/decrypt text or files without installing anything. Its original Dark/Pink theme and UI remain as they were. Both editions preserve the same ciphertext formats.

## How encryption works

| Item | Format / algorithm |
| --- | --- |
| Cipher | AES-256-GCM, random 12-byte IV, authenticated tag |
| Passphrase | PBKDF2/SHA-256, 200,000 iterations, random 16-byte salt |
| Text with a generated raw key | \`iv_hex:ciphertext_and_tag_hex\` |
| Text with a passphrase | \`salt_hex:iv_hex:ciphertext_and_tag_hex\` |
| Encrypted files | \`CE1\` header + mode + optional salt + IV + ciphertext and tag; \`.enc\` extension |

You **must keep your generated key or passphrase safe**. Lost keys cannot be recovered. Clipboard contents and decrypted files are plaintext. Nothing is uploaded or synchronized. There is no telemetry, login, or remote API. Do not assume a security audit: no independent cryptography review or code-signing has been performed.

## Legacy releases

[Windows portable v1.2.0](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.2.0) and [Electron v1.1.0](https://github.com/kavianpcx/Cyber-Encryption/releases/tag/v1.1.0) remain available for comparison and compatibility. **Use v1.2.1** for the improved lightweight desktop interface.

## License

MIT © 2026 Kavian Sherkatfar. See [LICENSE](./LICENSE).
