const heroTitle = document.getElementById("hero-title");
const heroLede = document.getElementById("hero-lede");
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

const TRUNK_REPEATS = 6;
const TRUNK_SEGMENT_H = 240;
const BASE_H = 964;
const TRUNK_INNER_LEFT = 0.35;
const TRUNK_INNER_RIGHT = 0.65;

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

  // Trunk — two layers overlaid (UL behind character, OL in front)
  const trunkWrap = document.createElement("div");
  trunkWrap.className = "tree-trunk-wrap";
  trunkWrap.style.height = `${TRUNK_REPEATS * TRUNK_SEGMENT_H}px`;

  const trunkBack = document.createElement("div");
  trunkBack.className = "tree-trunk-back";
  for (let i = 0; i < TRUNK_REPEATS; i++) {
    trunkBack.appendChild(img("./assets/tree/segment_UL.png", "tree-trunk-segment"));
  }

  const trunkFront = document.createElement("div");
  trunkFront.className = "tree-trunk-front";
  for (let i = 0; i < TRUNK_REPEATS; i++) {
    trunkFront.appendChild(img("./assets/tree/segment_OL.png", "tree-trunk-segment"));
  }

  trunkWrap.appendChild(trunkBack);
  trunkWrap.appendChild(trunkFront);
  treeBuildLayer.appendChild(trunkWrap);

  // Base — three layers stacked (underlay, island, overlay)
  const baseWrap = document.createElement("div");
  baseWrap.className = "tree-base-wrap";
  baseWrap.appendChild(img("./assets/tree/base1.png", "tree-base-layer"));
  baseWrap.appendChild(img("./assets/tree/base2.png", "tree-base-layer"));
  baseWrap.appendChild(img("./assets/tree/base3.png", "tree-base-layer"));
  treeBuildLayer.appendChild(baseWrap);
}

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

