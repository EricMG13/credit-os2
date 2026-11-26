// What a logo is, as data: one of five image types and a small, well-formed base64 body, made into
// the `data:` URL an `img` may hold. Pure: the slice reader and the live logo store both use it.

/** The image types a logo may have; anything else is no logo. */
const TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/x-icon"];
/** A logo is small: at most this many bytes once decoded. */
export const LOGO_BYTES = 32 * 1024;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * The `data:` URL of a logo given as its media type and its bytes in base64, or null when either
 * is not what a logo is: one of the five image types, and well-formed base64 of at most 32 KiB
 * decoded and at least one byte.
 */
export function logoUrl(type: unknown, data: unknown): string | null {
  if (typeof type !== "string" || typeof data !== "string" || !TYPES.includes(type)) return null;
  // Longer than any logo's base64 can be: not read further.
  if (data === "" || data.length > Math.ceil(LOGO_BYTES / 3) * 4) return null;
  if (!BASE64.test(data)) return null;
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return (data.length / 4) * 3 - padding > LOGO_BYTES ? null : `data:${type};base64,${data}`;
}

/** A `data:` URL as `logoUrl` writes one, read back; null for any other text. */
export function readLogoUrl(url: unknown): string | null {
  const found = typeof url === "string" ? /^data:([a-z/-]+);base64,(.*)$/s.exec(url) : null;
  return found === null ? null : logoUrl(found[1], found[2]);
}
