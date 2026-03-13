const doorField = document.getElementById("door-field");
const skyStack = document.getElementById("sky-stack");
const treeBuildLayer = document.getElementById("tree-build-layer");
const treeWorld = document.getElementById("tree-world");
const modal = document.getElementById("door-modal");
const modalKicker = document.getElementById("modal-kicker");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalLinks = document.getElementById("modal-links");
const modalPrimaryLink = document.getElementById("modal-primary-link");
const modalSecondaryLink = document.getElementById("modal-secondary-link");
const closeModalButton = document.getElementById("close-modal");
const knockForm = document.getElementById("knock-form");
const passphraseInput = document.getElementById("passphrase");
const knockHint = document.getElementById("knock-hint");

const SKY_SCALE = 2;
const SKY_IMG_W = 64;
const SKY_IMG_H = 304;
const SKY_ROWS = [
  { images: [5, 6, 7, 8], mode: "shuffle" },
  { images: [8, 7, 6, 5], mode: "shuffle" },
  { images: [5, 6, 7, 8], mode: "cycle" },
  { images: [8, 7, 6, 5], mode: "cycle" },
  { images: [4], mode: "tile" },
  { images: [3], mode: "tile" },
  { images: [2], mode: "tile" },
  { images: [1], mode: "tile" },
];

const roomById = new Map();
let activeRoomId = null;
let treefortConfig = {};
let pendingSkyRender = 0;
let DIALOG = {};

function skyImageUrl(n) {
  return `./assets/background/SKY-ATLAS${n}.jpeg`;
}

