"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { isEncryptedText } = require("./format.cjs");

test("accepts original raw-key and passphrase ciphertext formats", () => {
  assert.equal(isEncryptedText("a".repeat(24) + ":" + "b".repeat(32)), true);
  assert.equal(isEncryptedText("c".repeat(32) + ":" + "a".repeat(24) + ":" + "b".repeat(64)), true);
});
test("never QR encode plain text, keys, damaged formats or oversized output", () => {
  for (const s of ["hello", "a".repeat(64), "password", "a".repeat(24)+":zzz",
    "a".repeat(24)+":"+"b".repeat(31), "a".repeat(1801)]) {
    assert.equal(isEncryptedText(s), false, s.slice(0,30));
  }
});
test("the original HTML encryption engine and file format remain present", () => {
  const html = fs.readFileSync(path.resolve(__dirname,"..","index.html"), "utf8");
  assert.match(html, /FILE_MAGIC\s*=\s*new Uint8Array\(\[0x43, 0x45, 0x31\]\)/);
  assert.match(html, /PBKDF2/);
  assert.match(html, /iterations:\s*200000/);
  assert.match(html, /AES-GCM/);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:/);
});
