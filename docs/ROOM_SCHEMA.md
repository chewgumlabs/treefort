# Room Schema

## Latest public room manifest

- schema: `treefort-semantic-room`
- schemaVersion: `1`

## Latest source state

- schema: `treefort-semantic-room-state`
- schemaVersion: `1`

## Core top-level fields

- `roomId`
- `roomEngine`
- `owner`
- `presentation`
- `stage`
- `limits`
- `palette`
- `assets`
- `entrySpaceId`
- `spaces`

## Important behavior fields

- `spaces[].revealState`
  `locked`, `undrawn`, or `drawn`
- `spaces[].sceneArtAssetId`
  the imported IcyAnimation scene for that space
- `spaces[].fillPatches`
  coarse color blocks under the scene line art
- `spaces[].surfacePatches`
  semantic structure for future systems and editor hints
- `spaces[].regions`
  labeled image-map regions snapped to the tile grid
- `spaces[].portalBindings`
  explicit region -> destination bindings

## Compatibility policy

- this repo only accepts the latest checked-in semantic room schema
- no legacy room compatibility is preserved
- the runtime stays fixed while scene data and safe assets evolve
