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
const interactionNoteWindow = document.getElementById("interaction-note-window");
const interactionNoteInput = document.getElementById("interaction-note");
const noteGlitchOverlay = document.getElementById("note-glitch-overlay");
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

const _searchParams = new URLSearchParams(window.location.search);
const debugRegions = _searchParams.get("debug") === "1";
const debugMode = _searchParams.has("debug");
const ERASE_ID = "__erase__";
const LOCAL_DRAFT_PREFIX = "treefort-room-draft-v4:";
const ICY_LAYER_COLORS = ["#17191d", "#ef8f50", "#4d9fe7", "#2db8a1", "#de6a8b", "#f5c74e"];
const ROOM_META_SCHEMA = "treefort-room-hidden-meta";
const ROOM_META_SCHEMA_VERSION = 1;
const ROOM_BACKGROUND_NOTICE_DEFAULT = "ROOM COLORS ARE NOT EDITABLE";
const ROOM_WARNING_DEFAULT =
  "Your tags will be saved, and your colors will be shown on the background side in IcyAnimation for reference. Changes to that reference do not carry back into the bedroom.";
const SUPPORT_MESSAGE_DEFAULT = "... Support lines let a pet know where it can stand and walk. If one arrives...";
let DIALOG = {};
function dlg(id) { return DIALOG[id] || {}; }
function dlgText(id, vars) {
  let t = dlg(id).text || "";
  if (!vars) return t;
  let gs = vars._glitchSeed || 1;
  t = t.replace(/\{glitch\}/g, () => glitchText(gs++));
  for (const [k, v] of Object.entries(vars)) {
    if (!k.startsWith("_")) t = t.replaceAll("{" + k + "}", String(v));
  }
  return t;
}
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
let guestParam = null;
let isResident = false;
let isSolo = false;
let isGuestReadonly = false;

const RESIDENT_OVERLAY_COLORS = [
  "rgba(69, 176, 98, 0.62)",
  "rgba(229, 112, 162, 0.62)",
  "rgba(197, 124, 54, 0.62)",
  "rgba(92, 172, 255, 0.62)",
  "rgba(255, 207, 78, 0.66)",
  "rgba(152, 102, 67, 0.62)",
  "rgba(84, 198, 209, 0.62)",
  "rgba(140, 98, 224, 0.62)",
  "rgba(211, 82, 89, 0.62)",
  "rgba(128, 200, 140, 0.62)",
];

const RESIDENT_LABELS_KEY = "treefort-resident-labels";

function loadResidentLabels(spaceId) {
  const raw = window.localStorage.getItem(`${RESIDENT_LABELS_KEY}:${spaceId}`);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function saveResidentLabels(spaceId, labels) {
  window.localStorage.setItem(`${RESIDENT_LABELS_KEY}:${spaceId}`, JSON.stringify(labels));
}

const SOLO_STATE_KEY = "treefort-solo-state";

function persistSoloManifest() {
  if (!isSolo && !isResident) return;
  const state = {
    completedWaves: manifest.completedWaves || [],
    questPhase: manifest.questPhase,
    stickerBookOpened: manifest.stickerBookOpened || false,
    secretGraduationShown: manifest.secretGraduationShown || false,
    captureWarningShown: manifest.captureWarningShown || false,
    keyArt: manifest.keyArt || null,
    stickers: manifest.stickers || [],
  };
  localStorage.setItem(`${SOLO_STATE_KEY}:${manifest.roomId}`, JSON.stringify(state));
}

function loadSoloManifest() {
  const raw = localStorage.getItem(`${SOLO_STATE_KEY}:${manifest.roomId}`);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    if (state.completedWaves) manifest.completedWaves = state.completedWaves;
    if (state.questPhase !== undefined) manifest.questPhase = state.questPhase;
    if (state.stickerBookOpened) manifest.stickerBookOpened = true;
    if (state.secretGraduationShown) manifest.secretGraduationShown = true;
    if (state.captureWarningShown) manifest.captureWarningShown = true;
    if (state.keyArt) manifest.keyArt = state.keyArt;
    if (state.stickers?.length) manifest.stickers = state.stickers;
  } catch { /* ignore corrupt state */ }
}

function renameResidentLabel(space, goalId, newLabel) {
  const goal = space.scoreGoals?.find((g) => g.id === goalId);
  if (!goal) return;
  goal.label = newLabel;
  const labels = loadResidentLabels(space.id);
  labels[goalId] = newLabel;
  saveResidentLabels(space.id, labels);
  // Re-register brush with new label
  const idx = (space.scoreGoals || []).indexOf(goal);
  const overlay = RESIDENT_OVERLAY_COLORS[idx % RESIDENT_OVERLAY_COLORS.length];
  labelBrushById.set(goal.labelId, {
    id: goal.labelId,
    label: newLabel || `Slot ${idx + 1}`,
    key: newLabel || `Slot ${idx + 1}`,
    overlay,
  });
  buildLabelBrushes();
  buildLabelKey();
  drawLabelOverlay(space, getDraft(space));
}
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
let selectedInteractionType = "art";
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

  // Bonus and secret rooms auto-reveal on first visit — no Icy drawing needed
  if (targetSpace.revealState === "undrawn" && (targetSpace.id === "bonus" || targetSpace.id === "secret")) {
    targetSpace.revealState = "drawn";
  }

  if (activeSpaceId && activeSpaceId !== targetSpace.id) {
    spaceTrail.push(activeSpaceId);
  }
  forwardTrail = [];
  activeSpaceId = targetSpace.id;
  writeLocationSpaceId(activeSpaceId);
  renderActiveSpace();

  // Graduation dialog on first visit to secret room
  if (targetSpace.id === "secret" && manifest.questPhase === "decorating" && !secretGraduationShown) {
    secretGraduationShown = true;
    manifest.secretGraduationShown = true;
    showDialog({
      speaker: "Gum", frames: GUM_HAPPY,
      text: dlg("quest-graduation").text || "You've done everything a guest can do.",
      actions: [{ label: dlg("quest-graduation").actions?.[0] || "Wow", onClick: () => {} }],
    });
  }
}

function isBonusComplete() {
  const bonus = manifest.spaces.find((s) => s.id === "bonus");
  if (!bonus || !bonus.scoreGoals || bonus.scoreGoals.length === 0) return false;
  const maxWave = Math.max(...bonus.scoreGoals.map((g) => g.wave || 1));
  return (manifest.completedWaves || []).includes(`bonus-${maxWave}`);
}

function renderNavigation(space) {
  navBackwardButton.disabled = false;
  navForwardButton.disabled = forwardTrail.length === 0;
  navTreefortButton.disabled = !manifest.links.some((item) => item.href);
  const secretSpace = manifest.spaces.find((s) => s.id === "secret");
  const bonusSpace = manifest.spaces.find((s) => s.navigationKind === "bonus");
  // ? button: enabled only after bonus is complete, goes to secret room
  if (secretSpace && isBonusComplete()) {
    navBonusButton.disabled = space.id === "secret";
  } else {
    navBonusButton.disabled = !bonusSpace || space.id === bonusSpace?.id;
  }
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
      stageStatusDefault = dlg("status-paint-undrawn").text || "Pick colors now. Import a room drawing before you paint the stage.";
    } else if (authorMode === "labels") {
      stageStatusDefault = dlg("status-labels-undrawn").text || "Pick labels now. Import a room drawing before you tag the stage.";
    } else if (authorMode === "interactive") {
      stageStatusDefault = dlg("status-interactive-undrawn").text || "Import a room and label a few spots before you wire up interactions.";
    } else {
      stageStatusDefault = space.placeholderPrompt;
    }
  } else if (authorMode === "paint") {
    stageStatusDefault = dlg("status-paint").text || "Drag a color across the room.";
  } else if (authorMode === "labels") {
    stageStatusDefault = dlg("status-labels").text || "Paint floor, poster, opening, or prop zones like a collision map.";
  } else if (authorMode === "interactive") {
    stageStatusDefault = dlg("status-interactive").text || "Pick a labeled thing, then decide what it does.";
  } else if (space.portalBindings.length > 0) {
    stageStatusDefault = dlg("status-portals").text || "Click around the drawing to travel through the room.";
  } else {
    stageStatusDefault = dlg("status-quiet").text || "This room is quiet for now.";
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

  return dlg("status-spot-quiet").text || "This spot is quiet right now.";
}

