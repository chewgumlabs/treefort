const roomEyebrow = document.getElementById("room-eyebrow");
const roomTitle = document.getElementById("room-title");
const roomStage = document.getElementById("room-stage");
const fillLayer = document.getElementById("fill-layer");
const fillContext = fillLayer.getContext("2d");
const sceneCanvas = document.getElementById("scene-canvas");
const sceneContext = sceneCanvas.getContext("2d");
const sceneLineart = document.getElementById("scene-lineart");
const labelLayer = document.getElementById("label-layer");
const labelContext = labelLayer.getContext("2d");
const editorLayer = document.getElementById("editor-layer");
const editorContext = editorLayer.getContext("2d");
const regionLayer = document.getElementById("region-layer");
const hoverTitle = document.getElementById("hover-title");
const sceneEyebrow = document.getElementById("scene-eyebrow");
const sceneTitle = document.getElementById("scene-title");
const stageStatus = document.getElementById("stage-status");
const criticDialog = document.getElementById("critic-dialog");
const criticDialogText = document.getElementById("critic-dialog-text");
const authorScore = document.getElementById("author-score");
const leftPanelWindow = document.getElementById("left-panel-window");
const leftPanelTitle = document.getElementById("left-panel-title");
const leftPanelBody = document.getElementById("left-panel-body");
const labelKeyWindow = document.getElementById("label-key-window");
const supportWindow = document.getElementById("support-window");
const paintPanel = document.getElementById("paint-panel");
const labelPanel = document.getElementById("label-panel");
const interactivePanel = document.getElementById("interactive-panel");
const paintSwatches = document.getElementById("paint-swatches");
const labelBrushes = document.getElementById("label-brushes");
const supportBrushes = document.getElementById("support-brushes");
const labelKey = document.getElementById("label-key");
const interactionTypeButtons = [...document.querySelectorAll("[data-interaction-type]")];
const interactiveSelectedSwatch = document.getElementById("interactive-selected-swatch");
const interactiveSelectedValue = document.getElementById("interactive-selected-value");
const interactionTitleWindow = document.getElementById("interaction-title-window");
const interactionDescriptionWindow = document.getElementById("interaction-description-window");
const interactionActionWindow = document.getElementById("interaction-action-window");
const interactionSaveWindow = document.getElementById("interaction-save-window");
const interactionTitleInput = document.getElementById("interaction-title");
const interactionDescriptionInput = document.getElementById("interaction-description");
const interactionTargetField = document.getElementById("interaction-target-field");
const interactionSecretTarget = document.getElementById("interaction-secret-target");
const saveInteractionButton = document.getElementById("save-interaction-button");
const clearInteractionButton = document.getElementById("clear-interaction-button");
const artUploadWindow = document.getElementById("art-upload-window");
const artUploadButton = document.getElementById("art-upload-button");
const artUploadStatus = document.getElementById("art-upload-status");
const artGifInput = document.getElementById("art-gif-input");
const gifOverlay = document.getElementById("gif-overlay");
const gifOverlayImage = document.getElementById("gif-overlay-image");
const noteOverlay = document.getElementById("note-overlay");
const noteOverlayTitle = document.getElementById("note-overlay-title");
const noteOverlayBody = document.getElementById("note-overlay-body");
const navForwardButton = document.getElementById("nav-forward");
const navBackwardButton = document.getElementById("nav-backward");
const navTreefortButton = document.getElementById("nav-treefort");
const navBonusButton = document.getElementById("nav-bonus");
const importRoomButton = document.getElementById("import-room-button");
const importRoomInput = document.getElementById("import-room-input");
const exportRoomButton = document.getElementById("export-room-button");
const toolButtons = [...document.querySelectorAll(".author-tool[data-tool]")];

const debugRegions = new URLSearchParams(window.location.search).get("debug") === "1";
const ERASE_ID = "__erase__";
const LOCAL_DRAFT_PREFIX = "treefort-room-draft-v4:";
const ICY_LAYER_COLORS = ["#17191d", "#ef8f50", "#4d9fe7", "#2db8a1", "#de6a8b", "#f5c74e"];
const ROOM_META_SCHEMA = "treefort-room-hidden-meta";
const ROOM_META_SCHEMA_VERSION = 1;
const ROOM_BACKGROUND_NOTICE = "ROOM COLORS ARE NOT EDITABLE";
const ROOM_WARNING =
  "Your tags will be saved, and your colors will be shown on the background side in IcyAnimation for reference. Changes to that reference do not carry back into the bedroom.";
const SUPPORT_MESSAGE = "... Support lines let a pet know where it can stand and walk. If one arrives...";
const SCENE_OVERRIDE_STORAGE_PREFIX = "treefort-room-scene-v1:";
const PAINT_SWATCHES = [
  { id: "p01", label: "P01", hex: "#3f4328" },
  { id: "p02", label: "P02", hex: "#5f7132" },
  { id: "p03", label: "P03", hex: "#94ad39" },
  { id: "p04", label: "P04", hex: "#c2d64f" },
  { id: "p05", label: "P05", hex: "#eff37c" },
  { id: "p06", label: "P06", hex: "#e3e6ac" },
  { id: "p07", label: "P07", hex: "#a5c67c" },
  { id: "p08", label: "P08", hex: "#739a70" },
  { id: "p09", label: "P09", hex: "#4d6659" },
  { id: "p10", label: "P10", hex: "#343f41" },
  { id: "p11", label: "P11", hex: "#282e3b" },
  { id: "p12", label: "P12", hex: "#1a1f2e" },
  { id: "p13", label: "P13", hex: "#1e314b" },
  { id: "p14", label: "P14", hex: "#2f4c6c" },
  { id: "p15", label: "P15", hex: "#3d80a3" },
  { id: "p16", label: "P16", hex: "#63c4cc" },
  { id: "p17", label: "P17", hex: "#9ae5d5" },
  { id: "p18", label: "P18", hex: "#e5efef" },
  { id: "p19", label: "P19", hex: "#bac9cd" },
  { id: "p20", label: "P20", hex: "#8d99a4" },
  { id: "p21", label: "P21", hex: "#696f80" },
  { id: "p22", label: "P22", hex: "#414453" },
  { id: "p23", label: "P23", hex: "#b8a1c2" },
  { id: "p24", label: "P24", hex: "#7e659b" },
  { id: "p25", label: "P25", hex: "#5c3a6f" },
  { id: "p26", label: "P26", hex: "#39275e" },
  { id: "p27", label: "P27", hex: "#2f193e" },
  { id: "p28", label: "P28", hex: "#4e1a49" },
  { id: "p29", label: "P29", hex: "#7b234c" },
  { id: "p30", label: "P30", hex: "#b23657" },
  { id: "p31", label: "P31", hex: "#d16974" },
  { id: "p32", label: "P32", hex: "#edaaa3" },
  { id: "p33", label: "P33", hex: "#eecb90" },
  { id: "p34", label: "P34", hex: "#e1a845" },
  { id: "p35", label: "P35", hex: "#c57835" },
  { id: "p36", label: "P36", hex: "#8d4830" },
  { id: "p37", label: "P37", hex: "#e47259" },
  { id: "p38", label: "P38", hex: "#c33c40" },
  { id: "p39", label: "P39", hex: "#8d3649" },
  { id: "p40", label: "P40", hex: "#5c2b34" },
  { id: "p41", label: "P41", hex: "#3c252b" },
  { id: "p42", label: "P42", hex: "#684039" },
  { id: "p43", label: "P43", hex: "#825646" },
  { id: "p44", label: "P44", hex: "#b77862" },
  { id: "p45", label: "P45", hex: "#7d595d" },
  { id: "p46", label: "P46", hex: "#533b41" },
  { id: "p47", label: "P47", hex: "#3f333b" },
  { id: "p48", label: "P48", hex: "#2b222a" },
  { id: "p49", label: "P49", hex: "#6d4e4b" },
  { id: "p50", label: "P50", hex: "#867066" },
  { id: "p51", label: "P51", hex: "#b49d7e" },
  { id: "p52", label: "P52", hex: "#c4c6b8" },
  { id: "p53", label: "P53", hex: "#000000" },
];
const LABEL_BRUSHES = [
  {
    id: "floor",
    label: "Floor",
    overlay: "rgba(69, 176, 98, 0.62)",
    key: "Floor",
    surface: "floor",
  },
  {
    id: "bed",
    label: "Bed",
    overlay: "rgba(229, 112, 162, 0.62)",
    key: "Bed",
  },
  {
    id: "rug",
    label: "Rug",
    overlay: "rgba(211, 82, 89, 0.62)",
    key: "Rug",
  },
  {
    id: "desk",
    label: "Desk",
    overlay: "rgba(197, 124, 54, 0.62)",
    key: "Desk",
  },
  {
    id: "chair",
    label: "Chair",
    overlay: "rgba(152, 102, 67, 0.62)",
    key: "Chair",
  },
  {
    id: "lamp",
    label: "Lamp",
    overlay: "rgba(255, 207, 78, 0.66)",
    key: "Lamp",
  },
  {
    id: "window",
    label: "Window",
    overlay: "rgba(92, 172, 255, 0.62)",
    key: "Window",
  },
  {
    id: "shelf",
    label: "Shelf",
    overlay: "rgba(128, 97, 74, 0.62)",
    key: "Shelf",
  },
  {
    id: "clock",
    label: "Clock",
    overlay: "rgba(84, 198, 209, 0.62)",
    key: "Clock",
  },
  {
    id: "poster-secret",
    label: "Poster?",
    overlay: "rgba(140, 98, 224, 0.62)",
    key: "Poster?",
    surface: "poster",
    interactive: true,
  },
  {
    id: "solid",
    label: "Support",
    overlay: "rgba(88, 95, 110, 0.62)",
    key: "Support",
    surface: "solid",
  },
];

const labelBrushById = new Map(LABEL_BRUSHES.map((brush) => [brush.id, brush]));
const OBJECT_LABEL_BRUSHES = LABEL_BRUSHES.filter((brush) => brush.id !== "solid");
const SUPPORT_LABEL_BRUSHES = [ERASE_ID, "solid"];
const VALID_OBJECT_LABEL_IDS = new Set(OBJECT_LABEL_BRUSHES.map((brush) => brush.id));
const VALID_SUPPORT_LABEL_IDS = new Set(["solid"]);

let manifest = null;
let paletteById = new Map();
let assetById = new Map();
let spaceById = new Map();
let draftBySpaceId = new Map();
let sceneOverrideBySpaceId = new Map();
let activeSpaceId = null;
let spaceTrail = [];
let forwardTrail = [];
let stageStatusDefault = "";
let authorMode = "view";
let selectedColorId = ERASE_ID;
let selectedObjectLabelId = ERASE_ID;
let selectedSupportLabelId = ERASE_ID;
let activeLabelLayer = "objects";
let selectedInteractionType = "words";
let selectedInteractiveRegionId = null;
let pendingArtSrc = null;
let pointerStroke = null;