function seededShuffle(arr, seed) {
  const out = arr.slice();
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s + 0x6d2b79f5) | 0;
    let v = Math.imul(s ^ (s >>> 15), 1 | s);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    const j = ((v ^ (v >>> 14)) >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function renderSky() {
  if (!skyStack) {
    return;
  }

  skyStack.replaceChildren();
  const tileW = SKY_IMG_W * SKY_SCALE;
  const rowH = SKY_IMG_H * SKY_SCALE;
  const colCount = Math.max(4, Math.ceil(window.innerWidth / tileW) + 2);

  for (let r = 0; r < SKY_ROWS.length; r++) {
    const row = SKY_ROWS[r];
    const rowEl = document.createElement("div");
    rowEl.className = "sky-row";
    rowEl.style.height = `${rowH}px`;

    if (row.mode === "tile") {
      rowEl.style.backgroundImage = `url(${skyImageUrl(row.images[0])})`;
      rowEl.style.backgroundSize = `${tileW}px ${rowH}px`;
      rowEl.style.backgroundRepeat = "repeat-x";
    } else {
      const pattern = row.mode === "shuffle"
        ? seededShuffle(row.images, 31 + r * 97)
        : row.images;

      for (let c = 0; c < colCount; c++) {
        const imgN = pattern[c % pattern.length];
        const tile = document.createElement("div");
        tile.className = "sky-tile";
        tile.style.width = `${tileW}px`;
        tile.style.height = `${rowH}px`;
        tile.style.backgroundImage = `url(${skyImageUrl(imgN)})`;
        tile.style.backgroundSize = `${tileW}px ${rowH}px`;
        rowEl.appendChild(tile);
      }
    }

    skyStack.appendChild(rowEl);
  }
}

function scheduleSkyRender() {
  if (pendingSkyRender) {
    cancelAnimationFrame(pendingSkyRender);
  }

  pendingSkyRender = requestAnimationFrame(() => {
    pendingSkyRender = 0;
    renderSky();
  });
}

const TRUNK_SEGMENT_H = 240;
const BASE_H = 964;
let segmentCount = 0;

// Door slot config — pixel positions measured from 1024×240 segment sprite bounding boxes
const SLOT_CONFIG = {
  a: { x: 435, y: 157, w: 40, h: 44, xPixel: 453, floorOffset: 0 },
  b: { x: 495, y: 157, w: 40, h: 44, xPixel: 513, floorOffset: 0 },
  c: { x: 435, y:  39, w: 40, h: 44, xPixel: 453, floorOffset: 1 },
  d: { x: 495, y:  39, w: 40, h: 44, xPixel: 513, floorOffset: 1 },
};

function slotToFloor(segment, slot) {
  return segment * 2 + SLOT_CONFIG[slot].floorOffset;
}


function doorSpriteState(room) {
  const isPermanent = room.type === "permanent";
  if (room.status === "vacant" || room.status === "unclaimed") {
    return isPermanent ? "PermanentAvailable" : "Unclaimed";
  }
  const mode = room.access?.mode;
  if (mode === "knock") return isPermanent ? "PermanentKnock" : "Knock";
  if (mode === "lock") return isPermanent ? "PermanentLock" : "Lock";
  if (mode === "stalk") return isPermanent ? "PermanentStalk" : "Stalk";
  return isPermanent ? "PermanentAvailable" : "Unclaimed";
}

function renderTree() {
  if (!treeBuildLayer) {
    return;
  }

  treeBuildLayer.replaceChildren();

  function img(src, cls) {
    const el = document.createElement("img");
    el.src = src;
    el.className = `tree-part ${cls}`;
    el.draggable = false;
    el.alt = "";
    return el;
  }

  // Crown
  treeBuildLayer.appendChild(img("./assets/tree/top.png", "tree-crown"));

  // Trunk — three layers: UL (back), door sprites (middle), OL with platforms (front)
  const trunkWrap = document.createElement("div");
  trunkWrap.className = "tree-trunk-wrap";
  trunkWrap.style.height = `${segmentCount * TRUNK_SEGMENT_H}px`;

  const trunkBack = document.createElement("div");
  trunkBack.className = "tree-trunk-back";
  for (let i = 0; i < segmentCount; i++) {
    trunkBack.appendChild(img("./assets/tree/segment_UL.png", "tree-trunk-segment"));
  }

  const trunkDoors = document.createElement("div");
  trunkDoors.className = "tree-trunk-doors";
  trunkDoors.id = "tree-trunk-doors";
  // Door sprites are added later by renderDoorSprites()

  const trunkFront = document.createElement("div");
  trunkFront.className = "tree-trunk-front";
  for (let i = 0; i < segmentCount; i++) {
    trunkFront.appendChild(img("./assets/tree/segment_OL.png", "tree-trunk-segment"));
  }

  trunkWrap.appendChild(trunkBack);
  trunkWrap.appendChild(trunkDoors);
  trunkWrap.appendChild(trunkFront);
  createElevator(trunkWrap);
  treeBuildLayer.appendChild(trunkWrap);

  // Base — three layers stacked (underlay, island, overlay)
  const baseWrap = document.createElement("div");
  baseWrap.className = "tree-base-wrap";
  baseWrap.appendChild(img("./assets/tree/base1.png", "tree-base-layer"));
  baseWrap.appendChild(img("./assets/tree/base2.png", "tree-base-layer"));
  baseWrap.appendChild(img("./assets/tree/base3.png", "tree-base-layer"));

  // Sticker books on the grass
  const bookLayer = document.createElement("div");
  bookLayer.className = "tree-book-layer";
  bookLayer.id = "tree-book-layer";
  baseWrap.appendChild(bookLayer);

  treeBuildLayer.appendChild(baseWrap);
}

// ── Sticker Books at base of tree ─────────────

// ── Sticker book slot positions (hardcoded, 1024×964 base coords) ──
// 64 fixed slots on the grass. Do not reorder — removing a book leaves its slot empty.
//
// Row A (y=372): A1–A5 [trunk] A6–A9
// Row B (y=408): B1–B6 [trunk] B7–B11
// Row C (y=444): C1–C13
// Row D (y=480): D1–D13
// Row E (y=516): E1–E13
// Edge:          L1–L3 (left)  R1–R2 (right)
const BOOK_SLOTS = [
  /* A1 */[222,372], /* A2 */[270,372], /* A3 */[318,372], /* A4 */[366,372], /* A5 */[414,372],
  /* A6 */[654,372], /* A7 */[702,372], /* A8 */[750,372], /* A9 */[798,372],
  /* B1 */[222,408], /* B2 */[270,408], /* B3 */[318,408], /* B4 */[366,408], /* B5 */[414,408],
  /* B6 */[462,408], /* B7 */[606,408], /* B8 */[654,408], /* B9 */[702,408], /* B10*/[750,408],
  /* B11*/[798,408],
  /* C1 */[222,444], /* C2 */[270,444], /* C3 */[318,444], /* C4 */[366,444], /* C5 */[414,444],
  /* C6 */[462,444], /* C7 */[510,444], /* C8 */[558,444], /* C9 */[606,444], /* C10*/[654,444],
  /* C11*/[702,444], /* C12*/[750,444], /* C13*/[798,444],
  /* D1 */[222,480], /* D2 */[270,480], /* D3 */[318,480], /* D4 */[366,480], /* D5 */[414,480],
  /* D6 */[462,480], /* D7 */[510,480], /* D8 */[558,480], /* D9 */[606,480], /* D10*/[654,480],
  /* D11*/[702,480], /* D12*/[750,480], /* D13*/[798,480],
  /* E1 */[222,516], /* E2 */[270,516], /* E3 */[318,516], /* E4 */[366,516], /* E5 */[414,516],
  /* E6 */[462,516], /* E7 */[510,516], /* E8 */[558,516], /* E9 */[606,516], /* E10*/[654,516],
  /* E11*/[702,516], /* E12*/[750,516], /* E13*/[798,516],
  /* L1 */[174,408], /* L2 */[174,444], /* L3 */[174,480],
  /* R1 */[846,408], /* R2 */[846,444],
];

// Pseudo-random fill order (seed 42) — books scatter across the grass as they arrive
const BOOK_FILL_ORDER = [
  43,51,20,56,11,23,18,39,34,17,37,12,8,26,58,44,3,29,16,22,6,4,41,33,
  30,14,47,60,53,49,54,50,27,5,45,19,61,7,42,59,1,55,2,36,21,0,62,32,
  24,9,57,63,46,13,25,48,35,15,31,10,40,52,28,38,
];

function renderStickerBooks(stickerBooks) {
  const layer = document.getElementById("tree-book-layer");
  if (!layer) return;
  layer.replaceChildren();

  const books = stickerBooks || [];
  for (let i = 0; i < Math.min(books.length, BOOK_SLOTS.length); i++) {
    const book = books[i];
    const slotIdx = book.slot ?? i;
    const [sx, sy] = BOOK_SLOTS[slotIdx];

    const wrap = document.createElement("div");
    wrap.className = "sbook-slot";
    wrap.style.left = `${sx}px`;
    wrap.style.top = `${sy}px`;

    const label = document.createElement("p");
    label.className = "sbook-label";
    label.textContent = book.name;

    const icon = document.createElement("img");
    icon.className = "sbook-icon";
    icon.src = "./assets/tree/sbook.png";
    icon.alt = `${book.name}'s sticker book`;
    icon.draggable = false;

    wrap.appendChild(label);
    wrap.appendChild(icon);
    wrap.addEventListener("click", () => openStickerBook(book));
    layer.appendChild(wrap);
  }
}

// ── Sticker Book Viewer ──

let sbookPages = [];
let sbookIndex = 0;

function getStickerBookPages(data) {
  const pages = [];
  if (data.keyArt) {
    pages.push({ type: "key", label: "Key Art", dataUrl: data.keyArt });
  }
  const stickers = data.stickers || [];
  for (const s of stickers) {
    pages.push({ type: "snapshot", label: s.label, date: s.date, caption: s.caption, dataUrl: s.dataUrl });
  }
  if (pages.length === 0) {
    pages.push({ type: "empty", label: "Empty" });
  }
  return pages;
}

function renderSbookPage() {
  const pageEl = document.getElementById("sbook-viewer-page");
  const pageNum = document.getElementById("sbook-viewer-pagenum");
  const leftBtn = document.getElementById("sbook-viewer-left");
  const rightBtn = document.getElementById("sbook-viewer-right");
  if (!pageEl) return;

  if (sbookIndex < 0) sbookIndex = 0;
  if (sbookIndex >= sbookPages.length) sbookIndex = sbookPages.length - 1;
  const page = sbookPages[sbookIndex];

  pageEl.replaceChildren();

  if (page.type === "empty") {
    const p = document.createElement("p");
    p.className = "sbook-viewer__empty";
    p.textContent = "No stickers yet";
    pageEl.appendChild(p);
  } else {
    const img = document.createElement("img");
    img.src = page.dataUrl;
    img.alt = page.label || "Sticker";
    pageEl.appendChild(img);
    if (page.caption || page.date) {
      const line = document.createElement("p");
      line.className = "sbook-viewer__caption";
      const parts = [];
      if (page.caption) parts.push(page.caption);
      if (page.date) parts.push(page.date);
      line.textContent = parts.join("  ");
      pageEl.appendChild(line);
    }
  }

  const label = page.label || `${sbookIndex + 1} / ${sbookPages.length}`;
  if (pageNum) pageNum.textContent = label;
  if (leftBtn) leftBtn.disabled = sbookIndex === 0;
  if (rightBtn) rightBtn.disabled = sbookIndex >= sbookPages.length - 1;
}

async function openStickerBook(book) {
  const viewer = document.getElementById("sbook-viewer");
  const ownerEl = document.getElementById("sbook-viewer-owner");
  if (!viewer || !ownerEl) return;

  ownerEl.textContent = `${book.name}'s Sticker Book`;

  // Try to fetch full sticker book data
  try {
    const resp = await fetch(`./data/stickerbooks/${book.guestId}.json`);
    if (resp.ok) {
      const data = await resp.json();
      sbookPages = getStickerBookPages(data);
    } else {
      sbookPages = [{ type: "empty", label: "Empty" }];
    }
  } catch {
    sbookPages = [{ type: "empty", label: "Empty" }];
  }

  sbookIndex = 0;
  viewer.classList.remove("hidden");
  renderSbookPage();
}

function closeStickerBook() {
  const viewer = document.getElementById("sbook-viewer");
  if (viewer) viewer.classList.add("hidden");
  sbookPages = [];
  sbookIndex = 0;
}

document.getElementById("sbook-viewer-close")?.addEventListener("click", closeStickerBook);
document.getElementById("sbook-viewer-x")?.addEventListener("click", closeStickerBook);
document.getElementById("sbook-viewer-left")?.addEventListener("click", () => {
  sbookIndex--;
  renderSbookPage();
});
document.getElementById("sbook-viewer-right")?.addEventListener("click", () => {
  sbookIndex++;
  renderSbookPage();
});

function waitForTreeImages() {
  const images = treeBuildLayer.querySelectorAll("img");
  const promises = Array.from(images).map((img) => {
    if (img.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  });
  return Promise.all(promises);
}


const TREE_SCALE = 2;

function sizeWorld() {
  if (!treeBuildLayer || !treeWorld) {
    return;
  }

  const treeH = treeBuildLayer.scrollHeight * TREE_SCALE;
  treeWorld.style.height = `${treeH + window.innerHeight}px`;
}

function applyParallax() {
  if (!skyStack) {
    return;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) {
    return;
  }

  const fraction = window.scrollY / maxScroll;
  const skyH = skyStack.scrollHeight;
  const viewH = window.innerHeight;
  const travel = Math.max(0, skyH - viewH);

  skyStack.style.transform = `translateY(${-fraction * travel}px)`;
}

function modeLabel(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function guestLifecycle(room, rules) {
  if (room.type !== "guest" || room.status !== "occupied" || !room.moveInDate) {
    return null;
  }

  const moveIn = new Date(room.moveInDate + "T00:00:00");
  const now = new Date();
  const msLeft = (moveIn.getTime() + rules.stayDays * 86400000) - now.getTime();
  const hoursLeft = Math.max(0, Math.ceil(msLeft / 3600000));
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  const elapsed = Math.floor((now - moveIn) / 86400000);

  let phase = "active";
  if (msLeft <= 0) phase = "expired";
  else if (elapsed >= rules.exportDay - 1) phase = "export";
  else if (elapsed >= rules.readonlyDay - 1) phase = "readonly";
  else if (elapsed >= rules.warnDay - 1) phase = "warning";

  return { phase, day: elapsed, daysLeft, hoursLeft, msLeft };
}


function renderDoors(rooms, rules) {
  const trunkDoors = document.getElementById("tree-trunk-doors");
  if (!trunkDoors) return;
  trunkDoors.replaceChildren();
  doorField.querySelectorAll(".tree-message").forEach((n) => n.remove());
  roomById.clear();

  // Create one segment wrap per segment
  const segWraps = [];
  for (let s = 0; s < segmentCount; s++) {
    const segWrap = document.createElement("div");
    segWrap.className = "door-segment-wrap";
    trunkDoors.appendChild(segWrap);
    segWraps.push(segWrap);
  }

  rooms.forEach((room) => {
    if (room.segment == null || !room.slot) return;
    if (room.type === "guest" && !room.href) {
      room.href = `./room/?guest=${room.id}`;
    }
    roomById.set(room.id, room);

    const visualSeg = (segmentCount - 1) - room.segment;
    const wrap = segWraps[visualSeg];
    if (!wrap) return;

    const slot = SLOT_CONFIG[room.slot];
    const floor = slotToFloor(room.segment, room.slot);

    // Door sprite
    const state = doorSpriteState(room);
    const sprite = document.createElement("img");
    sprite.src = `./assets/tree/doors/${room.slot}${state}.png`;
    sprite.className = "door-sprite";
    sprite.draggable = false;
    sprite.alt = "";
    wrap.appendChild(sprite);

    // Hitbox button — exact pixel position from sprite bbox
    const isVacant = room.status === "vacant";
    const isUnclaimed = room.status === "unclaimed";
    const lifecycle = guestLifecycle(room, rules);
    const isExpired = lifecycle && lifecycle.phase === "expired";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "door";
    button.dataset.roomId = room.id;
    button.dataset.floor = String(floor);
    button.style.position = "absolute";
    button.style.left = `${slot.x}px`;
    button.style.top = `${slot.y}px`;
    button.style.width = `${slot.w}px`;
    button.style.height = `${slot.h}px`;

    if (isVacant || isUnclaimed) {
      button.setAttribute("aria-label", isVacant ? "Vacant guest room" : "Unclaimed room");
      button.addEventListener("click", () => {
        elevVisitDoorThenDialog(room);
      });
    } else if (isExpired) {
      button.disabled = true;
      button.setAttribute("aria-label", `${room.name}, expired`);
    } else {
      button.setAttribute("aria-label", `${room.name}, ${modeLabel(room.access?.mode || "open")}`);
      button.addEventListener("click", () => {
        elevVisitDoor(room);
      });
    }

    // Label
    if (room.name) {
      const possessiveMatch = room.name.match(/^(.+?)['']s\s+Room$/i);
      const labelHTML = possessiveMatch
        ? `${possessiveMatch[1]}'s<br>Room`
        : room.name;
      button.innerHTML = `<span class="door-label">${labelHTML}</span>`;
    } else if (isVacant) {
      button.innerHTML = `<span class="door-label door-label--vacant">Room<br>Available</span>`;
    } else if (isUnclaimed) {
      button.innerHTML = `<span class="door-label door-label--vacant">Unclaimed</span>`;
    }

    wrap.appendChild(button);
  });
}

function renderTreeMessage(message) {
  doorField.querySelectorAll(".door, .tree-message, .door-sprite").forEach((node) => node.remove());
  const messageNode = document.createElement("p");
  messageNode.className = "tree-message";
  messageNode.textContent = message;
  doorField.appendChild(messageNode);
}

function resolveDiscordUnlockUrl(roomId) {
  const unlockUrlBase = treefortConfig.gateways?.discord?.unlockUrlBase;
  if (!unlockUrlBase) {
    return null;
  }

  const url = new URL(unlockUrlBase, window.location.href);
  url.searchParams.set("door", roomId);
  return url.toString();
}

function handleDoorAction(roomId) {
  const room = roomById.get(roomId);
  if (!room) {
    return;
  }

  if (room.access.mode === "stalk") {
    sessionStorage.setItem("treefort-last-door", roomId);
    window.location.href = room.href;
    return;
  }

  if (room.access.mode === "lock") {
    showGumDialog({
      frames: GUM_HAPPY,
      text: DIALOG["hub-lock"]?.text || "This room is locked.",
      actions: [{ label: DIALOG["hub-lock"]?.actions?.[0] || "Okay!", onClick: hideGumDialog }],
    });
    return;
  }

  if (room.access.mode === "discord") {
    const unlockHref = resolveDiscordUnlockUrl(room.id);
    const roleNote = room.access.requiredRoleLabel
      ? ` This door expects the ${room.access.requiredRoleLabel} role.`
      : "";

    showModal({
      kicker: "Discord gate",
      title: room.name,
      message: unlockHref
        ? `This door opens from the tree only after Discord confirms membership in ${room.access.serverLabel}.${roleNote}`
        : `This door is configured for Discord verification through ${room.access.serverLabel}, but the unlock service is not configured yet.${roleNote}`,
      showKnock: false,
      primaryLink: unlockHref
        ? {
            href: unlockHref,
            label: treefortConfig.gateways?.discord?.authLabel || "Verify with Discord",
          }
        : {
            href: room.access.inviteUrl,
            label: `Join ${room.access.serverLabel}`,
          },
      secondaryLink: unlockHref
        ? {
            href: room.access.inviteUrl,
            label: `Join ${room.access.serverLabel}`,
          }
        : null,
    });
    return;
  }

  showGumDialog({
    frames: GUM_HAPPY,
    text: DIALOG["hub-knock"]?.text || "Enter the password.",
    actions: [{
      label: DIALOG["hub-knock"]?.actions?.[0] || "I know it!",
      onClick: () => {
        hideGumDialog();
        showModal({
          kicker: "Knock knock",
          title: room.name,
          message: room.access.encryptedHref
            ? "Type the secret word to open the door."
            : "Type the secret word to open the door.",
          showKnock: true,
          hint: room.access.hint || "",
        });
      },
    }, {
      label: DIALOG["hub-knock"]?.actions?.[1] || "Never mind",
      onClick: hideGumDialog,
    }],
  });
}

async function sha256Hex(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function decryptString(encoded, passphrase) {
  const blob = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = blob.slice(0, 16);
  const iv = blob.slice(16, 28);
  const ciphertext = blob.slice(28);
  const key = await deriveKey(passphrase, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintext);
}

function applyModalLink(node, link) {
  if (!link) {
    node.classList.add("hidden");
    node.removeAttribute("href");
    node.textContent = "";
    return;
  }

  node.href = link.href;
  node.textContent = link.label;
  node.classList.remove("hidden");
}

function showModal({ kicker, title, message, showKnock, hint = "", primaryLink = null, secondaryLink = null }) {
  modalKicker.textContent = kicker;
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  knockForm.classList.toggle("hidden", !showKnock);
  knockHint.textContent = hint;
  applyModalLink(modalPrimaryLink, showKnock ? null : primaryLink);
  applyModalLink(modalSecondaryLink, showKnock ? null : secondaryLink);
  modalLinks.classList.toggle("hidden", showKnock || (!primaryLink && !secondaryLink));
  passphraseInput.value = "";
  if (showKnock) {
    passphraseInput.focus();
  } else {
    closeModalButton.focus();
  }
}

function hideModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalLinks.classList.add("hidden");
  applyModalLink(modalPrimaryLink, null);
  applyModalLink(modalSecondaryLink, null);
}

closeModalButton.addEventListener("click", hideModal);
modal.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    hideModal();
  }
});

knockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const room = roomById.get(activeRoomId);
  if (!room || room.access.mode !== "knock") {
    return;
  }

  const passphrase = passphraseInput.value.trim().toLowerCase();
  const hash = await sha256Hex(passphrase);

  // Level 2: encrypted href — the URL itself is the secret
  if (room.access.encryptedHref) {
    try {
      const href = await decryptString(room.access.encryptedHref, passphrase);
      sessionStorage.setItem("treefort-guest-auth", JSON.stringify({ guestId: room.id, passphraseHash: hash }));
      sessionStorage.setItem("treefort-last-door", room.id);
      window.location.href = href;
      return;
    } catch {
      modalMessage.textContent = DIALOG["hub-wrong-passphrase"]?.text || "Wrong passphrase.";
      return;
    }
  }

  // Level 1 fallback: hash compare with plaintext href
  if (hash === room.access.passphraseHash) {
    sessionStorage.setItem("treefort-guest-auth", JSON.stringify({ guestId: room.id, passphraseHash: hash }));
    sessionStorage.setItem("treefort-last-door", room.id);
    window.location.href = room.href;
    return;
  }

  modalMessage.textContent = DIALOG["hub-wrong-passphrase"]?.text || "Wrong passphrase.";
});

function treefortManifestUrl() {
  const url = new URL("./data/treefort.json", window.location.href);
  url.searchParams.set("ts", String(Date.now()));
  return url.toString();
}