function getSelectionMessage(space, draft) {
  if (authorMode === "labels" && activeLabelLayer === "support") {
    return (dlg("const-support-msg").text || SUPPORT_MESSAGE_DEFAULT);
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
  // Map special cases; everything else is its own labelId
  const surfaceToLabel = { poster: "poster-secret" };
  if (!patch.surface) return null;
  return surfaceToLabel[patch.surface] || patch.surface;
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
      backgroundNotice: (dlg("const-bg-notice").text || ROOM_BACKGROUND_NOTICE_DEFAULT),
    },
    reference: {
      warning: (dlg("const-room-warning").text || ROOM_WARNING_DEFAULT),
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
  markGuestDirty();
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

function getActiveWaveForSpace(space) {
  const completed = manifest.completedWaves || [];
  const goals = getScoreGoals(space);
  if (!goals.length) return 1;
  const maxWave = Math.max(...goals.map((g) => g.wave || 1));
  for (let w = 1; w <= maxWave; w++) {
    if (!completed.includes(`${space.id}-${w}`)) return w;
  }
  return maxWave;
}

function evaluateSpace(space, draft) {
  if (space.revealState !== "drawn") {
    return {
      earned: 0,
      total: 0,
      critic: space.placeholderPrompt,
      secretRoomUnlocked: false,
      waveComplete: false,
      allComplete: false,
    };
  }

  const allGoals = getScoreGoals(space);
  const wave = getActiveWaveForSpace(space);

  // Only count goals up to and including the current wave
  const activeGoals = allGoals.filter((g) => (g.wave || 1) <= wave);
  const currentWaveGoals = allGoals.filter((g) => (g.wave || 1) === wave);

  let earned = 0;
  let total = activeGoals.length;
  let missingHint = null;
  let currentWaveEarned = 0;

  for (const goal of activeGoals) {
    const count = countCellsForLabel(draft.labelGrid, goal.labelId);
    if (count >= goal.minCells) {
      earned += 1;
      if ((goal.wave || 1) === wave) currentWaveEarned += 1;
    } else if (!missingHint && (goal.wave || 1) === wave) {
      missingHint = `${goal.hint || (dlg("critic-missing-fallback").text || "...this room still needs {label}.").replace("{label}", goal.label.toLowerCase())} (${count}/${goal.minCells})`;
    }
  }

  const waveComplete = currentWaveGoals.length > 0 && currentWaveEarned >= currentWaveGoals.length;
  const maxWave = allGoals.length ? Math.max(...allGoals.map((g) => g.wave || 1)) : 1;
  const allComplete = waveComplete && wave >= maxWave;

  if (!total) {
    return {
      earned: 0, total: 0,
      critic: dlg("critic-no-goals").text || "...draw the room, then teach it what everything is.",
      secretRoomUnlocked: false, waveComplete: false, allComplete: false,
    };
  }

  if (allComplete) {
    return {
      earned, total: allGoals.length,
      critic: dlg("critic-all-complete").text || "...the room knows every object now. secret room unlocked.",
      secretRoomUnlocked: true, waveComplete: true, allComplete: true,
    };
  }

  return {
    earned, total,
    critic: waveComplete
      ? (dlg("critic-wave-complete").text || "...wave complete! something is happening...")
      : missingHint || (dlg("critic-default").text || "...keep teaching the room what things are."),
    secretRoomUnlocked: false, waveComplete, allComplete: false,
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
    const selectedLabelId = selectedBlob?.labelId || region?.semanticLabelId || null;
    const secretRoomLocked = type === "secret-room" && selectedLabelId !== "poster-secret";
    button.disabled = secretRoomLocked;
    button.classList.toggle("is-active", type === selectedInteractionType);
  });
  interactionTitleWindow?.classList.toggle("hidden", authorMode !== "interactive");
  interactionDescriptionWindow?.classList.toggle("hidden", authorMode !== "interactive");
  interactionActionWindow?.classList.toggle("hidden", authorMode !== "interactive");
  interactionSaveWindow?.classList.toggle("hidden", authorMode !== "interactive");
  artUploadWindow?.classList.add("hidden");
  interactionNoteWindow?.classList.add("hidden");
  interactionSaveWindow?.classList.toggle("is-sinister", selectedInteractionType === "words");
  interactionActionWindow?.classList.toggle("is-sinister", selectedInteractionType === "words");

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

  const selectedLabelId = selectedBlob?.labelId || region?.semanticLabelId || null;
  const secretRoomLocked = selectedLabelId !== "poster-secret";
  const noTargets = false;
  if (!selectedBlob && !region) {
    syncInteractiveSelectedSwatch(null, "");
    interactionTitleInput.value = "";
    interactionDescriptionInput.value = "";
    if (interactionNoteInput) interactionNoteInput.value = "";
    if (noteGlitchOverlay) noteGlitchOverlay.textContent = "";
    interactionSecretTarget.value = secretRoomOptions[0]?.id ?? "";
    interactionTitleInput.disabled = true;
    interactionDescriptionInput.disabled = true;
    if (interactionNoteInput) interactionNoteInput.disabled = true;
    interactionSecretTarget.disabled = true;
    saveInteractionButton.disabled = true;
    clearInteractionButton.disabled = true;
    interactionTargetField.classList.add("hidden");
    artUploadWindow?.classList.add("hidden");
    interactionSaveWindow?.classList.remove("is-sinister");
    interactionActionWindow?.classList.remove("is-sinister");
    return;
  }

  const blob = selectedBlob ?? {
    labelId: region?.semanticLabelId || "poster-secret",
    labelName: region?.label || "Interactive",
  };
  syncInteractiveSelectedSwatch(blob.labelId, blob.labelName);

  const effectiveType = selectedInteractionType;
  interactionTypeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.interactionType === effectiveType);
  });

  interactionTargetField.classList.add("hidden");
  artUploadWindow?.classList.toggle("hidden", effectiveType !== "art");
  interactionDescriptionWindow?.classList.toggle("hidden", effectiveType === "art" || authorMode !== "interactive");
  interactionNoteWindow?.classList.toggle("hidden", effectiveType !== "words" || authorMode !== "interactive");
  interactionSaveWindow?.classList.toggle("is-sinister", effectiveType === "words");
  interactionActionWindow?.classList.toggle("is-sinister", effectiveType === "words");

  interactionTitleInput.disabled = false;
  interactionDescriptionInput.disabled = false;
  interactionSecretTarget.disabled = effectiveType !== "secret-room" || secretRoomLocked || noTargets;
  saveInteractionButton.disabled = effectiveType === "secret-room" && (secretRoomLocked || noTargets);
  clearInteractionButton.disabled = !savedInteraction;

  interactionTitleInput.value = savedInteraction?.title || "";
  interactionDescriptionInput.value = region?.description || savedInteraction?.body || "";
  if (interactionNoteInput) {
    interactionNoteInput.value = savedInteraction?.noteText || "";
    interactionNoteInput.disabled = false;
    syncNoteGlitch();
  }

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

  dismissNoteOverlay();
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
    const noteText = interaction.noteText || region.label || "Note";
    showNoteOverlay(noteText, zalgoify(noteText));
    if (interaction.body) {
      setMessage(interaction.body);
    }
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

  checkWaveAdvancement(space, evaluation);
}

let _waveAdvancing = false;

function checkWaveAdvancement(space, evaluation) {
  if (_waveAdvancing) return;
  if (manifest.questPhase !== "decorating") return;
  if (!evaluation.waveComplete) return;

  const wave = getActiveWaveForSpace(space);
  const allGoals = getScoreGoals(space);
  const maxWave = allGoals.length ? Math.max(...allGoals.map((g) => g.wave || 1)) : 1;

  // Already announced this wave completion — don't repeat
  if (!manifest.completedWaves) manifest.completedWaves = [];
  const completedKey = `${space.id}-${wave}`;
  if (manifest.completedWaves.includes(completedKey)) return;

  if (evaluation.allComplete) {
    // All waves done for this space
    _waveAdvancing = true;
    manifest.completedWaves.push(completedKey);

    if (space.id === "main") {
      showDialog({
        speaker: "Gum", frames: GUM_HAPPY,
        text: dlg("wave-main-complete").text || "You did it!",
        actions: [{ label: dlg("wave-main-complete").actions?.[0] || "!!!", onClick: () => { _waveAdvancing = false; } }],
      });
    } else if (space.id === "bonus") {
      showDialog({
        speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
        text: dlgText("wave-bonus-complete", { _glitchSeed: 99 }),
        actions: [{ label: dlg("wave-bonus-complete").actions?.[0] || "...", onClick: () => { _waveAdvancing = false; } }],
      });
    } else {
      _waveAdvancing = false;
    }
    saveGuestRoom();
    persistSoloManifest();
    return;
  }

  // Wave complete but more waves remain — advance
  _waveAdvancing = true;
  manifest.completedWaves.push(completedKey);

  const nextWave = wave + 1;
  if (space.id === "main") {
    const waveKey = `wave-main-${nextWave}`;
    showDialog({
      speaker: "Gum", frames: GUM_HAPPY,
      text: dlg(waveKey).text || `Wave ${nextWave} unlocked! Keep going!`,
      actions: [{ label: dlg(waveKey).actions?.[0] || "On it!", onClick: () => { _waveAdvancing = false; buildLabelBrushes(); updateFeedback(getCurrentSpace()); } }],
    });
  } else if (space.id === "bonus") {
    const bonusKey = `wave-bonus-${nextWave}`;
    showDialog({
      speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
      text: dlgText(bonusKey, { _glitchSeed: nextWave * 2 - 1 }) || `${glitchText(nextWave * 10)} ...n̸ext.`,
      actions: [{ label: dlg(bonusKey).actions?.[0] || "...okay", onClick: () => { _waveAdvancing = false; buildLabelBrushes(); updateFeedback(getCurrentSpace()); } }],
    });
  } else {
    _waveAdvancing = false;
  }
  saveGuestRoom();
  persistSoloManifest();
}

