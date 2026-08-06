import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Server-side admin session handling.
//
// Why this exists: /admin/seo was reachable by anyone on the internet. It carried
// `noindex, nofollow`, but that only asks search engines not to *list* the page -- it does nothing
// to stop someone who knows or guesses the URL from opening it. A client-side-only check would be
// equally useless, since anyone can edit the JS or call the API directly. So the gate lives here,
// on the server, and every admin API route goes through requireAdmin below.
//
// No new npm dependencies on purpose (no cookie-parser, no jsonwebtoken): this repo has a
// package-lock.json and no local npm available to regenerate it, and a lockfile mismatch would
// fail Vercel's `npm ci` for the entire site. Node's built-in crypto plus manual cookie
// parsing covers everything needed here.

const COOKIE_NAME = 'br_admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * Admin is DISABLED unless both secrets are configured. Failing closed matters more than
 * convenience here -- a missing env var must never mean "let everyone in", which is exactly the
 * bug being fixed. Same fail-closed principle as the address validation gate.
 */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || '';
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

/** Constant-time compare so a wrong password can't be discovered by timing the response. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPassword(candidate: unknown): boolean {
  if (!isAdminConfigured()) return false;
  if (typeof candidate !== 'string' || candidate.length === 0) return false;
  return safeEqual(candidate, process.env.ADMIN_PASSWORD as string);
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

/** Token is `<expiresAt>.<hmac(expiresAt)>` -- self-contained, so it needs no server-side store. */
export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!isAdminConfigured() || !token) return false;
  const [expiresAtRaw, signature] = token.split('.');
  if (!expiresAtRaw || !signature) return false;

  const expected = sign(expiresAtRaw);
  if (!safeEqual(signature, expected)) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export function setSessionCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}`,
    isProd ? 'Secure' : '',
  ].filter(Boolean);
  res.setHeader('Set-Cookie', attrs.join('; '));
}

export function clearSessionCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const attrs = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    'Max-Age=0',
    isProd ? 'Secure' : '',
  ].filter(Boolean);
  res.setHeader('Set-Cookie', attrs.join('; '));
}

export function hasValidSession(req: Request): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return isValidSessionToken(cookies[COOKIE_NAME]);
}

/** Express middleware -- put this in front of every admin API route. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminConfigured()) {
    res.status(503).json({
      success: false,
      error: 'Admin access is not configured on this server.',
    });
    return;
  }
  if (!hasValidSession(req)) {
    res.status(401).json({ success: false, error: 'Not signed in.' });
    return;
  }
  next();
}
