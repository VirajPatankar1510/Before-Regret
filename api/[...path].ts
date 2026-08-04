import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server';

// Vercel Node.js serverless function entry point for all /api/* traffic. The [...path] catch-all
// filename is required -- a plain api/index.ts only maps to the literal route /api, not to
// sub-paths like /api/health or /api/geocode/search (confirmed: an earlier index.ts-named version
// of this file never showed up as a routable function in Vercel's build output). vercel.json
// separately excludes /api/* from the SPA rewrite so requests reach this function instead of
// index.html. The Express app is built once per warm lambda instance and reused across
// invocations.
const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  app(req, res);
}