function refreshAuthoringUI(space) {
  const canAuthor = space.revealState === "drawn";
  const showFillLayer = space.revealState === "drawn" && (authorMode === "view" || authorMode === "paint");
  const hasGoals = getScoreGoals(space).length > 0;
  const showLabelsInView = authorMode === "view" && hasGoals;
  const leftPanelMode = authorMode === "view" ? (hasGoals ? "labels" : "") : authorMode;
  leftPanelWindow.classList.toggle("is-collapsed", !leftPanelMode);
  leftPanelBody.classList.toggle("hidden", !leftPanelMode);
  leftPanelWindow.classList.remove("is-fill");
  supportWindow?.classList.toggle("hidden", authorMode !== "labels");
  leftPanelTitle.textContent = showLabelsInView ? "Objects" : "Submenu";
  paintPanel.classList.toggle("hidden", authorMode !== "paint");
  labelPanel.classList.toggle("hidden", authorMode !== "labels" && !showLabelsInView);
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
    // Readonly guests can only view
    button.disabled = isGuestReadonly && tool !== "view";
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
  const displayName = manifest.owner?.displayName || manifest.roomId;
  const suffix = space.id === "main" ? "" : `_${space.id}`;
  const fileName = `${displayName}${suffix}.room`;

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
  // Readonly guests can only view
  if (isGuestReadonly && nextMode !== "view") return;
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

// Bonus room label overlays — Glitchby's weird labels
const BONUS_LABEL_OVERLAYS = {
  dry: "rgba(210, 180, 140, 0.62)",
  wet: "rgba(50, 120, 200, 0.62)",
  cold: "rgba(140, 200, 255, 0.62)",
  hot: "rgba(255, 80, 40, 0.62)",
  light: "rgba(255, 240, 140, 0.66)",
  dark: "rgba(40, 20, 60, 0.62)",
  lost: "rgba(160, 80, 200, 0.62)",
  found: "rgba(80, 200, 120, 0.62)",
};

function getLabelBrushesForSpace(space) {
  const wave = getActiveWaveForSpace(space);
  const goals = getScoreGoals(space);
  if (!goals.length) return OBJECT_LABEL_BRUSHES;

  // Resident mode: no wave gating, all slots always available
  const unlocked = isResident ? goals : goals.filter((g) => (g.wave || 1) <= wave);
  return unlocked.map((g, i) => {
    const existing = labelBrushById.get(g.labelId);
    if (existing) return existing;
    // Generate from goal (bonus room or resident)
    return {
      id: g.labelId,
      label: g.label || (isResident ? `Slot ${i + 1}` : g.label),
      key: g.label || (isResident ? `Slot ${i + 1}` : g.label),
      overlay: isResident
        ? RESIDENT_OVERLAY_COLORS[i % RESIDENT_OVERLAY_COLORS.length]
        : BONUS_LABEL_OVERLAYS[g.labelId] || "rgba(180, 180, 180, 0.62)",
    };
  });
}

function buildLabelBrushes() {
  labelBrushes.replaceChildren();

  const space = getCurrentSpace();
  const spaceBrushes = getLabelBrushesForSpace(space);

  // Register bonus labels in the lookup so overlays render
  for (const b of spaceBrushes) {
    if (!labelBrushById.has(b.id)) labelBrushById.set(b.id, b);
  }

  const brushes = [{ id: ERASE_ID, label: "Erase", key: "Erase", overlay: "rgba(255, 255, 255, 0.3)" }, ...spaceBrushes];

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

    // Resident mode: editable inline rename field for non-erase brushes
    if (isResident && entry.id !== ERASE_ID) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "label-key__label";
      input.value = entry.label.startsWith("Slot ") ? "" : entry.label;
      input.placeholder = entry.key;
      input.maxLength = 24;
      input.style.cssText = "background:transparent;border:none;border-bottom:1px dashed currentColor;color:inherit;font:inherit;width:5em;padding:0;outline:none;cursor:text;";
      input.addEventListener("click", (e) => e.stopPropagation());
      input.addEventListener("change", () => {
        renameResidentLabel(getCurrentSpace(), entry.id, input.value.trim());
      });
      button.append(swatch, input);
    } else {
      const label = document.createElement("p");
      label.className = "label-key__label";
      label.textContent = entry.key;
      button.append(swatch, label);
    }

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
      // Resident mode: hide unnamed slots in view mode
      if (isResident && !criterion.label) {
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
        showHoverTitle(getRegionHoverTitle(region), event);
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
    const isGlitchbyRoom = space.id === "bonus" || space.id === "secret";
    const targetIsGlitchby = spaceDraftMeta.spaceId === "bonus" || spaceDraftMeta.spaceId === "secret";
    if (isGlitchbyRoom) {
      // Importing Gum's stuff into Glitchby's space
      showDialog({
        speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
        text: dlgText("import-wrong-space-glitch", { _glitchSeed: 20 }),
        actions: [{ label: zalgoify("......"), onClick: () => {} }],
      });
    } else if (targetIsGlitchby) {
      // Importing Glitchby's stuff into Gum's space
      showDialog({
        speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
        text: dlgText("import-mine", { _glitchSeed: 15 }),
        actions: [{ label: zalgoify("......"), onClick: () => {} }],
      });
    } else {
      showDialog({
        speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
        text: dlgText("import-mine", { _glitchSeed: 22 }),
        actions: [{ label: zalgoify("......"), onClick: () => {} }],
      });
    }
    return;
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

const SPACE_PARENT = { bonus: "main", secret: "bonus" };

navBackwardButton?.addEventListener("click", () => {
  const parentId = SPACE_PARENT[activeSpaceId];
  if (parentId) {
    // Go to parent room
    if (activeSpaceId) forwardTrail.push(activeSpaceId);
    activeSpaceId = parentId;
    writeLocationSpaceId(activeSpaceId);
    renderActiveSpace();
    return;
  }
  // Main room → go to treefort hub
  if (activeSpaceId === "main" || !SPACE_PARENT[activeSpaceId]) {
    const treefortLink = manifest?.links?.find((item) => item.href);
    if (treefortLink?.href) {
      const hubHref = "../index.html";
      const fromId = manifest.roomId || "";
      window.location.assign(fromId ? `${hubHref}#from=${encodeURIComponent(fromId)}` : hubHref);
    }
  }
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
  if (!manifest) return;
  // After bonus completion, ? jumps to secret room
  const secretSpace = manifest.spaces.find((s) => s.id === "secret");
  if (secretSpace) {
    jumpToSpace(secretSpace.id);
    return;
  }
  // Fallback: old behavior
  const bonusSpace = manifest.spaces.find((s) => s.navigationKind === "bonus");
  if (bonusSpace) jumpToSpace(bonusSpace.id);
});

navTreefortButton?.addEventListener("click", async () => {
  if (!manifest) {
    return;
  }
  // Resident mode: go to neighbor hub
  if (isResident) {
    try {
      const res = await fetch("../data/treefort.json");
      if (res.ok) {
        const tf = await res.json();
        if (tf.resident?.neighborUrl) {
          window.location.assign(tf.resident.neighborUrl);
          return;
        }
      }
    } catch { /* fall through */ }
  }
  const treefortLink = manifest.links.find((item) => item.href);
  if (treefortLink?.href) {
    const hubHref = "../index.html";
    const fromId = manifest.roomId || "";
    window.location.assign(fromId ? `${hubHref}#from=${encodeURIComponent(fromId)}` : hubHref);
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
  if (!file) return;

  const lowerName = file.name.toLowerCase();

  // .SpecialKey import — Phase 3: return the key
  if (lowerName.endsWith(".specialkey")) {
    try {
      await handleSpecialKeyImport(file);
    } catch (error) {
      setStatus(error.message);
    }
    return;
  }

  // Standard .room/.icy import
  try {
    await handleImportedRoomFile(file);

    const space = getCurrentSpace();

    // If we were in awaiting-room, advance to decorating
    if (manifest.questPhase === "awaiting-room") {
      manifest.questPhase = "decorating";
      manifest.activeWave = 1;
      space.revealState = "drawn";
      await saveGuestRoom();
      persistSoloManifest();
      renderActiveSpace();
      const name = manifest.owner?.displayName || "friend";
      showDialog({
        speaker: "Gum", frames: GUM_HAPPY,
        text: dlgText("import-main-room", { name }),
        actions: [{ label: dlg("import-main-room").actions?.[0] || "Let's go!", onClick: () => {} }],
      });
    }

    // Bonus/secret room drawing imported — mark drawn and confirm
    if (space.id === "bonus" && space.revealState !== "drawn") {
      space.revealState = "drawn";
      await saveGuestRoom();
      renderActiveSpace();
      showDialog({
        speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
        text: dlgText("import-bonus-room", { _glitchSeed: 13 }),
        actions: [{ label: dlg("import-bonus-room").actions?.[0] || "...okay", onClick: () => {} }],
      });
    }
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
    // Live preview for words
    if (selectedInteractionType === "words") {
      updateNotePreview();
    } else {
      dismissNoteOverlay();
    }
  });
});

function updateNotePreview() {
  const note = interactionNoteInput?.value.trim() || "";
  showNoteOverlay(note || "Note", note ? zalgoify(note) : "");
}

function zalgoify(text) {
  const above = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u030a','\u030b','\u030c','\u030d','\u030e','\u030f','\u0310','\u0311','\u0312','\u0313','\u0314','\u0315','\u031a'];
  const below = ['\u0316','\u0317','\u0318','\u0319','\u031c','\u031d','\u031e','\u031f','\u0320','\u0323','\u0324','\u0325','\u0326','\u0329','\u032a','\u032b','\u032c','\u032d','\u032e','\u032f','\u0330','\u0331','\u0332','\u0333'];
  const mid = ['\u0334','\u0335','\u0336','\u0337','\u0338'];
  const swap = '\u2591\u2592\u2593\u2588\u25a0\u25b2\u25bc\u2666\u00ab\u00bb\u2020\u2021\u00a4\u00a7\u00b6\u2310\u2261\u2248\u221a\u221e';
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " " || ch === "\n") { out += ch; continue; }
    const h = (i * 9301 + text.charCodeAt(i) * 49297) % 233280;
    out += h % 7 === 0 ? swap[h % swap.length] : ch;
    const na = 2 + (h % 4);
    for (let j = 0; j < na; j++) out += above[(h + j * 37) % above.length];
    const nb = 1 + (h % 3);
    for (let j = 0; j < nb; j++) out += below[(h + j * 23) % below.length];
    if (h % 3 === 0) out += mid[h % mid.length];
  }
  return out;
}

