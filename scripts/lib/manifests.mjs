import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_ROOM_LIMITS,
  LATEST_ROOM_SCHEMA_VERSION,
  validateRoomManifestDocument,
} from "../../shared/room-compiler-core.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, "../..");

const DOOR_MODES = new Set(["lock", "knock", "stalk", "discord"]);
const REVIEW_STATUSES = new Set(["pending", "approved", "rejected", "suspended"]);
const BRIDGE_WRITE_KINDS = new Set(["json", "asset"]);
const BRIDGE_SITE_TYPES = new Set(["user", "project"]);
const FORBIDDEN_BRIDGE_PATHS = new Set(["index.html", "app.js", "styles.css", "package.json", "CNAME", "sw.js"]);

export async function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const file = await readFile(absolutePath, "utf8");
  return JSON.parse(file);
}

export async function loadJsonFromUrlish(urlish) {
  if (urlish.startsWith("https://") || urlish.startsWith("http://")) {
    const response = await fetch(urlish);
    if (!response.ok) {
      throw new Error(`failed to load ${urlish}: ${response.status}`);
    }
    return response.json();
  }

  const absolutePath = path.resolve(rootDir, urlish);
  if (!absolutePath.startsWith(`${rootDir}${path.sep}`) && absolutePath !== rootDir) {
    throw new Error(`refusing to read outside repo root: ${urlish}`);
  }
  const file = await readFile(absolutePath, "utf8");
  return JSON.parse(file);
}

export async function writeJson(relativePath, value) {
  const absolutePath = path.join(rootDir, relativePath);
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function listJsonFiles(relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  const entries = await readdir(absoluteDir);
  return entries.filter((entry) => entry.endsWith(".json")).sort();
}

function fail(message) {
  throw new Error(message);
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
  if (value === undefined) {
    return;
  }

  assertString(value, label);
}

function assertBoolean(value, label) {
  if (typeof value !== "boolean") {
    fail(`${label} must be a boolean`);
  }
}

function assertNumber(value, label, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    fail(`${label} must be a number between ${min} and ${max}`);
  }
}

function assertDateString(value, label) {
  assertString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label} must be in YYYY-MM-DD format`);
  }
}

function assertOptionalDateString(value, label) {
  if (value === undefined) {
    return;
  }

  assertDateString(value, label);
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

function assertSafeRelativePath(value, label) {
  assertString(value, label);
  if (path.isAbsolute(value) || value.includes("..") || value.includes("\\") || value.startsWith("./")) {
    fail(`${label} must be a safe repo-relative path`);
  }
}

function assertSlug(value, label) {
  assertString(value, label);
  if (!/^[a-z0-9-]+$/.test(value)) {
    fail(`${label} must contain only lowercase letters, numbers, and hyphens`);
  }
}

function assertHex(value, label, length = 64) {
  assertString(value, label);
  if (!new RegExp(`^[a-f0-9]{${length}}$`).test(value)) {
    fail(`${label} must be a ${length}-character lowercase hex string`);
  }
}

function assertSnowflake(value, label) {
  assertString(value, label);
  if (!/^\d{17,20}$/.test(value)) {
    fail(`${label} must be a Discord snowflake string`);
  }
}

function hashPassphrase(passphrase) {
  return createHash("sha256").update(passphrase.trim().toLowerCase()).digest("hex");
}

export function hashJsonValue(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertDiscordInviteUrl(value, label) {
  assertString(value, label);
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a valid Discord invite URL`);
  }

  const host = parsed.hostname.toLowerCase();
  const invitePath = parsed.pathname;
  const isShortInvite = host === "discord.gg" && invitePath.length > 1;
  const isLongInvite =
    (host === "discord.com" || host === "www.discord.com") && invitePath.startsWith("/invite/");

  if (!isShortInvite && !isLongInvite) {
    fail(`${label} must use discord.gg or discord.com/invite/...`);
  }
}

