#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const TREEFORT_JSON_PATH = path.join(ROOT_DIR, "data/treefort.json");
const ROOM_JSON_PATH = path.join(ROOT_DIR, "room/data/room.json");
const HUB_URL = "https://chewgumlabs.github.io/TreeFort/";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

// ── Gum ──────────────────────────────────────────
//
//  Gum is a small creature with pointy upright ears.
//  He guides new residents through the setup.

const GUM = {
  happy: [
    `   /\\  /\\`,
    `  ( ^  ^ )`,
    `   ( w  )`,
  ],
  excited: [
    `   /\\  /\\`,
    `  ( *  * )`,
    `   ( D  )`,
  ],
  thinking: [
    `   /\\  /\\`,
    `  ( o  o )`,
    `   ( ~  )`,
  ],
  sad: [
    `   /\\  /\\`,
    `  ( ;  ; )`,
    `   ( n  )`,
  ],
  wink: [
    `   /\\  /\\`,
    `  ( -  ^ )`,
    `   ( w  )`,
  ],
};

function wrapText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && (current.length + 1 + word.length) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function gumSay(text, mood = "happy") {
  const face = GUM[mood] || GUM.happy;
  const maxW = 46;
  const lines = wrapText(text, maxW);
  const boxW = Math.max(...lines.map(l => l.length), 10);

  console.log("");
  console.log(`  ╭${"─".repeat(boxW + 2)}╮`);
  for (const line of lines) {
    console.log(`  │ ${line.padEnd(boxW)} │`);
  }
  console.log(`  ╰${"─".repeat(boxW + 2)}╯`);
  console.log(`       ╱`);
  for (const line of face) {
    console.log(`  ${line}`);
  }
  console.log("");
}

function gumChoices(options) {
  for (let i = 0; i < options.length; i++) {
    console.log(`    ${i + 1}. ${options[i]}`);
  }
  console.log("");
}

function hr() { console.log(`  ${"─".repeat(48)}`); }

function printStep(text) { console.log(`  ${text}`); }

// ── Fresh setup ──────────────────────────────────

async function setupFresh(name, githubLogin) {
  const room = await readJson(ROOM_JSON_PATH);

  room.instance = "solo";
  room.questPhase = "decorating";
  room.stickerBookOpened = false;
  room.completedWaves = [];
  room.owner = { ...room.owner, displayName: name };
  if (githubLogin) {
    room.owner.githubLogin = githubLogin;
    room.owner.repo = `${githubLogin}/TreeFort`;
    room.owner.siteUrl = `https://${githubLogin}.github.io/TreeFort/`;
  }
  room.presentation = { ...room.presentation, title: `${name}'s Room` };

  await writeJson(ROOM_JSON_PATH, room);

  let treefort;
  try { treefort = await readJson(TREEFORT_JSON_PATH); } catch { treefort = { version: 2, treefort: {} }; }
  treefort.instance = "solo";
  treefort.resident = { name, neighborUrl: HUB_URL };
  treefort.doors = [];
  await writeJson(TREEFORT_JSON_PATH, treefort);

  gumSay(`Done! I set up a fresh room for you, ${name}. You'll get to paint it, name everything in it, and unlock secret stuff. Just like the guests do!`, "excited");
}

// ── Import from .treefort ────────────────────────

async function setupImport(treefortPath, name, githubLogin) {
  const { execFileSync } = await import("node:child_process");
  const scriptPath = path.join(ROOT_DIR, "scripts/import-treefort.mjs");
  execFileSync("node", [scriptPath, treefortPath], { stdio: "inherit", cwd: ROOT_DIR });

  if (name) {
    const treefort = await readJson(TREEFORT_JSON_PATH);
    treefort.resident.name = name;
    await writeJson(TREEFORT_JSON_PATH, treefort);
  }

  if (githubLogin) {
    const room = await readJson(ROOM_JSON_PATH);
    room.owner = { ...room.owner, githubLogin, repo: `${githubLogin}/TreeFort`, siteUrl: `https://${githubLogin}.github.io/TreeFort/` };
    await writeJson(ROOM_JSON_PATH, room);
  }

  gumSay(`Your room is all moved in, ${name}! Everything you built as a guest is here. Plus you get 10 custom object slots now that you're permanent.`, "excited");
}