function positionDoorField() {
  const trunkWrap = treeBuildLayer.querySelector(".tree-trunk-wrap");
  if (!trunkWrap) {
    return;
  }

  const worldRect = treeWorld.getBoundingClientRect();
  const trunkRect = trunkWrap.getBoundingClientRect();

  const innerLeft = trunkRect.left + trunkRect.width * TRUNK_INNER_LEFT;
  const innerWidth = trunkRect.width * (TRUNK_INNER_RIGHT - TRUNK_INNER_LEFT);

  doorField.style.top = `${trunkRect.top - worldRect.top}px`;
  doorField.style.left = `${innerLeft - worldRect.left}px`;
  doorField.style.width = `${innerWidth}px`;
  doorField.style.height = `${trunkRect.height}px`;
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

function formatCountdown(lifecycle) {
  if (!lifecycle || lifecycle.phase === "active") {
    return null;
  }

  if (lifecycle.phase === "expired") {
    return "Expired";
  }

  if (lifecycle.daysLeft <= 1) {
    return `${lifecycle.hoursLeft}h left`;
  }

  return `${lifecycle.daysLeft}d left`;
}

function renderDoors(rooms, rules) {
  doorField.querySelectorAll(".door, .tree-message, .floor-platform").forEach((node) => node.remove());
  roomById.clear();

  const floorCount = TRUNK_REPEATS;
  const floorH = 100 / floorCount;

  const floors = Array.from({ length: floorCount }, () => []);
  rooms.forEach((room) => {
    const floor = room.floor != null ? room.floor : 0;
    if (floor < floorCount) {
      floors[floor].push(room);
    }
  });

  for (let i = 0; i < floorCount; i++) {
    const platformY = (floorCount - i) * floorH;
    const platform = document.createElement("div");
    platform.className = "floor-platform";
    platform.style.top = `${platformY}%`;
    doorField.appendChild(platform);

    const floorRooms = floors[i];
    floorRooms.forEach((room, doorIdx) => {
      roomById.set(room.id, room);

      const isVacant = room.type === "guest" && room.status === "vacant";
      const lifecycle = guestLifecycle(room, rules);
      const isExpired = lifecycle && lifecycle.phase === "expired";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "door";
      button.dataset.roomId = room.id;
      button.style.left = `${18 + doorIdx * 22}%`;
      button.style.top = `${platformY}%`;

      if (isVacant) {
        button.dataset.state = "vacant";
        button.setAttribute("aria-label", "Vacant guest room");
        button.innerHTML = `<span class="door-label">Vacant</span>`;
        button.disabled = true;
      } else if (isExpired) {
        button.dataset.state = "expired";
        button.setAttribute("aria-label", `${room.name}, expired`);
        button.innerHTML = `<span class="door-label">${room.name}</span>`;
        button.disabled = true;
      } else {
        button.dataset.state = room.access?.mode || "stalk";
        button.setAttribute("aria-label", `${room.name}, ${modeLabel(room.access?.mode || "open")}`);

        const countdown = formatCountdown(lifecycle);
        let lifecycleTag = "";
        if (countdown) {
          const urgency = lifecycle.phase === "export" ? "door-countdown--final"
            : lifecycle.phase === "readonly" ? "door-countdown--urgent"
            : "";
          lifecycleTag = `<span class="door-countdown ${urgency}">${countdown}</span>`;
        }

        button.innerHTML = `
          <span class="door-knob"></span>
          ${lifecycleTag}
          <span class="door-label">${room.name}</span>
        `;

        button.addEventListener("click", () => {
          activeRoomId = room.id;
          document.querySelectorAll(".door").forEach((door) => {
            door.classList.toggle("is-selected", door.dataset.roomId === room.id);
          });
          handleDoorAction(room.id);
        });
      }

      doorField.appendChild(button);
    });
  }
}

function renderTreeMessage(message) {
  doorField.querySelectorAll(".door, .tree-message").forEach((node) => node.remove());
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
    window.location.href = room.href;
    return;
  }

  if (room.access.mode === "lock") {
    showModal({
      kicker: "Locked door",
      title: room.name,
      message:
        "This room participates in the tree, but it only opens from the kid's own website. The hub just shows the door.",
      showKnock: false,
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

  showModal({
    kicker: "Knock knock",
    title: room.name,
    message: room.access.encryptedHref
      ? "This room is locked with a passphrase. Only someone who knows the secret word can open it."
      : "This is a playful password gate. Type the secret word to open the door.",
    showKnock: true,
    hint: room.access.hint || "",
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

async function encryptString(plaintext, passphrase) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
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

  // Level 2: encrypted href — the URL itself is the secret
  if (room.access.encryptedHref) {
    try {
      const href = await decryptString(room.access.encryptedHref, passphrase);
      const hash = await sha256Hex(passphrase);
      sessionStorage.setItem("treefort-guest-auth", JSON.stringify({ guestId: room.id, passphraseHash: hash }));
      window.location.href = href;
      return;
    } catch {
      modalMessage.textContent = "Wrong passphrase. The door stays shut.";
      return;
    }
  }

  // Level 1 fallback: hash compare with plaintext href
  if ((await sha256Hex(passphrase)) === room.access.passphraseHash) {
    window.location.href = room.href;
    return;
  }

  modalMessage.textContent = "Wrong passphrase. The door stays shut.";
});

async function loadTreefort() {
  const response = await fetch("./data/treefort.json");
  if (!response.ok) {
    throw new Error(`Treefort manifest load failed with ${response.status}`);
  }

  return response.json();
}

function applyTreefortCopy(treefort) {
  treefortConfig = treefort;
  if (heroTitle) {
    heroTitle.textContent = treefort.title;
  }
  if (heroLede) {
    heroLede.textContent = treefort.lede;
  }
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

function tickCountdowns() {
  if (!cachedManifest) {
    return;
  }

  const rules = cachedManifest.treefort.guestRules;
  const badges = doorField.querySelectorAll(".door-countdown");
  let hasHourly = false;

  badges.forEach((badge) => {
    const button = badge.closest(".door");
    if (!button) {
      return;
    }

    const room = roomById.get(button.dataset.roomId);
    if (!room) {
      return;
    }

    const lifecycle = guestLifecycle(room, rules);
    const text = formatCountdown(lifecycle);
    if (text) {
      badge.textContent = text;
    }

    if (lifecycle && lifecycle.daysLeft <= 1 && lifecycle.phase !== "expired") {
      hasHourly = true;
    }
  });

  const interval = hasHourly ? 60000 : 300000;
  setTimeout(tickCountdowns, interval);
}

async function init() {
  renderTreeMessage("Loading doors...");

  try {
    const manifest = await loadTreefort();
    cachedManifest = manifest;
    renderSky();
    renderTree();
    applyTreefortCopy(manifest.treefort);
    await waitForTreeImages();
    sizeWorld();
    positionDoorField();
    renderDoors(manifest.doors, manifest.treefort.guestRules);
    tickCountdowns();
    requestAnimationFrame(() => requestAnimationFrame(scrollToWorldBase));
  } catch (error) {
    console.error(error);
    renderTreeMessage("Treefort data failed to load. Serve this folder over HTTP.");
  }
}

window.addEventListener("resize", () => {
  scheduleSkyRender();
  sizeWorld();
  positionDoorField();
});

window.addEventListener("scroll", applyParallax, { passive: true });

primeWorldStartPosition();
init();
