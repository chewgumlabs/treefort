export const ROOM_STATE_SCHEMA = "treefort-semantic-room-state";
export const ROOM_MANIFEST_SCHEMA = "treefort-semantic-room";
export const ROOM_ENGINE = "semantic-scene-v2";
export const LATEST_ROOM_SCHEMA_VERSION = 1;
export const LATEST_ROOM_STATE_SCHEMA_VERSION = 1;

export const STAGE_PRESET = {
  width: 256,
  height: 192,
  tileWidth: 4,
  tileHeight: 4,
  gridWidth: 64,
  gridHeight: 48,
  gutterLeft: 0,
  gutterRight: 0,
};

export const DEFAULT_ROOM_LIMITS = {
  maxSpaces: 12,
  maxLinks: 6,
  maxPaletteColors: 16,
  maxAssetCount: 64,
  maxAssetBytesPerFile: 4 * 1024 * 1024,
  maxAssetBytesTotal: 32 * 1024 * 1024,
  maxFillPatchesPerSpace: 64,
  maxSurfacePatchesPerSpace: 64,
  maxRegionsPerSpace: 32,
  maxPortalBindingsPerSpace: 24,
  maxRectsPerPatch: 24,
  maxRectsPerRegion: 24,
  maxTagsPerEntry: 12,
  maxLabelLength: 48,
  maxTitleLength: 64,
  maxBodyLength: 280,
  maxCaptionLength: 160,
  maxClickHintLength: 96,
  allowedAssetMimeTypes: ["image/png", "image/gif", "image/webp", "image/svg+xml", "application/json"],
  allowedAssetExtensions: [".png", ".gif", ".webp", ".svg", ".json"],
};

const ASSET_KINDS = new Set(["scene-lineart"]);
const REVEAL_STATES = new Set(["locked", "undrawn", "drawn"]);
const NAVIGATION_KINDS = new Set(["room", "bonus"]);
const SURFACE_TYPES = new Set([
  "void",
  "wall",
  "floor",
  "solid",
  "water",
  "bed",
  "desk",
  "shelf",
  "door",
  "poster",
  "rug",
]);

function fail(message) {
  throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
}

function assertOptionalString(value, label) {
  if (value === undefined || value === null) {
    return;
  }

  assertString(value, label);
}

function assertNumber(value, label, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    fail(`${label} must be a number between ${min} and ${max}`);
  }
}

function assertInteger(value, label, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  assertNumber(value, label, min, max);
  if (!Number.isInteger(value)) {
    fail(`${label} must be an integer`);
  }
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") {
    fail(`${label} must be a boolean`);
  }
}

function assertSlug(value, label) {
  assertString(value, label);
  if (!/^[a-z0-9-]+$/.test(value)) {
    fail(`${label} must contain only lowercase letters, numbers, and hyphens`);
  }
}

function assertHexColor(value, label) {
  assertString(value, label);
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    fail(`${label} must be a 6-digit hex color`);
  }
}

