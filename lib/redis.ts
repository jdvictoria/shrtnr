import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const LINK_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

/**
 * Shape stored in Redis for each slug.
 * Includes all data needed to serve a redirect without hitting the DB.
 */
export type CachedLink = {
  id: string;
  url: string;
  expiresAt: string | null; // ISO string
  hasPassword: boolean;
  isActive: boolean;
  geoRules: Array<{ country: string; url: string }>;
};

type CacheableLink = {
  id: string;
  url: string;
  expiresAt: Date | null;
  passwordHash: string | null;
  isActive: boolean;
  geoRules: Array<{ country: string; url: string }>;
};

export function isCachedLink(value: unknown): value is CachedLink {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CachedLink>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.url === "string" &&
    (candidate.expiresAt === null || typeof candidate.expiresAt === "string") &&
    typeof candidate.hasPassword === "boolean" &&
    typeof candidate.isActive === "boolean" &&
    Array.isArray(candidate.geoRules)
  );
}

export async function cacheLink(slug: string, link: CacheableLink): Promise<void> {
  const cached: CachedLink = {
    id: link.id,
    url: link.url,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    hasPassword: Boolean(link.passwordHash),
    isActive: link.isActive,
    geoRules: link.geoRules,
  };
  await redis.set(`link:${slug}`, cached, { ex: LINK_TTL });
}