const icyTintCanvas = document.createElement("canvas");
icyTintCanvas.width = 256;
icyTintCanvas.height = 192;
const icyTintContext = icyTintCanvas.getContext("2d");

fillContext.imageSmoothingEnabled = false;
sceneContext.imageSmoothingEnabled = false;
labelContext.imageSmoothingEnabled = false;
editorContext.imageSmoothingEnabled = false;
icyTintContext.imageSmoothingEnabled = false;

document.body.classList.toggle("debug-regions", debugRegions);

function createGrid(fillValue = null) {
  return Array.from({ length: manifest.stage.gridHeight }, () =>
    Array.from({ length: manifest.stage.gridWidth }, () => fillValue),
  );
}

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueId(prefix = "id") {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function cssColorWithAlpha(color, alpha) {
  if (!color?.startsWith("rgba(")) {
    return color;
  }
  const parts = color.slice(5, -1).split(",").map((part) => part.trim());
  if (parts.length !== 4) {
    return color;
  }
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function jumpToSpace(spaceId) {
  const targetSpace = spaceById.get(spaceId);
  if (!targetSpace) {
    return;
  }

  if (activeSpaceId && activeSpaceId !== targetSpace.id) {
    spaceTrail.push(activeSpaceId);
  }
  forwardTrail = [];
  activeSpaceId = targetSpace.id;
  writeLocationSpaceId(activeSpaceId);
  renderActiveSpace();
}

function renderNavigation(space) {
  navBackwardButton.disabled = spaceTrail.length === 0;
  navForwardButton.disabled = forwardTrail.length === 0;
  navTreefortButton.disabled = !manifest.links.some((item) => item.href);
  const bonusSpace = manifest.spaces.find((candidate) => candidate.navigationKind === "bonus");
  navBonusButton.disabled = !bonusSpace || space.id === bonusSpace.id;
}

function setStatus(text) {
  stageStatus.textContent = text;
}

function syncMessageScroll() {
  if (!criticDialog || !criticDialogText) {
    return;
  }

  criticDialog.classList.remove("is-scrolling");
  criticDialog.style.removeProperty("--message-scroll-distance");

  const overflow = criticDialogText.scrollWidth - criticDialog.clientWidth;
  if (overflow > 8) {
    criticDialog.style.setProperty("--message-scroll-distance", `${overflow + 18}px`);
    criticDialog.classList.add("is-scrolling");
  }
}

function setMessage(text) {
  const nextText = text || "";
  if (criticDialogText) {
    criticDialogText.textContent = nextText;
  } else if (criticDialog) {
    criticDialog.textContent = nextText;
  }
  window.requestAnimationFrame(syncMessageScroll);
}

function getRegionHoverTitle(region) {
  if (!region) {
    return "";
  }

  return region.interaction?.title || region.label || "Object";
}

function showHoverTitle(text, event = null) {
  if (!hoverTitle || !text || authorMode !== "view") {
    return;
  }

  hoverTitle.textContent = text;
  hoverTitle.classList.remove("hidden");

  const stageRect = roomStage.getBoundingClientRect();
  const fallbackLeft = 8;
  const fallbackTop = 8;
  let left = fallbackLeft;
  let top = fallbackTop;
  const titleWidth = hoverTitle.offsetWidth;
  const titleHeight = hoverTitle.offsetHeight;

  if (event?.clientX !== undefined && event?.clientY !== undefined) {
    left = Math.max(6, Math.min(stageRect.width - titleWidth - 6, event.clientX - stageRect.left + 10));
    top = Math.max(6, Math.min(stageRect.height - titleHeight - 6, event.clientY - stageRect.top - titleHeight - 8));
  }

  hoverTitle.style.left = `${left}px`;
  hoverTitle.style.top = `${top}px`;
}

function hideHoverTitle() {
  if (!hoverTitle) {
    return;
  }
  hoverTitle.classList.add("hidden");
  hoverTitle.textContent = "";
}

function getCurrentSpace() {
  return spaceById.get(activeSpaceId) || spaceById.get(manifest.entrySpaceId);
}

function resetStatus(space) {
  if (space.revealState === "locked") {
    stageStatusDefault = `${space.title} is locked.`;
  } else if (space.revealState === "undrawn") {
    if (authorMode === "paint") {
      stageStatusDefault = "Pick colors now. Import a room drawing before you paint the stage.";
    } else if (authorMode === "labels") {
      stageStatusDefault = "Pick labels now. Import a room drawing before you tag the stage.";
    } else if (authorMode === "interactive") {
      stageStatusDefault = "Import a room and label a few spots before you wire up interactions.";
    } else {
      stageStatusDefault = space.placeholderPrompt;
    }
  } else if (authorMode === "paint") {
    stageStatusDefault = "Drag a color across the room.";
  } else if (authorMode === "labels") {
    stageStatusDefault = "Paint floor, poster, opening, or prop zones like a collision map.";
  } else if (authorMode === "interactive") {
    stageStatusDefault = "Pick a labeled thing, then decide what it does.";
  } else if (space.portalBindings.length > 0) {
    stageStatusDefault = "Click around the drawing to travel through the room.";
  } else {
    stageStatusDefault = "This room is quiet for now.";
  }
  setStatus(stageStatusDefault);
}

function getRegionMessage(region, options = {}) {
  const interaction = region?.interaction;
  if (!region) {
    return "";
  }

  if (region.description) {
    return region.description;
  }

  if (options.playing && interaction?.body) {
    return interaction.body;
  }

  if (interaction?.body && interaction.type === "words") {
    return interaction.body;
  }

  return "This spot is quiet right now.";
}

function getSelectionMessage(space, draft) {
  if (authorMode === "labels" && activeLabelLayer === "support") {
    return SUPPORT_MESSAGE;
  }

  if (authorMode !== "interactive") {
    return "";
  }

  const { selectedBlob, region } = getInteractiveSelection(space, draft);
  if (region) {
    return getRegionMessage(region) || `Editing ${region.label || "interactive"}.`;
  }

  if (selectedBlob) {
    return `Editing ${selectedBlob.labelName} ${selectedBlob.order}.`;
  }

  return "";
}

function syncMessage(space) {
  const draft = getDraft(space);
  const selectionMessage = getSelectionMessage(space, draft);
  if (selectionMessage) {
    setMessage(selectionMessage);
    return;
  }

  const evaluation = evaluateSpace(space, draft);
  setMessage(evaluation.critic);
}

function pxToPercentX(pixels) {
  return `${(pixels / manifest.stage.width) * 100}%`;
}

function pxToPercentY(pixels) {
  return `${(pixels / manifest.stage.height) * 100}%`;
}

function tileToPixelsX(x) {
  return manifest.stage.gutterLeft + x * manifest.stage.tileWidth;
}

function tileToPixelsY(y) {
  return y * manifest.stage.tileHeight;
}

function rectToStyle(rect) {
  return {
    left: pxToPercentX(tileToPixelsX(rect.x)),
    top: pxToPercentY(tileToPixelsY(rect.y)),
    width: pxToPercentX(rect.width * manifest.stage.tileWidth),
    height: pxToPercentY(rect.height * manifest.stage.tileHeight),
  };
}

function applyRectStyle(node, rect) {
  const style = rectToStyle(rect);
  node.style.left = style.left;
  node.style.top = style.top;
  node.style.width = style.width;
  node.style.height = style.height;
}

function readLocationSpaceId() {
  const rawHash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(rawHash);
  const candidate = params.get("space");
  if (candidate && spaceById.has(candidate)) {
    return candidate;
  }
  return manifest.entrySpaceId;
}

function writeLocationSpaceId(spaceId, replace = false) {
  const nextUrl =
    spaceId === manifest.entrySpaceId
      ? `${window.location.pathname}${window.location.search}`
      : `${window.location.pathname}${window.location.search}#space=${encodeURIComponent(spaceId)}`;

  if (replace) {
    window.history.replaceState({ spaceId }, "", nextUrl);
    return;
  }

  window.history.pushState({ spaceId }, "", nextUrl);
}

function clearStage() {
  fillContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);
  sceneContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);
  labelContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);
  editorContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);
  sceneCanvas.classList.add("hidden");
  sceneLineart.classList.add("hidden");
  sceneLineart.removeAttribute("src");
  sceneLineart.alt = "";
  regionLayer.replaceChildren();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load imported IcyAnimation layer."));
    image.src = source;
  });
}

