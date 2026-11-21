# Lightweight native Windows portable app (v1.2.0)

The lightweight edition is a **native Win32 C++ application** using the
**Microsoft Edge WebView2 Runtime already included with Windows 11**.
It is not Electron, and it does not include a browser engine or Node.js.

The release contains a **single portable EXE** with the original `index.html`,
the offline QR encoder, the redesigned desktop UI and the Windows shield-lock icon
embedded inside. There is no installer. The original `index.html` file on the
repository root is **unchanged**, and the AES-GCM / CE1 formats are compatible.

For Windows 10 or stripped-down Windows systems that don't have the WebView2
Evergreen Runtime, install the Microsoft Runtime separately once:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

The app requires **no internet to run or encrypt/decrypt**. The native host serves
its embedded assets from a private, intercepted HTTPS origin. It does not access
an online website. Background networking is disabled, arbitrary web resources
are denied, external navigation/popups are blocked, and CSP forbids network
connections from the page. QR is generated entirely locally.

Local WebView2 preferences/cache live in a `CyberEncryptionData` folder beside
the EXE, which must be writable; this folder is not included in downloads and
contains no deliberately persisted keys or plaintext from our application code.

## Build (GitHub Actions / Visual Studio 2022 with Windows SDK)

Run on Windows (with MSBuild, Python, and Node installed):

```powershell
npm install --prefix native --no-audit --no-fund
npm run --prefix native bundle
python -m pip install pillow
python native/generate_icon.py
# Download/extract Microsoft.Web.WebView2 NuGet 1.0.4314.35 to native/deps
msbuild native/CyberEncryption.vcxproj /p:Configuration=Release /p:Platform=x64
```

Microsoft's WebView2 SDK is a **build-time** dependency. The
`WebView2LoaderStatic.lib` is linked into the EXE, so no DLL is shipped.

The CI tests use a temporary loopback-only Chromium DevTools debugging port
enabled **solely** when the `CYBER_UI_TEST` environment variable is set.
Normal release binaries do not enable this port. For production security
do not set that environment variable on an untrusted machine.

Encrypted text or files can be opened with the original browser edition and
vice versa. QR encodes ciphertext only, and never raw keys or plaintext.

No independent cryptography audit and no Windows code-signing are claimed.
License: MIT. © 2026 Kavian Sherkatfar.
