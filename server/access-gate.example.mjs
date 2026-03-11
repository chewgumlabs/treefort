import http from "node:http";
import { escapeHtml, redirect, sendHtml } from "./lib/http.mjs";
import { discordProvider } from "./lib/discord-provider.mjs";
import { buildState, requireEnv, verifyState } from "./lib/state.mjs";
import { loadApprovedGateDoor, resolveRoomUrl } from "./lib/treefort-doors.mjs";

const PORT = Number(process.env.PORT ?? 8787);
const providers = new Map([[discordProvider.id, discordProvider]]);

function getProvider(submission) {
  const provider = providers.get(submission.door.access.mode);
  if (!provider) {
    throw new Error(`door "${submission.submissionId}" uses unsupported gate mode "${submission.door.access.mode}"`);
  }
  return provider;
}

function buildRetryPath(submission) {
  return `/api/access/start?door=${encodeURIComponent(submission.submissionId)}`;
}

async function handleStart(requestUrl, response) {
  const doorId = requestUrl.searchParams.get("door");
  if (!doorId) {
    sendHtml(response, 400, "Missing door", "<p>Pick a gated door before starting the unlock flow.</p>");
    return;
  }

  const submission = await loadApprovedGateDoor(doorId);
  const provider = getProvider(submission);
  requireEnv(["TREEFORT_SESSION_SECRET", ...provider.requiredEnv]);

  const state = buildState(process.env.TREEFORT_SESSION_SECRET, {
    doorId,
    providerId: provider.id,
  });
  redirect(response, provider.buildAuthorizeUrl(state));
}

async function handleCallback(requestUrl, response) {
  const stateValue = requestUrl.searchParams.get("state");
  if (!stateValue) {
    sendHtml(response, 400, "Missing state", "<p>The access provider did not return a valid state parameter.</p>");
    return;
  }

  const state = verifyState(process.env.TREEFORT_SESSION_SECRET, stateValue);
  if (typeof state.doorId !== "string" || typeof state.providerId !== "string") {
    throw new Error("OAuth state is missing required fields");
  }

  const submission = await loadApprovedGateDoor(state.doorId);
  const provider = getProvider(submission);
  if (provider.id !== state.providerId) {
    throw new Error("OAuth state provider mismatch");
  }
  requireEnv(["TREEFORT_SESSION_SECRET", ...provider.requiredEnv]);

  const errorCode = requestUrl.searchParams.get("error");
  if (errorCode) {
    sendHtml(
      response,
      403,
      `${provider.label} authorization cancelled`,
      `<p>${provider.label} returned <code>${escapeHtml(errorCode)}</code>. You can <a href="${escapeHtml(
        submission.door.access.inviteUrl,
      )}">join ${escapeHtml(submission.door.access.serverLabel)}</a> and try again.</p>`,
    );
    return;
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    sendHtml(response, 400, "Missing code", "<p>The access provider did not return an authorization code.</p>");
    return;
  }

  const token = await provider.exchangeCode(code);
  const result = await provider.verifySubmissionAccess({
    submission,
    accessToken: token.access_token,
  });

  if (!result.allowed) {
    const requiredRoleMarkup = result.requiredRoleLabel
      ? `<p>This door expects the <strong>${escapeHtml(result.requiredRoleLabel)}</strong> role.</p>`
      : "";
    sendHtml(
      response,
      403,
      `Join ${escapeHtml(result.serverLabel)} first`,
      `<p>This door unlocks only after ${escapeHtml(provider.label)} confirms access to <strong>${escapeHtml(
        result.serverLabel,
      )}</strong>.</p>
      ${requiredRoleMarkup}
      <p><a href="${escapeHtml(result.inviteUrl)}">Join the server</a></p>
      <p><a href="${buildRetryPath(submission)}">Try verification again</a></p>`,
    );
    return;
  }

  redirect(response, resolveRoomUrl(submission.owner.siteUrl));
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const isStartRoute = requestUrl.pathname === "/api/access/start" || requestUrl.pathname === "/api/discord/start";
  const isCallbackRoute =
    requestUrl.pathname === "/api/access/callback" || requestUrl.pathname === "/api/discord/callback";

  if (request.method !== "GET") {
    sendHtml(response, 405, "Method not allowed", "<p>This example service only accepts GET requests.</p>");
    return;
  }

  if (isStartRoute) {
    await handleStart(requestUrl, response);
    return;
  }

  if (isCallbackRoute) {
    await handleCallback(requestUrl, response);
    return;
  }

  sendHtml(
    response,
    200,
    "Treefort Access Gate",
    "<p>Use <code>/api/access/start?door=&lt;submission-id&gt;</code> to begin a gated unlock flow.</p>",
  );
}

export function startAccessGateServer(port = PORT) {
  http
    .createServer((request, response) => {
      handleRequest(request, response).catch((error) => {
        console.error(error);
        sendHtml(response, 500, "Access gate error", `<p>${escapeHtml(error.message)}</p>`);
      });
    })
    .listen(port, () => {
      console.log(`Treefort access gate listening on http://127.0.0.1:${port}`);
    });
}