async function loadIcyProjectAsset(asset) {
  const response = await fetch(asset.path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load IcyAnimation room asset: ${response.status}`);
  }

  return response.json();
}

function getIcyColor(project, layerIndex) {
  const paletteIndexes = project.settings?.layerPaletteIndexes ?? [0, 1, 2];
  const paletteIndex = Number.isInteger(paletteIndexes[layerIndex]) ? paletteIndexes[layerIndex] : layerIndex;
  return ICY_LAYER_COLORS[paletteIndex] ?? ICY_LAYER_COLORS[layerIndex] ?? ICY_LAYER_COLORS[0];
}

function isIcyLayerVisible(project, layerIndex) {
  const visibility = project.settings?.layerVisibility;
  if (!Array.isArray(visibility)) {
    return true;
  }
  return visibility[layerIndex] !== false;
}

function getIcyFrame(project) {
  if (!Array.isArray(project.frames) || project.frames.length === 0) {
    throw new Error("IcyAnimation scene asset has no frames.");
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

async function drawIcyFrameLike(project, frameLike) {
  if (!Array.isArray(frameLike?.layers)) {
    return;
  }

  for (let layerIndex = 0; layerIndex < frameLike.layers.length; layerIndex += 1) {
    const layerSource = frameLike.layers[layerIndex];
    if (!layerSource || !isIcyLayerVisible(project, layerIndex)) {
      continue;
    }

    const image = await loadImage(layerSource);
    if (icyTintCanvas.width !== image.width || icyTintCanvas.height !== image.height) {
      icyTintCanvas.width = image.width;
      icyTintCanvas.height = image.height;
      icyTintContext.imageSmoothingEnabled = false;
    }

    icyTintContext.clearRect(0, 0, image.width, image.height);
    icyTintContext.fillStyle = getIcyColor(project, layerIndex);
    icyTintContext.fillRect(0, 0, image.width, image.height);
    icyTintContext.globalCompositeOperation = "destination-in";
    icyTintContext.drawImage(image, 0, 0);
    icyTintContext.globalCompositeOperation = "source-over";
    sceneContext.drawImage(icyTintCanvas, 0, 0);
  }
}

async function renderIcySceneAsset(asset, expectedSpaceId) {
  const project = await loadIcyProjectAsset(asset);
  await renderIcyProject(project, expectedSpaceId);
}

function fillRectOnGrid(grid, rect, value) {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      grid[y][x] = value;
    }
  }
}

function buildFillGrid(space) {
  const grid = createGrid(null);
  for (const patch of space.fillPatches) {
    for (const rect of patch.rects) {
      fillRectOnGrid(grid, rect, patch.colorId);
    }
  }
  return grid;
}

function inferLabelIdFromPatch(patch) {
  if (patch.surface === "floor") {
    return "floor";
  }
  if (patch.surface === "poster") {
    return "poster-secret";
  }
  if (patch.surface === "solid") {
    return "solid";
  }
  return null;
}

function inferLabelIdFromRegion(region) {
  if (region.tags?.includes("poster")) {
    return "poster-secret";
  }
  return null;
}

function buildLabelGrid(space) {
  const grid = createGrid(null);

  for (const patch of space.surfacePatches) {
    const labelId = inferLabelIdFromPatch(patch);
    if (!labelId || labelId === "solid") {
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

function buildSupportGrid(space) {
  const grid = createGrid(null);

  for (const patch of space.surfacePatches) {
    const labelId = inferLabelIdFromPatch(patch);
    if (labelId !== "solid") {
      continue;
    }
    for (const rect of patch.rects) {
      fillRectOnGrid(grid, rect, labelId);
    }
  }

  return grid;
}

function createSvgDataUri(svgText) {
  return `data:image/svg+xml;base64,${window.btoa(svgText)}`;
}

function buildFillUnderlayStampFromGrid(fillGrid) {
  const rects = [];

  for (let y = 0; y < manifest.stage.gridHeight; y += 1) {
    let x = 0;
    while (x < manifest.stage.gridWidth) {
      const colorId = fillGrid[y][x];
      if (!colorId) {
        x += 1;
        continue;
      }

      let width = 1;
      while (x + width < manifest.stage.gridWidth && fillGrid[y][x + width] === colorId) {
        width += 1;
      }

      rects.push({
        colorId,
        x,
        y,
        width,
        height: 1,
      });
      x += width;
    }
  }

  if (!rects.length) {
    return null;
  }

  const svgRects = rects
    .map((rect) => {
      const color = paletteById.get(rect.colorId);
      if (!color) {
        return "";
      }

      return `<rect x="${tileToPixelsX(rect.x)}" y="${tileToPixelsY(rect.y)}" width="${
        rect.width * manifest.stage.tileWidth
      }" height="${rect.height * manifest.stage.tileHeight}" fill="${color}" />`;
    })
    .filter(Boolean);

  if (!svgRects.length) {
    return null;
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${manifest.stage.width}" height="${manifest.stage.height}" viewBox="0 0 ${manifest.stage.width} ${manifest.stage.height}" shape-rendering="crispEdges">`,
    `<rect width="${manifest.stage.width}" height="${manifest.stage.height}" fill="transparent" />`,
    ...svgRects,
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
    objects: Array.isArray(frameLike.objects) ? cloneJson(frameLike.objects) : [],
  };
}

function buildTreefortRoomMeta(space, draft) {
  const exportedAt = new Date().toISOString();
  const regions = Array.isArray(draft.regions) ? draft.regions : space.regions || [];
  const portalBindings = Array.isArray(draft.portalBindings) ? draft.portalBindings : space.portalBindings || [];

  return {
    schema: ROOM_META_SCHEMA,
    schemaVersion: ROOM_META_SCHEMA_VERSION,
    roomId: manifest.roomId,
    spaceId: space.id,
    roomMode: {
      active: true,
      singleFrameLocked: true,
      timelineEditable: false,
      gifToolsEnabled: false,
      showBackgroundNotice: true,
      backgroundNotice: ROOM_BACKGROUND_NOTICE,
    },
    reference: {
      warning: ROOM_WARNING,
      ignoreBackgroundEditsOnReimport: true,
    },
    preserve: {
      fillGrid: true,
      labelGrid: true,
      supportGrid: true,
      interactions: true,
      unlockState: true,
    },
    spaceDraft: {
      roomId: manifest.roomId,
      spaceId: space.id,
      title: space.title,
      description: space.description || "",
      placeholderPrompt: space.placeholderPrompt,
      revealState: space.revealState,
      sceneArtAssetId: space.sceneArtAssetId,
      fillGrid: cloneGrid(draft.fillGrid),
      labelGrid: cloneGrid(draft.labelGrid),
      supportGrid: cloneGrid(draft.supportGrid),
      regions: cloneJson(regions),
      portalBindings: cloneJson(portalBindings),
      exportedAt,
    },
    exportedAt,
  };
}