function validateTreefortGateways(gateways, label) {
  if (gateways === undefined) {
    return;
  }

  assertObject(gateways, label);
  if (gateways.discord !== undefined) {
    assertObject(gateways.discord, `${label}.discord`);
    if (gateways.discord.unlockUrlBase !== undefined) {
      assertUrlish(gateways.discord.unlockUrlBase, `${label}.discord.unlockUrlBase`);
    }
    if (gateways.discord.authLabel !== undefined) {
      validateTextLength(gateways.discord.authLabel, `${label}.discord.authLabel`, DEFAULT_ROOM_LIMITS.maxLabelLength);
    }
  }
}

function validateDoorAccess(access, label, options = {}) {
  const { source = "submission" } = options;
  assertObject(access, label);
  assertString(access.mode, `${label}.mode`);
  if (!DOOR_MODES.has(access.mode)) {
    fail(`${label}.mode must be one of: ${[...DOOR_MODES].join(", ")}`);
  }

  if (access.mode === "knock") {
    if (source === "submission") {
      assertString(access.passphrase, `${label}.passphrase`);
      assertString(access.hint, `${label}.hint`);
    } else {
      assertString(access.hint, `${label}.hint`);
      assertHex(access.passphraseHash, `${label}.passphraseHash`);
    }
  }

  if (access.mode === "discord") {
    validateTextLength(access.serverLabel, `${label}.serverLabel`, DEFAULT_ROOM_LIMITS.maxTitleLength);
    assertDiscordInviteUrl(access.inviteUrl, `${label}.inviteUrl`);
    if (access.requiredRoleLabel !== undefined) {
      validateTextLength(access.requiredRoleLabel, `${label}.requiredRoleLabel`, DEFAULT_ROOM_LIMITS.maxLabelLength);
    }

    if (source === "submission") {
      assertSnowflake(access.guildId, `${label}.guildId`);
      if (access.requiredRoleIds !== undefined) {
        assertArray(access.requiredRoleIds, `${label}.requiredRoleIds`);
        access.requiredRoleIds.forEach((roleId, index) =>
          assertSnowflake(roleId, `${label}.requiredRoleIds[${index}]`),
        );
      }
    } else if (access.requiredRoleIds !== undefined) {
      fail(`${label}.requiredRoleIds must not ship in public data`);
    }
  }
}

function validateTextLength(value, label, limit) {
  assertString(value, label);
  if (value.length > limit) {
    fail(`${label} must be at most ${limit} characters`);
  }
}

function buildPublicDoor(door) {
  const baseDoor = {
    id: door.id,
    name: door.name,
    caption: door.caption,
    destinationLabel: door.destinationLabel,
    position: {
      x: door.position.x,
      y: door.position.y,
    },
    access: {
      mode: door.access.mode,
    },
  };

  if (door.access.mode === "stalk") {
    return {
      ...baseDoor,
      href: door.href,
    };
  }

  if (door.access.mode === "knock") {
    return {
      ...baseDoor,
      href: door.href,
      access: {
        mode: door.access.mode,
        hint: door.access.hint,
        passphraseHash: hashPassphrase(door.access.passphrase),
      },
    };
  }

  if (door.access.mode === "discord") {
    return {
      ...baseDoor,
      access: {
        mode: door.access.mode,
        serverLabel: door.access.serverLabel,
        inviteUrl: door.access.inviteUrl,
        ...(door.access.requiredRoleLabel ? { requiredRoleLabel: door.access.requiredRoleLabel } : {}),
      },
    };
  }

  return baseDoor;
}

export function validateTreefortBase(base) {
  assertObject(base, "treefort base");
  assertNumber(base.version, "treefort base version", 1, 1000);
  assertObject(base.treefort, "treefort copy");
  assertString(base.treefort.eyebrow, "treefort eyebrow");
  assertString(base.treefort.title, "treefort title");
  assertString(base.treefort.lede, "treefort lede");
  assertString(base.treefort.stumpNote, "treefort stump note");
  validateTreefortGateways(base.treefort.gateways, "treefort gateways");
}

