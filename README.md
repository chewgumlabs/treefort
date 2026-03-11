# Treefort MVP

Static Treefort hub plus a semantic sample room.

## Product shape

- `Hub`: your Treefort site, published from your repo
- `Room`: each kid's own room site, published from that kid's repo
- `Bridge`: local import and future publish tooling that only writes safe room data and assets
- `Gate`: optional backend service for Discord or other provider-based hub access

## Important folders

- `content/treefort.base.json`: source tree copy and shared hub metadata
- `content/submissions/*.json`: room submissions from kid-owned sites
- `content/reviews/*.json`: moderator decisions
- `content/verified-room-manifests/*.json`: reviewer-captured room snapshots for approved submissions
- `data/treefort.json`: generated public hub manifest
- `index.html`, `styles.css`, `app.js`: Treefort hub
- `room/source/semantic-room-state.json`: semantic room source of truth
- `room/data/room.json`: compiled public room manifest
- `room/assets/imports/icy/*`: imported or bundled room art assets
- `room/index.html`, `room/styles.css`, `room/app.js`: semantic room runtime
- `bridges/icy/import-plan.json`: local IcyAnimation import plan
- `scripts/compile-room.mjs`: compiles semantic room state into the room manifest
- `scripts/export-room-package.mjs`: exports a `.room` redraw package for IcyAnimation
- `scripts/import-icy-assets.mjs`: imports exported IcyAnimation assets into the semantic room state
- `scripts/build-treefort.mjs`: generates the public hub manifest from approved submissions
- `scripts/validate-treefort.mjs`: validates submissions, reviews, generated output, the room manifest, and the publish bridge contract
- `contracts/publish-bridge.example.json`: example safe publish contract
- `contracts/semantic-room-state.example.json`: example semantic room source state
- `contracts/region-interaction.example.json`: example blob interaction contract
- `contracts/room-roundtrip.example.json`: example `.room` round-trip package contract
- `docs/SEMANTIC_ROOM_MODEL.md`: semantic room design and tile-grid contract
- `docs/ICY_BRIDGE.md`: bridge contract and workflow
- `docs/INTERACTIVITY_AND_ROUNDTRIP.md`: `Make Interactive`, `.room` mode, and redraw persistence plan

## Semantic room model

Treefort rooms now use one imported `256x192` IcyAnimation drawing per space, then layer meaning on top:

- fill color under the line art on a `64x48` tile grid
- semantic label zones like `floor`, `door`, `poster`, or `prop`
- labeled regions that behave like a dynamic image map
- portal bindings for hidden rooms
- authoring feedback and tool unlocks driven by label progress

Unlocked rooms can stay `undrawn`. They exist structurally, but the child has to draw them before they become visible.

## Local workflow

1. Edit `content/treefort.base.json`, `content/submissions/*.json`, or `room/source/semantic-room-state.json`.
2. Compile the sample room with `npm run compile:room`.
3. Optionally import new IcyAnimation art with `npm run bridge:icy -- bridges/icy/import-plan.json`.
4. Export a redraw package with `npm run export:room`.
5. Rebuild the hub with `npm run build:treefort`.
6. Validate everything with `npm run validate`.
7. Serve the repo over HTTP, for example `python3 -m http.server 4174`.
8. Open `/` for the hub or `/room/` for the semantic room runtime.

## Security posture

- `data/treefort.json` is generated output, not hand-edited source.
- `lock` doors omit room URLs from the public hub manifest.
- `knock` passphrases are hashed at build time.
- `discord` doors publish only safe invite metadata; private guild requirements stay in reviewed source.
- `room/data/room.json` is compiled from validated semantic room state, not freeform HTML edits.
- the bridge writes data and assets only; runtime files stay outside the publish boundary.

This is still a static-site project. Hub-side door states are participation and moderation tools, not real privacy for a public Pages URL.
