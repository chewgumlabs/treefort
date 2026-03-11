import { loadTreefortSources } from "./lib/manifests.mjs";

async function main() {
  const { audit } = await loadTreefortSources();
  console.log(`approved: ${audit.counts.approved}`);
  console.log(`pending: ${audit.counts.pending}`);
  console.log(`rejected: ${audit.counts.rejected}`);
  console.log(`suspended: ${audit.counts.suspended}`);

  audit.details.forEach((detail) => {
    console.log(
      `${detail.status.padEnd(9)} ${detail.submissionId} (${detail.githubLogin}) [${detail.mode}] -> ${detail.neighborhood}`,
    );
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