function syncNoteGlitch() {
  if (!noteGlitchOverlay) return;
  const raw = interactionNoteInput?.value || "";
  noteGlitchOverlay.textContent = raw ? zalgoify(raw) : "";
}

interactionNoteInput?.addEventListener("input", () => {
  syncNoteGlitch();
  if (selectedInteractionType === "words") updateNotePreview();
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

  if (selectedInteractionType === "secret-room" && selectedBlob?.labelId !== "poster-secret") {
    setStatus("Only the poster can hide a secret passage.");
    return;
  }

  const interaction = {
    type: selectedInteractionType,
    title:
      interactionTitleInput.value.replace(/\s+/g, " ").trim() ||
      defaultInteractionForType(selectedInteractionType, selectedBlob).title,
  };

  if (selectedInteractionType === "secret-room") {
    interaction.targetSpaceId = "bonus";
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

  if (selectedInteractionType === "words") {
    interaction.noteText = interactionNoteInput?.value.trim() || "";
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
  buildLabelBrushes();
  buildSupportBrushes();

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

  // Sticker book + snapshot buttons track current space
  const inStickerMode = isResident || ((guestParam || isSolo) && manifest.questPhase === "decorating" && isBonusComplete());
  if (stickerBookButton) {
    stickerBookButton.classList.toggle("hidden", !inStickerMode);
    if (!inStickerMode) closeStickerBook();
  }
  if (captureButton) {
    const showCapture = inStickerMode && space.id !== "secret";
    captureButton.classList.toggle("hidden", !showCapture);
    captureButton.disabled = stickerBookFirstOpen || (manifest.stickers || []).length >= MAX_CAPTURES;
    authorScore.classList.toggle("hidden", showCapture);
  }

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
    if (!debugMode) {
      setStatus("This room is marked as drawn, but its scene art is missing.");
    }
    renderRegions(space, draft);
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

// ════════════════════════════════════════
//  Quest Dialog System
// ════════════════════════════════════════

const questDialogEl = document.getElementById("quest-dialog");
const questDialogPortrait = document.getElementById("quest-dialog-portrait");
const questDialogSpeaker = document.getElementById("quest-dialog-speaker");
const questDialogText = document.getElementById("quest-dialog-text");
const questDialogActions = document.getElementById("quest-dialog-actions");

let _talkInterval = null;

/**
 * showDialog({ speaker, frames, text, actions })
 *   speaker — display name ("Gum", "Chew", anything)
 *   frames  — array of image URLs, 1 = static, 2 = talk anim
 *   text    — dialog body string
 *   actions — [{ label, onClick }]
 */
function showDialog({ speaker, frames, text, actions, input, animSpeed }) {
  if (!questDialogEl) return;
  if (_talkInterval) { clearInterval(_talkInterval); _talkInterval = null; }

  // Size portrait to integer pixel scale — min 2x, max 3x
  const sizePortrait = (img) => {
    const nat = img.naturalHeight || 36;
    const scale = Math.max(2, Math.min(3, Math.floor(120 / nat)));
    img.style.width = `${img.naturalWidth * scale}px`;
    img.style.height = `${nat * scale}px`;
  };
  questDialogPortrait.onload = () => sizePortrait(questDialogPortrait);
  questDialogPortrait.src = frames[0];
  questDialogPortrait.alt = speaker;
  questDialogPortrait.dataset.speaker = speaker.toLowerCase();
  questDialogSpeaker.textContent = speaker;
  questDialogText.textContent = text;
  questDialogActions.replaceChildren();

  if (frames.length > 1) {
    let frame = 0;
    _talkInterval = setInterval(() => {
      frame = 1 - frame;
      questDialogPortrait.src = frames[frame];
    }, animSpeed || 260);
  }

  let inputEl = null;
  if (input) {
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.className = "quest-dialog__input";
    inputEl.placeholder = input.placeholder || "";
    inputEl.maxLength = input.maxLength || 48;
    questDialogActions.appendChild(inputEl);
    requestAnimationFrame(() => inputEl.focus());
  }

  for (const action of actions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-link room-link--button";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      if (_talkInterval) { clearInterval(_talkInterval); _talkInterval = null; }
      questDialogEl.classList.add("hidden");
      if (captureButton && !stickerBookFirstOpen && !stickerBookOpen) captureButton.disabled = false;
      if (action.onClick) action.onClick(inputEl ? inputEl.value : undefined);
    });
    questDialogActions.appendChild(btn);
  }
  questDialogEl.classList.remove("hidden");
  if (captureButton) captureButton.disabled = true;
}

const GUM_HAPPY = ["./assets/characters/gumDialA01.png", "./assets/characters/gumDialA02.png"];
const GUM_SAD   = ["./assets/characters/gumDialB01.png", "./assets/characters/gumDialB02.png"];
const GLITCHBY  = ["./assets/characters/glitchby1.png", "./assets/characters/glitchby2.png"];

function glitchText(seed) {
  const chunks = [
    "▓▒░", "█▄▀", "◄►▼", "╬═╗", "┼┤╣",
    "☐☐☐", "???", "___", "...", "───",
    "▓▓▓", "░░░", "┼┼┼", "═══", "╔╗╚",
    "▒▒▒", "▀▄▀", "╝╚╗", "┤├┬", "▄█▄",
  ];
  // Deterministic-ish shuffle from seed
  let h = seed;
  const pick = () => { h = (h * 9301 + 49297) % 233280; return chunks[h % chunks.length]; };
  const len = 6 + (seed % 5);
  return Array.from({ length: len }, pick).join(" ");
}

function buildParchment(guestId, guestName) {
  return {
    version: 1,
    app: "TreeFort",
    questPhase: "awaiting-key",
    guestId,
    guestName,
    createdAt: new Date().toISOString(),
    canvas: { width: 64, height: 64 },
    instructions: dlg("inst-parchment").text || "Draw a key. One chance. Forever.",
  };
}

function downloadParchment() {
  const guestId = manifest.roomId;
  const guestName = manifest.owner.displayName;
  const parchment = buildParchment(guestId, guestName);
  const blob = new Blob([JSON.stringify(parchment, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guestName}.Parchment`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function runQuestPhase() {
  if (!manifest.questPhase) return;

  const name = manifest.owner?.displayName || "friend";

  if (manifest.questPhase === "awaiting-key") {
    showDialog({
      speaker: "Gum", frames: GUM_HAPPY,
      text: dlgText("quest-awaiting-key", { name }),
      actions: [
        { label: dlg("quest-awaiting-key").actions?.[0] || "Take the Parchment", onClick: downloadParchment },
        { label: dlg("quest-awaiting-key").actions?.[1] || "I have a Key!", onClick: () => importRoomInput?.click() },
        { label: dlg("quest-awaiting-key").actions?.[2] || "Icy?", onClick: () => {
          showDialog({
            speaker: "Gum", frames: GUM_HAPPY,
            text: dlg("quest-icy-explain").text || "IcyAnimation is how we draw rooms!",
            actions: [
              { label: dlg("quest-icy-explain").actions?.[0] || "Take the Parchment", onClick: downloadParchment },
              { label: dlg("quest-icy-explain").actions?.[1] || "Not yet", onClick: () => {} },
            ],
          });
        }},
      ],
    });
    return;
  }

  if (manifest.questPhase === "awaiting-room") {
    showDialog({
      speaker: "Gum", frames: GUM_SAD,
      text: dlg("quest-awaiting-room").text || "Your room is empty.",
      actions: [
        { label: dlg("quest-awaiting-room").actions?.[0] || "Take the Room file", onClick: () => downloadRoomFile() },
        { label: dlg("quest-awaiting-room").actions?.[1] || "I drew my Room!", onClick: () => importRoomInput?.click() },
        { label: dlg("quest-awaiting-room").actions?.[2] || "Not yet", onClick: () => {} },
      ],
    });
    return;
  }

  if (manifest.questPhase === "decorating") {
    const space = getCurrentSpace();
    const wave = space ? getActiveWaveForSpace(space) : 1;

    // Secret room — graduation + sticker book
    if (space && space.id === "secret") {
      // Button visibility handled in renderActiveSpace()
      if (!secretGraduationShown) {
        secretGraduationShown = true;
    manifest.secretGraduationShown = true;
        showDialog({
          speaker: "Gum", frames: GUM_HAPPY,
          text: `You found it! You've done everything a guest can do. If you want to take up permanent residency with us, you can host your own room — your OWN Treefort. Ask the person who invited you how to get started. We'd love to have you as a neighbor.`,
          actions: [{ label: "Wow", onClick: () => {} }],
        });
      }
      return;
    }

    // Bonus room — Glitchby intro (wave 1 only, advancement handles the rest)
    if (space && space.id === "bonus" && wave === 1) {
      showDialog({
        speaker: "G̷l̶i̵t̸c̷h̶b̵y", frames: GLITCHBY,
        text: dlgText("quest-bonus-intro", { _glitchSeed: 1 }),
        actions: [
          { label: dlg("quest-bonus-intro").actions?.[0] || "How do I draw Dry and Wet?", onClick: () => { downloadBonusRoomFile(); } },
          { label: dlg("quest-bonus-intro").actions?.[1] || "Leave", onClick: () => { jumpToSpace("main"); } },
        ],
      });
      return;
    }

    // Main room — wave 1 intro (advancement handles 2+)
    if (space && space.id === "main" && wave === 1) {
      showDialog({
        speaker: "Gum", frames: GUM_HAPPY,
        text: dlgText("quest-decorating-main", { name: manifest.owner?.displayName || "friend" }),
        actions: [{ label: dlg("quest-decorating-main").actions?.[0] || "Let's go!", onClick: () => {} }],
      });
    }
    return;
  }
}

function downloadRoomFile(options = {}) {
  const guestName = manifest.owner.displayName;
  const roomFile = {
    version: 1,
    app: "TreeFort",
    questPhase: options.questPhase || "awaiting-room",
    guestId: manifest.roomId,
    guestName,
    createdAt: new Date().toISOString(),
    canvas: { width: 256, height: 192 },
    instructions: options.instructions || dlg("inst-room-file").text || "Draw your room.",
  };
  if (options.chewMessage) roomFile.chewMessage = options.chewMessage;
  if (options.chewMood) roomFile.chewMood = options.chewMood;
  const blob = new Blob([JSON.stringify(roomFile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guestName}.Room`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadBonusRoomFile() {
  const guestName = manifest.owner.displayName;
  const roomFile = {
    version: 1,
    app: "TreeFort",
    questPhase: "bonus-room",
    guestId: manifest.roomId,
    spaceId: "bonus",
    guestName,
    createdAt: new Date().toISOString(),
    canvas: { width: 256, height: 192 },
    instructions: dlg("inst-bonus-room").text || "Draw Glitchby's room.",
    chewMessage: dlg("inst-bonus-chew").text || "Glitchby needs a room too.",
  };
  const blob = new Blob([JSON.stringify(roomFile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guestName}_bonus.Room`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════
//  SpecialKey Import (Phase 3)
// ════════════════════════════════════════

async function handleSpecialKeyImport(file) {
  if (manifest.questPhase !== "awaiting-key") {
    throw new Error("You've already turned in your key!");
  }

  let keyData;
  try {
    keyData = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a valid SpecialKey.");
  }

  if (keyData?.app !== "IcyAnimation" || keyData?.questPhase !== "awaiting-key") {
    throw new Error("That doesn't look like a SpecialKey from Icy.");
  }

  // Store the key art as-is (displayed at 2x via CSS pixelated scaling)
  if (keyData.keyArt) {
    manifest.keyArt = keyData.keyArt;
  }

  // Advance quest
  manifest.questPhase = "awaiting-room";
  manifest.activeWave = 0;
  await saveGuestRoom();
  persistSoloManifest();

  const name = manifest.owner?.displayName || "friend";
  showDialog({
    speaker: "Gum", frames: GUM_HAPPY,
    text: dlg("quest-key-accepted").text || "Oh how pretty!",
    actions: [{ label: dlg("quest-key-accepted").actions?.[0] || "What?", onClick: () => {
      showDialog({
        speaker: "Gum", frames: GUM_SAD,
        text: dlg("quest-key-then-room").text || "Your room is empty.",
        actions: [
          { label: dlg("quest-key-then-room").actions?.[0] || "Take the Room file", onClick: () => downloadRoomFile() },
          { label: dlg("quest-key-then-room").actions?.[1] || "Not yet", onClick: () => {} },
        ],
      });
    }}],
  });
}

// ════════════════════════════════════════
//  Sticker Book
// ════════════════════════════════════════

const stickerBookButton = document.getElementById("sticker-book-button");
const captureButton = document.getElementById("capture-button");
const stickerBookOverlay = document.getElementById("sticker-book-overlay");
const stickerBookClose = document.getElementById("sticker-book-close");
const stickerBookPage = document.getElementById("sticker-book-page");
const stickerBookPageNum = document.getElementById("sticker-book-page-num");
const stickerBookLeft = document.getElementById("sticker-book-left");
const stickerBookRight = document.getElementById("sticker-book-right");

let stickerBookOpen = false;
let stickerBookIndex = 0;
let stickerBookFirstOpen = true;
let secretGraduationShown = false;
let captureWarningShown = false;
let stickerBookSawCapture = false;
const MAX_CAPTURES = 64;

function getStickerPages() {
  const pages = [];
  if (manifest.keyArt) {
    pages.push({ type: "key", label: "Your Key", dataUrl: manifest.keyArt });
  }
  const stickers = manifest.stickers || [];
  for (const s of stickers) {
    pages.push({ type: "snapshot", label: s.label, date: s.date, caption: s.caption, dataUrl: s.dataUrl });
  }
  if (pages.length === 0) {
    pages.push({ type: "empty", label: "Empty" });
  }
  return pages;
}

function renderStickerPage() {
  const pages = getStickerPages();
  if (stickerBookIndex < 0) stickerBookIndex = 0;
  if (stickerBookIndex >= pages.length) stickerBookIndex = pages.length - 1;
  const page = pages[stickerBookIndex];

  stickerBookPage.replaceChildren();

  if (page.type === "empty") {
    const p = document.createElement("p");
    p.className = "sticker-book__page--empty";
    p.textContent = "No stickers yet";
    stickerBookPage.appendChild(p);
  } else {
    const img = document.createElement("img");
    img.src = page.dataUrl;
    img.alt = page.label;
    stickerBookPage.appendChild(img);
    if (page.caption || page.date) {
      const line = document.createElement("p");
      line.className = "sticker-book__caption";
      const parts = [];
      if (page.caption) parts.push(page.caption);
      if (page.date) parts.push(page.date);
      line.textContent = parts.join("  ");
      stickerBookPage.appendChild(line);
    }
  }

  const label = page.label || `${stickerBookIndex + 1} / ${pages.length}`;
  stickerBookPageNum.textContent = label;
  stickerBookLeft.disabled = stickerBookIndex === 0;
  stickerBookRight.disabled = stickerBookIndex >= pages.length - 1;

  // Mark that they've seen a capture (warning fires on book close)
  if (page.type === "snapshot" && !captureWarningShown) {
    stickerBookSawCapture = true;
  }
}

function openStickerBook() {
  stickerBookOpen = true;
  stickerBookOverlay.classList.remove("hidden");
  stickerBookIndex = 0;
  renderStickerPage();
  if (captureButton) captureButton.disabled = true;
}

function closeStickerBook() {
  stickerBookOpen = false;
  stickerBookOverlay.classList.add("hidden");

  if (stickerBookSawCapture && !captureWarningShown) {
    captureWarningShown = true;
    manifest.captureWarningShown = true;
    stickerBookSawCapture = false;
    const remaining = MAX_CAPTURES - (manifest.stickers || []).length;
    showDialog({
      speaker: "", frames: ["./assets/characters/theSbookClosed.png", "./assets/characters/theSbookOpen.png"],
      animSpeed: 520,
      text: dlgText("sticker-capture-warning", { remaining }),
      actions: [{ label: dlg("sticker-capture-warning").actions?.[0] || "I am aware.", onClick: () => {} }],
    });
    return;
  }

  if (captureButton && !stickerBookFirstOpen) captureButton.disabled = false;
}

function toggleStickerBook() {
  if (stickerBookOpen) { closeStickerBook(); return; }

  if (stickerBookFirstOpen) {
    stickerBookFirstOpen = false;
    manifest.stickerBookOpened = true;
    persistSoloManifest();
    showDialog({
      speaker: "", frames: ["./assets/characters/theSbookClosed.png"],
      text: dlg("sticker-first-open").text || "Take this Sticker Book.",
      actions: [{ label: dlg("sticker-first-open").actions?.[0] || "Thanks?", onClick: openStickerBook }],
    });
    return;
  }
  openStickerBook();
}

function takeSnapshot() {
  const space = getCurrentSpace();
  if (!space || space.revealState !== "drawn") return;
  const stickers = manifest.stickers || [];
  if (stickers.length >= MAX_CAPTURES) return;

  // Composite visible layers onto an offscreen canvas
  const w = manifest.stage.width;
  const h = manifest.stage.height;
  const offscreen = document.createElement("canvas");
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext("2d");

  // 1. Fill layer (colored cells)
  ctx.drawImage(fillLayer, 0, 0);

  // 2. Scene canvas (if visible — imported room art rendered here)
  if (!sceneCanvas.classList.contains("hidden")) {
    ctx.drawImage(sceneCanvas, 0, 0);
  }

  // 3. Scene lineart (img element — drawn rooms from Icy)
  if (!sceneLineart.classList.contains("hidden") && sceneLineart.naturalWidth) {
    ctx.drawImage(sceneLineart, 0, 0, w, h);
  }

  const dataUrl = offscreen.toDataURL("image/png");
  const now = new Date();
  const date = `${now.getFullYear()} ${String(now.getMonth() + 1).padStart(2, "0")} ${String(now.getDate()).padStart(2, "0")}`;

  if (!manifest.stickers) manifest.stickers = [];
  manifest.stickers.push({
    label: `${space.title}  ${date}`,
    date,
    dataUrl,
    spaceId: space.id,
  });
  persistSoloManifest();

  const stickerEntry = manifest.stickers[manifest.stickers.length - 1];

  // Show confirmation with the book icon
  showDialog({
    speaker: "", frames: ["./assets/characters/theSbookOpen.png"],
    text: dlg("sticker-snapshot-1").text || "I captured your room.",
    actions: [{ label: dlg("sticker-snapshot-1").actions?.[0] || "Oh I see.", onClick: () => {
      // Follow-up: ask how they feel
      showDialog({
        speaker: "", frames: ["./assets/characters/theSbookClosed.png"],
        text: dlg("sticker-snapshot-2").text || "How do you feel in this room?",
        input: { placeholder: "...", maxLength: 48 },
        actions: [
          { label: dlg("sticker-snapshot-2").actions?.[0] || "This", onClick: (val) => {
            if (val && val.trim()) stickerEntry.caption = val.trim();
          }},
          { label: dlg("sticker-snapshot-2").actions?.[1] || "Nothing", onClick: () => {} },
        ],
      });
    }}],
  });
}

if (stickerBookButton) {
  stickerBookButton.addEventListener("click", toggleStickerBook);
}
if (captureButton) {
  captureButton.addEventListener("click", takeSnapshot);
}
if (stickerBookLeft) {
  stickerBookLeft.addEventListener("click", () => {
    stickerBookIndex--;
    renderStickerPage();
  });
}
if (stickerBookRight) {
  stickerBookRight.addEventListener("click", () => {
    stickerBookIndex++;
    renderStickerPage();
  });
}
if (stickerBookClose) {
  stickerBookClose.addEventListener("click", closeStickerBook);
}

// ════════════════════════════════════════
//  Sticker Book Export (zip)
// ════════════════════════════════════════

function exportStickerBook() {
  const guestName = manifest.owner?.displayName || manifest.roomId;
  const compiled = compileManifestForSave();

  // Bundle scene overrides from localStorage
  const scenes = {};
  for (const space of manifest.spaces) {
    const raw = window.localStorage.getItem(sceneOverrideStorageKey(space.id));
    if (raw) {
      try { scenes[space.id] = JSON.parse(raw); } catch { /* skip corrupt */ }
    }
  }

  const bundle = {
    app: "TreeFort",
    format: "treefort-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    guest: guestName,
    guestId: manifest.roomId,
    room: compiled,
    scenes,
  };

  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${guestName}.treefort`;
  a.click();
  URL.revokeObjectURL(url);
}

//  Guest Room Save
// ════════════════════════════════════════

const WORKER_SAVE_URL = "https://treefort-save.chewgum.workers.dev/save";
const guestSaveButton = document.getElementById("guest-save-button");

function gridToFillPatches(grid) {
  const byColor = new Map();
  for (let y = 0; y < manifest.stage.gridHeight; y++) {
    let x = 0;
    while (x < manifest.stage.gridWidth) {
      const colorId = grid[y][x];
      if (!colorId) { x++; continue; }
      let w = 1;
      while (x + w < manifest.stage.gridWidth && grid[y][x + w] === colorId) w++;
      if (!byColor.has(colorId)) byColor.set(colorId, []);
      byColor.get(colorId).push({ x, y, width: w, height: 1 });
      x += w;
    }
  }
  return [...byColor.entries()].map(([colorId, rects]) => ({ colorId, rects }));
}

function gridToSurfacePatches(labelGrid, supportGrid) {
  // Map special cases; everything else stored as-is
  const labelToSurface = { "poster-secret": "poster" };
  const byKey = new Map();
  function addRect(surface, x, y, w) {
    if (!byKey.has(surface)) byKey.set(surface, []);
    byKey.get(surface).push({ x, y, width: w, height: 1 });
  }
  for (let y = 0; y < manifest.stage.gridHeight; y++) {
    let x = 0;
    while (x < manifest.stage.gridWidth) {
      const labelId = labelGrid[y][x];
      if (!labelId) { x++; continue; }
      const surface = labelToSurface[labelId] || labelId;
      let w = 1;
      while (x + w < manifest.stage.gridWidth && labelGrid[y][x + w] === labelId) w++;
      addRect(surface, x, y, w);
      x += w;
    }
  }
  for (let y = 0; y < manifest.stage.gridHeight; y++) {
    let x = 0;
    while (x < manifest.stage.gridWidth) {
      const val = supportGrid[y][x];
      if (val !== "solid") { x++; continue; }
      let w = 1;
      while (x + w < manifest.stage.gridWidth && supportGrid[y][x + w] === "solid") w++;
      addRect("solid", x, y, w);
      x += w;
    }
  }
  return [...byKey.entries()].map(([surface, rects]) => ({ surface, rects }));
}

function compileManifestForSave() {
  const compiled = JSON.parse(JSON.stringify(manifest));
  compiled.updatedAt = new Date().toISOString().split("T")[0];
  for (const space of compiled.spaces) {
    const draft = draftBySpaceId.get(space.id);
    if (!draft) continue;
    space.fillPatches = gridToFillPatches(draft.fillGrid);
    space.surfacePatches = gridToSurfacePatches(draft.labelGrid, draft.supportGrid);
    if (Array.isArray(draft.regions)) space.regions = JSON.parse(JSON.stringify(draft.regions));
    if (Array.isArray(draft.portalBindings)) space.portalBindings = JSON.parse(JSON.stringify(draft.portalBindings));
  }
  return compiled;
}

let _guestSaveDirty = false;
let _guestSaving = false;
const AUTOSAVE_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

function markGuestDirty() {
  if (!_guestSaveDirty && guestSaveButton && !guestSaveButton.classList.contains("hidden")) {
    _guestSaveDirty = true;
    guestSaveButton.textContent = "Save to Tree";
  }
}

async function saveGuestRoom() {
  const guestId = new URLSearchParams(window.location.search).get("guest");
  if (!guestId) return;
  if (_guestSaving) return;

  const auth = JSON.parse(sessionStorage.getItem("treefort-guest-auth") || "null");
  if (!auth || auth.guestId !== guestId) return;

  _guestSaving = true;
  if (guestSaveButton) {
    guestSaveButton.disabled = true;
    guestSaveButton.textContent = "Saving...";
  }

  try {
    const roomData = compileManifestForSave();
    const res = await fetch(WORKER_SAVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, passphraseHash: auth.passphraseHash, roomData }),
    });

    const result = await res.json();
    if (res.ok && result.ok) {
      _guestSaveDirty = false;
      if (guestSaveButton) guestSaveButton.textContent = "Saved to Tree";
    } else {
      if (guestSaveButton) guestSaveButton.textContent = "Save to Tree";
    }
  } catch {
    if (guestSaveButton) guestSaveButton.textContent = "Save to Tree";
  } finally {
    _guestSaving = false;
    if (guestSaveButton) guestSaveButton.disabled = false;
  }
}

// Manual click
if (guestSaveButton) {
  guestSaveButton.addEventListener("click", () => void saveGuestRoom());
}

// Auto-save: periodic check
setInterval(() => {
  if (_guestSaveDirty && !_guestSaving) saveGuestRoom();
}, AUTOSAVE_INTERVAL_MS);

// Auto-save: tab hide / app minimize
document.addEventListener("visibilitychange", () => {
  if (document.hidden && _guestSaveDirty && !_guestSaving) saveGuestRoom();
});

// ════════════════════════════════════════
//  Door Lock Toggle
// ════════════════════════════════════════

const WORKER_DOOR_MODE_URL = "https://treefort-save.chewgum.workers.dev/door-mode";
const doorLockToggle = document.getElementById("door-lock-toggle");
const doorLockIcon = document.getElementById("door-lock-icon");

let currentDoorMode = "knock"; // default
const DOOR_LOCK_FIRST_KEY = "treefort-door-lock-explained";
const DOOR_UNLOCK_FIRST_KEY = "treefort-door-unlock-explained";

function updateDoorLockUI() {
  if (!doorLockToggle || !doorLockIcon) return;
  if (currentDoorMode === "stalk") {
    doorLockIcon.src = "./assets/ui/door-unlock.png";
    doorLockIcon.alt = "Door unlocked";
    doorLockToggle.title = "Your door is open — everyone is free to visit your room";
  } else {
    doorLockIcon.src = "./assets/ui/door-lock.png";
    doorLockIcon.alt = "Door locked";
    doorLockToggle.title = "Your door is locked — no one can get in without your password";
  }
}

async function toggleDoorMode() {
  if (!guestParam) return;
  const newMode = currentDoorMode === "stalk" ? "knock" : "stalk";

  // First-time Gum explanations
  const lockExplained = localStorage.getItem(DOOR_LOCK_FIRST_KEY);
  const unlockExplained = localStorage.getItem(DOOR_UNLOCK_FIRST_KEY);

  if (!lockExplained && newMode === "knock") {
    localStorage.setItem(DOOR_LOCK_FIRST_KEY, "1");
  }

  if (!unlockExplained && newMode === "stalk") {
    localStorage.setItem(DOOR_UNLOCK_FIRST_KEY, "1");
  }

  if (!lockExplained && currentDoorMode === "stalk") {
    // First time locking — show Gum, then proceed
    await new Promise((resolve) => {
      showDialog({
        speaker: "Gum", frames: GUM_HAPPY,
        text: "This Lock icon means you have a password on your door, so no one can see inside your room without knowing your password. If you click it again, you'll unlock your room, which allows anyone to come in and see! Don't worry, they can't ruin anything, they can just click on your things and admire your work. Either way, don't forget that if you don't unlock your door at some point, no one will ever see your room!",
        actions: [{ label: "Got it!", onClick: resolve }],
      });
    });
  } else if (!unlockExplained && currentDoorMode === "knock") {
    // First time unlocking — show Gum, then proceed
    await new Promise((resolve) => {
      showDialog({
        speaker: "Gum", frames: GUM_HAPPY,
        text: "You unlocked your door! Now anyone who visits the tree can walk right in and see your room. They can click around and admire your work, but they can't change anything. You can lock it again any time!",
        actions: [{ label: "Cool!", onClick: resolve }],
      });
    });
  }

  // Call Worker
  doorLockToggle.disabled = true;
  try {
    const auth = JSON.parse(sessionStorage.getItem("treefort-guest-auth") || "null");
    if (!auth || auth.guestId !== guestParam) return;
    const res = await fetch(WORKER_DOOR_MODE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId: guestParam, passphraseHash: auth.passphraseHash, mode: newMode }),
    });
    if (res.ok) {
      currentDoorMode = newMode;
      updateDoorLockUI();
    }
  } catch { /* silently fail */ }
  doorLockToggle.disabled = false;
}

if (doorLockToggle) {
  doorLockToggle.addEventListener("click", () => void toggleDoorMode());
}

// ════════════════════════════════════════
//  Publish Room (Solo / Resident → GitHub)
// ════════════════════════════════════════

const GITHUB_TOKEN_KEY = "treefort-github-token";
const GITHUB_API = "https://api.github.com";
const publishButton = document.getElementById("publish-button");

function getGitHubToken() { return localStorage.getItem(GITHUB_TOKEN_KEY); }
function setGitHubToken(token) { localStorage.setItem(GITHUB_TOKEN_KEY, token.trim()); }
function clearGitHubToken() { localStorage.removeItem(GITHUB_TOKEN_KEY); }

function getRepoSlug() {
  if (manifest.owner?.repo) return manifest.owner.repo;
  if (manifest.owner?.githubLogin) return `${manifest.owner.githubLogin}/TreeFort`;
  return null;
}

async function githubPutFile(token, repoSlug, filePath, content, commitMessage) {
  const url = `${GITHUB_API}/repos/${repoSlug}/contents/${filePath}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
  };

  // Get existing file SHA (needed for updates)
  let sha = null;
  try {
    const getRes = await fetch(url, { headers });
    if (getRes.ok) sha = (await getRes.json()).sha;
  } catch {}

  const body = {
    message: commitMessage,
    content: btoa(unescape(encodeURIComponent(content))),
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${putRes.status}`);
  }
  return putRes.json();
}

