import type { Request } from 'express';

/**
 * The visitor's IP for rate limits and click de-duplication.
 *
 * Audit 2026-11-19 (F19): every caller used to read the LEFTMOST X-Forwarded-For entry, which is the one a client
 * can write itself. Vercel sets x-vercel-forwarded-for and x-real-ip from the connection it actually received, so
 * those come first; X-Forwarded-For and the socket address stay as fallbacks for local runs and other hosts.
 */
export function clientIp(req: Request): string {
  for (const name of ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for']) {
    const value = req.headers[name];
    const first = (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket?.remoteAddress || 'unknown';
}
