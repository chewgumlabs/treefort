#!/usr/bin/env node
/**
 * Provision a guest room.
 *
 * Usage:
 *   node scripts/provision-guest.mjs "Kid Name" "their-passphrase"
 *
 * Finds the first vacant guest slot, assigns the kid,
 * encrypts their door, and creates their room directory.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const [, , kidName, passphrase] = process.argv;

if (!kidName || !passphrase) {
  console.error('Usage: node scripts/provision-guest.mjs "Kid Name" "their-passphrase"');
  process.exit(1);
}

const MANIFEST_PATH = resolve("data/treefort.json");
const ROOMS_DIR = resolve("rooms");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
const normalized = passphrase.trim().toLowerCase();

// Find first vacant slot
const slot = manifest.doors.find((d) => d.type === "guest" && d.status === "vacant");
if (!slot) {
  console.error("No vacant guest rooms available.");
  process.exit(1);
}

// Hash the passphrase
async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Encrypt the room URL
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

const roomHref = `./rooms/${slot.id}/`;
const hash = await sha256Hex(normalized);
const encrypted = await encryptString(roomHref, normalized);
const today = new Date().toISOString().split("T")[0];

// Update the slot
slot.status = "occupied";
slot.name = `${kidName}'s Room`;
slot.moveInDate = today;
slot.access = {
  mode: "knock",
  hint: `Ask ${kidName}!`,
  passphraseHash: hash,
  encryptedHref: encrypted,
};

// Create the room directory with an empty data file
const roomDir = resolve(ROOMS_DIR, slot.id);
if (!existsSync(roomDir)) {
  mkdirSync(roomDir, { recursive: true });
}

const defaultRoom = {
  version: 1,
  createdAt: today,
  guestName: kidName,
  guestId: slot.id,
  frames: [],
  interactions: [],
};

writeFileSync(resolve(roomDir, "data.json"), JSON.stringify(defaultRoom, null, 2) + "\n");

// Save manifest
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Guest room provisioned!`);
console.log(`  Slot:       ${slot.id} (floor ${slot.floor})`);
console.log(`  Name:       ${slot.name}`);
console.log(`  Move-in:    ${today}`);
console.log(`  Passphrase: ${passphrase} (never stored)`);
console.log(`  Room path:  ${roomHref}`);
console.log(`\nCommit and push to make it live.`);
