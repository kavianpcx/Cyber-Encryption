"use strict";

// The original index.html emits AES-GCM ciphertext as:
// raw key:   12-byte IV : ciphertext+16-byte tag (hex)
// passphrase:16-byte salt : 12-byte IV : ciphertext+16-byte tag (hex)
// Do not QR-encode anything else (particularly raw keys or plaintext).
function isEncryptedText(input) {
  const value = String(input || "").trim();
  if (!value || value.length > 1800) return false;
  const parts = value.split(":");
  if (parts.length !== 2 && parts.length !== 3) return false;
  if (!parts.every(p => /^[0-9a-f]+$/i.test(p))) return false;
  const [salt, iv, ciphertext] = parts.length === 3 ? parts : [null, ...parts];
  return (!salt || salt.length === 32) &&
    iv.length === 24 &&
    ciphertext.length >= 32 &&
    ciphertext.length % 2 === 0;
}

module.exports = { isEncryptedText };
