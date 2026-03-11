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
      `You already have a room! **${existing.name}** on floor ${existing.floor} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left).`,
    );
  }

  // Find a vacant slot
  const slot = manifest.doors.find((d) => d.type === "guest" && d.status === "vacant");
  if (!slot) {
    return discordReply("No vacant rooms right now. Check back when someone's stay ends!");
  }

  // Provision the room
  const today = new Date().toISOString().split("T")[0];
  const roomHref = `./rooms/${slot.id}/`;
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

  // Commit updated manifest
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

  // Create empty room data file
  const roomData = JSON.stringify(
    { version: 1, createdAt: today, guestName: username, guestId: slot.id, frames: [], interactions: [] },
    null,
    2,
  );
  await commitGitHubFile(env, `rooms/${slot.id}/data.json`, roomData, null, `Create ${slot.id} room data`);

  return discordReply(
    `**Your room is ready!** 🏠\n\n` +
      `**Room:** ${slot.name}\n` +
      `**Floor:** ${slot.floor}\n` +
      `**Passphrase:** ||${passphrase}|| (only you can see this)\n` +
      `**Stay:** ${rules.stayDays} days (expires ${expiryDate(today, rules.stayDays)})\n\n` +
      `Go to the tree and find your door!`,
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

  let status = `**${room.name}** — Floor ${room.floor}\n`;
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

// ════════════════════════════════════════
//  Utility
// ════════════════════════════════════════

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
