import {
  buildTreefortManifest,
  hashJsonValue,
  loadTreefortSources,
  readJson,
  validateApprovedRoomSnapshot,
  validatePublicTreefortManifest,
  validatePublishBridgeContract,
} from "./lib/manifests.mjs";
import { compileRoomManifest, loadRoomCompilerInputs } from "./lib/room-compiler.mjs";

function stable(value) {
  return JSON.stringify(value);
}

async function main() {
  const { base, approvedDoors, submissions, reviews, audit } = await loadTreefortSources();
  const generated = await readJson("data/treefort.json");
  const expected = buildTreefortManifest(base, approvedDoors);
  const roomManifest = await readJson("room/data/room.json");
  const { state } = await loadRoomCompilerInputs();
  const expectedRoomManifest = compileRoomManifest(state);
  const bridgeContract = await readJson("contracts/publish-bridge.example.json");

  validatePublicTreefortManifest(generated);
  validatePublishBridgeContract(bridgeContract);

  const reviewMap = new Map(reviews.map((review) => [review.submissionId, review]));
  for (const submission of submissions) {
    const review = reviewMap.get(submission.submissionId);
    if (!review || review.status !== "approved") {
      continue;
    }

    const snapshot = await readJson(review.verification.verifiedRoomManifestPath);
    validateApprovedRoomSnapshot(submission, review, snapshot);
    if (hashJsonValue(snapshot) !== review.verification.snapshotSha256) {
      throw new Error(
        `verified snapshot hash mismatch for "${submission.submissionId}". Re-approve or update the review snapshot hash.`,
      );
    }
  }

  if (stable(generated) !== stable(expected)) {
    throw new Error("data/treefort.json is out of date. Run `npm run build:treefort`.");
  }

  if (stable(roomManifest) !== stable(expectedRoomManifest)) {
    throw new Error("room/data/room.json is out of date. Run `npm run compile:room`.");
  }

  console.log(
    `Validated ${generated.doors.length} approved doors, ${submissions.length} submissions, ${reviews.length} reviews, ${audit.counts.pending} pending submissions, and ${roomManifest.spaces.length} semantic spaces.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
