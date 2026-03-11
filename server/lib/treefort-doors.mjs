import { loadTreefortSources } from "../../scripts/lib/manifests.mjs";

export async function loadApprovedGateDoor(doorId) {
  const { submissions, reviews } = await loadTreefortSources();
  const reviewMap = new Map(reviews.map((review) => [review.submissionId, review]));
  const submission = submissions.find((entry) => entry.submissionId === doorId);
  const review = reviewMap.get(doorId);

  if (!submission || !review || review.status !== "approved") {
    throw new Error(`door "${doorId}" is not an approved Treefort room`);
  }

  return submission;
}

export function resolveRoomUrl(siteUrl) {
  if (siteUrl.startsWith("https://") || siteUrl.startsWith("http://")) {
    return siteUrl;
  }

  const publicBaseUrl = process.env.TREEFORT_PUBLIC_BASE_URL;
  if (!publicBaseUrl) {
    throw new Error("TREEFORT_PUBLIC_BASE_URL is required when siteUrl is relative");
  }

  return new URL(siteUrl, publicBaseUrl).toString();
}