export function validateRoomSubmission(submission, label = "room submission") {
  assertObject(submission, label);
  assertNumber(submission.schemaVersion, `${label}.schemaVersion`, 1, 1000);
  assertSlug(submission.submissionId, `${label}.submissionId`);
  assertOptionalDateString(submission.submittedAt, `${label}.submittedAt`);

  assertObject(submission.owner, `${label}.owner`);
  assertString(submission.owner.githubLogin, `${label}.owner.githubLogin`);
  assertString(submission.owner.repo, `${label}.owner.repo`);
  assertUrlish(submission.owner.siteUrl, `${label}.owner.siteUrl`);
  assertUrlish(submission.owner.roomManifestUrl, `${label}.owner.roomManifestUrl`);

  assertObject(submission.room, `${label}.room`);
  assertSlug(submission.room.roomId, `${label}.room.roomId`);
  assertNumber(submission.room.schemaVersion, `${label}.room.schemaVersion`, 1, LATEST_ROOM_SCHEMA_VERSION);
  if (submission.room.roomId !== submission.submissionId) {
    fail(`${label}.room.roomId must match submissionId`);
  }

  assertObject(submission.acknowledgements, `${label}.acknowledgements`);
  assertBoolean(submission.acknowledgements.age13Plus, `${label}.acknowledgements.age13Plus`);
  assertBoolean(submission.acknowledgements.publicSite, `${label}.acknowledgements.publicSite`);
  assertBoolean(submission.acknowledgements.noPrivateInfo, `${label}.acknowledgements.noPrivateInfo`);
  if (
    !submission.acknowledgements.age13Plus ||
    !submission.acknowledgements.publicSite ||
    !submission.acknowledgements.noPrivateInfo
  ) {
    fail(`${label} acknowledgements must all be true`);
  }

  assertObject(submission.door, `${label}.door`);
  validateTextLength(submission.door.name, `${label}.door.name`, DEFAULT_ROOM_LIMITS.maxTitleLength);
  validateTextLength(submission.door.caption, `${label}.door.caption`, DEFAULT_ROOM_LIMITS.maxCaptionLength);
  validateTextLength(
    submission.door.destinationLabel,
    `${label}.door.destinationLabel`,
    DEFAULT_ROOM_LIMITS.maxCaptionLength,
  );
  validateDoorAccess(submission.door.access, `${label}.door.access`, { source: "submission" });
  assertString(submission.door.neighborhood, `${label}.door.neighborhood`);
}

export function validateRoomReview(review, label = "room review") {
  assertObject(review, label);
  assertNumber(review.schemaVersion, `${label}.schemaVersion`, 1, 1000);
  assertSlug(review.submissionId, `${label}.submissionId`);
  assertString(review.status, `${label}.status`);
  if (!REVIEW_STATUSES.has(review.status)) {
    fail(`${label}.status must be one of: ${[...REVIEW_STATUSES].join(", ")}`);
  }
  assertOptionalDateString(review.reviewedAt, `${label}.reviewedAt`);
  assertOptionalString(review.reviewedBy, `${label}.reviewedBy`);
  assertOptionalString(review.notes, `${label}.notes`);

  if (review.status === "approved") {
    assertDateString(review.reviewedAt, `${label}.reviewedAt`);
    assertString(review.reviewedBy, `${label}.reviewedBy`);
    assertObject(review.listing, `${label}.listing`);
    assertNumber(review.listing.sortOrder, `${label}.listing.sortOrder`, 0, 100000);
    assertObject(review.listing.position, `${label}.listing.position`);
    assertNumber(review.listing.position.x, `${label}.listing.position.x`, 0, 100);
    assertNumber(review.listing.position.y, `${label}.listing.position.y`, 0, 100);
    assertObject(review.verification, `${label}.verification`);
    assertDateString(review.verification.verifiedAt, `${label}.verification.verifiedAt`);
    assertSafeRelativePath(
      review.verification.verifiedRoomManifestPath,
      `${label}.verification.verifiedRoomManifestPath`,
    );
    if (!review.verification.verifiedRoomManifestPath.startsWith("content/verified-room-manifests/")) {
      fail(`${label}.verification.verifiedRoomManifestPath must live under content/verified-room-manifests/`);
    }
    assertNumber(
      review.verification.roomSchemaVersion,
      `${label}.verification.roomSchemaVersion`,
      LATEST_ROOM_SCHEMA_VERSION,
      LATEST_ROOM_SCHEMA_VERSION,
    );
    assertHex(review.verification.snapshotSha256, `${label}.verification.snapshotSha256`);
    assertUrlish(review.verification.sourceRoomManifestUrl, `${label}.verification.sourceRoomManifestUrl`);
  }
}

