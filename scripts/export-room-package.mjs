import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileRoomManifest, validateSemanticRoomState } from "../shared/room-compiler-core.mjs";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const STATE_PATH = path.join(ROOT_DIR, "room/source/semantic-room-state.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "build/room-packages");
const DEFAULT_WARNING =
  "Your tags will be saved, and your colors will be shown on the background side in IcyAnimation for reference. Changes to that reference do not carry back into the bedroom.";
const DEFAULT_NOTICE = "ROOM COLORS ARE NOT EDITABLE";
const ROOM_PACKAGE_SCHEMA = "treefort-room-package";
const ROOM_PACKAGE_SCHEMA_VERSION = 1;
const ROOM_META_SCHEMA = "treefort-room-hidden-meta";
const ROOM_META_SCHEMA_VERSION = 1;

function fail(message) {
  throw new Error(message);
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const options = {
    spaceId: null,
    outputPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--space") {
      options.spaceId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (argument === "--output") {
      options.outputPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    fail(`Unknown argument "${argument}"`);
  }

  return options;
}

function getSceneAssetAbsolutePath(asset) {
  return path.resolve(ROOT_DIR, "room", asset.path);
}

function getIcyFrameIndex(project) {
  const requestedIndex = Number(project.settings?.currentFrameIndex) || 0;
  if (!Array.isArray(project.frames) || project.frames.length === 0) {
    fail("Scene asset must include at least one IcyAnimation frame");
  }
  return Math.max(0, Math.min(project.frames.length - 1, requestedIndex));
}

function getBackgroundClipForFrame(project, frameIndex) {
  const backgroundId = project.backgroundAssignments?.[frameIndex];
  if (!backgroundId) {
    return null;
  }
  return project.backgroundClips?.find((backgroundClip) => backgroundClip.id === backgroundId) ?? null;
}

function createSvgDataUri(svgText) {
  return `data:image/svg+xml;base64,${Buffer.from(svgText, "utf8").toString("base64")}`;
}

function rectToPixels(stage, rect) {
  return {
    x: stage.gutterLeft + rect.x * stage.tileWidth,
    y: rect.y * stage.tileHeight,
    width: rect.width * stage.tileWidth,
    height: rect.height * stage.tileHeight,
  };
}

function createGrid(stage, fillValue = null) {
  return Array.from({ length: stage.gridHeight }, () => Array.from({ length: stage.gridWidth }, () => fillValue));
}

function fillRectOnGrid(grid, rect, value) {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      grid[y][x] = value;
    }
  }
}

function inferLabelIdFromPatch(patch) {
  if (patch.tags?.includes("prop") || patch.tags?.includes("prop-anchor")) {
    return "prop";
  }
  if (patch.surface === "floor") {
    return "floor";
  }
  if (patch.surface === "door" || patch.surface === "opening") {
    return "opening";
  }
  if (patch.surface === "poster") {
    return "poster";
  }
  if (patch.surface === "solid") {
    return "solid";
  }
  return null;
}

function inferLabelIdFromRegion(region) {
  if (region.tags?.includes("prop") || region.tags?.includes("prop-anchor")) {
    return "prop";
  }
  if (region.tags?.includes("door") || region.tags?.includes("opening")) {
    return "opening";
  }
  if (region.tags?.includes("poster")) {
    return "poster";
  }
  return null;
}

function buildFillGrid(space, manifest) {
  const grid = createGrid(manifest.stage, null);
  for (const patch of space.fillPatches) {
    for (const rect of patch.rects) {
      fillRectOnGrid(grid, rect, patch.colorId);
    }
  }
  return grid;
}

function buildLabelGrid(space, manifest) {
  const grid = createGrid(manifest.stage, null);

  for (const patch of space.surfacePatches) {
    const labelId = inferLabelIdFromPatch(patch);
    if (!labelId) {
      continue;
    }
    for (const rect of patch.rects) {
      fillRectOnGrid(grid, rect, labelId);
    }
  }

  for (const region of space.regions) {
    const labelId = inferLabelIdFromRegion(region);
    if (!labelId) {
      continue;
    }
    for (const rect of region.rects) {
      fillRectOnGrid(grid, rect, labelId);
    }
  }

  return grid;
}

