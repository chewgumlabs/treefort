import { buildTreefortManifest, loadTreefortSources, validatePublicTreefortManifest, writeJson } from "./lib/manifests.mjs";

async function main() {
  const { base, approvedDoors, audit } = await loadTreefortSources();
  const manifest = buildTreefortManifest(base, approvedDoors);
  validatePublicTreefortManifest(manifest);
  await writeJson("data/treefort.json", manifest);
  console.log(
    `Built public treefort manifest with ${manifest.doors.length} approved doors (${audit.counts.pending} pending, ${audit.counts.suspended} suspended).`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
