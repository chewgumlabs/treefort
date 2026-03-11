# Treefort Architecture

## Product split

- `Hub`
  your Treefort site, published from your repo
- `Room`
  each kid's own site, published from that kid's repo
- `Bridge`
  local import and future publish tooling that writes safe room data and assets
- `Gate`
  optional backend service that verifies Discord or other provider-based access before a hub redirect

## Current backend shape

Treefort is still a static-site system, so the backend is a content pipeline:

1. Kid room submissions live in `content/submissions/*.json`.
2. Moderator review records live in `content/reviews/*.json`.
3. Reviewer-approved snapshots live in `content/verified-room-manifests/*.json`.
4. `npm run build:treefort` generates `data/treefort.json` from approved submissions.
5. The sample room compiles from `room/source/semantic-room-state.json` into `room/data/room.json`.
6. The room runtime reads the compiled semantic manifest only.

## Semantic room flow

The room model is now:

1. kids draw room art in IcyAnimation at `256x192`
2. Treefort imports that drawing as `scene-lineart`
3. Treefort stores fill patches, semantic labels, regions, and portals as safe JSON
4. `npm run compile:room` emits the public runtime manifest
5. the published room runtime never edits HTML, CSS, or JavaScript

The source and contract docs are:

- `docs/SEMANTIC_ROOM_MODEL.md`
- `contracts/semantic-room-state.example.json`
- `docs/ICY_BRIDGE.md`

## Trust boundaries

- `content/submissions/*.json` is structured but untrusted until reviewed.
- `content/reviews/*.json` is moderator-owned source input.
- `content/verified-room-manifests/*.json` is reviewer-owned evidence of what was approved.
- `data/treefort.json` is public output.
- `room/data/room.json` is trusted room configuration.
- browser code is public and inspectable.

That means:

- never treat door passwords as real security
- never treat a Discord hub gate as room privacy
- never trust client-side checks as authorization
- never ship raw moderation or admin-only metadata into public manifests
- never let a kid submission choose its own public tree position without review

## Near-term roadmap

1. Keep the bridge as the source-of-truth import path from IcyAnimation.
2. Add embedded drawing later only if it still writes through the same semantic room contract.
3. Add better authoring tools for fills, labels, portals, scoring, and hidden-room discovery.
4. Finish the GitHub publish bridge so kid-owned repos update without exposing raw files.
