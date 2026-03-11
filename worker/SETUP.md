# Treefort Worker Setup

One Worker handles two things:
- Room saves from the editor (POST /save)
- Discord bot commands (POST /discord)

## Step 1 — Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application**, name it "Treefort"
3. Go to **Bot** tab → click **Reset Token** → copy the token (save it!)
4. Go to **General Information** → copy **Application ID** and **Public Key**
5. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: (none needed, it only responds to slash commands)
   - Copy the URL and open it to invite the bot to your server

## Step 2 — Create a GitHub Fine-Grained PAT

1. Go to https://github.com/settings/personal-access-tokens/new
2. Name: "treefort-worker"
3. Repository access: **Only select repositories** → pick your TreeFort repo
4. Permissions: **Contents** → Read and write
5. Generate → copy the token

## Step 3 — Install Wrangler & Deploy

```bash
npm install -g wrangler
cd worker
wrangler login          # opens browser to auth with Cloudflare
wrangler deploy         # deploys the Worker
```

After deploy, Wrangler prints your Worker URL, something like:
`https://treefort-save.your-subdomain.workers.dev`

## Step 4 — Set Environment Variables

In the Cloudflare dashboard (Workers & Pages → treefort-save → Settings → Variables):

| Variable | Value |
|----------|-------|
| `GITHUB_TOKEN` | The PAT from Step 2 (encrypt it!) |
| `GITHUB_REPO` | `your-username/treefort` |
| `GITHUB_BRANCH` | `main` |
| `DISCORD_PUBLIC_KEY` | From Step 1 |
| `DISCORD_APP_ID` | From Step 1 |
| `DISCORD_BOT_TOKEN` | From Step 1 (encrypt it!) |

Click **Encrypt** on the sensitive values (tokens).

## Step 5 — Set Discord Interactions URL

1. Go back to https://discord.com/developers/applications → your app
2. Go to **General Information**
3. Set **Interactions Endpoint URL** to: `https://treefort-save.your-subdomain.workers.dev/discord`
4. Discord will verify the endpoint — it should succeed

## Step 6 — Register Slash Commands

```bash
DISCORD_APP_ID=your_app_id DISCORD_BOT_TOKEN=your_bot_token node worker/register-commands.mjs
```

## Done!

Kids in your Discord can now:
- `/claim-room passphrase:mysecret` — get a guest room
- `/my-room` — check their countdown

The room editor saves to `POST https://your-worker-url/save`.
The nightly GitHub Action wipes expired rooms automatically.