function buildRoomPackage(project, space, draft) {
  const { frameIndex } = getIcyFrame(project);
  const frame = cloneFrameLike(project.frames[frameIndex], "room-frame-1");
  const backgroundClip = cloneFrameLike(getIcyBackgroundClip(project, frameIndex), "treefort-background-1");
  const stamps = Array.isArray(project.stamps) ? cloneJson(project.stamps) : [];
  const underlayStamp = buildFillUnderlayStampFromGrid(draft.fillGrid);

  if (underlayStamp) {
    if (!stamps.some((stamp) => stamp.id === underlayStamp.id)) {
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

  return {
    version: 1,
    app: "IcyAnimation",
    savedAt: new Date().toISOString(),
    settings: {
      currentFrameIndex: 0,
      activeLayerIndex: 0,
      brushSize: Number(project.settings?.brushSize) || 1,
      tool: "pen",
      activePreset: typeof project.settings?.activePreset === "string" ? project.settings.activePreset : "note",
      activeNoteColor: typeof project.settings?.activeNoteColor === "string" ? project.settings.activeNoteColor : "sun",
      stampScale: Number(project.settings?.stampScale) || 1,
      activeStampId: null,
      fps: Number(project.settings?.fps) || 12,
      onionSkin: false,
      soloTrack: null,
      editTarget: "frame",
      layerVisibility: Array.isArray(project.settings?.layerVisibility)
        ? [...project.settings.layerVisibility]
        : [true, true, true],
      layerPaletteIndexes: Array.isArray(project.settings?.layerPaletteIndexes)
        ? [...project.settings.layerPaletteIndexes]
        : [0, 1, 2],
    },
    stamps,
    frames: [frame],
    backgroundClips: [backgroundClip],
    backgroundAssignments: [backgroundClip.id],
    treefortRoom: buildTreefortRoomMeta(space, draft),
  };
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

function canExportRoomPackage(space) {
  if (space.revealState !== "drawn") {
    return false;
  }

  const override = getSceneOverride(space);
  if (override?.app === "IcyAnimation") {
    return true;
  }

  return false;
}

function draftStorageKey(spaceId) {
  return `${LOCAL_DRAFT_PREFIX}${manifest.roomId}:${spaceId}`;
}

function sceneOverrideStorageKey(spaceId) {
  return `${SCENE_OVERRIDE_STORAGE_PREFIX}${manifest.roomId}:${spaceId}`;
}

function normalizeStoredGrid(value) {
  if (!Array.isArray(value) || value.length !== manifest.stage.gridHeight) {
    return null;
  }
  if (!value.every((row) => Array.isArray(row) && row.length === manifest.stage.gridWidth)) {
    return null;
  }
  return value;
}

function sanitizeLabelGrid(grid) {
  return grid.map((row) => row.map((cell) => (VALID_OBJECT_LABEL_IDS.has(cell) ? cell : null)));
}

function sanitizeSupportGrid(grid) {
  return grid.map((row) => row.map((cell) => (VALID_SUPPORT_LABEL_IDS.has(cell) ? cell : null)));
}

function sanitizeRegions(regions) {
  if (!Array.isArray(regions)) {
    return [];
  }

  const seen = new Set();
  return cloneJson(regions).filter((region) => {
    const labelId = region?.semanticLabelId;
    if (!VALID_OBJECT_LABEL_IDS.has(labelId) || seen.has(labelId)) {
      return false;
    }
    seen.add(labelId);
    return true;
  });
}

function sanitizePortalBindings(bindings, validRegionIds) {
  if (!Array.isArray(bindings)) {
    return [];
  }

  return cloneJson(bindings).filter((binding) => validRegionIds.has(binding?.regionId));
}

function sanitizeDraft(space, draft) {
  const labelGrid = normalizeStoredGrid(draft.labelGrid) ? sanitizeLabelGrid(draft.labelGrid) : buildLabelGrid(space);
  const supportGrid = normalizeStoredGrid(draft.supportGrid) ? sanitizeSupportGrid(draft.supportGrid) : buildSupportGrid(space);
  const baseDraft = {
    fillGrid: normalizeStoredGrid(draft.fillGrid) ? draft.fillGrid : buildFillGrid(space),
    labelGrid,
    supportGrid,
    regions: sanitizeRegions(draft.regions),
    portalBindings: Array.isArray(draft.portalBindings) ? cloneJson(draft.portalBindings) : [],
  };
  const regions = normalizeInteractiveRegions(baseDraft);
  const validRegionIds = new Set(regions.map((region) => region.id));
  const portalBindings = sanitizePortalBindings(baseDraft.portalBindings, validRegionIds);

  return {
    fillGrid: baseDraft.fillGrid,
    labelGrid,
    supportGrid,
    regions,
    portalBindings,
  };
}

function loadDraft(space) {
  const raw = window.localStorage.getItem(draftStorageKey(space.id));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const fillGrid = normalizeStoredGrid(parsed.fillGrid);
    const labelGrid = normalizeStoredGrid(parsed.labelGrid);
    if (!fillGrid || !labelGrid) {
      return null;
    }
    const supportGrid = normalizeStoredGrid(parsed.supportGrid) ?? createGrid(null);
    return {
      fillGrid,
      labelGrid,
      supportGrid,
      regions: Array.isArray(parsed.regions) ? cloneJson(parsed.regions) : undefined,
      portalBindings: Array.isArray(parsed.portalBindings) ? cloneJson(parsed.portalBindings) : undefined,
    };
  } catch {
    return null;
  }
}

function persistDraft(spaceId, draft) {
  const nextDraft = {
    fillGrid: draft.fillGrid,
    labelGrid: draft.labelGrid,
    supportGrid: draft.supportGrid,
  };

  if (Array.isArray(draft.regions)) {
    nextDraft.regions = draft.regions;
  }
  if (Array.isArray(draft.portalBindings)) {
    nextDraft.portalBindings = draft.portalBindings;
  }

  window.localStorage.setItem(draftStorageKey(spaceId), JSON.stringify(nextDraft));
}

function getDraft(space) {
  if (draftBySpaceId.has(space.id)) {
    return draftBySpaceId.get(space.id);
  }

  const storedDraft = loadDraft(space);
  const rawDraft =
    storedDraft ?? {
      fillGrid: buildFillGrid(space),
      labelGrid: buildLabelGrid(space),
      supportGrid: buildSupportGrid(space),
      regions: cloneJson(space.regions || []),
      portalBindings: cloneJson(space.portalBindings || []),
    };
  const draft = sanitizeDraft(space, rawDraft);

  draftBySpaceId.set(space.id, draft);
  persistDraft(space.id, draft);
  return draft;
}

function loadSceneOverride(spaceId) {
  const raw = window.localStorage.getItem(sceneOverrideStorageKey(spaceId));
  if (!raw) {
    return null;
  }

  try {
    const project = JSON.parse(raw);
    if (project?.app !== "IcyAnimation") {
      return null;
    }
    return project;
  } catch {
    return null;
  }
}

function persistSceneOverride(spaceId, project) {
  const storedProject = cloneJson(project);
  sceneOverrideBySpaceId.set(spaceId, storedProject);
  window.localStorage.setItem(sceneOverrideStorageKey(spaceId), JSON.stringify(storedProject));
}

function clearSceneOverride(spaceId) {
  sceneOverrideBySpaceId.delete(spaceId);
  window.localStorage.removeItem(sceneOverrideStorageKey(spaceId));
}

function getSceneOverride(space) {
  if (sceneOverrideBySpaceId.has(space.id)) {
    return sceneOverrideBySpaceId.get(space.id);
  }

  const storedProject = loadSceneOverride(space.id);
  if (storedProject) {
    sceneOverrideBySpaceId.set(space.id, storedProject);
  }
  return storedProject;
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function parseCellKey(key) {
  const [xText, yText] = String(key).split(",");
  return {
    x: Number.parseInt(xText, 10),
    y: Number.parseInt(yText, 10),
  };
}

function isInteractiveLabelId(labelId) {
  return Boolean(labelId && labelId !== "solid");
}

function isCellInRect(rect, cell) {
  return (
    cell.x >= rect.x &&
    cell.x < rect.x + rect.width &&
    cell.y >= rect.y &&
    cell.y < rect.y + rect.height
  );
}

function regionContainsCell(region, cell) {
  return Array.isArray(region.rects) && region.rects.some((rect) => isCellInRect(rect, cell));
}

function rectsFromCells(cells) {
  const rows = new Map();

  for (const cell of cells) {
    const row = rows.get(cell.y) ?? [];
    row.push(cell.x);
    rows.set(cell.y, row);
  }

  const rects = [];
  const sortedRows = [...rows.keys()].sort((left, right) => left - right);
  for (const y of sortedRows) {
    const xs = rows.get(y).sort((left, right) => left - right);
    let startX = xs[0];
    let previousX = xs[0];

    for (let index = 1; index <= xs.length; index += 1) {
      const nextX = xs[index];
      if (nextX === previousX + 1) {
        previousX = nextX;
        continue;
      }

      rects.push({
        x: startX,
        y,
        width: previousX - startX + 1,
        height: 1,
      });

      startX = nextX;
      previousX = nextX;
    }
  }

  return rects;
}

function buildInteractiveBlobs(draft) {
  const blobs = [];
  const blobLookup = new Map();
  const blobsByLabelId = new Map();

  for (let y = 0; y < manifest.stage.gridHeight; y += 1) {
    for (let x = 0; x < manifest.stage.gridWidth; x += 1) {
      const labelId = draft.labelGrid[y][x];
      if (!isInteractiveLabelId(labelId)) {
        continue;
      }

      let blob = blobsByLabelId.get(labelId);
      if (!blob) {
        const brush = labelBrushById.get(labelId);
        blob = {
          id: `blob-${labelId}`,
          labelId,
          labelName: brush?.label ?? labelId,
          order: null,
          cells: [],
          cellKeys: [],
          rects: [],
          bounds: {
            x: x,
            y: y,
            width: 1,
            height: 1,
          },
        };
        blobsByLabelId.set(labelId, blob);
        blobs.push(blob);
      }

      const cell = { x, y };
      const key = cellKey(x, y);
      blob.cells.push(cell);
      blob.cellKeys.push(key);
      blob.bounds.x = Math.min(blob.bounds.x, x);
      blob.bounds.y = Math.min(blob.bounds.y, y);
      blob.bounds.width = Math.max(blob.bounds.width, x - blob.bounds.x + 1);
      blob.bounds.height = Math.max(blob.bounds.height, y - blob.bounds.y + 1);
      blobLookup.set(key, blob);
    }
  }

  for (const blob of blobs) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const cell of blob.cells) {
      minX = Math.min(minX, cell.x);
      minY = Math.min(minY, cell.y);
      maxX = Math.max(maxX, cell.x);
      maxY = Math.max(maxY, cell.y);
    }
    blob.bounds = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
    blob.rects = rectsFromCells(blob.cells);
  }

  return { blobs, blobLookup };
}

function normalizeInteractiveRegions(draft) {
  const regionsByLabelId = new Map(
    sanitizeRegions(draft.regions).map((region) => [region.semanticLabelId, region]),
  );
  const { blobs } = buildInteractiveBlobs(draft);

  return blobs.flatMap((blob) => {
    const region = regionsByLabelId.get(blob.labelId);
    if (!region) {
      return [];
    }

    return [
      {
        ...region,
        id: blob.id,
        label: blob.labelName,
        semanticLabelId: blob.labelId,
        rects: cloneJson(blob.rects),
        cells: [...blob.cellKeys],
        bounds: cloneJson(blob.bounds),
        clickHint: region.clickHint || region.interaction?.title || region.description || blob.labelName,
      },
    ];
  });
}

function getRegionById(draft, regionId) {
  return draft.regions.find((region) => region.id === regionId) ?? null;
}

function getRegionAtCell(draft, cell) {
  return draft.regions.find((region) => regionContainsCell(region, cell)) ?? null;
}

function getInteractiveSelection(space, draft) {
  const interactiveData = buildInteractiveBlobs(draft);
  const selectedBlob = interactiveData.blobs.find((blob) => blob.id === selectedInteractiveRegionId) ?? null;
  const region =
    (selectedBlob
      ? draft.regions.find((candidate) => candidate.semanticLabelId === selectedBlob.labelId)
      : null) ??
    (selectedInteractiveRegionId ? getRegionById(draft, selectedInteractiveRegionId) : null);

  return {
    ...interactiveData,
    region,
    selectedBlob,
    evaluation: evaluateSpace(space, draft),
  };
}

function defaultInteractionForType(type, blob) {
  const titleBase = blob ? blob.labelName : "New Interactive";

  if (type === "art") {
    return {
      type,
      title: `${titleBase} Art`,
      body: "This spot can open another drawing later.",
    };
  }

  if (type === "secret-room") {
    return {
      type,
      title: `${titleBase} Passage`,
      targetSpaceId: "",
    };
  }

  return {
    type: "words",
    title: `${titleBase} Note`,
    body: "Write a clue, note, or little room thought.",
  };
}

function drawFillGrid(fillGrid) {
  fillContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);

  for (let y = 0; y < manifest.stage.gridHeight; y += 1) {
    for (let x = 0; x < manifest.stage.gridWidth; x += 1) {
      const colorId = fillGrid[y][x];
      if (!colorId) {
        continue;
      }
      fillContext.fillStyle = paletteById.get(colorId) || "#ffffff";
      fillContext.fillRect(
        tileToPixelsX(x),
        tileToPixelsY(y),
        manifest.stage.tileWidth,
        manifest.stage.tileHeight,
      );
    }
  }
}

function drawBlobOutline(blob, color = "#fffef5") {
  if (!blob?.cells?.length) {
    return;
  }

  const cells = new Set(blob.cells.map((cell) => cellKey(cell.x, cell.y)));
  labelContext.strokeStyle = color;
  labelContext.lineWidth = 1;
  labelContext.lineCap = "butt";
  labelContext.lineJoin = "miter";
  labelContext.beginPath();

  for (const cell of blob.cells) {
    const left = tileToPixelsX(cell.x) + 0.5;
    const top = tileToPixelsY(cell.y) + 0.5;
    const right = tileToPixelsX(cell.x + 1) + 0.5;
    const bottom = tileToPixelsY(cell.y + 1) + 0.5;

    if (!cells.has(cellKey(cell.x, cell.y - 1))) {
      labelContext.moveTo(left, top);
      labelContext.lineTo(right, top);
    }

    if (!cells.has(cellKey(cell.x + 1, cell.y))) {
      labelContext.moveTo(right, top);
      labelContext.lineTo(right, bottom);
    }

    if (!cells.has(cellKey(cell.x, cell.y + 1))) {
      labelContext.moveTo(left, bottom);
      labelContext.lineTo(right, bottom);
    }

    if (!cells.has(cellKey(cell.x - 1, cell.y))) {
      labelContext.moveTo(left, top);
      labelContext.lineTo(left, bottom);
    }
  }

  labelContext.stroke();
}

function drawLabelOverlay(space, draft) {
  labelContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);

  if (space.revealState !== "drawn") {
    labelLayer.classList.add("hidden");
    return;
  }

  if (authorMode === "labels") {
    const selectedLabelId = activeLabelLayer === "support" ? selectedSupportLabelId : selectedObjectLabelId;
    const brush = labelBrushById.get(selectedLabelId);
    const activeGrid = activeLabelLayer === "support" ? draft.supportGrid : draft.labelGrid;
    if (!brush && activeLabelLayer !== "support") {
      labelLayer.classList.add("hidden");
      return;
    }

    const overlayColor = brush?.overlay || labelBrushById.get("solid")?.overlay;
    if (!overlayColor) {
      labelLayer.classList.add("hidden");
      return;
    }

    for (let y = 0; y < manifest.stage.gridHeight; y += 1) {
      for (let x = 0; x < manifest.stage.gridWidth; x += 1) {
        if (activeGrid[y][x] !== (activeLabelLayer === "support" ? "solid" : selectedLabelId)) {
          continue;
        }
        labelContext.fillStyle = overlayColor;
        labelContext.fillRect(
          tileToPixelsX(x),
          tileToPixelsY(y),
          manifest.stage.tileWidth,
          manifest.stage.tileHeight,
        );
      }
    }

    labelLayer.classList.remove("hidden");
    return;
  }

  if (authorMode !== "interactive") {
    labelLayer.classList.add("hidden");
    return;
  }

  const { blobs, selectedBlob } = getInteractiveSelection(space, draft);
  if (!blobs.length && !selectedBlob) {
    labelLayer.classList.add("hidden");
    return;
  }

  for (const blob of blobs) {
    const brush = labelBrushById.get(blob.labelId);
    labelContext.fillStyle = cssColorWithAlpha(brush?.overlay || "rgba(255, 70, 70, 0.34)", 0.22);
    for (const cell of blob.cells) {
      labelContext.fillRect(
        tileToPixelsX(cell.x),
        tileToPixelsY(cell.y),
        manifest.stage.tileWidth,
        manifest.stage.tileHeight,
      );
    }
  }

  if (selectedBlob) {
    const selectedBrush = labelBrushById.get(selectedBlob.labelId);
    labelContext.fillStyle = cssColorWithAlpha(selectedBrush?.overlay || "rgba(255, 70, 70, 0.34)", 0.4);
    for (const cell of selectedBlob.cells) {
      labelContext.fillRect(
        tileToPixelsX(cell.x),
        tileToPixelsY(cell.y),
        manifest.stage.tileWidth,
        manifest.stage.tileHeight,
      );
    }
    drawBlobOutline(selectedBlob);
  }

  labelLayer.classList.remove("hidden");
}

