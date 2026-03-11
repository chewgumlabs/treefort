import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  compileRoomManifest,
  validateRoomManifestDocument,
  validateSemanticRoomState,
} from "../shared/room-compiler-core.mjs";
import { writeJson } from "./lib/manifests.mjs";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const STATE_PATH = path.join(ROOT_DIR, "room/source/semantic-room-state.json");
const ROOM_OUTPUT_PATH = path.join(ROOT_DIR, "room/data/room.json");
const ROOM_ASSET_DIR = path.join(ROOT_DIR, "room/assets/imports/icy");
const REPORT_PATH = path.join(ROOT_DIR, "build/icy-import-report.json");
const PLAN_SCHEMA = "treefort-icy-import-plan";
const PLAN_SCHEMA_VERSION = 2;
const IMPORT_KINDS = new Set(["scene-lineart"]);
const ICY_SCREEN_WIDTH = 256;
const ICY_SCREEN_HEIGHT = 192;

function fail(message) {
  throw new Error(message);
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9-]+$/.test(value);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeAbsoluteJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    planPath: null,
  };

  argv.forEach((argument) => {
    if (argument === "--dry-run") {
      options.dryRun = true;
      return;
    }
    if (!options.planPath) {
      options.planPath = argument;
      return;
    }
    fail(`Unknown argument "${argument}"`);
  });

  if (!options.planPath) {
    fail("Usage: npm run bridge:icy -- <import-plan.json> [--dry-run]");
  }

  return options;
}

function validatePlan(plan) {
  assertObject(plan, "Icy bridge plan");
  if (plan.schema !== PLAN_SCHEMA) {
    fail(`Icy bridge plan schema must be "${PLAN_SCHEMA}"`);
  }
  if (plan.schemaVersion !== PLAN_SCHEMA_VERSION) {
    fail(`Icy bridge plan schemaVersion must be ${PLAN_SCHEMA_VERSION}`);
  }
  if (!isSlug(plan.roomId)) {
    fail("Icy bridge plan roomId must be a slug");
  }
  if (plan.sourceRoot !== undefined) {
    assertString(plan.sourceRoot, "Icy bridge plan sourceRoot");
  }
  if (!Array.isArray(plan.imports) || plan.imports.length === 0) {
    fail("Icy bridge plan imports must be a non-empty array");
  }

  plan.imports.forEach((entry, index) => {
    const label = `Icy bridge plan imports[${index}]`;
    assertObject(entry, label);
    assertString(entry.input, `${label}.input`);
    if (!isSlug(entry.assetId)) {
      fail(`${label}.assetId must be a slug`);
    }
    assertString(entry.kind, `${label}.kind`);
    if (!IMPORT_KINDS.has(entry.kind)) {
      fail(`${label}.kind must be one of: ${[...IMPORT_KINDS].join(", ")}`);
    }

    const actions = ["assignScene"].filter((field) => entry[field] !== undefined);
    if (actions.length > 1) {
      fail(`${label} can only declare one assignment action`);
    }

    if (entry.assignScene !== undefined) {
      assertObject(entry.assignScene, `${label}.assignScene`);
      if (!isSlug(entry.assignScene.spaceId)) {
        fail(`${label}.assignScene.spaceId must be a slug`);
      }
      if (entry.assignScene.resetSemanticData !== undefined && typeof entry.assignScene.resetSemanticData !== "boolean") {
        fail(`${label}.assignScene.resetSemanticData must be a boolean`);
      }
    }
  });

  return plan;
}

function resolveImportSource(planPath, plan, inputPath) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  const planDir = path.dirname(planPath);
  if (plan.sourceRoot) {
    return path.resolve(planDir, plan.sourceRoot, inputPath);
  }

  return path.resolve(planDir, inputPath);
}