function showPublishSetup() {
  showDialog({
    speaker: "Gum", frames: GUM_HAPPY,
    text: dlg("publish-setup-intro").text || "To publish, you need a GitHub token.",
    actions: [
      { label: dlg("publish-setup-intro").actions?.[0] || "Walk me through it", onClick: showPublishStep1 },
      { label: dlg("publish-setup-intro").actions?.[1] || "I already have one", onClick: showPublishPasteToken },
    ],
  });
}

function showPublishStep1() {
  showDialog({
    speaker: "Gum", frames: GUM_HAPPY,
    text: dlg("publish-setup-step1").text || "Go to github.com/settings/tokens to create a token.",
    actions: [
      { label: dlg("publish-setup-step1").actions?.[0] || "I copied it!", onClick: showPublishPasteToken },
    ],
  });
}

function showPublishPasteToken() {
  showDialog({
    speaker: "Gum", frames: GUM_HAPPY,
    text: dlg("publish-setup-paste").text || "Paste your token here.",
    input: { placeholder: "ghp_xxxxxxxxxxxx", maxLength: 200 },
    actions: [
      { label: dlg("publish-setup-paste").actions?.[0] || "Save token", onClick: (val) => {
        if (val && val.trim().length > 10) {
          setGitHubToken(val);
          publishRoom();
        } else {
          setStatus("That doesn't look like a GitHub token.");
        }
      }},
      { label: dlg("publish-setup-paste").actions?.[1] || "Cancel", onClick: () => {} },
    ],
  });
}

