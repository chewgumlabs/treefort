#!/usr/bin/env node
/**
 * Register Discord slash commands for the Treefort bot.
 *
 * Usage:
 *   DISCORD_APP_ID=... DISCORD_BOT_TOKEN=... node worker/register-commands.mjs
 */

const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!APP_ID || !BOT_TOKEN) {
  console.error("Set DISCORD_APP_ID and DISCORD_BOT_TOKEN environment variables.");
  process.exit(1);
}

const commands = [
  {
    name: "claim-room",
    description: "Claim a guest room in the Treefort! You pick the passphrase.",
    options: [
      {
        name: "passphrase",
        description: "A secret word only you will know (used to unlock your door)",
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: "my-room",
    description: "Check on your guest room — days left, status, floor.",
  },
  {
    name: "evict-room",
    description: "Admin only — evict a guest and free up their room.",
    default_member_permissions: "0",
    options: [
      {
        name: "room",
        description: "The room ID to evict (e.g. guest-003)",
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

const res = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error("Failed to register commands:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log(`Registered ${data.length} command(s):`);
data.forEach((cmd) => console.log(`  /${cmd.name} — ${cmd.description}`));
