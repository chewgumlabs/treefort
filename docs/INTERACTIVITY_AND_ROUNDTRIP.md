# Interactivity And Round-Trip

Treefort needs two separate promises:

1. kids can decide what labeled things do
2. kids can redraw the room later without losing metadata

Those should be designed together.

## Authoring Flow

The intended room workflow becomes:

1. draw the room in IcyAnimation
2. import the scene into Treefort
3. paint color on the coarse tile grid
4. label blobs like `floor`, `bed`, `poster`, `opening`, or generic `prop`
5. use `Make Interactive` on a labeled blob
6. later, redraw the room and re-import the scene without wiping the metadata layer

Color is appearance.

Labels are semantics.

Interactivity is a second pass attached to a semantic blob, not to raw paint.

## Blob Model

When a child paints tiles with the same label, Treefort should group contiguous cells into a blob.

Recommended grouping:

- `4-neighbor` flood fill
- each separate blob becomes one candidate interactive region
- the stored geometry should be the exact cell mask, not only a loose bounding box

That gives children loose drawing freedom while still producing stable clickable regions.

## Make Interactive

`Make Interactive` acts on a selected labeled blob.

The first interaction types should be:

- `sound`
- `art`
- `words`
- `secret-room`

The UI should show those as four chunky choices after the blob is selected.

`secret-room` should appear disabled until it is unlocked.

## Interaction Contract

Recommended shape:

```json
{
  "id": "bed-blob-1",
  "spaceId": "main",
  "label": "bed",
  "cells": [
    "20,30",
    "21,30",
    "22,30",
    "20,31",
    "21,31",
    "22,31"
  ],
  "interaction": {
    "type": "words",
    "title": "Under Blanket Note",
    "body": "Don't forget the flashlight.",
    "unlock": {
      "state": "available"
    }
  }
}
```

Recommended per-type payloads:

### `sound`

```json
{
  "type": "sound",
  "title": "Bed Creak",
  "assetId": "bed-creak-audio",
  "playMode": "tap"
}
```

### `art`

```json
{
  "type": "art",
  "title": "Bed Drawing",
  "assetId": "bed-secret-art",
  "openMode": "panel"
}
```

### `words`

```json
{
  "type": "words",
  "title": "Under Blanket Note",
  "body": "Don't forget the flashlight."
}
```

### `secret-room`

```json
{
  "type": "secret-room",
  "title": "Blanket Tunnel",
  "targetSpaceId": "blanket-tunnel",
  "openMode": "travel"
}
```

## Secret Room Unlock

`secret-room` should not be available immediately.

Recommended unlock rule:

1. the current room must be `drawn`
2. required room labels must be complete
3. the room score must be full
4. `Scribbler` must be unlocked

That makes secret rooms feel earned instead of default.

Recommended UI wording when locked:

- `Secret Room`
  `Locked until the room is fully taught and Scribbler is unlocked.`

## Score Model

Base room score should come from semantic labels, not color.

Suggested first required labels:

- `floor`
- `opening`
- `poster`
- `prop`

Later, specific labels can replace generic `prop`:

- `bed`
- `desk`
- `shelf`
- `lamp`

The current runtime can keep using the simple score gate, but the long-term model should score blobs by expected roles, not just raw cell count.

## Round-Trip Principle

Room art and room metadata must stay separate.

That means:

- the scene drawing lives in the imported `scene-lineart` asset
- fills, labels, blobs, and interactions live in Treefort JSON
- re-importing new scene art should replace only the scene asset by default
- metadata should stay untouched unless the child explicitly resets it

This is the key to letting kids revise art after labeling.

## `.room` Package

Treefort should round-trip room art through a single `.room` file.

That file should behave like a normal IcyAnimation project when opened, but it also carries a hidden Treefort metadata block that Icy preserves without showing it to the child.

The intended split is:

- the child edits only the room drawing
- Treefort preserves fill, labels, blobs, interactions, and unlock state
- IcyAnimation never exposes Treefort semantics directly in the editor UI

Recommended package shape:

- base IcyAnimation project document
- hidden `treefortRoom` metadata block
- room-mode session hints
- a non-authoritative color underlay reference for the background side

The child opens the `.room` file in IcyAnimation, tweaks the art, saves the `.room` file, then Treefort reimports the same file and keeps the metadata intact.

## IcyAnimation Room Mode

Opening a `.room` file in IcyAnimation should activate a special room-edit mode.

That mode should:

- lock the session to one frame
- disable timeline growth, frame duplication, reordering, and deletion
- disable GIF-oriented behavior like playback-focused editing and accidental animation authoring
- keep the Treefort color underlay visible as reference
- hide Treefort labels, interactions, and region logic entirely

Recommended UI cues:

- a muted `ROOM MODE` status in the header
- a narrow faded bar under the Background track saying:
  `ROOM COLORS ARE NOT EDITABLE`
- no clickable affordance on that bar, just a visual reminder that it is reference-only

The point is to make the room package feel safe and constrained without looking scary.

## Room Drawing Mapping

The `.room` package should map visuals like this:

- current room scene art goes onto the normal IcyAnimation drawing layers
- Treefort color underlay is provided as a background-side reference
- the background reference is not authoritative Treefort data

That means the child can redraw over tile spill or rough color edges while still seeing where Treefort thinks the room colors are.

Treefort then:

- reimports only the drawing result for room art
- preserves fill, labels, blobs, interactions, and unlock state from hidden metadata
- ignores any edits made to the background reference layer

This is why labels and interactions must not be shown in IcyAnimation at all.

## Metadata Preservation

The hidden metadata block should be saved in the `.room` file itself.

Recommended rule:

- IcyAnimation may read `treefortRoom.roomMode`
- IcyAnimation must preserve the entire `treefortRoom` block verbatim on save
- Treefort remains the only tool that edits that block intentionally

That gives us redraw-safe round-tripping without turning IcyAnimation into a Treefort editor.

## Reimport Rules

Default reimport behavior should be:

- `replaceSceneOnly: true`
- `preserveFillGrid: true`
- `preserveLabelGrid: true`
- `preserveInteractions: true`
- `exportFillUnderlayToBackground: true`
- `ignoreEditedBackgroundReference: true`
- `preserveTreefortRoomBlock: true`

Optional destructive behavior should require an explicit choice:

- `resetSemanticData: true`

That should be used only when the child is effectively starting the room over.

## Realign Mode

Sometimes the kid will redraw the bed in a different spot.

When that happens, Treefort should not silently delete metadata.

Instead:

1. keep old labels and interactions
2. show them as translucent overlays on top of the new art
3. let the child repaint or nudge them into place

That preserves work and avoids punishing revision.

## Player-Facing Note

When exporting back to IcyAnimation, Treefort should show a note like:

`Your tags will be saved, and your colors will be placed on the Background layer in IcyAnimation for reference. Changes made to the Background layer in IcyAnimation will not carry back into the bedroom. Draw on the normal drawing layers above it.`

That warning should appear:

- on export
- on reimport
- anywhere the child chooses `replace scene only`

## Product Rule

The child should be allowed to change the drawing many times.

Treefort should treat the drawing as replaceable and the metadata as the durable layer.