// ── Join flow ────────────────────────────────────

async function setupJoin(name, existingLogin) {
  gumSay(`Okay! To get a door on the main tree, we need to send a request to the tree owner. They'll review it and put up your door.`, "thinking");

  let githubLogin = existingLogin;
  if (!githubLogin) {
    githubLogin = (await ask("  Your GitHub username: ")).trim();
    if (!githubLogin) {
      gumSay("No worries, you can do this later. Your room will still work on its own!", "happy");
      return;
    }
  } else {
    gumSay(`I'll use your GitHub username: ${githubLogin}`, "happy");
  }

  gumSay("How should your door work? Some people like visitors to just walk in. Others want a secret password.", "thinking");
  gumChoices([
    "Stalk  — anyone can walk right in",
    "Knock  — visitors need a passphrase",
  ]);

  const modeChoice = (await ask("  Pick a mode [1/2]: ")).trim();
  const isKnock = modeChoice === "2";

  let passphrase = "";
  let hint = "";
  if (isKnock) {
    passphrase = (await ask("  Passphrase (visitors type this): ")).trim();
    hint = (await ask("  Hint for visitors: ")).trim() || `Ask ${name}!`;
    gumSay(`Got it! Password door. I'll remember the hint: "${hint}"`, "wink");
  } else {
    gumSay("Open door! I like it. Friendly.", "happy");
  }

  const siteUrl = `https://${githubLogin}.github.io/TreeFort/room/`;
  const submissionId = githubLogin.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const submission = {
    schemaVersion: 1,
    submissionId,
    submittedAt: new Date().toISOString().split("T")[0],
    owner: {
      githubLogin,
      repo: `${githubLogin}/TreeFort`,
      siteUrl: `https://${githubLogin}.github.io/TreeFort/`,
      roomManifestUrl: `${siteUrl}data/room.json`,
    },
    room: { roomId: submissionId, schemaVersion: 1 },
    door: {
      name: `${name}'s Room`,
      caption: `${name}'s permanent room`,
      destinationLabel: `${name}'s Room`,
      access: isKnock ? { mode: "knock", passphrase, hint } : { mode: "stalk" },
      neighborhood: "residents",
    },
    acknowledgements: { age13Plus: true, publicSite: true, noPrivateInfo: true },
  };

  const submissionPath = path.join(ROOT_DIR, "content/submissions", `${submissionId}.json`);
  await fs.mkdir(path.dirname(submissionPath), { recursive: true });
  await writeJson(submissionPath, submission);

  gumSay(`I wrote your door request to content/submissions/${submissionId}.json! Now you need to send it.`, "excited");
  console.log("");
  hr();
  printStep("TO SUBMIT YOUR DOOR:");
  console.log("");
  printStep("1. Push your fork to GitHub (see deploy steps below)");
  printStep("2. Go to the ORIGINAL TreeFort repo:");
  printStep(`   ${HUB_URL.replace(/\/$/, "")}`);
  printStep('3. Click "Pull Requests" then "New Pull Request"');
  printStep("4. Choose your fork as the source");
  printStep("5. The tree owner will review and add your door!");
  hr();
}

// ── GitHub Pages guide ───────────────────────────

