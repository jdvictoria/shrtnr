import { createHmac, timingSafeEqual } from "node:crypto";

const GRANT_TTL_SECONDS = 60 * 60 * 24;

function getSigningSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to sign link access grants");
  return secret;
}

function signature(slug: string, expiresAt: number): string {
  return createHmac("sha256", getSigningSecret())
    .update(`${slug}:${expiresAt}`)
    .digest("base64url");
}

export function createLinkAccessGrant(slug: string): {
  value: string;
  maxAge: number;
} {
  const expiresAt = Math.floor(Date.now() / 1000) + GRANT_TTL_SECONDS;
  return {
    value: `${expiresAt}.${signature(slug, expiresAt)}`,
    maxAge: GRANT_TTL_SECONDS,
  };
}

export function verifyLinkAccessGrant(slug: string, value?: string): boolean {
  if (!value) return false;
  const [rawExpiry, suppliedSignature, ...rest] = value.split(".");
  if (!rawExpiry || !suppliedSignature || rest.length > 0) return false;

  const expiresAt = Number(rawExpiry);
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = Buffer.from(signature(slug, expiresAt));
  const supplied = Buffer.from(suppliedSignature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