function assertDateString(value, label) {
  assertString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must be in YYYY-MM-DD format`);
  }
}

function assertUrlish(value, label) {
  assertString(value, label);
  const allowed =
    value.startsWith("https://") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("/") ||
    value.startsWith("http://localhost") ||
    value.startsWith("http://127.0.0.1");
  if (!allowed) {
    fail(`${label} must be https or a local development URL/path`);
  }
}

function assertAssetPath(value, label) {
  assertString(value, label);
  if (value.startsWith("data:image/")) {
    return;
  }

  const allowed = value.startsWith("assets/") || value.startsWith("./") || value.startsWith("../") || value.startsWith("/");
  if (!allowed) {
    fail(`${label} must be a local asset path or data:image URL`);
  }
}

function assertSafeTag(tag, label) {
  assertSlug(tag, label);
}

function validateTextLength(value, label, limit) {
  assertString(value, label);
  if (value.length > limit) {
    fail(`${label} must be at most ${limit} characters`);
  }
}

function validateOptionalTextLength(value, label, limit) {
  if (value === undefined || value === null) {
    return;
  }

  validateTextLength(value, label, limit);
}

function normalizeLimits(limits = {}) {
  const nextLimits = {
    ...DEFAULT_ROOM_LIMITS,
    ...(limits || {}),
  };

  return {
    ...nextLimits,
    allowedAssetMimeTypes: [...new Set([...DEFAULT_ROOM_LIMITS.allowedAssetMimeTypes, ...(limits.allowedAssetMimeTypes || [])])],
    allowedAssetExtensions: [...new Set([...DEFAULT_ROOM_LIMITS.allowedAssetExtensions, ...(limits.allowedAssetExtensions || [])])],
  };
}

function validateLimits(limits, label) {
  assertObject(limits, label);
  const normalized = normalizeLimits(limits);

  Object.entries(normalized).forEach(([key, value]) => {
    const entryLabel = `${label}.${key}`;
    if (Array.isArray(value)) {
      assertArray(value, entryLabel);
      return;
    }

    if (typeof value === "number") {
      assertNumber(value, entryLabel, 1, Number.MAX_SAFE_INTEGER);
      return;
    }

    fail(`${entryLabel} must be a number or array`);
  });

  normalized.allowedAssetMimeTypes.forEach((mimeType, index) => assertString(mimeType, `${label}.allowedAssetMimeTypes[${index}]`));
  normalized.allowedAssetExtensions.forEach((extension, index) =>
    assertString(extension, `${label}.allowedAssetExtensions[${index}]`),
  );

  return normalized;
}

function validateStage(stage, label) {
  assertObject(stage, label);
  Object.entries(STAGE_PRESET).forEach(([key, expected]) => {
    assertInteger(stage[key], `${label}.${key}`, expected, expected);
  });
  return clone(stage);
}

function validateLink(link, label, limits) {
  assertObject(link, label);
  validateTextLength(link.label, `${label}.label`, limits.maxLabelLength);
  if (link.muted !== undefined) {
    assertBoolean(link.muted, `${label}.muted`);
  }
  if (!link.muted) {
    assertUrlish(link.href, `${label}.href`);
  }
  return {
    label: link.label,
    ...(link.muted ? { muted: true } : { href: link.href }),
  };
}

function validatePalette(palette, label, limits) {
  assertArray(palette, label);
  if (palette.length === 0) {
    fail(`${label} must include at least one color`);
  }
  if (palette.length > limits.maxPaletteColors) {
    fail(`${label} exceeds maxPaletteColors of ${limits.maxPaletteColors}`);
  }

  const seenIds = new Set();
  return palette.map((entry, index) => {
    const entryLabel = `${label}[${index}]`;
    assertObject(entry, entryLabel);
    assertSlug(entry.id, `${entryLabel}.id`);
    if (seenIds.has(entry.id)) {
      fail(`${label} ids must be unique; duplicate "${entry.id}"`);
    }
    seenIds.add(entry.id);
    assertHexColor(entry.hex, `${entryLabel}.hex`);
    return {
      id: entry.id,
      hex: entry.hex.toLowerCase(),
    };
  });
}

function fileExtension(value) {
  const match = /\.[a-z0-9]+$/i.exec(value);
  return match ? match[0].toLowerCase() : "";
}

function validateAsset(asset, label, limits, stage) {
  assertObject(asset, label);
  assertSlug(asset.id, `${label}.id`);
  assertString(asset.kind, `${label}.kind`);
  if (!ASSET_KINDS.has(asset.kind)) {
    fail(`${label}.kind must be one of: ${[...ASSET_KINDS].join(", ")}`);
  }
  assertAssetPath(asset.path, `${label}.path`);
  assertNumber(asset.bytes, `${label}.bytes`, 1, limits.maxAssetBytesPerFile);
  assertString(asset.mimeType, `${label}.mimeType`);
  if (!limits.allowedAssetMimeTypes.includes(asset.mimeType)) {
    fail(`${label}.mimeType "${asset.mimeType}" is not allowed`);
  }
  if (!asset.path.startsWith("data:image/")) {
    const extension = fileExtension(asset.path);
    if (!limits.allowedAssetExtensions.includes(extension)) {
      fail(`${label}.path extension "${extension}" is not allowed`);
    }
    if (extension === ".json" && asset.kind !== "scene-lineart") {
      fail(`${label}.path extension ".json" is only allowed for scene-lineart assets`);
    }
  }
  assertInteger(asset.width, `${label}.width`, 1, stage.width);
  assertInteger(asset.height, `${label}.height`, 1, stage.height);
  validateOptionalTextLength(asset.source, `${label}.source`, limits.maxBodyLength);

  if (asset.kind === "scene-lineart") {
    if (asset.width !== stage.width || asset.height !== stage.height) {
      fail(`${label} scene-lineart assets must match the ${stage.width}x${stage.height} stage`);
    }
    if (asset.mimeType === "application/json" && fileExtension(asset.path) !== ".json") {
      fail(`${label} scene-lineart JSON assets must use a .json path`);
    }
  }

  return clone(asset);
}

function validateRect(rect, label, stage, limit) {
  assertObject(rect, label);
  assertInteger(rect.x, `${label}.x`, 0, stage.gridWidth - 1);
  assertInteger(rect.y, `${label}.y`, 0, stage.gridHeight - 1);
  assertInteger(rect.width, `${label}.width`, 1, stage.gridWidth);
  assertInteger(rect.height, `${label}.height`, 1, stage.gridHeight);
  if (rect.x + rect.width > stage.gridWidth) {
    fail(`${label}.x + width exceeds gridWidth ${stage.gridWidth}`);
  }
  if (rect.y + rect.height > stage.gridHeight) {
    fail(`${label}.y + height exceeds gridHeight ${stage.gridHeight}`);
  }

  if (limit !== undefined && rect.width * rect.height > limit) {
    fail(`${label} exceeds the allowed area limit`);
  }

  return clone(rect);
}

function validateRectCollection(rects, label, stage, maxRects) {
  assertArray(rects, label);
  if (rects.length === 0) {
    fail(`${label} must include at least one rect`);
  }
  if (rects.length > maxRects) {
    fail(`${label} exceeds max rect count of ${maxRects}`);
  }
  return rects.map((rect, index) => validateRect(rect, `${label}[${index}]`, stage));
}

function validateTagCollection(tags, label, limits) {
  if (tags === undefined) {
    return [];
  }

  assertArray(tags, label);
  if (tags.length > limits.maxTagsPerEntry) {
    fail(`${label} exceeds maxTagsPerEntry of ${limits.maxTagsPerEntry}`);
  }

  const seen = new Set();
  return tags.map((tag, index) => {
    const tagLabel = `${label}[${index}]`;
    assertSafeTag(tag, tagLabel);
    if (seen.has(tag)) {
      fail(`${label} must be unique; duplicate "${tag}"`);
    }
    seen.add(tag);
    return tag;
  });
}

function validateFillPatch(patch, label, context) {
  assertObject(patch, label);
  assertSlug(patch.colorId, `${label}.colorId`);
  if (!context.paletteIds.has(patch.colorId)) {
    fail(`${label}.colorId "${patch.colorId}" does not exist`);
  }
  return {
    colorId: patch.colorId,
    rects: validateRectCollection(patch.rects, `${label}.rects`, context.stage, context.limits.maxRectsPerPatch),
  };
}

function validateSurfacePatch(patch, label, context) {
  assertObject(patch, label);
  assertString(patch.surface, `${label}.surface`);
  if (!SURFACE_TYPES.has(patch.surface)) {
    fail(`${label}.surface must be one of: ${[...SURFACE_TYPES].join(", ")}`);
  }
  return {
    surface: patch.surface,
    tags: validateTagCollection(patch.tags, `${label}.tags`, context.limits),
    rects: validateRectCollection(patch.rects, `${label}.rects`, context.stage, context.limits.maxRectsPerPatch),
  };
}

function validateRegion(region, label, context) {
  assertObject(region, label);
  assertSlug(region.id, `${label}.id`);
  validateTextLength(region.label, `${label}.label`, context.limits.maxLabelLength);
  validateOptionalTextLength(region.clickHint, `${label}.clickHint`, context.limits.maxClickHintLength);
  return {
    id: region.id,
    label: region.label,
    rects: validateRectCollection(region.rects, `${label}.rects`, context.stage, context.limits.maxRectsPerRegion),
    tags: validateTagCollection(region.tags, `${label}.tags`, context.limits),
    ...(region.clickHint ? { clickHint: region.clickHint } : {}),
  };
}

function validatePortalBinding(binding, label, context, regionIds, spaceIds) {
  assertObject(binding, label);
  assertSlug(binding.regionId, `${label}.regionId`);
  if (!regionIds.has(binding.regionId)) {
    fail(`${label}.regionId "${binding.regionId}" does not exist in the current space`);
  }

  const destinationFields = ["targetSpaceId", "roomUrl", "externalUrl"].filter((field) => binding[field] !== undefined);
  if (destinationFields.length !== 1) {
    fail(`${label} must declare exactly one destination`);
  }

  const nextBinding = {
    regionId: binding.regionId,
  };

  if (binding.targetSpaceId !== undefined) {
    assertSlug(binding.targetSpaceId, `${label}.targetSpaceId`);
    if (!spaceIds.has(binding.targetSpaceId)) {
      fail(`${label}.targetSpaceId "${binding.targetSpaceId}" does not exist`);
    }
    nextBinding.targetSpaceId = binding.targetSpaceId;
  }

  if (binding.roomUrl !== undefined) {
    assertUrlish(binding.roomUrl, `${label}.roomUrl`);
    nextBinding.roomUrl = binding.roomUrl;
  }

  if (binding.externalUrl !== undefined) {
    assertUrlish(binding.externalUrl, `${label}.externalUrl`);
    nextBinding.externalUrl = binding.externalUrl;
  }

  return nextBinding;
}

function validateScoreGoal(goal, label, context) {
  assertObject(goal, label);
  assertSlug(goal.id, `${label}.id`);
  assertSlug(goal.labelId, `${label}.labelId`);
  validateTextLength(goal.label, `${label}.label`, context.limits.maxLabelLength);
  assertInteger(goal.minCells, `${label}.minCells`, 1, context.stage.gridWidth * context.stage.gridHeight);
  validateOptionalTextLength(goal.hint, `${label}.hint`, context.limits.maxBodyLength);

  return {
    id: goal.id,
    labelId: goal.labelId,
    label: goal.label,
    minCells: goal.minCells,
    ...(goal.hint ? { hint: goal.hint } : {}),
  };
}

function validateSpace(space, label, context) {
  assertObject(space, label);
  assertSlug(space.id, `${label}.id`);
  const navigationKind = space.navigationKind ?? "room";
  assertString(navigationKind, `${label}.navigationKind`);
  if (!NAVIGATION_KINDS.has(navigationKind)) {
    fail(`${label}.navigationKind must be one of: ${[...NAVIGATION_KINDS].join(", ")}`);
  }
  validateTextLength(space.title, `${label}.title`, context.limits.maxTitleLength);
  validateOptionalTextLength(space.description, `${label}.description`, context.limits.maxBodyLength);
  assertString(space.revealState, `${label}.revealState`);
  if (!REVEAL_STATES.has(space.revealState)) {
    fail(`${label}.revealState must be one of: ${[...REVEAL_STATES].join(", ")}`);
  }
  validateTextLength(space.placeholderPrompt, `${label}.placeholderPrompt`, context.limits.maxBodyLength);

  if (space.sceneArtAssetId !== undefined && space.sceneArtAssetId !== null) {
    assertSlug(space.sceneArtAssetId, `${label}.sceneArtAssetId`);
    const asset = context.assetById.get(space.sceneArtAssetId);
    if (!asset) {
      fail(`${label}.sceneArtAssetId "${space.sceneArtAssetId}" does not exist`);
    }
    if (asset.kind !== "scene-lineart") {
      fail(`${label}.sceneArtAssetId "${space.sceneArtAssetId}" must reference a scene-lineart asset`);
    }
  }

  if (space.revealState === "drawn" && !space.sceneArtAssetId) {
    fail(`${label}.sceneArtAssetId is required when revealState is "drawn"`);
  }

  if (space.revealState !== "drawn" && space.sceneArtAssetId) {
    fail(`${label}.sceneArtAssetId must be empty unless revealState is "drawn"`);
  }

  assertArray(space.fillPatches, `${label}.fillPatches`);
  if (space.fillPatches.length > context.limits.maxFillPatchesPerSpace) {
    fail(`${label}.fillPatches exceeds maxFillPatchesPerSpace of ${context.limits.maxFillPatchesPerSpace}`);
  }

  assertArray(space.surfacePatches, `${label}.surfacePatches`);
  if (space.surfacePatches.length > context.limits.maxSurfacePatchesPerSpace) {
    fail(
      `${label}.surfacePatches exceeds maxSurfacePatchesPerSpace of ${context.limits.maxSurfacePatchesPerSpace}`,
    );
  }

  assertArray(space.regions, `${label}.regions`);
  if (space.regions.length > context.limits.maxRegionsPerSpace) {
    fail(`${label}.regions exceeds maxRegionsPerSpace of ${context.limits.maxRegionsPerSpace}`);
  }

  assertArray(space.portalBindings, `${label}.portalBindings`);
  if (space.portalBindings.length > context.limits.maxPortalBindingsPerSpace) {
    fail(
      `${label}.portalBindings exceeds maxPortalBindingsPerSpace of ${context.limits.maxPortalBindingsPerSpace}`,
    );
  }

  assertArray(space.scoreGoals ?? [], `${label}.scoreGoals`);

  const regionIds = new Set();
  const validatedRegions = space.regions.map((region, index) => {
    const nextRegion = validateRegion(region, `${label}.regions[${index}]`, context);
    if (regionIds.has(nextRegion.id)) {
      fail(`${label}.regions ids must be unique; duplicate "${nextRegion.id}"`);
    }
    regionIds.add(nextRegion.id);
    return nextRegion;
  });

  const scoreGoalIds = new Set();
  const validatedScoreGoals = (space.scoreGoals ?? []).map((goal, index) => {
    const nextGoal = validateScoreGoal(goal, `${label}.scoreGoals[${index}]`, context);
    if (scoreGoalIds.has(nextGoal.id)) {
      fail(`${label}.scoreGoals ids must be unique; duplicate "${nextGoal.id}"`);
    }
    scoreGoalIds.add(nextGoal.id);
    return nextGoal;
  });

  return {
    id: space.id,
    navigationKind,
    title: space.title,
    ...(space.description ? { description: space.description } : {}),
    revealState: space.revealState,
    sceneArtAssetId: space.sceneArtAssetId ?? null,
    placeholderPrompt: space.placeholderPrompt,
    fillPatches: space.fillPatches.map((patch, index) => validateFillPatch(patch, `${label}.fillPatches[${index}]`, context)),
    surfacePatches: space.surfacePatches.map((patch, index) =>
      validateSurfacePatch(patch, `${label}.surfacePatches[${index}]`, context),
    ),
    scoreGoals: validatedScoreGoals,
    regions: validatedRegions,
    portalBindings: space.portalBindings.map((binding, index) =>
      validatePortalBinding(binding, `${label}.portalBindings[${index}]`, context, regionIds, context.spaceIds),
    ),
  };
}

function validateRoomDocument(document, expectedSchema) {
  assertObject(document, "semantic room");
  assertString(document.schema, "semantic room schema");
  if (document.schema !== expectedSchema) {
    fail(`semantic room schema must be "${expectedSchema}"`);
  }
  assertInteger(
    document.schemaVersion,
    "semantic room schemaVersion",
    LATEST_ROOM_STATE_SCHEMA_VERSION,
    LATEST_ROOM_STATE_SCHEMA_VERSION,
  );
  assertSlug(document.roomId, "semantic room roomId");
  assertString(document.roomEngine, "semantic room roomEngine");
  if (document.roomEngine !== ROOM_ENGINE) {
    fail(`semantic room roomEngine must be "${ROOM_ENGINE}"`);
  }

  assertObject(document.owner, "semantic room owner");
  validateTextLength(document.owner.displayName, "semantic room owner.displayName", DEFAULT_ROOM_LIMITS.maxTitleLength);
  assertString(document.owner.githubLogin, "semantic room owner.githubLogin");
  assertString(document.owner.repo, "semantic room owner.repo");
  assertUrlish(document.owner.siteUrl, "semantic room owner.siteUrl");

  assertObject(document.presentation, "semantic room presentation");
  validateTextLength(document.presentation.eyebrow, "semantic room presentation.eyebrow", DEFAULT_ROOM_LIMITS.maxLabelLength);
  validateTextLength(document.presentation.title, "semantic room presentation.title", DEFAULT_ROOM_LIMITS.maxTitleLength);
  validateTextLength(document.presentation.description, "semantic room presentation.description", DEFAULT_ROOM_LIMITS.maxBodyLength);

  if (document.updatedAt !== undefined) {
    assertDateString(document.updatedAt, "semantic room updatedAt");
  }

  const stage = validateStage(document.stage, "semantic room stage");
  const limits = validateLimits(document.limits || DEFAULT_ROOM_LIMITS, "semantic room limits");

  assertArray(document.links ?? [], "semantic room links");
  if ((document.links ?? []).length > limits.maxLinks) {
    fail(`semantic room links exceed maxLinks of ${limits.maxLinks}`);
  }

  const links = (document.links ?? []).map((link, index) => validateLink(link, `semantic room links[${index}]`, limits));
  const palette = validatePalette(document.palette, "semantic room palette", limits);
  const paletteIds = new Set(palette.map((entry) => entry.id));

  assertArray(document.assets, "semantic room assets");
  if (document.assets.length > limits.maxAssetCount) {
    fail(`semantic room assets exceed maxAssetCount of ${limits.maxAssetCount}`);
  }

  let totalAssetBytes = 0;
  const assetById = new Map();
  const assets = document.assets.map((asset, index) => {
    const nextAsset = validateAsset(asset, `semantic room assets[${index}]`, limits, stage);
    if (assetById.has(nextAsset.id)) {
      fail(`semantic room assets ids must be unique; duplicate "${nextAsset.id}"`);
    }
    assetById.set(nextAsset.id, nextAsset);
    totalAssetBytes += nextAsset.bytes;
    return nextAsset;
  });

  if (totalAssetBytes > limits.maxAssetBytesTotal) {
    fail(`semantic room assets exceed maxAssetBytesTotal of ${limits.maxAssetBytesTotal}`);
  }

  assertArray(document.spaces, "semantic room spaces");
  if (document.spaces.length === 0) {
    fail("semantic room spaces must include at least one space");
  }
  if (document.spaces.length > limits.maxSpaces) {
    fail(`semantic room spaces exceed maxSpaces of ${limits.maxSpaces}`);
  }

  const spaceIds = new Set();
  document.spaces.forEach((space, index) => {
    assertObject(space, `semantic room spaces[${index}]`);
    assertSlug(space.id, `semantic room spaces[${index}].id`);
    if (spaceIds.has(space.id)) {
      fail(`semantic room spaces ids must be unique; duplicate "${space.id}"`);
    }
    spaceIds.add(space.id);
  });

  assertSlug(document.entrySpaceId, "semantic room entrySpaceId");
  if (!spaceIds.has(document.entrySpaceId)) {
    fail(`semantic room entrySpaceId "${document.entrySpaceId}" does not exist`);
  }

  const spaceContext = {
    stage,
    limits,
    paletteIds,
    assetById,
    spaceIds,
  };

  const spaces = document.spaces.map((space, index) => validateSpace(space, `semantic room spaces[${index}]`, spaceContext));

  return {
    schema: expectedSchema,
    schemaVersion: LATEST_ROOM_STATE_SCHEMA_VERSION,
    roomId: document.roomId,
    roomEngine: ROOM_ENGINE,
    owner: clone(document.owner),
    presentation: clone(document.presentation),
    ...(document.updatedAt ? { updatedAt: document.updatedAt } : {}),
    links,
    stage,
    limits,
    palette,
    assets,
    entrySpaceId: document.entrySpaceId,
    spaces,
  };
}

export function validateSemanticRoomState(state) {
  return validateRoomDocument(state, ROOM_STATE_SCHEMA);
}

export function validateRoomManifestDocument(manifest) {
  return validateRoomDocument(manifest, ROOM_MANIFEST_SCHEMA);
}

export function compileRoomManifest(state) {
  const validated = validateSemanticRoomState(state);
  return {
    ...validated,
    schema: ROOM_MANIFEST_SCHEMA,
    schemaVersion: LATEST_ROOM_SCHEMA_VERSION,
  };
}

export function cloneRoomDocument(document) {
  return clone(document);
}