function createSpaceDraft(space, manifest) {
  return {
    roomId: manifest.roomId,
    spaceId: space.id,
    title: space.title,
    description: space.description || "",
    placeholderPrompt: space.placeholderPrompt,
    revealState: space.revealState,
    sceneArtAssetId: space.sceneArtAssetId,
    fillGrid: buildFillGrid(space, manifest),
    labelGrid: buildLabelGrid(space, manifest),
    regions: clone(space.regions || []),
    portalBindings: clone(space.portalBindings || []),
    exportedAt: new Date().toISOString(),
  };
}

function buildFillUnderlayStamp(space, manifest) {
  const paletteById = new Map(manifest.palette.map((entry) => [entry.id, entry.hex]));
  const underlayRects = [];

  space.fillPatches.forEach((patch) => {
    const color = paletteById.get(patch.colorId);
    if (!color) {
      return;
    }

    patch.rects.forEach((rect) => {
      const pixels = rectToPixels(manifest.stage, rect);
      underlayRects.push(
        `<rect x="${pixels.x}" y="${pixels.y}" width="${pixels.width}" height="${pixels.height}" fill="${color}" />`,
      );
    });
  });

  if (underlayRects.length === 0) {
    return null;
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${manifest.stage.width}" height="${manifest.stage.height}" viewBox="0 0 ${manifest.stage.width} ${manifest.stage.height}" shape-rendering="crispEdges">`,
    `<rect width="${manifest.stage.width}" height="${manifest.stage.height}" fill="transparent" />`,
    ...underlayRects,
    "</svg>",
  ].join("");

  return {
    id: "treefort-fill-underlay",
    label: "Treefort Colors",
    src: createSvgDataUri(svg),
  };
}

function cloneFrameLike(frameLike, fallbackId) {
  if (!frameLike || typeof frameLike !== "object") {
    return {
      id: fallbackId,
      layers: [null, null, null],
      objects: [],
    };
  }

  return {
    id: typeof frameLike.id === "string" ? frameLike.id : fallbackId,
    layers: Array.isArray(frameLike.layers) ? [...frameLike.layers] : [null, null, null],
    objects: Array.isArray(frameLike.objects) ? clone(frameLike.objects) : [],
  };
}

function createRoomModeMeta(sourceState, manifest, space) {
  const exportedAt = new Date().toISOString();
  return {
    schema: ROOM_META_SCHEMA,
    schemaVersion: ROOM_META_SCHEMA_VERSION,
    roomId: sourceState.roomId,
    spaceId: space.id,
    roomMode: {
      active: true,
      singleFrameLocked: true,
      timelineEditable: false,
      gifToolsEnabled: false,
      showBackgroundNotice: true,
      backgroundNotice: DEFAULT_NOTICE,
    },
    reference: {
      warning: DEFAULT_WARNING,
      ignoreBackgroundEditsOnReimport: true,
    },
    preserve: {
      fillGrid: true,
      labelGrid: true,
      interactions: true,
      unlockState: true,
    },
    spaceDraft: createSpaceDraft(space, manifest),
    sourceState,
    exportedAt,
  };
}