async function publishRoom() {
  const token = getGitHubToken();
  if (!token) { showPublishSetup(); return; }

  const repoSlug = getRepoSlug();
  if (!repoSlug) {
    setStatus("Can't publish — no repo info in room manifest. Set owner.repo in room.json.");
    return;
  }

  if (publishButton) {
    publishButton.disabled = true;
    publishButton.textContent = "Publishing...";
  }
  setStatus("Publishing room...");

  try {
    // Compile and publish room.json
    const compiled = compileManifestForSave();
    await githubPutFile(token, repoSlug, "room/data/room.json",
      JSON.stringify(compiled, null, 2), "Update room (published from TreeFort)");

    // Publish scene overrides from localStorage
    for (const space of manifest.spaces) {
      const raw = window.localStorage.getItem(sceneOverrideStorageKey(space.id));
      if (!raw) continue;
      try {
        const project = JSON.parse(raw);
        if (project?.app !== "IcyAnimation") continue;
        const asset = manifest.assets?.find(a => a.id === space.sceneArtAssetId);
        if (!asset?.path) continue;
        await githubPutFile(token, repoSlug, `room/${asset.path}`,
          JSON.stringify(project, null, 2), `Update ${space.id} scene art`);
      } catch {}
    }

    setStatus("Published!");
    showDialog({
      speaker: "Gum", frames: GUM_HAPPY,
      text: dlg("publish-success").text || "Published!",
      actions: [{ label: dlg("publish-success").actions?.[0] || "Nice!", onClick: () => {} }],
    });
  } catch (err) {
    if (err.message?.includes("Bad credentials") || err.message?.includes("401")) {
      clearGitHubToken();
      setStatus("Token expired or invalid. Set up again.");
      showPublishSetup();
    } else {
      setStatus(`Publish failed: ${err.message}`);
      showDialog({
        speaker: "Gum", frames: GUM_SAD,
        text: dlgText("publish-error", { error: err.message }),
        actions: [
          { label: dlg("publish-error").actions?.[0] || "Try again", onClick: () => publishRoom() },
          { label: dlg("publish-error").actions?.[1] || "Okay", onClick: () => {} },
        ],
      });
    }
  } finally {
    if (publishButton) {
      publishButton.disabled = false;
      publishButton.textContent = "Publish Room";
    }
  }
}