function drawEditorCursor() {
  editorContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);

  if (authorMode === "view" || authorMode === "interactive" || !pointerStroke?.hoverCell) {
    editorLayer.classList.toggle("hidden", authorMode === "view");
    return;
  }

  const { x, y } = pointerStroke.hoverCell;
  const pixelX = tileToPixelsX(x);
  const pixelY = tileToPixelsY(y);
  editorContext.lineWidth = 1;

  if (authorMode === "paint") {
    editorContext.strokeStyle = selectedColorId === ERASE_ID ? "#ffffff" : paletteById.get(selectedColorId) || "#ffffff";
    editorContext.strokeRect(pixelX + 0.5, pixelY + 0.5, manifest.stage.tileWidth - 1, manifest.stage.tileHeight - 1);
  } else if (authorMode === "labels") {
    const selectedLabelId = activeLabelLayer === "support" ? selectedSupportLabelId : selectedObjectLabelId;
    const brush = labelBrushById.get(selectedLabelId) || (activeLabelLayer === "support" ? labelBrushById.get("solid") : null);
    if (brush) {
      editorContext.fillStyle = brush.overlay;
      editorContext.fillRect(pixelX, pixelY, manifest.stage.tileWidth, manifest.stage.tileHeight);
      editorContext.strokeStyle = "#ffffff";
      editorContext.strokeRect(pixelX + 0.5, pixelY + 0.5, manifest.stage.tileWidth - 1, manifest.stage.tileHeight - 1);
    }
  }

  editorLayer.classList.remove("hidden");
}

function countCellsForLabel(labelGrid, labelId) {
  let count = 0;
  for (const row of labelGrid) {
    for (const cell of row) {
      if (cell === labelId) {
        count += 1;
      }
    }
  }
  return count;
}

function getScoreGoals(space) {
  return Array.isArray(space.scoreGoals) ? space.scoreGoals : [];
}

function evaluateSpace(space, draft) {
  if (space.revealState !== "drawn") {
    return {
      earned: 0,
      total: 0,
      critic: space.placeholderPrompt,
      secretRoomUnlocked: false,
    };
  }

  const criteria = getScoreGoals(space);
  let earned = 0;
  let total = 0;
  let missingHint = null;

  for (const criterion of criteria) {
    total += 1;
    const count = countCellsForLabel(draft.labelGrid, criterion.labelId);
    if (count >= criterion.minCells) {
      earned += 1;
    } else if (!missingHint) {
      missingHint = criterion.hint || `...this room still needs ${criterion.label.toLowerCase()}.`;
    }
  }

  if (!total) {
    return {
      earned: 0,
      total: 0,
      critic: "...draw the room, then teach it what everything is.",
      secretRoomUnlocked: false,
    };
  }

  if (earned >= total) {
    return {
      earned,
      total,
      critic: "...the room knows every object now. secret room unlocked.",
      secretRoomUnlocked: true,
    };
  }

  return {
    earned,
    total,
    critic: missingHint || "...keep teaching the room what things are.",
    secretRoomUnlocked: false,
  };
}

function getSecretRoomOptions(space) {
  return manifest.spaces.filter((candidate) => candidate.id !== space.id && candidate.navigationKind !== "bonus");
}

function syncInteractiveSelectedSwatch(labelId, labelName = "") {
  if (!interactiveSelectedSwatch || !interactiveSelectedValue) {
    return;
  }

  interactiveSelectedSwatch.classList.remove("label-key__swatch--erase", "interactive-selected__swatch--empty");
  interactiveSelectedSwatch.style.removeProperty("background");

  const brush = labelId ? labelBrushById.get(labelId) : null;
  if (!brush?.overlay) {
    interactiveSelectedSwatch.classList.add("interactive-selected__swatch--empty");
    interactiveSelectedValue.textContent = "None";
    return;
  }

  interactiveSelectedSwatch.style.background = cssColorWithAlpha(brush.overlay, 0.8);
  interactiveSelectedValue.textContent = (labelName || brush.key || brush.label || "Object").toUpperCase();
}

function syncInteractiveForm(space) {
  const draft = getDraft(space);
  const { selectedBlob, region, evaluation } = getInteractiveSelection(space, draft);
  const secretRoomOptions = getSecretRoomOptions(space);
  const savedInteraction = region?.interaction && typeof region.interaction === "object" ? region.interaction : null;

  interactivePanel.classList.toggle("hidden", authorMode !== "interactive");
  interactionTypeButtons.forEach((button) => {
    const type = button.dataset.interactionType;
    const secretRoomLocked = type === "secret-room" && (!evaluation.secretRoomUnlocked || !secretRoomOptions.length);
    button.disabled = secretRoomLocked;
    button.classList.toggle("is-active", type === selectedInteractionType);
  });
  interactionTitleWindow?.classList.toggle("hidden", authorMode !== "interactive");
  interactionDescriptionWindow?.classList.toggle("hidden", authorMode !== "interactive");
  interactionActionWindow?.classList.toggle("hidden", authorMode !== "interactive");
  interactionSaveWindow?.classList.toggle("hidden", authorMode !== "interactive");
  artUploadWindow?.classList.toggle("hidden", authorMode !== "interactive");

  interactionSecretTarget.replaceChildren();
  if (secretRoomOptions.length) {
    for (const candidate of secretRoomOptions) {
      const option = document.createElement("option");
      option.value = candidate.id;
      option.textContent = candidate.title;
      interactionSecretTarget.appendChild(option);
    }
  } else {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No other rooms yet";
    interactionSecretTarget.appendChild(option);
  }

  const secretRoomLocked = !evaluation.secretRoomUnlocked;
  const noTargets = !secretRoomOptions.length;
  if (!selectedBlob && !region) {
    syncInteractiveSelectedSwatch(null, "");
    interactionTitleInput.value = "";
    interactionDescriptionInput.value = "";
    interactionSecretTarget.value = secretRoomOptions[0]?.id ?? "";
    interactionTitleInput.disabled = true;
    interactionDescriptionInput.disabled = true;
    interactionSecretTarget.disabled = true;
    saveInteractionButton.disabled = true;
    clearInteractionButton.disabled = true;
    interactionTargetField.classList.add("hidden");
    artUploadWindow?.classList.add("hidden");
    return;
  }

  const blob = selectedBlob ?? {
    labelId: region?.semanticLabelId || "poster-secret",
    labelName: region?.label || "Interactive",
  };
  syncInteractiveSelectedSwatch(blob.labelId, blob.labelName);

  const effectiveType = region?.interaction?.type ?? selectedInteractionType;
  selectedInteractionType = effectiveType;
  interactionTypeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.interactionType === effectiveType);
  });

  interactionTargetField.classList.toggle("hidden", effectiveType !== "secret-room");
  artUploadWindow?.classList.toggle("hidden", effectiveType !== "art");
  interactionDescriptionWindow?.classList.toggle("hidden", effectiveType === "art" || authorMode !== "interactive");

  interactionTitleInput.disabled = false;
  interactionDescriptionInput.disabled = false;
  interactionSecretTarget.disabled = effectiveType !== "secret-room" || secretRoomLocked || noTargets;
  saveInteractionButton.disabled = effectiveType === "secret-room" && (secretRoomLocked || noTargets);
  clearInteractionButton.disabled = !savedInteraction;

  interactionTitleInput.value = savedInteraction?.title || "";
  interactionDescriptionInput.value = region?.description || savedInteraction?.body || "";

  const existingArtSrc = savedInteraction?.artSrc || null;
  pendingArtSrc = pendingArtSrc || existingArtSrc;
  if (artUploadStatus) {
    artUploadStatus.textContent = pendingArtSrc ? "GIF loaded." : existingArtSrc ? "GIF loaded." : "";
    artUploadButton.textContent = pendingArtSrc || existingArtSrc ? "Replace GIF" : "Load GIF";
  }

  if (effectiveType === "secret-room") {
    const targetSpaceId = savedInteraction?.targetSpaceId || secretRoomOptions[0]?.id || "";
    interactionSecretTarget.value = targetSpaceId;
  } else {
    interactionSecretTarget.value = secretRoomOptions[0]?.id ?? "";
  }
}

function upsertInteractiveRegion(space, draft, blob, interaction) {
  const description = interactionDescriptionInput.value.trim();
  const nextRegion = {
    id: blob.id,
    label: blob.labelName,
    semanticLabelId: blob.labelId,
    clickHint: interaction.title || blob.labelName,
    description,
    rects: cloneJson(blob.rects),
    cells: [...blob.cellKeys],
    bounds: cloneJson(blob.bounds),
    interaction,
  };

  const removedRegionIds = draft.regions
    .filter((region) => region.id === blob.id || region.semanticLabelId === blob.labelId)
    .map((region) => region.id);
  draft.regions = draft.regions.filter((region) => !removedRegionIds.includes(region.id));
  draft.regions.push(nextRegion);

  draft.portalBindings = draft.portalBindings.filter(
    (binding) => binding.regionId !== blob.id && !removedRegionIds.includes(binding.regionId),
  );
  if (interaction.type === "secret-room" && interaction.targetSpaceId) {
    draft.portalBindings.push({
      regionId: blob.id,
      targetSpaceId: interaction.targetSpaceId,
    });
  }

  persistDraft(space.id, draft);
}