async function exportRoomPackage(options) {
  const sourceState = validateSemanticRoomState(await readJson(STATE_PATH));
  const manifest = compileRoomManifest(sourceState);
  const spaceId = options.spaceId ?? manifest.entrySpaceId;
  const space = manifest.spaces.find((entry) => entry.id === spaceId);
  if (!space) {
    fail(`Room space "${spaceId}" does not exist`);
  }
  if (space.revealState !== "drawn" || !space.sceneArtAssetId) {
    fail(`Room space "${spaceId}" must be drawn before exporting a .room package`);
  }

  const sceneAsset = manifest.assets.find((entry) => entry.id === space.sceneArtAssetId);
  if (!sceneAsset) {
    fail(`Scene asset "${space.sceneArtAssetId}" does not exist`);
  }
  if (sceneAsset.mimeType !== "application/json") {
    fail("Current .room export requires a scene-lineart asset imported from an IcyAnimation project");
  }

  const sceneProject = await readJson(getSceneAssetAbsolutePath(sceneAsset));
  if (sceneProject.app !== "IcyAnimation") {
    fail("Scene asset must be an IcyAnimation project JSON export");
  }

  const frameIndex = getIcyFrameIndex(sceneProject);
  const frame = cloneFrameLike(sceneProject.frames[frameIndex], "room-frame-1");
  const backgroundClip = cloneFrameLike(
    getBackgroundClipForFrame(sceneProject, frameIndex),
    "treefort-background-1",
  );

  const underlayStamp = buildFillUnderlayStamp(space, manifest);
  const stamps = Array.isArray(sceneProject.stamps) ? clone(sceneProject.stamps) : [];
  if (underlayStamp) {
    const stampIdSet = new Set(stamps.map((stamp) => stamp.id));
    if (!stampIdSet.has(underlayStamp.id)) {
      stamps.push(underlayStamp);
    }
    backgroundClip.objects = [
      {
        id: "treefort-fill-underlay-object",
        type: "stamp",
        stampId: underlayStamp.id,
        scale: 1,
        x: 0,
        y: 0,
        width: manifest.stage.width,
        height: manifest.stage.height,
      },
      ...backgroundClip.objects,
    ];
  }

  const roomPackage = {
    version: 1,
    app: "IcyAnimation",
    savedAt: new Date().toISOString(),
    settings: {
      currentFrameIndex: 0,
      activeLayerIndex: 0,
      brushSize: Number(sceneProject.settings?.brushSize) || 1,
      tool: "pen",
      activePreset: typeof sceneProject.settings?.activePreset === "string" ? sceneProject.settings.activePreset : "note",
      activeNoteColor:
        typeof sceneProject.settings?.activeNoteColor === "string" ? sceneProject.settings.activeNoteColor : "sun",
      stampScale: Number(sceneProject.settings?.stampScale) || 1,
      activeStampId: null,
      fps: Number(sceneProject.settings?.fps) || 12,
      onionSkin: false,
      soloTrack: null,
      editTarget: "frame",
      layerVisibility: Array.isArray(sceneProject.settings?.layerVisibility)
        ? [...sceneProject.settings.layerVisibility]
        : [true, true, true],
      layerPaletteIndexes: Array.isArray(sceneProject.settings?.layerPaletteIndexes)
        ? [...sceneProject.settings.layerPaletteIndexes]
        : [0, 1, 2],
    },
    stamps,
    frames: [frame],
    backgroundClips: [backgroundClip],
    backgroundAssignments: [backgroundClip.id],
    treefortRoom: createRoomModeMeta(sourceState, manifest, space),
  };

  const outputPath =
    options.outputPath ??
    path.join(OUTPUT_DIR, `${sourceState.roomId}-${space.id}.room`);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(roomPackage, null, 2)}\n`, "utf8");

  const packageSummary = {
    schema: ROOM_PACKAGE_SCHEMA,
    schemaVersion: ROOM_PACKAGE_SCHEMA_VERSION,
    roomId: sourceState.roomId,
    spaceId: space.id,
    outputPath,
    includesUnderlay: Boolean(underlayStamp),
    sceneAssetPath: sceneAsset.path,
  };

  await writeJson(path.join(OUTPUT_DIR, `${sourceState.roomId}-${space.id}.json`), packageSummary);
  return packageSummary;
}

const options = parseArgs(process.argv.slice(2));
const result = await exportRoomPackage(options);
console.log(`Exported .room package for ${result.roomId}/${result.spaceId} to ${result.outputPath}.`);
