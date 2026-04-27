# Cyber Encryption (Offline Pro)

A secure **offline encryption & decryption web app** for text and files, built with pure **HTML, CSS, and JavaScript**.  
The app uses the **Web Crypto API (AES‑GCM)** to ensure strong client‑side encryption.

## Features
- Fully **offline** – works without any server
- Encrypt & decrypt **text**
- Encrypt & decrypt **files**
- Choose between **Default Key** or **Passphrase**
- Built-in Web Crypto API (AES-GCM)
- Clean, responsive UI

## How to Use
1. Open the `index.html` file in any modern browser.
2. Enter your text or choose a file.
3. Select key mode:
   - Default Key  
   - Passphrase
4. Click **Encrypt** or **Decrypt**.
5. Download or copy the result.

## HTTPS Required for Online Use

If you upload this project to a website, the site **must use HTTPS (SSL)**.

Modern browsers block the Web Crypto API (AES‑GCM) on unsecured HTTP pages.  
This means encryption and decryption will only work on:

- `https://` websites  
- Local files (`file://`)

Using plain `http://` will prevent the crypto functions from running.

## Technology Stack
- HTML5
- CSS3
- JavaScript
- Web Crypto API (AES-GCM)

## Security Notes
- Everything happens locally on your device.
- No data is uploaded anywhere.
- If you lose your passphrase, the encrypted data **cannot** be recovered.

## Browser Support
- Chrome  
- Edge  
- Firefox  
- Safari  


## License
This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.