function clearInteractiveRegion(space, draft, regionId) {
  const selectedBlob = buildInteractiveBlobs(draft).blobs.find((blob) => blob.id === regionId) ?? null;
  const removedRegionIds = draft.regions
    .filter(
      (region) =>
        region.id === regionId || (selectedBlob && region.semanticLabelId === selectedBlob.labelId),
    )
    .map((region) => region.id);
  draft.regions = draft.regions.filter((region) => !removedRegionIds.includes(region.id));
  draft.portalBindings = draft.portalBindings.filter((binding) => !removedRegionIds.includes(binding.regionId));
  persistDraft(space.id, draft);
}

function playRegionInteraction(space, draft, region) {
  const interaction = region.interaction;
  if (!interaction) {
    const binding = getBindingForRegion(draft, region.id);
    if (binding) {
      navigateToBinding(space, binding);
      return;
    }
    setStatus(region.clickHint || `${region.label} is quiet right now.`);
    setMessage(getRegionMessage(region));
    return;
  }

  if (interaction.type === "secret-room") {
    const targetSpaceId = interaction.targetSpaceId || getBindingForRegion(draft, region.id)?.targetSpaceId;
    if (!targetSpaceId) {
      setStatus("This secret path does not point anywhere yet.");
      return;
    }
    navigateToBinding(space, { regionId: region.id, targetSpaceId });
    return;
  }

  if (interaction.type === "art" && interaction.artSrc) {
    showGifOverlay(interaction.artSrc);
    setStatus(interaction.title || region.clickHint || region.label);
    return;
  }

  if (interaction.type === "words") {
    showNoteOverlay(
      interaction.title || region.clickHint || region.label,
      interaction.body || region.description || "",
    );
    setStatus(interaction.title || region.clickHint || region.label);
    return;
  }

  setStatus(`${interaction.title || region.clickHint || region.label}`);
  setMessage(getRegionMessage(region, { playing: true }) || "...this spot is quiet for now.");
}

function showGifOverlay(src) {
  if (!gifOverlay || !gifOverlayImage) {
    return;
  }
  gifOverlayImage.src = src;
  gifOverlay.classList.remove("hidden");
}

function dismissGifOverlay() {
  if (!gifOverlay || !gifOverlayImage) {
    return;
  }
  gifOverlay.classList.add("hidden");
  gifOverlayImage.src = "";
}

function showNoteOverlay(title, body) {
  if (!noteOverlay) {
    return;
  }
  if (noteOverlayTitle) {
    noteOverlayTitle.textContent = title || "";
  }
  if (noteOverlayBody) {
    noteOverlayBody.textContent = body || "";
  }
  noteOverlay.classList.remove("hidden");
}

function dismissNoteOverlay() {
  if (!noteOverlay) {
    return;
  }
  noteOverlay.classList.add("hidden");
}

function dismissAllOverlays() {
  dismissGifOverlay();
  dismissNoteOverlay();
}

function loadArtGif(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/gif")) {
      reject(new Error("Only GIF files are allowed."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth !== 256 || img.naturalHeight !== 192) {
          reject(new Error(`GIF must be exactly 256x192. This one is ${img.naturalWidth}x${img.naturalHeight}.`));
          return;
        }
        resolve(reader.result);
      };
      img.onerror = () => reject(new Error("Could not read the GIF."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("File read failed."));
    reader.readAsDataURL(file);
  });
}

function updateFeedback(space) {
  const draft = getDraft(space);
  const evaluation = evaluateSpace(space, draft);
  authorScore.textContent = `${evaluation.earned} / ${evaluation.total} pts`;
  syncMessage(space);

  if (authorMode === "interactive") {
    syncInteractiveForm(space);
  }
}

function refreshAuthoringUI(space) {
  const canAuthor = space.revealState === "drawn";
  const showFillLayer = space.revealState === "drawn" && (authorMode === "view" || authorMode === "paint");
  const leftPanelMode = authorMode === "view" ? "" : authorMode;
  leftPanelWindow.classList.toggle("is-collapsed", !leftPanelMode);
  leftPanelBody.classList.toggle("hidden", !leftPanelMode);
  leftPanelWindow.classList.remove("is-fill");
  supportWindow?.classList.toggle("hidden", authorMode !== "labels");
  leftPanelTitle.textContent = "Submenu";
  paintPanel.classList.toggle("hidden", authorMode !== "paint");
  labelPanel.classList.toggle("hidden", authorMode !== "labels");
  interactivePanel.classList.toggle("hidden", authorMode !== "interactive");
  fillLayer.classList.toggle("hidden", !showFillLayer);
  labelLayer.classList.toggle("hidden", !canAuthor || !["labels", "interactive"].includes(authorMode));
  editorLayer.classList.toggle("hidden", !canAuthor || authorMode === "view");
  document.body.classList.toggle("authoring-active", canAuthor && authorMode !== "view");
  if (authorMode !== "view") {
    hideHoverTitle();
  }
  if (exportRoomButton) {
    exportRoomButton.disabled = !canExportRoomPackage(space);
  }

  toolButtons.forEach((button) => {
    const tool = button.dataset.tool;
    button.disabled = false;
    button.setAttribute("aria-pressed", tool === authorMode ? "true" : "false");
  });

  resetStatus(space);
  drawLabelOverlay(space, getDraft(space));
  drawEditorCursor();
  syncInteractiveForm(space);
  syncMessage(space);
}

async function exportCurrentRoomPackage() {
  const space = getCurrentSpace();
  if (!canExportRoomPackage(space)) {
    setStatus("This room can only export .room after it is imported from IcyAnimation.");
    return;
  }

  const draft = getDraft(space);
  const fileName = `${manifest.roomId}-${space.id}.room`;

  try {
    const asset = assetById.get(space.sceneArtAssetId);
    const project = getSceneOverride(space) ?? (asset ? await loadIcyProjectAsset(asset) : null);
    if (!project) {
      throw new Error("This room does not have an IcyAnimation scene to export yet.");
    }
    if (project.app !== "IcyAnimation") {
      throw new Error("This room scene is not an IcyAnimation project.");
    }

    const roomPackage = buildRoomPackage(project, space, draft);
    downloadBlob(
      new Blob([JSON.stringify(roomPackage, null, 2)], {
        type: "application/x-icyanimation+json",
      }),
      fileName,
    );
    setStatus(`Downloaded ${fileName}.`);
  } catch (error) {
    setStatus(error.message);
  }
}

function setAuthorMode(nextMode) {
  if (nextMode === "interactive" && authorMode !== "interactive") {
    selectedInteractiveRegionId = null;
    pendingArtSrc = null;
  }
  dismissAllOverlays();
  authorMode = nextMode;
  pointerStroke = null;
  const space = getCurrentSpace();
  refreshAuthoringUI(space);
  updateFeedback(space);
}

function buildPaintSwatches() {
  paintSwatches.replaceChildren();

  const swatches = [
    { id: ERASE_ID, label: "Erase", color: null },
    ...PAINT_SWATCHES.map((entry) => ({ id: entry.id, label: entry.label, color: entry.hex })),
  ];

  swatches.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch-chip";
    button.dataset.colorId = entry.id;
    button.setAttribute("aria-pressed", String(entry.id === selectedColorId));
    button.setAttribute("aria-label", entry.label);
    button.title = entry.label;
    if (entry.color) {
      button.style.background = entry.color;
    }

    const well = document.createElement("span");
    well.className = "swatch-chip__well";
    if (entry.id === ERASE_ID) {
      well.classList.add("swatch-chip__well--erase");
    } else {
      well.style.background = entry.color;
    }

    button.append(well);
    button.addEventListener("click", () => {
      selectedColorId = entry.id;
      buildPaintSwatches();
      drawEditorCursor();
    });
    paintSwatches.appendChild(button);
  });
}

function buildLabelBrushes() {
  labelBrushes.replaceChildren();

  const brushes = [{ id: ERASE_ID, label: "Erase", key: "Erase", overlay: "rgba(255, 255, 255, 0.3)" }, ...OBJECT_LABEL_BRUSHES];

  brushes.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "label-choice";
    if (entry.id === "poster-secret") {
      button.classList.add("label-choice--secret");
    }
    button.dataset.labelId = entry.id;
    button.setAttribute("aria-pressed", String(activeLabelLayer === "objects" && entry.id === selectedObjectLabelId));
    button.title = entry.label;

    const swatch = document.createElement("div");
    swatch.className = "label-key__swatch";
    if (entry.id === ERASE_ID) {
      swatch.classList.add("label-key__swatch--erase");
    } else {
      swatch.style.background = cssColorWithAlpha(entry.overlay, 0.8);
    }

    const label = document.createElement("p");
    label.className = "label-key__label";
    label.textContent = entry.key;

    button.append(swatch, label);
    button.addEventListener("click", () => {
      activeLabelLayer = "objects";
      selectedObjectLabelId = entry.id;
      buildLabelBrushes();
      buildSupportBrushes();
      drawLabelOverlay(getCurrentSpace(), getDraft(getCurrentSpace()));
      drawEditorCursor();
      syncMessage(getCurrentSpace());
    });
    labelBrushes.appendChild(button);
  });
}

function buildSupportBrushes() {
  if (!supportBrushes) {
    return;
  }

  supportBrushes.replaceChildren();

  const brushes = SUPPORT_LABEL_BRUSHES.map((id) =>
    id === ERASE_ID
      ? { id: ERASE_ID, label: "Erase", key: "Erase", overlay: "rgba(255, 255, 255, 0.3)" }
      : labelBrushById.get(id),
  ).filter(Boolean);

  brushes.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "label-chip";
    button.dataset.labelId = entry.id;
    button.setAttribute("aria-pressed", String(activeLabelLayer === "support" && entry.id === selectedSupportLabelId));
    button.title = entry.label;

    if (entry.id === ERASE_ID) {
      const well = document.createElement("span");
      well.className = "label-chip__well swatch-chip__well--erase";
      button.append(well);
    } else {
      const well = document.createElement("span");
      well.className = "label-chip__well";
      well.style.background = entry.overlay;
      button.append(well);
    }

    button.addEventListener("click", () => {
      activeLabelLayer = "support";
      selectedSupportLabelId = entry.id;
      buildLabelBrushes();
      buildSupportBrushes();
      drawLabelOverlay(getCurrentSpace(), getDraft(getCurrentSpace()));
      drawEditorCursor();
      syncMessage(getCurrentSpace());
    });

    supportBrushes.appendChild(button);
  });
}

