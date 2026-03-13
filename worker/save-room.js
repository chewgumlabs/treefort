/**
 * Treefort Worker — Room saves + Discord bot in one.
 *
 * Routes:
 *   POST /save     — Room editor saves guest room data
 *   POST /discord  — Discord interaction endpoint (slash commands)
 *
 * Environment variables (set in Cloudflare dashboard):
 *   GITHUB_TOKEN        — fine-grained PAT, contents:write on the repo
 *   GITHUB_REPO         — "owner/repo"
 *   GITHUB_BRANCH       — "main"
 *   DISCORD_PUBLIC_KEY   — from Discord Developer Portal
 *   DISCORD_APP_ID       — from Discord Developer Portal
 *   DISCORD_BOT_TOKEN    — from Discord Developer Portal
 */

const MAX_SIZE = 52428800;
const ALLOWED_PATH_RE = /^rooms\/guest-\d{3}\/data\.json$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return corsResponse(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/save" && request.method === "POST") {
      return corsResponse(await handleSave(request, env));
    }

    if (url.pathname === "/door-mode" && request.method === "POST") {
      return corsResponse(await handleDoorMode(request, env));
    }

    if (url.pathname === "/discord" && request.method === "POST") {
      return handleDiscord(request, env);
    }

    return new Response("Treefort Worker", { status: 200 });
  },
};

// ════════════════════════════════════════
//  Room Save
// ════════════════════════════════════════

