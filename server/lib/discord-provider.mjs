const OAUTH_SCOPE = "identify guilds.members.read";

function buildAuthorizeUrl(state) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", process.env.DISCORD_REDIRECT_URI);
  url.searchParams.set("scope", OAUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    scope: OAUTH_SCOPE,
  });

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed with ${response.status}`);
  }

  return response.json();
}

async function fetchGuildMember(accessToken, guildId) {
  const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Discord member lookup failed with ${response.status}`);
  }

  return response.json();
}

function memberHasRequiredRoles(member, requiredRoleIds) {
  if (!requiredRoleIds || requiredRoleIds.length === 0) {
    return true;
  }

  const memberRoles = new Set(member.roles ?? []);
  return requiredRoleIds.every((roleId) => memberRoles.has(roleId));
}

export const discordProvider = {
  id: "discord",
  label: "Discord",
  requiredEnv: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_REDIRECT_URI"],
  buildAuthorizeUrl,
  exchangeCode,
  async verifySubmissionAccess({ submission, accessToken }) {
    const member = await fetchGuildMember(accessToken, submission.door.access.guildId);
    const allowed = !!member && memberHasRequiredRoles(member, submission.door.access.requiredRoleIds);

    return {
      allowed,
      serverLabel: submission.door.access.serverLabel,
      inviteUrl: submission.door.access.inviteUrl,
      requiredRoleLabel: submission.door.access.requiredRoleLabel || null,
    };
  },
};
