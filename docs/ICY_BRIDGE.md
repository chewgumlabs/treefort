# IcyAnimation Bridge

## Goal

Import a kid-drawn `256x192` room scene from IcyAnimation into Treefort without touching HTML, CSS, or runtime code, then round-trip it through a `.room` file without exposing Treefort metadata in IcyAnimation.

The bridge is scene-first:

- it accepts a raw `.icy` room project or a flattened raster export
- it writes the scene into `room/assets/imports/icy/`
- it updates `room/source/semantic-room-state.json`
- it recompiles `room/data/room.json`
- long-term, it also exports a `.room` package for redraw-safe edits

## Supported imports

- `scene-lineart`
  imports a full room scene for a specific space

That is the only bridge import kind right now. Loose props, pets, or other animated extras are not part of the base room contract anymore.

## Import plan

Start from:

- [bridges/icy/import-plan.example.json](/Volumes/Storage/TreeFort/bridges/icy/import-plan.example.json)

Fields:

- `sourceRoot`
  optional base folder for scene exports
- `imports[].input`
  file path relative to `sourceRoot`, relative to the plan file, or absolute
- `imports[].assetId`
  stable slug for the imported scene asset
- `imports[].kind`
  must be `scene-lineart`
- `imports[].assignScene`
  target space binding

## Run

```bash
npm run bridge:icy -- bridges/icy/import-plan.json
```

Dry run:

```bash
npm run bridge:icy -- bridges/icy/import-plan.json --dry-run
```

The bridge writes a report to:

- `build/icy-import-report.json`

## `.room` mode

The intended redraw package is a `.room` file:

- the visible drawing remains an IcyAnimation project
- a hidden `treefortRoom` block preserves Treefort metadata
- opening the file in IcyAnimation should activate a locked single-frame room session
- the Treefort color underlay is shown as a background-side reference only
- labels and interactions are not shown or editable in IcyAnimation

Treefort should treat `.room` as:

- scene art input
- hidden metadata preservation container
- a redraw-safe bridge format rather than a public publish format

## Notes

- `.icy` imports are stored as raw JSON scene assets and rendered directly by the room runtime.
- `.icy` imports currently require layer-based art only. If a project contains note, title, stamp, or connector frame objects, the bridge stops instead of silently dropping them.
- assigning scene art to a space marks that space as `drawn` unless it is still explicitly `locked`
- `resetSemanticData` clears old fill, label, and portal scaffolding when a new scene replaces placeholder content
- the long-term redraw path should default to scene replacement only, preserving fill, labels, interactions, and the hidden `treefortRoom` block unless the user explicitly resets them
- the Treefort color underlay should travel into `.room` as a non-authoritative background reference and never overwrite Treefort metadata on reimport
