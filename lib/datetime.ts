export type ParsedExpiry =
  | { success: true; value: Date | null }
  | { success: false; error: string };

export function parseExpiry(value?: string | null): ParsedExpiry {
  if (!value) return { success: true, value: null };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: "Enter a valid expiration date" };
  }
  if (date <= new Date()) {
    return { success: false, error: "Expiration date must be in the future" };
  }

  return { success: true, value: date };
}

export function toDateTimeLocalValue(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

export function localDateTimeToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