function buildLabelKey() {
  if (!labelKey) {
    return 0;
  }

  labelKey.replaceChildren();
  const seen = new Set();
  const brushes = getScoreGoals(getCurrentSpace())
    .filter((criterion) => {
      if (!criterion?.labelId || seen.has(criterion.labelId)) {
        return false;
      }
      seen.add(criterion.labelId);
      return true;
    })
    .map((criterion) => ({
      id: criterion.labelId,
      key: criterion.label || labelBrushById.get(criterion.labelId)?.key || criterion.labelId,
      overlay: labelBrushById.get(criterion.labelId)?.overlay || "rgba(255, 255, 255, 0.3)",
    }));

  brushes.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "label-key__entry";
    if (entry.id === "poster-secret") {
      row.classList.add("label-key__entry--secret");
    }

    const swatch = document.createElement("div");
    swatch.className = "label-key__swatch";
    if (entry.id === ERASE_ID) {
      swatch.classList.add("label-key__swatch--erase");
    } else {
      swatch.style.background = cssColorWithAlpha(entry.overlay, 0.8);
    }

    const label = document.createElement("p");
    label.className = "label-key__label";
    label.textContent = entry.key;

    row.append(swatch, label);
    labelKey.append(row);
  });

  return brushes.length;
}

function getBindingForRegion(draft, regionId) {
  return draft.portalBindings.find((binding) => binding.regionId === regionId) ?? null;
}

function navigateToBinding(space, binding) {
  dismissAllOverlays();
  if (binding.targetSpaceId) {
    const targetSpace = spaceById.get(binding.targetSpaceId);
    if (!targetSpace) {
      setStatus("This path is broken right now.");
      return;
    }

    if (targetSpace.revealState === "locked") {
      setStatus(`${targetSpace.title} is still locked.`);
      return;
    }

    if (activeSpaceId) {
      spaceTrail.push(activeSpaceId);
    }
    forwardTrail = [];
    activeSpaceId = targetSpace.id;
    writeLocationSpaceId(activeSpaceId);
    renderActiveSpace();
    return;
  }

  const href = binding.roomUrl || binding.externalUrl;
  if (href) {
    window.location.assign(href);
  }
}

function renderRegions(space, draft) {
  regionLayer.replaceChildren();
  hideHoverTitle();

  if (space.revealState !== "drawn") {
    return;
  }

  for (const region of draft.regions) {
    const binding = getBindingForRegion(draft, region.id);
    for (const rect of region.rects) {
      const hit = document.createElement("button");
      hit.type = "button";
      hit.className = "region-hit";
      hit.setAttribute("aria-label", region.label);
      applyRectStyle(hit, rect);

      hit.addEventListener("mouseenter", (event) => {
        if (authorMode !== "view") {
          return;
        }
        setStatus(getRegionHoverTitle(region));
        showHoverTitle(getRegionHoverTitle(region), event);
        setMessage(getRegionMessage(region));
      });
      hit.addEventListener("mousemove", (event) => {
        if (authorMode !== "view") {
          return;
        }
        showHoverTitle(getRegionHoverTitle(region), event);
      });
      hit.addEventListener("mouseleave", () => {
        if (authorMode !== "view") {
          return;
        }
        hideHoverTitle();
        setStatus(stageStatusDefault);
        syncMessage(space);
      });
      hit.addEventListener("focus", () => {
        if (authorMode !== "view") {
          return;
        }
        setStatus(getRegionHoverTitle(region));
        showHoverTitle(getRegionHoverTitle(region));
        setMessage(getRegionMessage(region));
      });
      hit.addEventListener("blur", () => {
        if (authorMode !== "view") {
          return;
        }
        hideHoverTitle();
        setStatus(stageStatusDefault);
        syncMessage(space);
      });
      hit.addEventListener("click", () => {
        if (authorMode !== "view") {
          return;
        }
        if (region.interaction || binding) {
          playRegionInteraction(space, draft, region);
        } else {
          setStatus(region.clickHint || `${region.label} does not open anything yet.`);
          setMessage(getRegionMessage(region));
        }
      });
      regionLayer.appendChild(hit);
    }
  }
}

async function renderIcyProject(project, expectedSpaceId) {
  const { frame, frameIndex } = getIcyFrame(project);
  const backgroundClip = getIcyBackgroundClip(project, frameIndex);
  sceneContext.clearRect(0, 0, manifest.stage.width, manifest.stage.height);
  await drawIcyFrameLike(project, backgroundClip);
  await drawIcyFrameLike(project, frame);
  if (activeSpaceId === expectedSpaceId) {
    sceneCanvas.classList.remove("hidden");
  }
}

async function handleImportedRoomFile(file) {
  const space = getCurrentSpace();
  const fileName = file.name.toLowerCase();
  const isRoomPackage = fileName.endsWith(".room");
  const isIcyProject = fileName.endsWith(".icy");
  if (!isRoomPackage && !isIcyProject) {
    throw new Error("Treefort only imports .room or .icy files.");
  }
  const rawText = await file.text();
  let project = null;

  try {
    project = JSON.parse(rawText);
  } catch {
    throw new Error("That file is not valid room data.");
  }

  if (project?.app !== "IcyAnimation") {
    throw new Error("That file is not a valid IcyAnimation room scene.");
  }

  const roomMeta = project.treefortRoom;
  if (isRoomPackage && (!roomMeta || roomMeta.schema !== ROOM_META_SCHEMA || roomMeta.schemaVersion !== ROOM_META_SCHEMA_VERSION)) {
    throw new Error("That .room file is missing Treefort room metadata.");
  }
  const spaceDraftMeta = roomMeta?.spaceDraft;

  if (roomMeta?.roomId && roomMeta.roomId !== manifest.roomId) {
    throw new Error("This .room belongs to a different Treefort room.");
  }

  if (spaceDraftMeta?.spaceId && spaceDraftMeta.spaceId !== space.id) {
    throw new Error(`Open ${spaceDraftMeta.spaceId} first, then import this file there.`);
  }

  const draft = getDraft(space);
  const nextDraft = {
    fillGrid: cloneGrid(draft.fillGrid),
    labelGrid: cloneGrid(draft.labelGrid),
    supportGrid: cloneGrid(draft.supportGrid),
    regions: cloneJson(draft.regions || []),
    portalBindings: cloneJson(draft.portalBindings || []),
  };

  const importedFillGrid = normalizeStoredGrid(spaceDraftMeta?.fillGrid);
  const importedLabelGrid = normalizeStoredGrid(spaceDraftMeta?.labelGrid);
  const importedSupportGrid = normalizeStoredGrid(spaceDraftMeta?.supportGrid);
  if (importedFillGrid) {
    nextDraft.fillGrid = importedFillGrid;
  }
  if (importedLabelGrid) {
    nextDraft.labelGrid = importedLabelGrid;
  }
  if (importedSupportGrid) {
    nextDraft.supportGrid = importedSupportGrid;
  }
  if (Array.isArray(spaceDraftMeta?.regions)) {
    nextDraft.regions = cloneJson(spaceDraftMeta.regions);
  }
  if (Array.isArray(spaceDraftMeta?.portalBindings)) {
    nextDraft.portalBindings = cloneJson(spaceDraftMeta.portalBindings);
  }

  draftBySpaceId.set(space.id, nextDraft);
  persistDraft(space.id, nextDraft);
  persistSceneOverride(space.id, project);
  renderActiveSpace();
  setStatus(`Imported ${file.name} locally.`);
}

function selectInteractiveAtCell(space, draft, cell) {
  const region = getRegionAtCell(draft, cell);
  if (region) {
    selectedInteractiveRegionId = region.id;
    selectedInteractionType = region.interaction?.type || selectedInteractionType;
    refreshAuthoringUI(space);
    setStatus(`Selected ${region.label || "interactive"} for editing.`);
    return;
  }

  const { blobLookup } = buildInteractiveBlobs(draft);
  const blob = blobLookup.get(cellKey(cell.x, cell.y)) ?? null;
  if (!blob) {
    selectedInteractiveRegionId = null;
    pendingArtSrc = null;
    refreshAuthoringUI(space);
    setStatus("That spot is not labeled as an interactive room thing yet.");
    return;
  }

  pendingArtSrc = null;
  selectedInteractiveRegionId = blob.id;
  refreshAuthoringUI(space);
  setStatus(`Selected ${blob.labelName}.`);
}

function clientToCell(event) {
  const rect = roomStage.getBoundingClientRect();
  const pixelX = Math.floor(((event.clientX - rect.left) / rect.width) * manifest.stage.width);
  const pixelY = Math.floor(((event.clientY - rect.top) / rect.height) * manifest.stage.height);
  const tileX = Math.floor((pixelX - manifest.stage.gutterLeft) / manifest.stage.tileWidth);
  const tileY = Math.floor(pixelY / manifest.stage.tileHeight);

  if (
    pixelX < manifest.stage.gutterLeft ||
    pixelX >= manifest.stage.width - manifest.stage.gutterRight ||
    tileX < 0 ||
    tileX >= manifest.stage.gridWidth ||
    tileY < 0 ||
    tileY >= manifest.stage.gridHeight
  ) {
    return null;
  }

  return { x: tileX, y: tileY };
}

function applyPaint(space, draft, cell) {
  draft.fillGrid[cell.y][cell.x] = selectedColorId === ERASE_ID ? null : selectedColorId;
  persistDraft(space.id, draft);
  drawFillGrid(draft.fillGrid);
}

function applyLabel(space, draft, cell) {
  if (activeLabelLayer === "support") {
    if (selectedSupportLabelId === ERASE_ID) {
      draft.supportGrid[cell.y][cell.x] = null;
    } else {
      draft.supportGrid[cell.y][cell.x] = "solid";
    }
  } else {
    if (selectedObjectLabelId === ERASE_ID) {
      draft.labelGrid[cell.y][cell.x] = null;
    } else {
      draft.labelGrid[cell.y][cell.x] = selectedObjectLabelId;
    }
  }
  persistDraft(space.id, draft);
  drawLabelOverlay(space, draft);
}

function handleEditorStroke(event) {
  const space = getCurrentSpace();
  if (space.revealState !== "drawn") {
    return;
  }

  const cell = clientToCell(event);
  pointerStroke = {
    ...(pointerStroke || {}),
    hoverCell: cell,
  };
  drawEditorCursor();

  if (!pointerStroke?.drawing || !cell) {
    return;
  }

  const cellKey = `${cell.x}:${cell.y}`;
  if (pointerStroke.lastCellKey === cellKey) {
    return;
  }
  pointerStroke.lastCellKey = cellKey;

  const draft = getDraft(space);
  if (authorMode === "paint") {
    applyPaint(space, draft, cell);
  } else if (authorMode === "labels") {
    applyLabel(space, draft, cell);
  }

  updateFeedback(space);
}

editorLayer.addEventListener("pointerdown", (event) => {
  if (authorMode === "view") {
    return;
  }
  const cell = clientToCell(event);
  const space = getCurrentSpace();
  const draft = getDraft(space);
  if (authorMode === "interactive") {
    if (cell) {
      selectInteractiveAtCell(space, draft, cell);
    }
    return;
  }
  pointerStroke = {
    drawing: true,
    pointerId: event.pointerId,
    lastCellKey: null,
    hoverCell: cell,
  };
  editorLayer.setPointerCapture(event.pointerId);
  handleEditorStroke(event);
});