async function handleSave(request, env) {
  try {
    const { guestId, passphraseHash, roomData } = await request.json();

    if (!guestId || !passphraseHash || !roomData) {
      return jsonResponse(400, { error: "Missing guestId, passphraseHash, or roomData" });
    }

    const filePath = `rooms/${guestId}/data.json`;
    if (!ALLOWED_PATH_RE.test(filePath)) {
      return jsonResponse(400, { error: "Invalid guest ID format" });
    }

    const payload = JSON.stringify(roomData);
    if (new TextEncoder().encode(payload).length > MAX_SIZE) {
      return jsonResponse(413, { error: "Room data exceeds 50MB limit" });
    }

    const manifest = await fetchGitHubFile(env, "data/treefort.json");
    if (!manifest) {
      return jsonResponse(500, { error: "Could not read manifest" });
    }

    const manifestData = JSON.parse(manifest.content);
    const door = manifestData.doors.find((d) => d.id === guestId);

    if (!door || door.type !== "guest" || door.status !== "occupied") {
      return jsonResponse(403, { error: "Guest room not found or not occupied" });
    }

    const rules = manifestData.treefort.guestRules;
    const elapsed = daysSince(door.moveInDate);

    if (elapsed >= rules.stayDays) {
      return jsonResponse(403, { error: "Guest stay has expired" });
    }

    if (door.access.passphraseHash !== passphraseHash) {
      return jsonResponse(401, { error: "Passphrase does not match" });
    }

    if (elapsed >= rules.readonlyDay - 1) {
      return jsonResponse(403, { error: "Room is read-only" });
    }

    const existing = await fetchGitHubFile(env, filePath);
    const result = await commitGitHubFile(env, filePath, payload, existing?.sha, `Save ${guestId}`);

    if (!result.ok) {
      return jsonResponse(502, { error: "GitHub commit failed" });
    }

    return jsonResponse(200, { ok: true });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
}

// ════════════════════════════════════════
//  Door Mode Toggle
// ════════════════════════════════════════

async function handleDoorMode(request, env) {
  try {
    const { guestId, passphraseHash, mode } = await request.json();

    if (!guestId || !passphraseHash || !mode) {
      return jsonResponse(400, { error: "Missing guestId, passphraseHash, or mode" });
    }

    if (mode !== "knock" && mode !== "stalk" && mode !== "lock") {
      return jsonResponse(400, { error: "Mode must be knock, stalk, or lock" });
    }

    const manifestFile = await fetchGitHubFile(env, "data/treefort.json");
    if (!manifestFile) {
      return jsonResponse(500, { error: "Could not read manifest" });
    }

    const manifest = JSON.parse(manifestFile.content);
    const door = manifest.doors.find((d) => d.id === guestId);

    if (!door || door.type !== "guest" || door.status !== "occupied") {
      return jsonResponse(403, { error: "Guest room not found or not occupied" });
    }

    if (door.access.passphraseHash !== passphraseHash) {
      return jsonResponse(401, { error: "Passphrase does not match" });
    }

    // Update the mode, preserve everything else
    door.access.mode = mode;

    const newManifest = JSON.stringify(manifest, null, 2) + "\n";
    const result = await commitGitHubFile(env, "data/treefort.json", newManifest, manifestFile.sha, `${guestId} door → ${mode}`);

    if (!result.ok) {
      return jsonResponse(502, { error: "GitHub commit failed" });
    }

    return jsonResponse(200, { ok: true, mode });
  } catch (err) {
    return jsonResponse(500, { error: err.message });
  }
}

// ════════════════════════════════════════
//  Discord Bot
// ════════════════════════════════════════

async function handleDiscord(request, env) {
  // Verify the request is from Discord
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const body = await request.text();

  const isValid = await verifyDiscordRequest(env.DISCORD_PUBLIC_KEY, signature, timestamp, body);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction = JSON.parse(body);

  // Discord ping (verification handshake)
  if (interaction.type === 1) {
    return jsonResponse(200, { type: 1 });
  }

  // Slash command
  if (interaction.type === 2) {
    const command = interaction.data.name;
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const username = interaction.member?.user?.username || interaction.user?.username;

    if (command === "claim-room") {
      return handleClaimRoom(env, interaction, userId, username);
    }

    if (command === "my-room") {
      return handleMyRoom(env, userId);
    }

    if (command === "evict-room") {
      return handleEvictRoom(env, interaction, userId);
    }

    return discordReply("Unknown command.");
  }

  return jsonResponse(400, { error: "Unknown interaction type" });
}

async function handleClaimRoom(env, interaction, userId, username) {
  const passphrase = interaction.data.options?.find((o) => o.name === "passphrase")?.value;

  if (!passphrase || passphrase.trim().length < 3) {
    return discordReply("Your passphrase needs to be at least 3 characters. Pick something only you would know!");
  }

  const normalized = passphrase.trim().toLowerCase();

  // Fetch manifest
  const manifestFile = await fetchGitHubFile(env, "data/treefort.json");
  if (!manifestFile) {
    return discordReply("Could not read the treefort manifest. Try again later.");
  }

  const manifest = JSON.parse(manifestFile.content);
  const rules = manifest.treefort.guestRules;

  // Check if this user already has an active room
  const existing = manifest.doors.find(
    (d) => d.type === "guest" && d.status === "occupied" && d.discordUserId === userId,
  );

  if (existing) {
    const elapsed = daysSince(existing.moveInDate);
    const daysLeft = rules.stayDays - elapsed;
    return discordReply(
      `You already have a room! **${existing.name}** — ${doorLabel(existing.id)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left).`,
    );
  }

  // Find a vacant slot
  const slot = manifest.doors.find((d) => d.type === "guest" && d.status === "vacant");
  if (!slot) {
    return discordReply("No vacant rooms right now. Check back when someone's stay ends!");
  }

  // Provision the room
  const today = new Date().toISOString().split("T")[0];
  const roomHref = `./room/?guest=${slot.id}`;
  const hash = await sha256Hex(normalized);
  const encrypted = await encryptString(roomHref, normalized);

  slot.status = "occupied";
  slot.name = `${username}'s Room`;
  slot.moveInDate = today;
  slot.discordUserId = userId;
  slot.access = {
    mode: "knock",
    hint: `Ask ${username}!`,
    passphraseHash: hash,
    encryptedHref: encrypted,
  };

  // Create or replace room data matching the editor's semantic-room schema.
  // Reused guest slots must overwrite any stale file from a previous occupant.
  const roomPath = `rooms/${slot.id}/data.json`;
  const existingRoomFile = await fetchGitHubFile(env, roomPath);
  const roomData = JSON.stringify(guestRoomTemplate(slot.id, username, today), null, 2) + "\n";
  const roomCommitResult = await commitGitHubFile(
    env,
    roomPath,
    roomData,
    existingRoomFile?.sha,
    `${existingRoomFile ? "Reset" : "Create"} ${slot.id} room data`,
  );

  if (!roomCommitResult.ok) {
    return discordReply(
      `Your door was assigned to ${slot.id}, but the room file could not be prepared. Ask the tree owner to reset ${slot.id}.`,
    );
  }

  // Commit updated manifest after the room file is ready.
  // If this step fails, the slot stays vacant even though the blank file exists,
  // which is safer than assigning a door to stale room data.
  const newManifest = JSON.stringify(manifest, null, 2) + "\n";
  const commitResult = await commitGitHubFile(
    env,
    "data/treefort.json",
    newManifest,
    manifestFile.sha,
    `Provision ${slot.id} for ${username}`,
  );

  if (!commitResult.ok) {
    return discordReply("Something went wrong provisioning your room. Try again in a minute.");
  }

  return discordReply(
    `**Your room is ready!** 🏠\n\n` +
      `**Room:** ${slot.name}\n` +
      `**Location:** ${doorLabel(slot.id)}\n` +
      `**Passphrase:** ||${passphrase}|| (only you can see this)\n` +
      `**Stay:** ${rules.stayDays} days (expires ${expiryDate(today, rules.stayDays)})\n\n` +
      `Go to the tree and find your door!\nhttps://chewgumlabs.github.io/treefort/`,
  );
}

async function handleMyRoom(env, userId) {
  const manifestFile = await fetchGitHubFile(env, "data/treefort.json");
  if (!manifestFile) {
    return discordReply("Could not read the manifest.");
  }

  const manifest = JSON.parse(manifestFile.content);
  const rules = manifest.treefort.guestRules;

  const room = manifest.doors.find(
    (d) => d.type === "guest" && d.status === "occupied" && d.discordUserId === userId,
  );

  if (!room) {
    return discordReply("You don't have a guest room right now. Use `/claim-room` to get one!");
  }

  const elapsed = daysSince(room.moveInDate);
  const daysLeft = rules.stayDays - elapsed;
  const expires = expiryDate(room.moveInDate, rules.stayDays);

  let status = `**${room.name}** — ${doorLabel(room.id)}\n`;
  status += `Moved in: ${room.moveInDate}\n`;
  status += `Expires: ${expires}\n`;

  if (daysLeft <= 0) {
    status += `\n⚠️ **Your stay has expired.** Export your room before it's wiped!`;
  } else if (daysLeft <= 1) {
    const hoursLeft = Math.max(0, Math.ceil((new Date(room.moveInDate + "T00:00:00Z").getTime() + rules.stayDays * 86400000 - Date.now()) / 3600000));
    status += `\n🔴 **Last day!** ${hoursLeft} hours left. Export your room now!`;
  } else if (daysLeft <= 2) {
    status += `\n🟠 **${daysLeft} days left.** Your room goes read-only tomorrow.`;
  } else if (daysLeft <= 3) {
    status += `\n🟡 **${daysLeft} days left.**`;
  } else {
    status += `\n🟢 **${daysLeft} days left.** Enjoy your stay!`;
  }

  return discordReply(status);
}

const ADMIN_USER_ID = "1028469253139075152"; // shanecurry's Discord ID

async function handleEvictRoom(env, interaction, userId) {
  if (userId !== ADMIN_USER_ID) {
    return discordReply("Only the Treefort owner can evict rooms.");
  }

  const targetId = interaction.data.options?.find((o) => o.name === "room")?.value;
  if (!targetId) {
    return discordReply("Specify a room ID (e.g. guest-003).");
  }

  const manifestFile = await fetchGitHubFile(env, "data/treefort.json");
  if (!manifestFile) {
    return discordReply("Could not read the manifest.");
  }

  const manifest = JSON.parse(manifestFile.content);
  const door = manifest.doors.find((d) => d.id === targetId);

  if (!door) {
    return discordReply(`No door found with ID \`${targetId}\`.`);
  }

  if (door.type !== "guest" || door.status !== "occupied") {
    return discordReply(`\`${targetId}\` is not an occupied guest room.`);
  }

  const oldName = door.name;
  door.status = "vacant";
  delete door.name;
  delete door.moveInDate;
  delete door.discordUserId;
  delete door.access;

  const newManifest = JSON.stringify(manifest, null, 2) + "\n";
  const commitResult = await commitGitHubFile(env, "data/treefort.json", newManifest, manifestFile.sha, `Evict ${targetId}`);

  if (!commitResult.ok) {
    return discordReply("Failed to update manifest.");
  }

  // Delete room data
  const roomFile = await fetchGitHubFile(env, `rooms/${targetId}/data.json`);
  if (roomFile) {
    const deleteResult = await deleteGitHubFile(
      env,
      `rooms/${targetId}/data.json`,
      roomFile.sha,
      `Delete ${targetId} room data`,
    );
    if (!deleteResult.ok) {
      return discordReply(
        `Evicted **${oldName}** from \`${targetId}\`, but the old room file could not be deleted. Reset ${targetId} before reusing it.`,
      );
    }
  }

  return discordReply(`Evicted **${oldName}** from \`${targetId}\`. Room is now vacant.`);
}

// ════════════════════════════════════════
//  Crypto helpers
// ════════════════════════════════════════

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function encryptString(plaintext, pass) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pass), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  const blob = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  blob.set(salt, 0);
  blob.set(iv, salt.length);
  blob.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...blob));
}

