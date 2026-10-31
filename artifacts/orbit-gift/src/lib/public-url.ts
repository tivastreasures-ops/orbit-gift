/**
 * Public card URL seam. Empty until a verified published URL is configured via
 * VITE_PUBLIC_CARD_URL. Dev / preview hosts are rejected so they can never land on a card.
 */
const BLOCKED = /(replit\.dev|repl\.co|replit\.app\.local|localhost|127\.0\.0\.1|0\.0\.0\.0|\.local$)/i;

export function validatePublicUrl(raw: string | undefined | null): string {
  const v = (raw ?? '').trim();
  if (!v) return '';
  try {
    const u = new URL(/^https?:\/\//.test(v) ? v : `https://${v}`);
    if (u.protocol !== 'https:' || BLOCKED.test(u.hostname)) return '';
    return `${u.origin}${u.pathname}`.replace(/\/$/, '');
  } catch {
    return '';
  }
}

export const PUBLIC_CARD_URL: string = validatePublicUrl(import.meta.env.VITE_PUBLIC_CARD_URL as string | undefined);

/** Short display form for the card footer: host + path, no protocol. */
export function shortLink(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

/** QR is only offered when a real public URL exists. No fake codes. */
export const QR_AVAILABLE = !!PUBLIC_CARD_URL;
