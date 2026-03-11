#!/usr/bin/env node
/**
 * Wipe expired guest rooms.
 *
 * Reads the manifest, finds occupied guest rooms past their stay,
 * resets them to vacant, and deletes their room directories.
 *
 * Run by GitHub Actions nightly or manually:
 *   node scripts/wipe-expired-guests.mjs
 */

import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MANIFEST_PATH = resolve("data/treefort.json");
const ROOMS_DIR = resolve("rooms");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
const rules = manifest.treefort.guestRules;
const now = new Date();
let wiped = 0;

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

  // Reset door to vacant
  door.status = "vacant";
  delete door.name;
  delete door.moveInDate;
  delete door.access;

  // Delete room directory if it exists
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