function printDeployGuide(name, githubLogin) {
  const login = githubLogin || "YOUR_USERNAME";

  gumSay(`Almost done! Now we need to put your TreeFort on the internet so people can visit. Don't worry, I'll walk you through it.`, "happy");

  hr();
  printStep("HOW TO DEPLOY YOUR TREEFORT");
  hr();
  console.log("");

  if (!githubLogin) {
    gumSay("First, you need a GitHub account. It's free! If you already have one, skip to Step 2.", "thinking");
    printStep("STEP 1: Create a GitHub account");
    printStep("  Go to https://github.com/join");
    printStep("  Pick a username, email, password");
    printStep("  Verify your email");
    console.log("");
  } else {
    gumSay(`I already know your GitHub username: ${githubLogin}. Let's get your code up there!`, "happy");
  }

  gumSay("Now push your TreeFort code up to GitHub. Run these commands in your terminal, one at a time:", "thinking");
  printStep("STEP 2: Push to GitHub");
  console.log("");
  printStep("  git add -A");
  printStep(`  git commit -m "Set up ${name}'s TreeFort"`);
  printStep(`  git remote set-url origin \\`);
  printStep(`    https://github.com/${login}/TreeFort.git`);
  printStep("  git push -u origin main");
  console.log("");
  if (!githubLogin) {
    printStep("  (Replace YOUR_USERNAME with your GitHub username!)");
    console.log("");
  }

  gumSay("Last step! Tell GitHub to turn your code into a website. This is called 'GitHub Pages'.", "excited");
  printStep("STEP 3: Enable GitHub Pages");
  printStep(`  Go to https://github.com/${login}/TreeFort`);
  printStep("  Click the Settings gear icon");
  printStep("  Find 'Pages' in the left sidebar");
  printStep("  Source: 'Deploy from a branch'");
  printStep("  Branch: main, Folder: / (root)");
  printStep("  Click Save!");
  console.log("");

  printStep("STEP 4: Wait ~2 minutes, then visit:");
  printStep(`  https://${login}.github.io/TreeFort/`);
  console.log("");

  gumSay(`That's it, ${name}! Your very own TreeFort. I'll be waiting inside.`, "wink");
  hr();
}

// ── Main ─────────────────────────────────────────

async function main() {
  console.log("");
  console.log("");
  for (const line of GUM.happy) console.log(`  ${line}`);
  console.log("");
  hr();
  console.log("       T R E E F O R T   S E T U P");
  hr();
  console.log("");

  gumSay("Oh! A new neighbor! Hi! I'm Gum. I live in the TreeFort. Do you want to move in?", "excited");

  gumSay("There are two ways to start. You can play through the whole thing fresh, or if you already stayed as a guest, you can bring your room with you.", "thinking");
  gumChoices([
    "Fresh start — I want to play the full game!",
    "Import — I have a .treefort file from my guest stay",
  ]);

  const modeChoice = (await ask("  Choose [1/2]: ")).trim();
  const isFresh = modeChoice !== "2";

  gumSay("What should I call you?", "happy");
  const name = (await ask("  Your name: ")).trim() || "Friend";

  gumSay("Do you have a GitHub account? I need your username so you can publish your room from the app. If you don't have one yet, just press Enter and we'll set it up later.", "thinking");
  const githubLogin = (await ask("  GitHub username (or Enter to skip): ")).trim();

  gumSay(`${name}! I like it. Okay, let me set things up...`, "excited");

  if (isFresh) {
    await setupFresh(name, githubLogin);
  } else {
    gumSay("Where's your .treefort file? Drag it here or type the path.", "thinking");
    const filePath = (await ask("  Path to .treefort file: ")).trim();
    if (!filePath) {
      gumSay("No file? That's okay! You can run this again later with your file.", "sad");
      rl.close();
      return;
    }
    await setupImport(path.resolve(filePath), name, githubLogin);
  }

  gumSay(`Now here's the big question. You can host your room all on your own, OR you can request a door on the main TreeFort so everyone can find you from the big tree.`, "thinking");
  gumChoices([
    "Join the main TreeFort — put my door on the tree!",
    "Host my own — I'll be independent for now",
  ]);

  const joinChoice = (await ask("  Choose [1/2]: ")).trim();
  if (joinChoice === "1") {
    await setupJoin(name, githubLogin);
  } else {
    gumSay("That's totally fine! You can always join later by running this setup again. Your room works great on its own.", "happy");
  }

  printDeployGuide(name, githubLogin);

  rl.close();
}

main().catch((err) => {
  console.error(err.message);
  rl.close();
  process.exit(1);
});