if (publishButton) {
  publishButton.addEventListener("click", () => void publishRoom());
}

async function checkGuestExpiry(guestId) {
  let treefortData;
  try {
    const res = await fetch("../data/treefort.json", { cache: "no-store" });
    if (!res.ok) return;
    treefortData = await res.json();
  } catch { return; }

  const rules = treefortData.treefort?.guestRules;
  if (!rules) return;

  const door = treefortData.doors?.find((d) => d.id === guestId);
  if (!door || door.status !== "occupied" || !door.moveInDate) return;

  const moveIn = new Date(door.moveInDate + "T00:00:00");
  const now = new Date();
  const msLeft = (moveIn.getTime() + rules.stayDays * 86400000) - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  const elapsed = Math.floor((now - moveIn) / 86400000);

  let phase = "active";
  if (msLeft <= 0) phase = "expired";
  else if (elapsed >= rules.exportDay - 1) phase = "export";
  else if (elapsed >= rules.readonlyDay - 1) phase = "readonly";
  else if (elapsed >= rules.warnDay - 1) phase = "warning";

  if (phase === "warning") {
    showDialog({
      speaker: "Gum", frames: GUM_SAD,
      text: dlgText("expiry-warning", { daysLeft: daysLeft + " day" + (daysLeft === 1 ? "" : "s") }),
      actions: [{ label: dlg("expiry-warning").actions?.[0] || "Okay", onClick: () => {} }],
    });
  } else if (phase === "readonly") {
    isGuestReadonly = true;
    if (authorMode !== "view") {
      authorMode = "view";
    }
    refreshAuthoringUI(getCurrentSpace());
    showDialog({
      speaker: "Gum", frames: GUM_SAD,
      text: dlg("expiry-readonly").text || "Your room is now read-only.",
      actions: [{ label: dlg("expiry-readonly").actions?.[0] || "I understand", onClick: () => {} }],
    });
  } else if (phase === "export" || phase === "expired") {
    isGuestReadonly = true;
    if (authorMode !== "view") {
      authorMode = "view";
    }
    refreshAuthoringUI(getCurrentSpace());
    showDialog({
      speaker: "Gum", frames: GUM_SAD,
      text: dlg("expiry-export").text || "Your stay has ended.",
      actions: [{
        label: dlg("expiry-export").actions?.[0] || "Download my Sticker Book",
        onClick: () => { exportStickerBook(); },
      }, {
        label: dlg("expiry-export").actions?.[1] || "Goodbye",
        onClick: () => {},
      }],
    });
  }
}

