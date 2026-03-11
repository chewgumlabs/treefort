# Publish Bridge Contract

## Goal

The publish bridge is the only component allowed to write kid room data into a kid-owned GitHub repo.

## Safe write boundary

Allowed:

- `data/room.json`
- `data/assets.json`
- `assets/**`

Forbidden:

- `index.html`
- `app.js`
- `styles.css`
- `package.json`
- `sw.js`
- `CNAME`
- anything outside approved prefixes

## Contract shape

See `contracts/publish-bridge.example.json`.

The contract declares:

- target repo and branch
- expected room schema version
- exact write paths
- exact delete paths
- asset digests and sizes
- commit metadata

## Security rules

- bridge writes data and assets only
- bridge never rewrites runtime files
- asset writes must stay within declared limits
- delete operations stay under `assets/`
- future GitHub auth should use minimal scopes and repo-specific writes
- approval snapshots should be refreshed before bridge writes are allowed to publish
