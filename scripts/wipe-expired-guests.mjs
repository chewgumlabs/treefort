#!/usr/bin/env node
/**
 * Wipe expired guest rooms.
 *
 * Reads the manifest, finds occupied guest rooms past their stay,
 * extracts sticker books (if discovered), resets doors to vacant,
 * and deletes their room directories.
 *
 * Run by GitHub Actions nightly or manually:
 *   node scripts/wipe-expired-guests.mjs
 */

import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MANIFEST_PATH = resolve("data/treefort.json");
const ROOMS_DIR = resolve("rooms");
const STICKERBOOKS_DIR = resolve("data/stickerbooks");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
const rules = manifest.treefort.guestRules;
const now = new Date();
let wiped = 0;

// Ensure stickerbooks directory exists
mkdirSync(STICKERBOOKS_DIR, { recursive: true });

// Pre-compute next fill slot for any new sticker books
if (!manifest.stickerBooks) manifest.stickerBooks = [];
const FILL_ORDER = [
  43,51,20,56,11,23,18,39,34,17,37,12,8,26,58,44,3,29,16,22,6,4,41,33,
  30,14,47,60,53,49,54,50,27,5,45,19,61,7,42,59,1,55,2,36,21,0,62,32,
  24,9,57,63,46,13,25,48,35,15,31,10,40,52,28,38,
];
const usedSlots = new Set(manifest.stickerBooks.map(b => b.slot));

function nextFreeSlot() {
  for (const s of FILL_ORDER) {
    if (!usedSlots.has(s)) return s;
  }
  return null;
}

for (const door of manifest.doors) {
  if (door.type !== "guest" || door.status !== "occupied" || !door.moveInDate) {
    continue;
  }

  const moveIn = new Date(door.moveInDate + "T00:00:00Z");
  const elapsed = Math.floor((now - moveIn) / 86400000);

  if (elapsed < rules.stayDays) {
    continue;
  }

  console.log(`Wiping ${door.id} (${door.name}) — ${elapsed} days elapsed, limit ${rules.stayDays}`);

  // Extract sticker book before deletion
  const roomDataPath = resolve(ROOMS_DIR, door.id, "data.json");
  if (existsSync(roomDataPath)) {
    try {
      const roomData = JSON.parse(readFileSync(roomDataPath, "utf-8"));
      const discovered = !!roomData.stickerBookOpened;
      const hasContent = roomData.keyArt || (roomData.stickers && roomData.stickers.length > 0);

      // Always save the sticker book data as backup
      const stickerBook = {
        schemaVersion: 1,
        guestId: door.id,
        name: roomData.owner?.displayName || door.name || door.id,
        exportedAt: now.toISOString(),
        discovered,
        keyArt: roomData.keyArt || null,
        stickers: roomData.stickers || [],
      };

      const sbookPath = resolve(STICKERBOOKS_DIR, `${door.id}.json`);
      writeFileSync(sbookPath, JSON.stringify(stickerBook, null, 2) + "\n");
      console.log(`  Saved sticker book → ${sbookPath} (${stickerBook.stickers.length} stickers, discovered: ${discovered})`);

      // Only place on the tree if guest discovered the sticker book
      if (discovered && hasContent) {
        const slot = nextFreeSlot();
        if (slot !== null) {
          const entry = { name: stickerBook.name, guestId: door.id, slot };
          manifest.stickerBooks.push(entry);
          usedSlots.add(slot);
          console.log(`  Added to tree grass at slot ${slot}`);
        } else {
          console.log(`  No free slots on grass — sticker book saved but not placed`);
        }
      }
    } catch (err) {
      console.log(`  Could not extract sticker book: ${err.message}`);
    }
  }

  // Reset door to vacant
  door.status = "vacant";
  delete door.name;
  delete door.moveInDate;
  delete door.access;

  // Delete room directory
  const roomDir = resolve(ROOMS_DIR, door.id);
  if (existsSync(roomDir)) {
    rmSync(roomDir, { recursive: true, force: true });
    console.log(`  Deleted ${roomDir}`);
  }

  wiped++;
}

if (wiped > 0) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nWiped ${wiped} expired guest room(s). Manifest updated.`);
} else {
  console.log("No expired guest rooms found.");
}