function detectPng(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    fail("PNG import has an invalid signature");
  }

  return {
    mimeType: "image/png",
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function detectGif(buffer) {
  const signature = buffer.subarray(0, 6).toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    fail("GIF import has an invalid signature");
  }

  return {
    mimeType: "image/gif",
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function detectWebp(buffer) {
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff !== "RIFF" || webp !== "WEBP") {
    fail("WEBP import has an invalid signature");
  }

  const chunkType = buffer.subarray(12, 16).toString("ascii");
  if (chunkType === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return {
      mimeType: "image/webp",
      width,
      height,
    };
  }

  fail("WEBP import must use a VP8X header");
}

function detectImageMeta(filePath, buffer) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") {
    return {
      extension,
      ...detectPng(buffer),
    };
  }
  if (extension === ".gif") {
    return {
      extension,
      ...detectGif(buffer),
    };
  }
  if (extension === ".webp") {
    return {
      extension,
      ...detectWebp(buffer),
    };
  }

  fail(`Unsupported IcyAnimation import extension "${extension}". Use PNG, GIF, or WEBP exports.`);
}

function getIcyFrame(project) {
  if (!Array.isArray(project.frames) || project.frames.length === 0) {
    fail("IcyAnimation project must include at least one frame");
  }

  const requestedIndex = Math.max(0, Math.min(project.frames.length - 1, Number(project.settings?.currentFrameIndex) || 0));
  return {
    frame: project.frames[requestedIndex],
    frameIndex: requestedIndex,
  };
}

function getIcyBackgroundClip(project, frameIndex) {
  const clipId = project.backgroundAssignments?.[frameIndex];
  if (!clipId) {
    return null;
  }

  return project.backgroundClips?.find((clip) => clip.id === clipId) ?? null;
}

function validateNoUnsupportedObjects(frameLike, label) {
  if (!Array.isArray(frameLike?.objects) || frameLike.objects.length === 0) {
    return;
  }

  fail(`${label} contains frame objects. The bridge only supports flattened layer-based room art right now.`);
}

function detectImportedAsset(filePath, buffer, kind) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".icy" || extension === ".room") {
    if (kind !== "scene-lineart") {
      fail("IcyAnimation project imports are only supported for scene-lineart assets");
    }

    const project = JSON.parse(buffer.toString("utf8"));
    const { frame, frameIndex } = getIcyFrame(project);
    const backgroundClip = getIcyBackgroundClip(project, frameIndex);
    const isRoomPackage = extension === ".room";
    validateNoUnsupportedObjects(frame, `IcyAnimation frame ${frameIndex + 1}`);
    if (backgroundClip && !isRoomPackage) {
      validateNoUnsupportedObjects(backgroundClip, `IcyAnimation background clip ${backgroundClip.id}`);
    }
    return {
      extension: ".json",
      mimeType: "application/json",
      width: ICY_SCREEN_WIDTH,
      height: ICY_SCREEN_HEIGHT,
      output: buffer,
      sourceLabel: `IcyAnimation:${path.basename(filePath)}`,
      treefortRoomMeta: clone(project.treefortRoom ?? null),
    };
  }

  const detected = detectImageMeta(filePath, buffer);
  return {
    ...detected,
    output: buffer,
    sourceLabel: `IcyAnimation:${path.basename(filePath)}`,
  };
}

function upsertAsset(assets, nextAsset) {
  const existingIndex = assets.findIndex((asset) => asset.id === nextAsset.id);
  if (existingIndex === -1) {
    assets.push(nextAsset);
    return;
  }
  assets[existingIndex] = nextAsset;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createGrid(stage, fillValue = null) {
  return Array.from({ length: stage.gridHeight }, () => Array.from({ length: stage.gridWidth }, () => fillValue));
}

function normalizeDraftGrid(grid, stage, label) {
  if (!Array.isArray(grid) || grid.length !== stage.gridHeight) {
    fail(`${label} must be a ${stage.gridHeight}-row grid`);
  }
  if (!grid.every((row) => Array.isArray(row) && row.length === stage.gridWidth)) {
    fail(`${label} must have ${stage.gridWidth} columns in every row`);
  }
  return grid;
}

function compressGridValueToRects(grid, targetValue) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visited = Array.from({ length: height }, () => Array.from({ length: width }, () => false));
  const rects = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (visited[y][x] || grid[y][x] !== targetValue) {
        continue;
      }

      let rectWidth = 1;
      while (x + rectWidth < width && !visited[y][x + rectWidth] && grid[y][x + rectWidth] === targetValue) {
        rectWidth += 1;
      }

      let rectHeight = 1;
      outer: while (y + rectHeight < height) {
        for (let offsetX = 0; offsetX < rectWidth; offsetX += 1) {
          if (visited[y + rectHeight][x + offsetX] || grid[y + rectHeight][x + offsetX] !== targetValue) {
            break outer;
          }
        }
        rectHeight += 1;
      }

      for (let offsetY = 0; offsetY < rectHeight; offsetY += 1) {
        for (let offsetX = 0; offsetX < rectWidth; offsetX += 1) {
          visited[y + offsetY][x + offsetX] = true;
        }
      }

      rects.push({
        x,
        y,
        width: rectWidth,
        height: rectHeight,
      });
    }
  }

  return rects;
}

