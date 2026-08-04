import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server';

// Vercel Node.js serverless function entry point for all /api/* traffic (see vercel.json, which
// excludes /api/* from the SPA rewrite so requests reach this function instead of index.html).
// The Express app is built once per warm lambda instance and reused across invocations.
const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  app(req, res);
}
