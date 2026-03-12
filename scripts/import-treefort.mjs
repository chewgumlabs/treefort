#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const TREEFORT_JSON_PATH = path.join(ROOT_DIR, "data/treefort.json");
const ROOM_JSON_PATH = path.join(ROOT_DIR, "room/data/room.json");
const SCENE_IMPORT_DIR = path.join(ROOT_DIR, "room/assets/imports/icy");

const MAX_BUNDLE_BYTES = 50 * 1024 * 1024; // 50 MB
const HUB_URL = "https://chewgumlabs.github.io/TreeFort/";
const SAFE_PATH_RE = /^[a-zA-Z0-9_-]+$/;
const DATA_URL_RE = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

const RESIDENT_SCORE_GOALS = Array.from({ length: 10 }, (_, i) => ({
  id: `obj-${i + 1}`,
  labelId: `obj-${i + 1}`,
  label: "",
  minCells: 0,
  wave: 1,
}));

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function sanitizePath(value) {
  const base = path.basename(value, path.extname(value)).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!base) fail(`Path contains no safe characters: ${value}`);
  return base;
}

function validateDataUrl(value, label) {
  if (!value) return;
  if (typeof value !== "string") fail(`${label} must be a string`);
  // Reject dangerous schemes
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.includes("<script")) {
    fail(`${label} contains forbidden content`);
  }
  if (!DATA_URL_RE.test(value)) {
    fail(`${label} must be a data:image/png;base64 URL`);
  }
}

function validateStickers(stickers, label) {
  if (!Array.isArray(stickers)) return;
  for (let i = 0; i < stickers.length; i++) {
    const s = stickers[i];
    if (s.dataUrl) validateDataUrl(s.dataUrl, `${label}[${i}].dataUrl`);
  }
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.log("Usage: node scripts/import-treefort.mjs <file.treefort>");
    process.exit(1);
  }

  const absoluteInput = path.resolve(inputPath);
  const raw = await fs.readFile(absoluteInput, "utf8");

  // Size check
  if (Buffer.byteLength(raw) > MAX_BUNDLE_BYTES) {
    fail(`Bundle exceeds ${MAX_BUNDLE_BYTES / 1024 / 1024}MB limit`);
  }

  let bundle;
  try {
    bundle = JSON.parse(raw);
  } catch {
    fail("Invalid JSON in .treefort file");
  }

  // ── Validate envelope ──
  if (bundle.app !== "TreeFort") fail(`Expected app "TreeFort", got "${bundle.app}"`);
  if (bundle.format !== "treefort-export") fail(`Expected format "treefort-export", got "${bundle.format}"`);
  if (bundle.version !== 1) fail(`Expected version 1, got ${bundle.version}`);
  if (!bundle.room) fail("Bundle missing room data");

  const guestName = bundle.guest || bundle.guestId || "resident";
  console.log(`Importing treefort for: ${guestName}`);

  // ── Sanitize room data ──
  const room = JSON.parse(JSON.stringify(bundle.room));

  // Validate inline data URLs
  if (room.keyArt) validateDataUrl(room.keyArt, "room.keyArt");
  if (room.stickers) validateStickers(room.stickers, "room.stickers");

  // Strip quest state, mark as resident
  room.questPhase = null;
  room.instance = "resident";
  room.stickerBookOpened = true;
  room.completedWaves = [];

  // Replace main space scoreGoals with 10 blank slots
  const mainSpace = room.spaces?.find((s) => s.id === room.entrySpaceId || s.id === "main");
  if (mainSpace) {
    mainSpace.scoreGoals = RESIDENT_SCORE_GOALS;
  }

  // ── Write scene overrides ──
  const scenes = bundle.scenes || {};
  const sceneFiles = [];
  await fs.mkdir(SCENE_IMPORT_DIR, { recursive: true });

  for (const [spaceId, sceneData] of Object.entries(scenes)) {
    const safeId = sanitizePath(spaceId);
    const filename = `${safeId}-scene.json`;
    const scenePath = path.join(SCENE_IMPORT_DIR, filename);
    const assetPath = `assets/imports/icy/${filename}`;

    await fs.writeFile(scenePath, JSON.stringify(sceneData, null, 2) + "\n", "utf8");
    sceneFiles.push({ spaceId, assetPath, filename });

    // Update scene art reference in room manifest
    const space = room.spaces?.find((s) => s.id === spaceId);
    if (space) {
      const assetId = `imported-${safeId}-scene`;
      space.sceneArtAssetId = assetId;

      // Add/update asset entry
      if (!room.assets) room.assets = [];
      const existing = room.assets.find((a) => a.id === assetId);
      if (existing) {
        existing.path = assetPath;
      } else {
        const sceneJson = JSON.stringify(sceneData);
        room.assets.push({
          id: assetId,
          path: assetPath,
          mimeType: "application/json",
          bytes: Buffer.byteLength(sceneJson),
          width: room.stage?.width || 256,
          height: room.stage?.height || 192,
          source: "treefort-import",
        });
      }
    }
  }

  // ── Write room.json ──
  await fs.mkdir(path.dirname(ROOM_JSON_PATH), { recursive: true });
  await fs.writeFile(ROOM_JSON_PATH, JSON.stringify(room, null, 2) + "\n", "utf8");

  // ── Write treefort.json ──
  let treefortJson;
  try {
    treefortJson = JSON.parse(await fs.readFile(TREEFORT_JSON_PATH, "utf8"));
  } catch {
    treefortJson = { version: 2, treefort: {} };
  }

  treefortJson.instance = "resident";
  treefortJson.resident = {
    name: guestName,
    neighborUrl: HUB_URL,
  };
  treefortJson.doors = [];

  await fs.writeFile(TREEFORT_JSON_PATH, JSON.stringify(treefortJson, null, 2) + "\n", "utf8");

  // ── Summary ──
  console.log("");
  console.log("Import complete!");
  console.log(`  room/data/room.json — written (instance: resident, ${RESIDENT_SCORE_GOALS.length} blank label slots)`);
  if (sceneFiles.length) {
    console.log(`  Scene overrides:`);
    for (const sf of sceneFiles) {
      console.log(`    room/assets/imports/icy/${sf.filename} (space: ${sf.spaceId})`);
    }
  }
  console.log(`  data/treefort.json — written (instance: resident, neighbor: ${HUB_URL})`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. git add -A && git commit -m 'Import resident room'");
  console.log("  2. Push to GitHub and enable Pages");
  console.log("  3. Your room will be live at your GitHub Pages URL");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