function mergeSubmissionAndReview(submission, review) {
  if (review.submissionId !== submission.submissionId) {
    fail(`review ${review.submissionId} does not match submission ${submission.submissionId}`);
  }

  if (review.status !== "approved") {
    return null;
  }

  return {
    id: submission.submissionId,
    name: submission.door.name,
    caption: submission.door.caption,
    destinationLabel: submission.door.destinationLabel,
    href: submission.owner.siteUrl,
    position: {
      x: review.listing.position.x,
      y: review.listing.position.y,
    },
    sortOrder: review.listing.sortOrder,
    access: submission.door.access,
  };
}

export function buildSubmissionAudit(submissions, reviews) {
  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  };

  const reviewMap = new Map(reviews.map((review) => [review.submissionId, review]));
  const details = submissions.map((submission) => {
    const review = reviewMap.get(submission.submissionId);
    const status = review?.status ?? "pending";
    counts[status] += 1;
    return {
      submissionId: submission.submissionId,
      githubLogin: submission.owner.githubLogin,
      status,
      neighborhood: submission.door.neighborhood,
      mode: submission.door.access.mode,
    };
  });

  return { counts, details };
}

export async function loadTreefortSources() {
  const base = await readJson("content/treefort.base.json");
  validateTreefortBase(base);

  const submissionFiles = await listJsonFiles("content/submissions");
  const reviewFiles = await listJsonFiles("content/reviews");

  const submissions = [];
  const reviews = [];
  const seenSubmissionIds = new Set();
  const reviewMap = new Map();

  for (const file of submissionFiles) {
    const submission = await readJson(path.join("content/submissions", file));
    validateRoomSubmission(submission, `room submission ${file}`);
    if (seenSubmissionIds.has(submission.submissionId)) {
      fail(`submission ids must be unique; duplicate "${submission.submissionId}"`);
    }
    seenSubmissionIds.add(submission.submissionId);
    submissions.push(submission);
  }

  for (const file of reviewFiles) {
    const review = await readJson(path.join("content/reviews", file));
    validateRoomReview(review, `room review ${file}`);
    if (reviewMap.has(review.submissionId)) {
      fail(`review ids must be unique; duplicate "${review.submissionId}"`);
    }
    reviewMap.set(review.submissionId, review);
    reviews.push(review);
  }

  const approvedDoors = submissions
    .map((submission) => {
      const review = reviewMap.get(submission.submissionId);
      if (!review) {
        fail(`missing review for submission "${submission.submissionId}"`);
      }
      return mergeSubmissionAndReview(submission, review);
    })
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));

  return {
    base,
    submissions,
    reviews,
    approvedDoors,
    audit: buildSubmissionAudit(submissions, reviews),
  };
}

export function buildTreefortManifest(base, doors) {
  return {
    version: base.version,
    treefort: base.treefort,
    doors: doors.map(buildPublicDoor),
  };
}

