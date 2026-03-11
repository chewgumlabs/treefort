# Treefort Security Model

## What this can protect

- the public hub can avoid exposing URLs for `lock` doors
- the public hub can avoid storing knock passphrases in plaintext
- the public hub can keep Discord guild IDs and role IDs out of public data
- generated manifests can strip admin-only fields before publish
- validation scripts can reject malformed or unsafe room data

## What this cannot protect

- a public GitHub Pages room URL is still public if someone has it
- client-side password gates are not real authentication
- a Discord-gated hub door still cannot make a public Pages room private
- any logic shipped to the browser can be inspected

## Current hardening decisions

- `lock` doors do not carry `href` into the generated public manifest
- `knock` passphrases are hashed before they reach `data/treefort.json`
- `discord` doors keep private gate requirements in reviewed source data and use a server-side OAuth flow
- room runtime code is fixed; kid-authored changes stay inside validated semantic room JSON and assets
- the IcyAnimation bridge currently accepts only raster exports: `PNG`, `GIF`, or `WEBP`
- bundled SVG demo assets exist only as local placeholders until real exports are imported

## Operational rules

- no third-party embeds
- no remote script injection
- no user-authored HTML, CSS, or JavaScript
- no public directory inclusion without explicit approval
- no secret credentials stored in static frontend code
