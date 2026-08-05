import type { IncomingMessage, ServerResponse } from 'http';
// Extension required: package.json has "type": "module", and Vercel's Node.js function runtime
// resolves this import with Node's native strict ESM resolver at runtime rather than inlining it
// via a bundler -- confirmed live via Vercel's runtime logs: an extensionless '../server' import
// failed with ERR_MODULE_NOT_FOUND ("Cannot find module '/var/task/server'"). The source file is
// server.ts, but Node's ESM resolver needs the extension of the file it will actually load at
// runtime (the transpiled .js), not the TypeScript source extension.
import { createApp } from '../server.js';

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