export function validatePublicTreefortManifest(manifest) {
  assertObject(manifest, "public treefort manifest");
  assertNumber(manifest.version, "public treefort version", 1, 1000);
  assertObject(manifest.treefort, "public treefort copy");
  assertString(manifest.treefort.eyebrow, "public treefort eyebrow");
  assertString(manifest.treefort.title, "public treefort title");
  assertString(manifest.treefort.lede, "public treefort lede");
  assertString(manifest.treefort.stumpNote, "public treefort stump note");
  validateTreefortGateways(manifest.treefort.gateways, "public treefort gateways");
  assertArray(manifest.doors, "public treefort doors");

  manifest.doors.forEach((door, index) => {
    const label = `public door ${index}`;
    assertObject(door, label);
    assertSlug(door.id, `${label}.id`);
    validateTextLength(door.name, `${label}.name`, DEFAULT_ROOM_LIMITS.maxTitleLength);
    validateTextLength(door.caption, `${label}.caption`, DEFAULT_ROOM_LIMITS.maxCaptionLength);
    validateTextLength(door.destinationLabel, `${label}.destinationLabel`, DEFAULT_ROOM_LIMITS.maxCaptionLength);
    assertObject(door.position, `${label}.position`);
    assertNumber(door.position.x, `${label}.position.x`, 0, 100);
    assertNumber(door.position.y, `${label}.position.y`, 0, 100);
    validateDoorAccess(door.access, `${label}.access`, { source: "public" });

    if ((door.access.mode === "lock" || door.access.mode === "discord") && "href" in door) {
      fail(`${label} should not expose href for ${door.access.mode} mode`);
    }

    if (door.access.mode === "stalk" || door.access.mode === "knock") {
      assertUrlish(door.href, `${label}.href`);
    }
  });
}

export function validateRoomManifest(manifest) {
  return validateRoomManifestDocument(manifest);
}

export function validateSubmissionRoomManifest(submission, manifest) {
  const validated = validateRoomManifest(manifest);
  if (validated.roomId !== submission.room.roomId) {
    fail(`submitted roomId "${validated.roomId}" does not match submission "${submission.room.roomId}"`);
  }
  if (validated.owner.githubLogin !== submission.owner.githubLogin) {
    fail(
      `submitted owner "${validated.owner.githubLogin}" does not match submission owner "${submission.owner.githubLogin}"`,
    );
  }
  if (validated.schemaVersion !== submission.room.schemaVersion) {
    fail(
      `submitted schemaVersion ${validated.schemaVersion} does not match requested schemaVersion ${submission.room.schemaVersion}`,
    );
  }
  return validated;
}

export function validateApprovedRoomSnapshot(submission, review, snapshot) {
  if (review.status !== "approved") {
    fail(`cannot validate a non-approved snapshot for "${submission.submissionId}"`);
  }

  const validated = validateSubmissionRoomManifest(submission, snapshot);
  if (validated.schemaVersion !== review.verification.roomSchemaVersion) {
    fail(
      `approved snapshot schemaVersion ${validated.schemaVersion} does not match review verification ${review.verification.roomSchemaVersion}`,
    );
  }
  return validated;
}

