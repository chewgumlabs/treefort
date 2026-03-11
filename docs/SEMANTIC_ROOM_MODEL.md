# Semantic Room Model

Treefort rooms are no longer object-layout editors. A room is now a drawn scene plus lightweight meaning layered on top.

## Stage

- scene size: `256x192`
- tile size: `4x4`
- active grid: `64x48`
- horizontal gutter: `0px`

This fits the `256x192` stage exactly and keeps hotspot and authoring data finer without changing the art size.

## Room layers

Each space contains:

- `sceneArtAssetId`
  the imported IcyAnimation scene
- `fillPatches`
  low-resolution color blocks under the line art
- `surfacePatches`
  coarse semantic structure for future systems
- `regions`
  clickable rectangles snapped to the grid
- `portalBindings`
  where those regions lead

## Reveal states

- `locked`
  the room exists, but cannot be entered yet
- `undrawn`
  the room is unlocked, but the kid has to draw it before it becomes visible
- `drawn`
  the room has a scene and can render normally

That means a hidden room can be discovered before it has art. The discovery unlocks the slot. The drawing reveals it.

## Authoring model

The current authoring loop is:

1. import a scene from IcyAnimation
2. paint coarse fill color on the grid
3. label floor, opening, poster, bed, or generic prop zones
4. assign behavior with `Make Interactive`
5. watch the room score respond
6. unlock new tools after the label checklist is satisfied

The labels are intentionally collision-like. They are meant to feel closer to a game engine paint pass than a form.

See [docs/INTERACTIVITY_AND_ROUNDTRIP.md](/Volumes/Storage/TreeFort/docs/INTERACTIVITY_AND_ROUNDTRIP.md) for the planned blob interaction model and redraw-safe round-trip workflow.

## Feedback loop

The room runtime can score the current draft against required labels and surface hints.

That enables:

- bottom-of-screen dialog feedback
- missing-object suggestions
- progression gates such as the `Scribbler` unlock

## What is explicitly out of the base model

These are not part of the core room contract right now:

- loose prop sprites
- built-in pets
- freeform runtime object placement
- direct HTML editing

Those can come back later as separate services, but the base room stays scene-first.
