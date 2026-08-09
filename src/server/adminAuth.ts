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
const PENDING_TOTP_DURATION_MS = 1000 * 60 * 5; // 5 minutes -- just long enough to type a 6-digit code

/**
 * Admin is DISABLED unless all three secrets are configured. Failing closed matters more than
 * convenience here -- a missing env var must never mean "let everyone in" (or "let everyone in
 * without the second factor"), which is exactly the bug being fixed. Same fail-closed principle
 * as the address validation gate. ADMIN_TOTP_SECRET is generated once via
 * scripts/generate-admin-totp-secret.ts, not typed in by hand, so it's always present or the
 * operator hasn't finished setup yet -- there's no partial/optional 2FA state.
 */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_TOTP_SECRET);
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

// --- Pending 2FA ticket ------------------------------------------------------------------------
// Issued once the password check passes, before the TOTP code is verified. Deliberately its own
// token shape (a "pending" tag baked into what gets signed) rather than reusing
// createSessionToken with a shorter duration -- that would make a half-authenticated ticket
// structurally indistinguishable from a real session token, so a bug elsewhere that accepts one
// where it expects the other would silently skip the second factor entirely. Stays stateless like
// the session token: no server-side store, just a signed, time-boxed value the client hands back.

function signPending(expiresAt: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`pending:${expiresAt}`).digest('hex');
}

export function createPendingTotpTicket(): string {
  const expiresAt = Date.now() + PENDING_TOTP_DURATION_MS;
  return `${expiresAt}.${signPending(String(expiresAt))}`;
}

export function isValidPendingTotpTicket(ticket: string | undefined): boolean {
  if (!isAdminConfigured() || !ticket) return false;
  const [expiresAtRaw, signature] = ticket.split('.');
  if (!expiresAtRaw || !signature) return false;

  const expected = signPending(expiresAtRaw);
  if (!safeEqual(signature, expected)) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

// --- TOTP (RFC 6238), Google Authenticator-compatible ------------------------------------------
// Hand-rolled on Node's built-in crypto rather than an npm package (otplib, speakeasy, etc.) --
// same "no new dependencies" constraint as the rest of this file: no local npm to regenerate
// package-lock.json, and a mismatched lockfile fails Vercel's `npm ci` for the whole site. RFC
// 6238 is small enough that hand-rolling it correctly is cheaper than working around that.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** RFC 4648 base32, no padding -- the format every TOTP app expects for a manually-entered key. */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;

/** HOTP per RFC 4226 -- HMAC-SHA1 of the counter, dynamically truncated to a 6-digit code. */
function hotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuffer.writeUInt32BE(counter % 2 ** 32, 4);

  const digest = crypto.createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

/**
 * Verifies a 6-digit code against a ±1 step (30s) window, so a code typed right at a 30-second
 * boundary -- or a phone clock a few seconds off -- still works. Wider than that starts trading
 * away the security the second factor exists for.
 */
export function verifyTotpCode(secretBase32: string, candidate: unknown): boolean {
  if (typeof candidate !== 'string') return false;
  const code = candidate.trim();
  if (!/^\d{6}$/.test(code)) return false;

  const secret = base32Decode(secretBase32);
  if (secret.length === 0) return false;

  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  for (const drift of [0, -1, 1]) {
    const expected = hotp(secret, counter + drift);
    if (safeEqual(code, expected)) return true;
  }
  return false;
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
