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

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
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

const roomHref = `./room/?guest=${slot.id}`;
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
rmSync(roomDir, { recursive: true, force: true });
mkdirSync(roomDir, { recursive: true });

const defaultRoom = guestRoomTemplate(slot.id, kidName, today);

function guestRoomTemplate(guestId, guestName, date) {
  return {
    schema: "treefort-semantic-room", schemaVersion: 1, roomId: guestId,
    roomEngine: "semantic-scene-v2",
    owner: { displayName: guestName, siteUrl: "./" },
    presentation: { eyebrow: "Guest room", title: `${guestName}'s Room`, description: "A guest room in the Treefort." },
    updatedAt: date,
    links: [{ label: "Treefort", href: "../index.html" }],
    stage: { width: 256, height: 192, tileWidth: 4, tileHeight: 4, gridWidth: 64, gridHeight: 48, gutterLeft: 0, gutterRight: 0 },
    limits: {
      maxSpaces: 12, maxLinks: 6, maxPaletteColors: 16, maxAssetCount: 64,
      maxAssetBytesPerFile: 4194304, maxAssetBytesTotal: 33554432,
      maxFillPatchesPerSpace: 64, maxSurfacePatchesPerSpace: 64, maxRegionsPerSpace: 32,
      maxPortalBindingsPerSpace: 24, maxRectsPerPatch: 24, maxRectsPerRegion: 24,
      maxTagsPerEntry: 12, maxLabelLength: 48, maxTitleLength: 64, maxBodyLength: 280,
      maxCaptionLength: 160, maxClickHintLength: 96,
      allowedAssetMimeTypes: ["image/png", "image/gif", "image/webp", "image/svg+xml", "application/json"],
      allowedAssetExtensions: [".png", ".gif", ".webp", ".svg", ".json"],
    },
    palette: [
      { id: "soot", hex: "#17191d" }, { id: "pearl", hex: "#f4f1e8" },
      { id: "fog", hex: "#b9b2a8" }, { id: "bark", hex: "#6a4e40" },
      { id: "ember", hex: "#b44034" }, { id: "tangerine", hex: "#ef8f50" },
      { id: "sun", hex: "#f5c74e" }, { id: "lemon", hex: "#f2df73" },
      { id: "moss", hex: "#6f9440" }, { id: "sky", hex: "#4d9fe7" },
      { id: "mint", hex: "#2db8a1" }, { id: "teal", hex: "#2b7f8c" },
      { id: "cobalt", hex: "#3d57bb" }, { id: "grape", hex: "#7a4db0" },
      { id: "rose", hex: "#de6a8b" }, { id: "peach", hex: "#efb7a2" },
    ],
    questPhase: "awaiting-key",
    activeWave: 0,
    completedWaves: [],
    assets: [],
    entrySpaceId: "main",
    spaces: [{
      id: "main", navigationKind: "room", title: `${guestName}'s Room`,
      description: "A blank room ready to be decorated.", revealState: "undrawn",
      sceneArtAssetId: null, placeholderPrompt: "",
      fillPatches: [], surfacePatches: [],
      scoreGoals: [
        { id: "main-floor", labelId: "floor", label: "Floor", minCells: 64, wave: 1, hint: "...a room needs some floor if anyone is going to stand in it." },
        { id: "main-rug", labelId: "rug", label: "Rug", minCells: 18, wave: 1, hint: "...something soft on the floor would help the room settle down." },
        { id: "main-bed", labelId: "bed", label: "Bed", minCells: 24, wave: 1, hint: "...it needs a bed before anybody can sleep in here." },
        { id: "main-desk", labelId: "desk", label: "Desk", minCells: 16, wave: 2, hint: "...a desk would give the room somewhere to think." },
        { id: "main-chair", labelId: "chair", label: "Chair", minCells: 12, wave: 2, hint: "...a desk without a chair feels a little rude." },
        { id: "main-lamp", labelId: "lamp", label: "Lamp", minCells: 8, wave: 2, hint: "...a lamp would help you see what you're doing." },
        { id: "main-window", labelId: "window", label: "Window", minCells: 16, wave: 3, hint: "...a window would make the room feel less boxed in." },
        { id: "main-shelf", labelId: "shelf", label: "Shelf", minCells: 12, wave: 3, hint: "...somewhere high up for treasures would help." },
        { id: "main-clock", labelId: "clock", label: "Clock", minCells: 8, wave: 3, hint: "...the room ought to know what time it is." },
        { id: "main-poster-secret", labelId: "poster-secret", label: "Poster?", minCells: 18, wave: 4, hint: "...something strange on the wall might hide a passage." },
      ],
      regions: [], portalBindings: [],
    },
    {
      id: "bonus", navigationKind: "room", title: "?̷̧?̶̡?",
      description: "Glitchby's room.", revealState: "undrawn",
      sceneArtAssetId: null, placeholderPrompt: "",
      fillPatches: [], surfacePatches: [],
      scoreGoals: [
        { id: "bonus-dry", labelId: "dry", label: "Dry", minCells: 24, wave: 1, hint: "...d̷r̶y̵..." },
        { id: "bonus-wet", labelId: "wet", label: "Wet", minCells: 24, wave: 1, hint: "...w̷e̶t̵..." },
        { id: "bonus-cold", labelId: "cold", label: "Cold", minCells: 20, wave: 2, hint: "...c̷o̶l̵d̸..." },
        { id: "bonus-hot", labelId: "hot", label: "Hot", minCells: 20, wave: 2, hint: "...h̷o̶t̵..." },
        { id: "bonus-light", labelId: "light", label: "Light", minCells: 16, wave: 3, hint: "...l̷i̶g̵h̸t̷..." },
        { id: "bonus-dark", labelId: "dark", label: "Dark", minCells: 16, wave: 3, hint: "...d̷a̶r̵k̸..." },
        { id: "bonus-lost", labelId: "lost", label: "Lost", minCells: 12, wave: 4, hint: "...l̷o̶s̵t̸..." },
        { id: "bonus-found", labelId: "found", label: "Found", minCells: 12, wave: 4, hint: "...f̷o̶u̵n̸d̷..." },
      ],
      regions: [], portalBindings: [],
    },
    {
      id: "secret", navigationKind: "room", title: "???",
      description: "You found it.", revealState: "visible",
      sceneArtAssetId: null, placeholderPrompt: "",
      fillPatches: [], surfacePatches: [],
      scoreGoals: [],
      regions: [], portalBindings: [],
    }],
  };
}

writeFileSync(resolve(roomDir, "data.json"), JSON.stringify(defaultRoom, null, 2) + "\n");

// Save manifest
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Guest room provisioned!`);
console.log(`  Slot:       ${slot.id}`);
console.log(`  Name:       ${slot.name}`);
console.log(`  Move-in:    ${today}`);
console.log(`  Passphrase: ${passphrase} (never stored)`);
console.log(`  Room path:  ${roomHref}`);
console.log(`\nCommit and push to make it live.`);