function chunkRects(rects, maxRectsPerPatch) {
  const chunks = [];
  for (let index = 0; index < rects.length; index += maxRectsPerPatch) {
    chunks.push(rects.slice(index, index + maxRectsPerPatch));
  }
  return chunks;
}

function buildFillPatchesFromGrid(fillGrid, context) {
  const normalizedGrid = normalizeDraftGrid(fillGrid, context.stage, "treefortRoom.spaceDraft.fillGrid");
  const colorIds = new Set();

  normalizedGrid.forEach((row) => {
    row.forEach((value) => {
      if (typeof value === "string" && value.length > 0) {
        colorIds.add(value);
      }
    });
  });

  const patches = [];
  colorIds.forEach((colorId) => {
    if (!context.paletteIds.has(colorId)) {
      fail(`treefortRoom.spaceDraft.fillGrid color "${colorId}" does not exist in the current palette`);
    }
    const rects = compressGridValueToRects(normalizedGrid, colorId);
    chunkRects(rects, context.limits.maxRectsPerPatch).forEach((chunk) => {
      patches.push({
        colorId,
        rects: chunk,
      });
    });
  });

  return patches;
}

function buildSurfacePatchesFromLabelGrid(labelGrid, context) {
  const normalizedGrid = normalizeDraftGrid(labelGrid, context.stage, "treefortRoom.spaceDraft.labelGrid");
  const labelSpecs = new Map([
    ["floor", { surface: "floor", tags: [] }],
    ["opening", { surface: "door", tags: ["opening"] }],
    ["poster", { surface: "poster", tags: ["poster"] }],
    ["prop", { surface: "solid", tags: ["prop"] }],
    ["solid", { surface: "solid", tags: [] }],
  ]);
  const patches = [];

  labelSpecs.forEach((spec, labelId) => {
    const rects = compressGridValueToRects(normalizedGrid, labelId);
    if (!rects.length) {
      return;
    }

    chunkRects(rects, context.limits.maxRectsPerPatch).forEach((chunk) => {
      patches.push({
        surface: spec.surface,
        ...(spec.tags.length ? { tags: spec.tags } : {}),
        rects: chunk,
      });
    });
  });

  return patches;
}

function applyTreefortRoomMeta(nextState, treefortRoomMeta, targetSpaceId) {
  if (!treefortRoomMeta || typeof treefortRoomMeta !== "object") {
    return false;
  }

  const space = nextState.spaces.find((candidate) => candidate.id === targetSpaceId);
  if (!space) {
    fail(`Space "${targetSpaceId}" does not exist for imported room metadata`);
  }

  const context = {
    stage: nextState.stage,
    limits: nextState.limits,
    paletteIds: new Set(nextState.palette.map((entry) => entry.id)),
  };

  const draft = treefortRoomMeta.spaceDraft;
  if (draft && typeof draft === "object") {
    if (draft.fillGrid !== undefined) {
      space.fillPatches = buildFillPatchesFromGrid(draft.fillGrid, context);
    }
    if (draft.labelGrid !== undefined) {
      space.surfacePatches = buildSurfacePatchesFromLabelGrid(draft.labelGrid, context);
    }
    if (Array.isArray(draft.regions)) {
      space.regions = clone(draft.regions);
    }
    if (Array.isArray(draft.portalBindings)) {
      space.portalBindings = clone(draft.portalBindings);
    }
    if (typeof draft.title === "string" && draft.title.trim()) {
      space.title = draft.title.trim();
    }
    if (typeof draft.description === "string") {
      space.description = draft.description;
    }
    if (typeof draft.placeholderPrompt === "string" && draft.placeholderPrompt.trim()) {
      space.placeholderPrompt = draft.placeholderPrompt.trim();
    }
    return true;
  }

  const sourceSpace = treefortRoomMeta.sourceState?.spaces?.find((candidate) => candidate.id === targetSpaceId);
  if (sourceSpace) {
    space.fillPatches = clone(sourceSpace.fillPatches ?? []);
    space.surfacePatches = clone(sourceSpace.surfacePatches ?? []);
    space.regions = clone(sourceSpace.regions ?? []);
    space.portalBindings = clone(sourceSpace.portalBindings ?? []);
    if (typeof sourceSpace.title === "string" && sourceSpace.title.trim()) {
      space.title = sourceSpace.title.trim();
    }
    if (typeof sourceSpace.description === "string") {
      space.description = sourceSpace.description;
    }
    if (typeof sourceSpace.placeholderPrompt === "string" && sourceSpace.placeholderPrompt.trim()) {
      space.placeholderPrompt = sourceSpace.placeholderPrompt.trim();
    }
    return true;
  }

  return false;
}