export function validatePublishBridgeContract(contract) {
  assertObject(contract, "publish bridge contract");
  assertNumber(contract.contractVersion, "publish bridge contractVersion", 1, 1000);
  assertString(contract.requestType, "publish bridge requestType");
  if (contract.requestType !== "publish-room") {
    fail(`publish bridge requestType must be "publish-room"`);
  }
  assertString(contract.requestId, "publish bridge requestId");
  assertSlug(contract.roomId, "publish bridge roomId");
  assertNumber(
    contract.expectedRoomSchemaVersion,
    "publish bridge expectedRoomSchemaVersion",
    LATEST_ROOM_SCHEMA_VERSION,
    LATEST_ROOM_SCHEMA_VERSION,
  );

  assertObject(contract.target, "publish bridge target");
  assertString(contract.target.githubOwner, "publish bridge target.githubOwner");
  assertString(contract.target.repoName, "publish bridge target.repoName");
  assertString(contract.target.branch, "publish bridge target.branch");
  assertString(contract.target.siteType, "publish bridge target.siteType");
  if (!BRIDGE_SITE_TYPES.has(contract.target.siteType)) {
    fail(`publish bridge target.siteType must be one of: ${[...BRIDGE_SITE_TYPES].join(", ")}`);
  }
  assertUrlish(contract.target.baseUrl, "publish bridge target.baseUrl");

  assertObject(contract.constraints, "publish bridge constraints");
  assertArray(contract.constraints.allowedWritePrefixes, "publish bridge constraints.allowedWritePrefixes");
  assertArray(contract.constraints.forbiddenPaths, "publish bridge constraints.forbiddenPaths");
  assertNumber(contract.constraints.maxDeleteCount, "publish bridge constraints.maxDeleteCount", 0, 1000);
  assertBoolean(contract.constraints.requirePullRequest, "publish bridge constraints.requirePullRequest");

  const allowedPrefixes = new Set(contract.constraints.allowedWritePrefixes);
  const forbiddenPaths = new Set(contract.constraints.forbiddenPaths);

  assertArray(contract.writes, "publish bridge writes");
  const seenWritePaths = new Set();
  contract.writes.forEach((write, index) => {
    const label = `publish bridge write ${index}`;
    assertObject(write, label);
    assertSafeRelativePath(write.path, `${label}.path`);
    assertString(write.kind, `${label}.kind`);
    if (!BRIDGE_WRITE_KINDS.has(write.kind)) {
      fail(`${label}.kind must be one of: ${[...BRIDGE_WRITE_KINDS].join(", ")}`);
    }
    if (seenWritePaths.has(write.path)) {
      fail(`publish bridge write paths must be unique; duplicate "${write.path}"`);
    }
    seenWritePaths.add(write.path);

    const allowed = [...allowedPrefixes].some((prefix) => write.path.startsWith(prefix));
    if (!allowed) {
      fail(`${label}.path must start with one of: ${[...allowedPrefixes].join(", ")}`);
    }

    if (FORBIDDEN_BRIDGE_PATHS.has(write.path) || forbiddenPaths.has(write.path)) {
      fail(`${label}.path is forbidden`);
    }

    if (write.kind === "json") {
      assertString(write.source, `${label}.source`);
    }

    if (write.kind === "asset") {
      assertSlug(write.assetId, `${label}.assetId`);
      assertString(write.mimeType, `${label}.mimeType`);
      if (!DEFAULT_ROOM_LIMITS.allowedAssetMimeTypes.includes(write.mimeType)) {
        fail(`${label}.mimeType must be one of: ${DEFAULT_ROOM_LIMITS.allowedAssetMimeTypes.join(", ")}`);
      }
      assertNumber(write.bytes, `${label}.bytes`, 1, DEFAULT_ROOM_LIMITS.maxAssetBytesPerFile);
      assertHex(write.sha256, `${label}.sha256`);
    }
  });

  assertArray(contract.deletes, "publish bridge deletes");
  if (contract.deletes.length > contract.constraints.maxDeleteCount) {
    fail(`publish bridge deletes exceed maxDeleteCount of ${contract.constraints.maxDeleteCount}`);
  }
  contract.deletes.forEach((deletePath, index) => {
    assertSafeRelativePath(deletePath, `publish bridge deletes[${index}]`);
    if (!deletePath.startsWith("assets/")) {
      fail(`publish bridge deletes[${index}] must stay under assets/`);
    }
  });

  assertObject(contract.commit, "publish bridge commit");
  assertString(contract.commit.message, "publish bridge commit.message");
  assertString(contract.commit.authorLabel, "publish bridge commit.authorLabel");
}
