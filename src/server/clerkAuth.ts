import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      verifiedUserId?: string;
    }
  }
}

export function isClerkBackendConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY);
}

// Express middleware for every vendor-ads route that used to trust a client-sent clerkUserId
// (checkout, /my-ads, the two edit routes) -- verifies the Authorization: Bearer <token> header
// against Clerk's own signing keys (JWKS, cached locally after the first check -- no per-request
// network round trip to Clerk, so this doesn't add API usage or cost) and sets req.verifiedUserId
// to the token's real subject. A forged or missing token can no longer write an order under
// someone else's identity or read another vendor's placements, which a raw `clerkUserId` field in
// the request body always could.
export async function requireVerifiedUser(req: Request, res: Response, next: NextFunction) {
  if (!isClerkBackendConfigured()) {
    res.status(503).json({ success: false, error: 'Account verification is not configured on this server.' });
    return;
  }
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ success: false, error: 'Sign in required.' });
    return;
  }
  try {
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY as string });
    req.verifiedUserId = verified.sub;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Your session has expired -- please sign in again.' });
  }
}