async function main() {
  const { planPath, dryRun } = parseArgs(process.argv.slice(2));
  const absolutePlanPath = path.resolve(ROOT_DIR, planPath);
  const plan = validatePlan(await readJson(absolutePlanPath));
  const state = validateSemanticRoomState(await readJson(STATE_PATH));

  if (plan.roomId !== state.roomId) {
    fail(`Icy bridge plan roomId "${plan.roomId}" does not match room state "${state.roomId}"`);
  }

  const nextState = clone(state);
  const importedAssets = [];

  for (const entry of plan.imports) {
    const sourcePath = resolveImportSource(absolutePlanPath, plan, entry.input);
    const buffer = await fs.readFile(sourcePath);
    const detected = detectImportedAsset(sourcePath, buffer, entry.kind);
    const targetFileName = `${entry.assetId}${detected.extension}`;
    const targetRelativePath = path.posix.join("assets", "imports", "icy", targetFileName);
    const targetAbsolutePath = path.join(ROOM_ASSET_DIR, targetFileName);

    if (!dryRun) {
      await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true });
      await fs.writeFile(targetAbsolutePath, detected.output);
    }

    const assetRecord = {
      id: entry.assetId,
      kind: entry.kind,
      path: targetRelativePath,
      bytes: detected.output.byteLength,
      mimeType: detected.mimeType,
      width: detected.width,
      height: detected.height,
      source: detected.sourceLabel,
    };

    upsertAsset(nextState.assets, assetRecord);

    if (entry.assignScene) {
      const space = nextState.spaces.find((candidate) => candidate.id === entry.assignScene.spaceId);
      if (!space) {
        fail(`Space "${entry.assignScene.spaceId}" does not exist for asset "${entry.assetId}"`);
      }
      space.sceneArtAssetId = entry.assetId;
      if (space.revealState !== "locked") {
        space.revealState = "drawn";
      }
      if (entry.assignScene.resetSemanticData) {
        space.fillPatches = [];
        space.surfacePatches = [];
        space.regions = [];
        space.portalBindings = [];
      }

      if (detected.treefortRoomMeta) {
        applyTreefortRoomMeta(nextState, detected.treefortRoomMeta, entry.assignScene.spaceId);
      }
    }

    importedAssets.push({
      assetId: assetRecord.id,
      kind: assetRecord.kind,
      sourcePath,
      targetPath: targetRelativePath,
      bytes: assetRecord.bytes,
    });
  }

  const validatedState = validateSemanticRoomState(nextState);
  const manifest = compileRoomManifest(validatedState);
  validateRoomManifestDocument(manifest);

  const report = {
    schema: "treefort-icy-import-report",
    schemaVersion: 1,
    roomId: validatedState.roomId,
    dryRun,
    importedAt: new Date().toISOString(),
    importedAssets,
    wroteStatePath: dryRun ? null : path.relative(ROOT_DIR, STATE_PATH),
    wroteManifestPath: dryRun ? null : path.relative(ROOT_DIR, ROOM_OUTPUT_PATH),
  };

  if (!dryRun) {
    await writeAbsoluteJson(STATE_PATH, validatedState);
    await writeJson("room/data/room.json", manifest);
  }
  await writeAbsoluteJson(REPORT_PATH, report);

  console.log(
    `${dryRun ? "Dry-ran" : "Imported"} ${importedAssets.length} IcyAnimation asset${
      importedAssets.length === 1 ? "" : "s"
    } for ${validatedState.roomId}.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
