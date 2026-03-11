import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  hashJsonValue,
  loadJsonFromUrlish,
  readJson,
  rootDir,
  validateRoomSubmission,
  validateSubmissionRoomManifest,
  writeJson,
} from "./lib/manifests.mjs";

function usage() {
  throw new Error("usage: node scripts/capture-room-snapshot.mjs <submission-id>");
}

async function main() {
  const submissionId = process.argv[2];
  if (!submissionId) {
    usage();
  }

  const submissionPath = `content/submissions/${submissionId}.json`;
  const submission = await readJson(submissionPath);
  validateRoomSubmission(submission, submissionPath);

  const sourceManifest = await loadJsonFromUrlish(submission.owner.roomManifestUrl);
  const validatedManifest = validateSubmissionRoomManifest(submission, sourceManifest);
  const snapshotPath = `content/verified-room-manifests/${submissionId}.json`;

  await mkdir(path.join(rootDir, "content/verified-room-manifests"), { recursive: true });
  await writeJson(snapshotPath, validatedManifest);

  console.log(
    JSON.stringify(
      {
        submissionId,
        verifiedRoomManifestPath: snapshotPath,
        roomSchemaVersion: validatedManifest.schemaVersion,
        snapshotSha256: hashJsonValue(validatedManifest),
        sourceRoomManifestUrl: submission.owner.roomManifestUrl,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