async function verifyDiscordRequest(publicKey, signature, timestamp, body) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8(publicKey),
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"],
    );

    const message = new TextEncoder().encode(timestamp + body);
    return crypto.subtle.verify("Ed25519", key, hexToUint8(signature), message);
  } catch {
    return false;
  }
}

function hexToUint8(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));
}

// ════════════════════════════════════════
//  GitHub API
// ════════════════════════════════════════

async function fetchGitHubFile(env, path) {
  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}?ref=${env.GITHUB_BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "treefort-worker",
      },
    },
  );

  if (!res.ok) return null;
  const data = await res.json();
  return { sha: data.sha, content: atob(data.content.replace(/\n/g, "")) };
}

async function commitGitHubFile(env, path, content, existingSha, message) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: env.GITHUB_BRANCH,
  };
  if (existingSha) body.sha = existingSha;

  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "treefort-worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function deleteGitHubFile(env, path, sha, message) {
  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "treefort-worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sha,
      branch: env.GITHUB_BRANCH,
    }),
  });
}

// ════════════════════════════════════════
//  Utility
// ════════════════════════════════════════

function doorLabel(doorId) {
  const num = parseInt(doorId.replace("guest-", ""), 10);
  const floor = Math.ceil(num / 2);
  return `Door ${num}, Floor ${floor}`;
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr + "T00:00:00Z").getTime()) / 86400000);
}

function expiryDate(moveInDate, stayDays) {
  const d = new Date(moveInDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + stayDays);
  return d.toISOString().split("T")[0];
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function corsResponse(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

function discordReply(content) {
  return jsonResponse(200, { type: 4, data: { content, flags: 64 } });
}

function guestRoomTemplate(guestId, guestName, today) {
  return {
    schema: "treefort-semantic-room",
    schemaVersion: 1,
    roomId: guestId,
    roomEngine: "semantic-scene-v2",
    owner: { displayName: guestName, siteUrl: "./" },
    presentation: { eyebrow: "Guest room", title: `${guestName}'s Room`, description: "A guest room in the Treefort." },
    updatedAt: today,
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
