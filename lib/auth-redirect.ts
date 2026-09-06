const DEFAULT_AUTH_DESTINATION = "/dashboard";

export function resolveAuthCallback(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_DESTINATION;
  }

  return value;
}

export function authEntryHref(path: "/sign-in" | "/sign-up", callbackUrl?: string | null) {
  const destination = resolveAuthCallback(callbackUrl);

  if (destination === DEFAULT_AUTH_DESTINATION) return path;

  return `${path}?callbackUrl=${encodeURIComponent(destination)}`;
}