editorLayer.addEventListener("pointermove", (event) => {
  if (pointerStroke && pointerStroke.pointerId !== undefined && pointerStroke.pointerId !== event.pointerId) {
    return;
  }
  if (authorMode === "interactive") {
    return;
  }
  handleEditorStroke(event);
});

editorLayer.addEventListener("pointerleave", () => {
  if (pointerStroke) {
    pointerStroke.hoverCell = null;
  }
  drawEditorCursor();
});

function endEditorStroke(event) {
  if (pointerStroke?.pointerId !== undefined && event?.pointerId !== undefined && pointerStroke.pointerId !== event.pointerId) {
    return;
  }
  pointerStroke = null;
  drawEditorCursor();
  const space = getCurrentSpace();
  updateFeedback(space);
}

editorLayer.addEventListener("pointerup", endEditorStroke);
editorLayer.addEventListener("pointercancel", endEditorStroke);

toolButtons.forEach((button) => {
  let pressTimer = null;
  const icon = button.querySelector(".author-tool__icon-image");

  const setPressedState = (pressed) => {
    button.classList.toggle("is-pressed", pressed);
    if (!icon) {
      return;
    }
    const nextSrc = pressed ? icon.dataset.pressedSrc : icon.dataset.defaultSrc;
    if (nextSrc) {
      icon.src = nextSrc;
    }
  };

  const releasePress = () => {
    button.classList.remove("is-pressed");
    setPressedState(false);
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  button.addEventListener("pointerdown", () => {
    if (button.disabled) {
      return;
    }
    setPressedState(true);
  });

  button.addEventListener("pointerup", releasePress);
  button.addEventListener("pointercancel", releasePress);
  button.addEventListener("pointerleave", releasePress);

  button.addEventListener("click", () => {
    if (button.disabled) {
      return;
    }
    setAuthorMode(button.dataset.tool);
    setPressedState(true);
    pressTimer = window.setTimeout(() => {
      setPressedState(false);
      pressTimer = null;
    }, 90);
  });
});

navBackwardButton?.addEventListener("click", () => {
  const previousSpaceId = spaceTrail.pop();
  if (!previousSpaceId) {
    return;
  }
  if (activeSpaceId) {
    forwardTrail.push(activeSpaceId);
  }
  activeSpaceId = previousSpaceId;
  writeLocationSpaceId(activeSpaceId);
  renderActiveSpace();
});

navForwardButton?.addEventListener("click", () => {
  const nextSpaceId = forwardTrail.pop();
  if (!nextSpaceId) {
    return;
  }
  if (activeSpaceId) {
    spaceTrail.push(activeSpaceId);
  }
  activeSpaceId = nextSpaceId;
  writeLocationSpaceId(activeSpaceId);
  renderActiveSpace();
});

navBonusButton?.addEventListener("click", () => {
  if (!manifest) {
    return;
  }
  const bonusSpace = manifest.spaces.find((candidate) => candidate.navigationKind === "bonus");
  if (!bonusSpace) {
    return;
  }
  jumpToSpace(bonusSpace.id);
});

navTreefortButton?.addEventListener("click", () => {
  if (!manifest) {
    return;
  }
  const treefortLink = manifest.links.find((item) => item.href);
  if (treefortLink?.href) {
    window.location.assign(treefortLink.href);
  }
});

exportRoomButton?.addEventListener("click", () => {
  if (exportRoomButton.disabled) {
    return;
  }
  void exportCurrentRoomPackage();
});

importRoomButton?.addEventListener("click", () => {
  importRoomInput?.click();
});

importRoomInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  try {
    await handleImportedRoomFile(file);
  } catch (error) {
    setStatus(error.message);
  }
});

interactionTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) {
      return;
    }
    selectedInteractionType = button.dataset.interactionType;
    pendingArtSrc = null;
    syncInteractiveForm(getCurrentSpace());
  });
});

gifOverlay?.addEventListener("click", dismissGifOverlay);
noteOverlay?.addEventListener("click", dismissNoteOverlay);

artUploadButton?.addEventListener("click", () => {
  artGifInput?.click();
});

artGifInput?.addEventListener("change", async () => {
  const file = artGifInput.files?.[0];
  if (!file) {
    return;
  }
  artGifInput.value = "";
  try {
    pendingArtSrc = await loadArtGif(file);
    if (artUploadStatus) {
      artUploadStatus.textContent = "GIF loaded.";
    }
    if (artUploadButton) {
      artUploadButton.textContent = "Replace GIF";
    }
    setStatus("GIF loaded. Hit Save to keep it.");
  } catch (error) {
    pendingArtSrc = null;
    setStatus(error.message);
    if (artUploadStatus) {
      artUploadStatus.textContent = error.message;
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    dismissAllOverlays();
  }
});

saveInteractionButton?.addEventListener("click", () => {
  const space = getCurrentSpace();
  const draft = getDraft(space);
  const { selectedBlob, evaluation } = getInteractiveSelection(space, draft);

  if (!selectedBlob) {
    setStatus("Pick a labeled blob before saving an interaction.");
    return;
  }

  if (selectedInteractionType === "secret-room" && !evaluation.secretRoomUnlocked) {
    setStatus("Secret Room unlocks after the room is fully taught.");
    return;
  }

  const interaction = {
    type: selectedInteractionType,
    title:
      interactionTitleInput.value.replace(/\s+/g, " ").trim() ||
      defaultInteractionForType(selectedInteractionType, selectedBlob).title,
  };

  if (selectedInteractionType === "secret-room") {
    interaction.targetSpaceId = interactionSecretTarget.value;
  } else if (selectedInteractionType === "art") {
    const artSrc = pendingArtSrc || getInteractiveSelection(space, draft).region?.interaction?.artSrc;
    if (!artSrc) {
      setStatus("Load a GIF first.");
      return;
    }
    interaction.artSrc = artSrc;
    interaction.body = "";
  } else {
    interaction.body = interactionDescriptionInput.value.trim();
  }

  upsertInteractiveRegion(space, draft, selectedBlob, interaction);
  pendingArtSrc = null;
  selectedInteractiveRegionId = selectedBlob.id;
  renderActiveSpace();
  setStatus(`Saved ${interaction.type} on ${selectedBlob.labelName.toLowerCase()}.`);
});

clearInteractionButton?.addEventListener("click", () => {
  const space = getCurrentSpace();
  const draft = getDraft(space);
  if (!selectedInteractiveRegionId) {
    return;
  }
  clearInteractiveRegion(space, draft, selectedInteractiveRegionId);
  const clearedRegionId = selectedInteractiveRegionId;
  selectedInteractiveRegionId = null;
  renderActiveSpace();
  setStatus(`Cleared ${clearedRegionId}.`);
});

function renderActiveSpace() {
  const previousSpaceId = activeSpaceId;
  const space = getCurrentSpace();
  const draft = getDraft(space);
  const sceneOverride = getSceneOverride(space);
  activeSpaceId = space.id;
  if (previousSpaceId !== null && previousSpaceId !== space.id) {
    selectedInteractiveRegionId = null;
  }

  if (roomEyebrow) {
    roomEyebrow.textContent = manifest.presentation.eyebrow;
  }
  roomTitle.textContent = "TREEFORT";
  if (sceneTitle) {
    sceneTitle.textContent = space.title;
  }
  if (sceneEyebrow) {
    sceneEyebrow.textContent =
      space.id === manifest.entrySpaceId ? "Main room" : space.revealState === "drawn" ? "Hidden room" : "Undrawn room";
  }
  renderNavigation(space);

  clearStage();
  resetStatus(space);
  updateFeedback(space);

  if (space.revealState !== "drawn") {
    refreshAuthoringUI(space);
    return;
  }

  drawFillGrid(draft.fillGrid);
  const asset = assetById.get(space.sceneArtAssetId);
  if (!sceneOverride && !asset) {
    setStatus("This room is marked as drawn, but its scene art is missing.");
    refreshAuthoringUI(space);
    return;
  }

  if (sceneOverride?.app === "IcyAnimation") {
    renderIcyProject(sceneOverride, space.id).catch((error) => {
      setStatus(error.message);
    });
  } else if (asset.mimeType === "application/json" && asset.path.endsWith(".json")) {
    renderIcySceneAsset(asset, space.id).catch((error) => {
      setStatus(error.message);
    });
  } else {
    sceneLineart.src = asset.path;
    sceneLineart.alt = `${space.title} line art`;
    sceneLineart.classList.remove("hidden");
  }

  renderRegions(space, draft);
  refreshAuthoringUI(space);
}

function renderShell() {
  buildPaintSwatches();
  buildLabelBrushes();
  buildSupportBrushes();
  activeSpaceId = readLocationSpaceId();
  renderActiveSpace();
}

window.addEventListener("popstate", () => {
  if (!manifest) {
    return;
  }

  const nextSpaceId = readLocationSpaceId();
  if (nextSpaceId === activeSpaceId) {
    return;
  }

  if (spaceTrail[spaceTrail.length - 1] === nextSpaceId) {
    spaceTrail.pop();
  } else if (nextSpaceId === manifest.entrySpaceId) {
    spaceTrail = [];
  }
  forwardTrail = [];

  activeSpaceId = nextSpaceId;
  renderActiveSpace();
});

async function main() {
  const response = await fetch("./data/room.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load room manifest: ${response.status}`);
  }

  manifest = await response.json();
  paletteById = new Map(manifest.palette.map((entry) => [entry.id, entry.hex]));
  for (const entry of PAINT_SWATCHES) {
    paletteById.set(entry.id, entry.hex);
  }
  assetById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  spaceById = new Map(manifest.spaces.map((space) => [space.id, space]));
  for (const space of manifest.spaces) {
    if (space.revealState !== "drawn") {
      clearSceneOverride(space.id);
    }
  }
  selectedColorId = ERASE_ID;
  selectedObjectLabelId = ERASE_ID;
  selectedSupportLabelId = ERASE_ID;
  activeLabelLayer = "objects";
  writeLocationSpaceId(readLocationSpaceId(), true);
  renderShell();
}

main().catch((error) => {
  if (roomEyebrow) {
    roomEyebrow.textContent = "Load error";
  }
  roomTitle.textContent = "TREEFORT";
  if (sceneTitle) {
    sceneTitle.textContent = "Room offline";
  }
  navForwardButton.disabled = true;
  navBackwardButton.disabled = true;
  navTreefortButton.disabled = true;
  navBonusButton.disabled = true;
  criticDialog.textContent = error.message;
  setStatus(error.message);
});