async function loadTreefort() {
  const response = await fetch(treefortManifestUrl(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Treefort manifest load failed with ${response.status}`);
  }

  return response.json();
}

function applyTreefortCopy(treefort) {
  treefortConfig = treefort;
}

function scrollToWorldBase() {
  if (!treeWorld) {
    return;
  }

  const worldBase = Math.max(0, treeWorld.offsetTop + treeWorld.offsetHeight - window.innerHeight);
  window.scrollTo(0, worldBase);
}

function primeWorldStartPosition() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  // Don't pre-snap if returning from a room — init will handle scroll
  if (window.location.hash.startsWith("#from=") || sessionStorage.getItem("treefort-last-door")) return;

  let snapped = false;
  const snapToBase = () => {
    if (snapped) {
      return;
    }

    snapped = true;
    scrollToWorldBase();
  };

  requestAnimationFrame(() => requestAnimationFrame(snapToBase));
  window.addEventListener("load", snapToBase, { once: true });
}

let cachedManifest = null;
let elevatorAssetsPromise = Promise.resolve();
let elevatorAssetsReady = false;

async function refreshTreefortIfChanged() {
  if (document.hidden) {
    return;
  }

  try {
    const manifest = await loadTreefort();
    const previous = cachedManifest ? JSON.stringify(cachedManifest) : "";
    const next = JSON.stringify(manifest);
    if (previous && previous !== next) {
      window.location.reload();
    }
  } catch (error) {
    console.warn("Treefort refresh skipped:", error);
  }
}


// ── Elevator ──
// States: idle (in elevator), riding (moving vertically), walking (on a floor)
// Gum is a 27×37 cropped sprite positioned independently from the 1024×240 box sprites.

const ELEV_FRAME_MS = 1000 / 12;
const ELEV_SPEED = 384;
const GUM_WALK_SPEED = 160;
const GUM_HOME_X = 577;
const GUM_W = 27;
const GUM_H = 37;
const ROPE_TOP_OFFSET = 55;
const ELEVATOR_BOX_SPRITES = [
  "elevatorAB_UL",
  "elevatorAB_OL",
  "elevatorCD_UL",
  "elevatorCD_OL",
  "elevator_ropeExtension",
];
const ELEVATOR_GUM_SPRITES = [
  "arrive",
  "atDoor",
  "eyesUp",
  "eyesDown",
  "walk01",
  "walk02",
  "walk03",
  "walk04",
];

let elev = {
  y: 0, targetY: 0, floor: 0, _targetFloor: 0,
  state: "idle", dir: 0, facingRight: false,
  gumX: GUM_HOME_X, targetX: GUM_HOME_X,
  walkIdx: 0, walkAcc: 0,
  lastT: 0, scrollDriven: true,
  _queuedFloor: null, _pendingDoor: null, _pendingDialog: null,
};
let elevEls = {};

function elevTotalFloors() { return segmentCount * 2; }

function elevFloorY(f) {
  const seg = f >> 1, isCD = f & 1;
  const vs = (segmentCount - 1) - seg;
  return vs * TRUNK_SEGMENT_H + (isCD ? 82 : 200);
}

function elevFloorPrefix(f) { return (f & 1) ? "CD" : "AB"; }

function elevSrc(name) { return `./assets/tree/elevator/${name}.png`; }
function gumSrc(name) { return `./assets/tree/elevator/gum/${name}.png`; }

function preloadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;

  if (image.complete) {
    if (typeof image.decode === "function") {
      return image.decode().catch(() => {});
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    image.addEventListener("load", () => {
      if (typeof image.decode === "function") {
        image.decode().catch(() => {}).finally(resolve);
      } else {
        resolve();
      }
    }, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

function preloadElevatorAssets() {
  const sources = [
    ...ELEVATOR_BOX_SPRITES.map((name) => elevSrc(name)),
    ...ELEVATOR_GUM_SPRITES.map((name) => gumSrc(name)),
  ];

  return Promise.all(sources.map(preloadImage)).then(() => {
    elevatorAssetsReady = true;
    if (elevEls.layer) {
      elevEls.layer.style.visibility = "visible";
    }
  });
}

function elevFloorStops() {
  return [
    { x: SLOT_CONFIG.a.xPixel },  // 453
    { x: SLOT_CONFIG.b.xPixel },  // 513
    { x: GUM_HOME_X },            // elevator home
  ];
}

function elevNearestDoor(floor, gumX) {
  const seg = floor >> 1;
  const slots = (floor & 1) ? ["c", "d"] : ["a", "b"];
  let best = null, bestDist = Infinity;
  for (const slot of slots) {
    const dx = Math.abs(SLOT_CONFIG[slot].xPixel - gumX);
    if (dx < bestDist) { bestDist = dx; best = { slot, seg }; }
  }
  if (best && bestDist < 20) {
    for (const [, room] of roomById) {
      if (room.segment === best.seg && room.slot === best.slot) return room;
    }
  }
  return null;
}

function createElevator(trunkWrap) {
  const layer = document.createElement("div");
  layer.className = "elevator-layer";
  layer.style.visibility = "hidden";

  const rope = document.createElement("div");
  rope.className = "elevator-rope";

  const makeBox = (src, cls) => {
    const img = document.createElement("img");
    img.src = elevSrc(src);
    img.className = `elevator-sprite ${cls}`;
    img.draggable = false;
    img.alt = "";
    return img;
  };

  const ul = makeBox("elevatorAB_UL", "elevator-box-ul");
  const ol = makeBox("elevatorAB_OL", "elevator-box-ol");

  const gum = document.createElement("img");
  gum.src = gumSrc("arrive");
  gum.className = "elevator-gum";
  gum.draggable = false;
  gum.alt = "Gum";

  // Clickable cage hitbox — narrow div over just the elevator cage
  const cageHit = document.createElement("div");
  cageHit.style.cssText = "position:absolute;width:60px;height:80px;cursor:pointer;pointer-events:auto;z-index:5;";
  cageHit.addEventListener("click", () => {
    if (elev.state === "idle" && Math.abs(elev.gumX - GUM_HOME_X) > 2) {
      elev.scrollDriven = false;
      elev._pendingDoor = null;
      elev._pendingDialog = null;
      elev.targetX = GUM_HOME_X;
      elev.state = "walking";
      elev.walkIdx = 0;
      elev.walkAcc = 0;
    }
  });

  layer.append(rope, ul, gum, ol, cageHit);
  trunkWrap.appendChild(layer);

  elevEls = { layer, rope, ul, gum, ol, cageHit };
  elevatorAssetsReady = false;
  elevatorAssetsPromise = preloadElevatorAssets();

  elev.floor = 0;
  elev._targetFloor = 0;
  elev._lastPrefix = "AB";
  elev.y = elev.targetY = elevFloorY(0);
  elev.gumX = GUM_HOME_X;
  elev.targetX = GUM_HOME_X;
  elevPosition();
}

function elevPosition() {
  const y = Math.round(elev.y);

  // Box sprites — use target floor prefix during rides to prevent flash on arrival
  const displayFloor = elev.state === "riding" ? elev._targetFloor : elev.floor;
  const p = elevFloorPrefix(displayFloor);
  const platformPx = (displayFloor & 1) ? 82 : 200;
  const boxTop = y - platformPx;
  elevEls.ul.style.top = elevEls.ol.style.top = `${boxTop}px`;
  if (elev._lastPrefix !== p) {
    elev._lastPrefix = p;
    elevEls.ul.src = elevSrc(`elevator${p}_UL`);
    elevEls.ol.src = elevSrc(`elevator${p}_OL`);
  }

  // Gum (27×37) — feet at platform Y + 2px nudge, centered on gumX
  elevEls.gum.style.top = `${y - GUM_H + 2}px`;
  elevEls.gum.style.left = `${Math.round(elev.gumX - GUM_W / 2)}px`;
  elevEls.gum.style.transform = elev.facingRight ? "scaleX(-1)" : "";

  // Cage hitbox — centered on elevator home position
  elevEls.cageHit.style.top = `${y - platformPx + 80}px`;
  elevEls.cageHit.style.left = `${GUM_HOME_X - 30}px`;

  // Rope
  elevEls.rope.style.height = `${Math.max(0, y - ROPE_TOP_OFFSET)}px`;
}

function elevSetGum(name) { elevEls.gum.src = gumSrc(name); }

function elevGoTo(floor) {
  floor = Math.max(0, Math.min(elevTotalFloors() - 1, floor));

  if (Math.abs(elev.gumX - GUM_HOME_X) > 2) {
    elev.targetX = GUM_HOME_X;
    elev.state = "walking";
    elev._queuedFloor = floor;
    elev.scrollDriven = false;
    return;
  }

  const effective = elev.state === "riding" ? elev._targetFloor : elev.floor;
  if (floor === effective) return;

  elev._targetFloor = floor;
  elev.targetY = elevFloorY(floor);
  elev.facingRight = false;
  if (Math.abs(elev.targetY - elev.y) < 1) {
    elev.y = elev.targetY;
    elev.floor = floor;
    elev.state = "idle";
    elevSetGum("arrive");
    elevPosition();
    return;
  }
  elev.state = "riding";
  elev.dir = elev.targetY > elev.y ? 1 : -1;
  elevSetGum(elev.dir < 0 ? "eyesUp" : "eyesDown");
}

function elevWalk(dir) {
  if (elev.state === "riding") return;
  elev.scrollDriven = false;
  elev._queuedFloor = null;
  elev._pendingDoor = null;
  elev._pendingDialog = null;

  const stops = elevFloorStops();
  let newTarget = null;
  if (dir < 0) {
    for (let i = stops.length - 1; i >= 0; i--) {
      if (stops[i].x < elev.gumX - 2) { newTarget = stops[i].x; break; }
    }
  } else {
    for (let i = 0; i < stops.length; i++) {
      if (stops[i].x > elev.gumX + 2) { newTarget = stops[i].x; break; }
    }
  }
  if (newTarget == null) return;
  elev.targetX = newTarget;
  elev.state = "walking";
  elev.walkIdx = 0;
  elev.walkAcc = 0;
}

function elevTick(now) {
  if (!elev.lastT) elev.lastT = now;
  const dt = Math.min((now - elev.lastT) / 1000, 0.1);
  elev.lastT = now;

  if (elev.state === "riding") {
    const dist = Math.abs(elev.targetY - elev.y);
    const step = ELEV_SPEED * dt;
    if (dist <= step) {
      elev.y = elev.targetY;
      elev.floor = elev._targetFloor;
      elev.state = "idle";
      elev.dir = 0;
      elevSetGum("arrive");
      // After arriving at a floor, walk to pending door/dialog if set
      const pending = elev._pendingDoor || elev._pendingDialog;
      if (pending) {
        const doorX = SLOT_CONFIG[pending.slot].xPixel;
        elev.targetX = doorX;
        elev.state = "walking";
        elev.walkIdx = 0;
        elev.walkAcc = 0;
      }
    } else {
      elev.y += elev.dir * step;
    }
    elevPosition();
  } else if (elev.state === "walking") {
    const dist = Math.abs(elev.targetX - elev.gumX);
    const step = GUM_WALK_SPEED * dt;
    if (dist <= step) {
      elev.gumX = elev.targetX;
      elev.state = "idle";
      const atHome = Math.abs(elev.gumX - GUM_HOME_X) < 2;
      if (atHome) elev.facingRight = false;
      elevSetGum(atHome ? "arrive" : "atDoor");
      // Pending door: fire action now that Gum is at the door
      if (elev._pendingDoor && !atHome) {
        const pd = elev._pendingDoor;
        elev._pendingDoor = null;
        activeRoomId = pd.id;
        handleDoorAction(pd.id);
      }
      // Pending dialog: show vacant dialog now that Gum is at the door
      if (elev._pendingDialog && !atHome) {
        elev._pendingDialog = null;
        showVacantRoomDialog();
      }
      if (elev._queuedFloor != null && atHome) {
        const qf = elev._queuedFloor;
        elev._queuedFloor = null;
        elevGoTo(qf);
      }
    } else {
      const walkDir = elev.targetX > elev.gumX ? 1 : -1;
      elev.facingRight = walkDir > 0;
      elev.gumX = walkDir > 0
        ? Math.min(elev.gumX + step, elev.targetX)
        : Math.max(elev.gumX - step, elev.targetX);
      elev.walkAcc += dt * 1000;
      if (elev.walkAcc >= ELEV_FRAME_MS) {
        elev.walkAcc -= ELEV_FRAME_MS;
        elev.walkIdx = (elev.walkIdx + 1) % 4;
      }
      elevSetGum(`walk0${elev.walkIdx + 1}`);
    }
    elevPosition();
  }

  requestAnimationFrame(elevTick);
}

function elevScrollUpdate() {
  if (!elev.scrollDriven || !treeWorld) return;
  const tw = treeBuildLayer.querySelector(".tree-trunk-wrap");
  if (!tw) return;
  const tr = tw.getBoundingClientRect();
  const rel = (window.innerHeight / 2 - tr.top) / tr.height;
  const f = Math.round((1 - rel) * (elevTotalFloors() - 1));
  const clamped = Math.max(0, Math.min(elevTotalFloors() - 1, f));
  const effective = elev.state === "riding" ? elev._targetFloor : elev.floor;
  if (clamped !== effective) {
    elev._targetFloor = clamped;
    elev.targetY = elevFloorY(clamped);
    elev.state = "riding";
    elev.dir = elev.targetY > elev.y ? 1 : -1;
    elevSetGum(elev.dir < 0 ? "eyesUp" : "eyesDown");
  }
}

// Walk Gum to a specific door, then fire the action on arrival
function elevVisitDoor(room) {
  if (!room) return;
  const floor = slotToFloor(room.segment, room.slot);
  const doorX = SLOT_CONFIG[room.slot].xPixel;

  elev.scrollDriven = false;
  elev._pendingDoor = room;

  // Already at the door? Fire immediately.
  if (elev.floor === floor && Math.abs(elev.gumX - doorX) < 2 && elev.state === "idle") {
    elevSetGum("atDoor");
    activeRoomId = room.id;
    handleDoorAction(room.id);
    elev._pendingDoor = null;
    return;
  }

  // Need to ride to the floor first?
  if (elev.floor !== floor && elev.state !== "riding") {
    // Walk home first if away, then ride, then walk to door
    elev._queuedFloor = floor;
    if (Math.abs(elev.gumX - GUM_HOME_X) > 2) {
      elev.targetX = GUM_HOME_X;
      elev.state = "walking";
      elev.walkIdx = 0;
      elev.walkAcc = 0;
    } else {
      elevGoTo(floor);
    }
    return;
  }

  // On the right floor — walk to the door
  if (elev.state !== "riding") {
    elev.targetX = doorX;
    elev.state = "walking";
    elev.walkIdx = 0;
    elev.walkAcc = 0;
  }
}

// Walk Gum to a vacant door, then show dialog instead of handleDoorAction
function elevVisitDoorThenDialog(room) {
  if (!room) return;
  const floor = slotToFloor(room.segment, room.slot);
  const doorX = SLOT_CONFIG[room.slot].xPixel;

  elev.scrollDriven = false;
  elev._pendingDoor = null;
  elev._pendingDialog = room;

  // Already at the door?
  if (elev.floor === floor && Math.abs(elev.gumX - doorX) < 2 && elev.state === "idle") {
    elevSetGum("atDoor");
    elev._pendingDialog = null;
    showVacantRoomDialog();
    return;
  }

  // Need to ride first?
  if (elev.floor !== floor && elev.state !== "riding") {
    elev._queuedFloor = floor;
    if (Math.abs(elev.gumX - GUM_HOME_X) > 2) {
      elev.targetX = GUM_HOME_X;
      elev.state = "walking";
      elev.walkIdx = 0;
      elev.walkAcc = 0;
    } else {
      elevGoTo(floor);
    }
    return;
  }

  // On the right floor — walk to the door
  if (elev.state !== "riding") {
    elev.targetX = doorX;
    elev.state = "walking";
    elev.walkIdx = 0;
    elev.walkAcc = 0;
  }
}

function elevActivateDoor() {
  const room = elevNearestDoor(elev.floor, elev.gumX);
  if (!room) return;
  if (room.status === "vacant" || room.status === "unclaimed") {
    showVacantRoomDialog();
    return;
  }
  const rules = cachedManifest?.treefort?.guestRules;
  if (rules) {
    const lc = guestLifecycle(room, rules);
    if (lc && lc.phase === "expired") return;
  }
  activeRoomId = room.id;
  handleDoorAction(room.id);
}

// ── Gum Dialog ──

const gumDialog = document.getElementById("gum-dialog");
const gumDialogPortrait = document.getElementById("gum-dialog-portrait");
const gumDialogText = document.getElementById("gum-dialog-text");
const gumDialogActions = document.getElementById("gum-dialog-actions");

const GUM_HAPPY = [
  "./assets/characters/gumDialA01.png",
  "./assets/characters/gumDialA02.png",
];
const GUM_SAD = [
  "./assets/characters/gumDialB01.png",
  "./assets/characters/gumDialB02.png",
];

// Preload dialog portraits
[...GUM_HAPPY, ...GUM_SAD].forEach(src => { new Image().src = src; });

let _gumDialogTimer = null;

function showGumDialog({ frames, text, actions }) {
  gumDialogText.textContent = text;
  gumDialogActions.replaceChildren();

  actions.forEach(({ label, onClick }) => {
    const btn = document.createElement("button");
    btn.className = "gum-dialog__btn";
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    gumDialogActions.appendChild(btn);
  });

  // Start 2-frame talking animation
  let frameIdx = 0;
  gumDialogPortrait.src = frames[0];
  clearInterval(_gumDialogTimer);
  _gumDialogTimer = setInterval(() => {
    frameIdx = (frameIdx + 1) % frames.length;
    gumDialogPortrait.src = frames[frameIdx];
  }, 260);

  gumDialog.classList.remove("hidden");
}

function hideGumDialog() {
  gumDialog.classList.add("hidden");
  clearInterval(_gumDialogTimer);
  _gumDialogTimer = null;
}

// Close on backdrop click
gumDialog.querySelector(".gum-dialog__backdrop").addEventListener("click", hideGumDialog);

function showVacantRoomDialog() {
  showGumDialog({
    frames: GUM_SAD,
    text: DIALOG["hub-vacant-1"]?.text || "This room is vacant.",
    actions: [{
      label: DIALOG["hub-vacant-1"]?.actions?.[0] || "Where's my room?",
      onClick: () => {
        showGumDialog({
          frames: GUM_HAPPY,
          text: DIALOG["hub-vacant-2"]?.text || "Let's go find it!",
          actions: [{
            label: DIALOG["hub-vacant-2"]?.actions?.[0] || "Okay",
            onClick: hideGumDialog,
          }],
        });
      },
    }],
  });
}

// ── Input handlers ──

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!gumDialog.classList.contains("hidden")) { hideGumDialog(); return; }
    if (!modal.classList.contains("hidden")) { hideModal(); return; }
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    elev.scrollDriven = false;
    const base = elev.state === "riding" ? elev._targetFloor : elev.floor;
    elevGoTo(base + 1);
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    elev.scrollDriven = false;
    const base = elev.state === "riding" ? elev._targetFloor : elev.floor;
    elevGoTo(base - 1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    elev.scrollDriven = false;
    elevWalk(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    elev.scrollDriven = false;
    elevWalk(1);
  }
  if (event.key === "Enter" && modal.classList.contains("hidden")) {
    event.preventDefault();
    elevActivateDoor();
  }
});

function parseReturnDoor() {
  // Priority 1: explicit #from= hash (set by room back buttons)
  const hash = window.location.hash;
  if (hash.startsWith("#from=")) {
    const id = decodeURIComponent(hash.slice(6));
    const room = roomById.get(id);
    if (room) return room;
  }
  // Priority 2: sessionStorage (set before navigating to any room)
  const lastDoor = sessionStorage.getItem("treefort-last-door");
  if (lastDoor) {
    sessionStorage.removeItem("treefort-last-door");
    return roomById.get(lastDoor) || null;
  }
  return null;
}

function returnToDoor(room) {
  const floor = slotToFloor(room.segment, room.slot);
  const doorX = SLOT_CONFIG[room.slot].xPixel;

  // Position Gum at the door
  elev.floor = floor;
  elev._targetFloor = floor;
  elev.y = elev.targetY = elevFloorY(floor);
  elev.gumX = doorX;
  elev.targetX = doorX;
  elev.state = "idle";
  elev.scrollDriven = false;
  elev._lastPrefix = null;
  elevSetGum("atDoor");
  elevPosition();

  // Scroll so the door is centered on screen.
  // Tree is scaled 2× from bottom center, anchored at bottom of tree-world.
  // Distance from bottom of treeBuildLayer (pre-scale):
  const crown = treeBuildLayer.querySelector(".tree-crown");
  const crownH = crown ? crown.offsetHeight : 0;
  const doorFromTop = crownH + elev.y;
  const doorFromBottom = treeBuildLayer.scrollHeight - doorFromTop;
  // After 2× scale, distance from bottom doubles
  const scaledFromBottom = doorFromBottom * TREE_SCALE;
  // The tree bottom aligns with the bottom of tree-world
  const worldH = treeWorld.offsetHeight;
  const doorInWorld = worldH - scaledFromBottom;
  // Scroll so that point is at the vertical center of the viewport
  const scrollTarget = Math.max(0, treeWorld.offsetTop + doorInWorld - window.innerHeight / 2);
  window.scrollTo(0, scrollTarget);
}

// ── Init ──

async function init() {
  try {
    const dlgResp = await fetch("./room/data/dialog.json");
    if (dlgResp.ok) DIALOG = await dlgResp.json();
  } catch {}

  renderTreeMessage(DIALOG["hub-loading"]?.text || "Loading doors...");

  try {
    const manifest = await loadTreefort();
    cachedManifest = manifest;

    // Resident / solo instances skip the tree — go straight to the room
    if (manifest.instance === "resident" || manifest.instance === "solo") {
      window.location.replace("./room/");
      return;
    }

    segmentCount = manifest.doors.reduce((max, d) => Math.max(max, (d.segment ?? 0) + 1), 0);
    renderSky();
    renderTree();
    applyTreefortCopy(manifest.treefort);
    await Promise.all([waitForTreeImages(), elevatorAssetsPromise]);
    sizeWorld();
    renderDoors(manifest.doors, manifest.treefort.guestRules);
    renderStickerBooks(manifest.stickerBooks);

    // Check if returning from a room
    const fromRoom = parseReturnDoor();
    if (fromRoom) {
      returnToDoor(fromRoom);
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    } else {
      scrollToWorldBase();
    }

    requestAnimationFrame(elevTick);
  } catch (error) {
    console.error(error);
    renderTreeMessage(DIALOG["hub-error"]?.text || "Treefort data failed to load. Serve this folder over HTTP.");
  }
}

window.addEventListener("resize", () => {
  scheduleSkyRender();
  sizeWorld();
});

window.addEventListener("focus", () => {
  void refreshTreefortIfChanged();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    void refreshTreefortIfChanged();
  }
});

window.addEventListener("scroll", () => {
  applyParallax();
  // Don't hijack keyboard-initiated rides
  if (!elev.scrollDriven && elev.state === "riding") return;
  elev.scrollDriven = true;

  // If Gum is away from elevator, walk back first
  if (Math.abs(elev.gumX - GUM_HOME_X) > 2) {
    // Calculate and queue the scroll target floor
    const tw = treeBuildLayer.querySelector(".tree-trunk-wrap");
    if (tw) {
      const tr = tw.getBoundingClientRect();
      const rel = (window.innerHeight / 2 - tr.top) / tr.height;
      const f = Math.round((1 - rel) * (elevTotalFloors() - 1));
      elev._queuedFloor = Math.max(0, Math.min(elevTotalFloors() - 1, f));
    }
    elev.targetX = GUM_HOME_X;
    if (elev.state !== "walking") {
      elev.state = "walking";
      elev.walkIdx = 0;
      elev.walkAcc = 0;
    }
    return;
  }

  // Gum is in the elevator — scroll drives normally
  elev._queuedFloor = null;
  elev.facingRight = false;
  if (elev.state === "walking") {
    elev.state = "idle";
    elevSetGum("arrive");
  }
  elevScrollUpdate();
}, { passive: true });

primeWorldStartPosition();
init();
