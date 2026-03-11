import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

export function requireEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`missing env vars: ${missing.join(", ")}`);
  }
}

export function buildState(secret, payload) {
  const encoded = Buffer.from(
    JSON.stringify({
      ...payload,
      issuedAt: Date.now(),
      nonce: randomBytes(12).toString("hex"),
    }),
    "utf8",
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("hex");
  return `${encoded}.${signature}`;
}

export function verifyState(secret, serialized) {
  const [encoded, signature] = serialized.split(".");
  if (!encoded || !signature) {
    throw new Error("invalid OAuth state");
  }

  const expected = Buffer.from(createHmac("sha256", secret).update(encoded).digest("hex"), "hex");
  const received = Buffer.from(signature, "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("OAuth state signature mismatch");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (typeof payload.issuedAt !== "number" || Date.now() - payload.issuedAt > STATE_TTL_MS) {
    throw new Error("OAuth state expired");
  }

  return payload;
}