async function main() {
  guestParam = new URLSearchParams(window.location.search).get("guest");
  const dataUrl = guestParam ? `../rooms/${guestParam}/data.json` : "./data/room.json";
  const response = await fetch(dataUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load room manifest: ${response.status}`);
  }

  manifest = await response.json();

  // Load dialog text
  try {
    const dlgResp = await fetch("./data/dialog.json");
    if (dlgResp.ok) DIALOG = await dlgResp.json();
  } catch {}

  // Detect resident / solo mode
  isResident = !guestParam && manifest.instance === "resident";
  isSolo = !guestParam && manifest.instance === "solo";

  // Visitors without valid auth are read-only
  if (guestParam) {
    const auth = JSON.parse(sessionStorage.getItem("treefort-guest-auth") || "null");
    if (!auth || auth.guestId !== guestParam) {
      isGuestReadonly = true;
    }
  }

  // Solo + Resident: restore persisted progress from localStorage
  if (isSolo || isResident) {
    loadSoloManifest();
  }

  // Restore persisted sticker book flags
  stickerBookFirstOpen = isResident ? false : !manifest.stickerBookOpened;
  secretGraduationShown = !!manifest.secretGraduationShown;
  captureWarningShown = !!manifest.captureWarningShown;

  // Resident mode: restore custom labels from localStorage
  if (isResident) {
    for (const space of (manifest.spaces || [])) {
      const labels = loadResidentLabels(space.id);
      for (const goal of (space.scoreGoals || [])) {
        if (labels[goal.id]) goal.label = labels[goal.id];
      }
    }
  }

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

  // Show save button for guest rooms, publish button for solo/resident
  if (guestParam && !isGuestReadonly && guestSaveButton) {
    guestSaveButton.classList.remove("hidden");
  }

  // Show door lock toggle for guests
  if (guestParam && !isGuestReadonly && doorLockToggle) {
    try {
      const tfRes = await fetch("../data/treefort.json", { cache: "no-store" });
      if (tfRes.ok) {
        const tfData = await tfRes.json();
        const door = tfData.doors?.find((d) => d.id === guestParam);
        if (door?.access?.mode) currentDoorMode = door.access.mode;
      }
    } catch { /* keep default */ }
    updateDoorLockUI();
    doorLockToggle.classList.remove("hidden");
  }
  if ((isSolo || isResident) && publishButton) {
    publishButton.classList.remove("hidden");
  }

  // Run quest phase dialog after room loads
  if (guestParam) {
    runQuestPhase();
    checkGuestExpiry(guestParam);
  } else if (isSolo) {
    runQuestPhase();
  }
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
