import {
  hashJsonValue,
  readJson,
  validateRoomReview,
  validateRoomSubmission,
  validateSubmissionRoomManifest,
  writeJson,
} from "./lib/manifests.mjs";

function usage() {
  throw new Error(
    "usage: node scripts/approve-submission.mjs <submission-id> <sort-order> <x> <y> [reviewer]",
  );
}

function parseNumber(value, label, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a number between ${min} and ${max}`);
  }
  return parsed;
}

function todayStamp() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function main() {
  const [submissionId, sortOrderArg, xArg, yArg, reviewer = "treefort-reviewer"] = process.argv.slice(2);
  if (!submissionId || sortOrderArg === undefined || xArg === undefined || yArg === undefined) {
    usage();
  }

  const submissionPath = `content/submissions/${submissionId}.json`;
  const reviewPath = `content/reviews/${submissionId}.json`;
  const snapshotPath = `content/verified-room-manifests/${submissionId}.json`;

  const submission = await readJson(submissionPath);
  const snapshot = await readJson(snapshotPath);
  validateRoomSubmission(submission, submissionPath);
  const validatedSnapshot = validateSubmissionRoomManifest(submission, snapshot);

  let existingReview = null;
  try {
    existingReview = await readJson(reviewPath);
  } catch {
    existingReview = null;
  }

  const today = todayStamp();
  const review = {
    schemaVersion: 1,
    submissionId,
    status: "approved",
    reviewedAt: today,
    reviewedBy: reviewer,
    notes: existingReview?.notes ?? "Approved through the review workflow script.",
    listing: {
      sortOrder: parseNumber(sortOrderArg, "sort-order", 0, 100000),
      position: {
        x: parseNumber(xArg, "x", 0, 100),
        y: parseNumber(yArg, "y", 0, 100),
      },
    },
    verification: {
      verifiedAt: today,
      verifiedRoomManifestPath: snapshotPath,
      roomSchemaVersion: validatedSnapshot.schemaVersion,
      snapshotSha256: hashJsonValue(validatedSnapshot),
      sourceRoomManifestUrl: submission.owner.roomManifestUrl,
    },
  };

  validateRoomReview(review, reviewPath);
  await writeJson(reviewPath, review);
  console.log(`Approved ${submissionId} and updated ${reviewPath}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
