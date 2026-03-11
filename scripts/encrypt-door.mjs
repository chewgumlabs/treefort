#!/usr/bin/env node
/**
 * Encrypt a door href with a passphrase for Level 2 knock security.
 *
 * Usage:
 *   node scripts/encrypt-door.mjs <passphrase> <href>
 *
 * Output:
 *   passphraseHash and encryptedHref for treefort.json
 */

const [, , passphrase, href] = process.argv;

if (!passphrase || !href) {
  console.error("Usage: node scripts/encrypt-door.mjs <passphrase> <href>");
  process.exit(1);
}

const normalized = passphrase.trim().toLowerCase();

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function encryptString(plaintext, pass) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );

  const blob = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  blob.set(salt, 0);
  blob.set(iv, salt.length);
  blob.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...blob));
}

const hash = await sha256Hex(normalized);
const encrypted = await encryptString(href, normalized);

console.log(JSON.stringify({
  passphraseHash: hash,
  encryptedHref: encrypted,
}, null, 2));
