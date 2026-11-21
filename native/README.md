# Cyber Encryption native Windows portable — v1.2.1

A tiny, standalone Win32 x64 EXE using Microsoft's **system-installed WebView2 runtime**. It is not Electron and does not embed a browser engine. All local HTML, CSS and QR JavaScript are compiled into the binary. The root \`index.html\` and its AES-GCM / CE1 encryption formats remain **unchanged**.

## Desktop behavior

The original Windows titlebar has been removed; one unified custom titlebar now handles minimize, maximize, close and dragging. The initial window size is 960 × 700, with resizing and maximization available. Dark and Green modes change the **whole interface** and persist via the original application's local \`ce_theme\` preference; only the native edition maps its legacy internal \`pink\` state to Green. The standalone browser file retains its original Dark/Pink themes.

Click the **v1.2.1** badge for About / current version. The portable UI also adds accessible icon-based copy/QR/transfer buttons, paste from clipboard, text-field clearing, encrypted-text-only TXT export, and Ctrl+Enter / Ctrl+Shift+Enter encryption shortcuts. No automatic clipboard copying or persistent plaintext history is added.

## Offline and security

The application runs without internet, intercepts and serves its own embedded local assets through an internal HTTPS origin, denies external requests/navigation and blocks remote connection via CSP. The encryption/key logic is the same original Web Crypto AES-256-GCM code.

Portable WebView2 preferences and browser cache live in \`CyberEncryptionData\` next to the EXE, so the destination folder must be writable. The app itself does not intentionally persist passwords, raw keys or plaintext. Clipboard usage and output files can still expose sensitive data if handled carelessly.

WebView2 Runtime ships with most Windows 11 systems, but Windows 10 or customized installations may need the [official Microsoft runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) installed separately once.

## Build from source (Windows + Visual Studio/MSBuild)

\`\`\`powershell
npm install --prefix native --no-audit --no-fund
npm run --prefix native bundle
python -m pip install pillow
python native/generate_icon.py
# Download Microsoft.Web.WebView2 NuGet 1.0.4314.35 to native/deps
msbuild native/CyberEncryption.vcxproj /p:Configuration=Release /p:Platform=x64
npm run --prefix native test
\`\`\`

\`WebView2LoaderStatic.lib\` is linked at build time so no separate loader DLL is distributed. GitHub Actions performs a real Windows build, checks the **Win32 window style** has no OS caption, tests AES-GCM round trip, QR, persistent Green theme and version display, and captures an authentic screenshot. A test-only local DevTools port can be enabled with \`CYBER_UI_TEST\`; this should not be enabled on an untrusted host.

The EXE is **unsigned**. No independent security audit is claimed.

MIT © 2026 Kavian Sherkatfar.
