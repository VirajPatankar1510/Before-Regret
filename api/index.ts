import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server';

// Vercel Node.js serverless function entry point for all /api/* traffic. This project isn't
// Next.js, so Vercel's [...param] catch-all filename convention doesn't apply here -- confirmed
// live: a file literally named api/[...path].ts only ever matched exactly one path segment past
// /api (e.g. /api/health worked, /api/geocode/search 404'd at Vercel's edge, never reaching this
// function). Routing every /api/* request here is instead handled explicitly in vercel.json via
// a rewrite from /api/:path* to /api/index, which Vercel resolves to this file while preserving
// the original request URL for Express's own internal router to match against. The Express app
// is built once per warm lambda instance and reused across invocations.
const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  app(req, res);
}
