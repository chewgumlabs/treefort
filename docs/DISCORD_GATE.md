# Discord Gate

## Purpose

Discord-gated doors are verified by a backend service, not by the static GitHub Pages frontend.

The public hub only knows:

- that a door uses `discord` mode
- the Discord server label
- the invite URL

The reviewer-owned source data keeps:

- `guildId`
- optional `requiredRoleIds`

## Example service

Use `server/access-gate.example.mjs` as the provider-driven service and `server/discord-gate.example.mjs` as the Discord-flavored entry point.

It implements:

1. `GET /api/access/start?door=<submission-id>`
2. Discord OAuth redirect with `identify guilds.members.read`
3. `GET /api/access/callback`
4. server-side membership and optional role verification
5. redirect to the approved room URL

## Environment variables

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `TREEFORT_SESSION_SECRET`
- `TREEFORT_PUBLIC_BASE_URL`
- `PORT`

`TREEFORT_PUBLIC_BASE_URL` is only needed when approved room URLs are stored as relative paths in the repo demo.

## Hub wiring

To let the public hub launch the gate, set this in `content/treefort.base.json`:

```json
{
  "version": 1,
  "treefort": {
    "eyebrow": "GitHub Pages Treefort",
    "title": "The giant tree with everyone's door on it.",
    "lede": "Each door represents a kid's own GitHub Pages room.",
    "stumpNote": "Future hand-drawn stump art lives here",
    "gateways": {
      "discord": {
        "unlockUrlBase": "http://127.0.0.1:8787/api/access/start",
        "authLabel": "Verify with Discord"
      }
    }
  }
}
```

## Security notes

- This gate protects entry from the hub, not the room URL itself.
- Use the authorization-code flow with a server-side client secret.
- Sign and expire OAuth state values.
- Never trust a browser-only Discord check for authorization.
