// Makes Neon reachable from a machine whose DNS resolver refuses the endpoint.
//
//   import './lib/neon-curl.js';   // side-effect import, BEFORE anything that touches the db
//
// THE FAULT, diagnosed 2026-09-06 on this workstation:
//
//     host api.c-4.us-east-2.aws.neon.tech   ->  not found: 5(REFUSED)
//     dig +short @1.1.1.1 <same host>        ->  16.59.10.57  18.226.241.3  13.58.18.166
//
// A DNS refusal, not a network partition, which is why the symptom presented two ways all session
// and why retry loops sometimes appeared to fix it: undici reports ENOTFOUND when it has no
// resolution and a connect timeout when it has a stale one. Nothing was ever wrong with the route.
//
// THIS IS A LOCAL WORKAROUND AND MUST STAY ONE. The first version installed itself unconditionally
// and broke the Vercel build: `npm run build` runs generate-sitemap.ts, Vercel's build image does
// have curl, so the shim took over a connection that was working perfectly and Neon rejected the
// request with "could not parse the HTTP request body: expected value at line 1 column 1" -- the
// driver does not always hand fetch() a string body, and String(bodyBuffer) is not the body.
//
// So there are now three guards, and the shim no-ops unless all three pass:
//   1. Not in CI or on Vercel. Those environments resolve Neon normally; there is nothing to fix.
//   2. curl and dig both exist.
//   3. dig via 1.1.1.1 actually returns addresses for the host being requested.
// Anything else leaves the platform's own fetch in place, which is the behaviour that was always
// correct everywhere except here.
import { spawnSync } from 'node:child_process';
import { neonConfig } from '@neondatabase/serverless';

const IN_CI = Boolean(process.env.VERCEL || process.env.CI || process.env.GITHUB_ACTIONS);

function has(bin: string): boolean {
  const r = spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0 && Boolean((r.stdout || '').trim());
}

const resolved = new Map<string, string[]>();
function resolveHost(host: string): string[] {
  if (resolved.has(host)) return resolved.get(host)!;
  const dig = spawnSync('dig', ['+short', '+time=3', '+tries=2', '@1.1.1.1', host], { encoding: 'utf8' });
  const ips = (dig.stdout || '').split('\n').map((l) => l.trim()).filter((l) => /^\d{1,3}(\.\d{1,3}){3}$/.test(l));
  resolved.set(host, ips);
  return ips;
}

// Body may arrive as a string, a Buffer, or a Uint8Array. Decoding it wrongly is what produced the
// empty-body rejection above, so each case is handled explicitly rather than via String().
function bodyToString(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  if (body instanceof Uint8Array) return Buffer.from(body).toString('utf8');
  return null;
}

function curlFetch(input: any, init: any = {}): Promise<any> {
  const url = typeof input === 'string' ? input : input?.url;
  let host = '';
  try { host = new URL(url).hostname; } catch { /* fall through to the native path below */ }

  const ips = host ? resolveHost(host) : [];
  const body = bodyToString(init.body);
  // If anything about this request is not something the shim can faithfully reproduce, hand it
  // back to the platform rather than sending a request that differs from the one asked for.
  if (!host || ips.length === 0 || (init.body != null && body === null)) {
    return fetch(input, init);
  }

  const args = ['-4', '-sS', '--max-time', '45', '-X', init.method || 'GET'];
  for (const ip of ips) args.push('--resolve', `${host}:443:${ip}`);
  const headers = init.headers || {};
  const entries = typeof headers.entries === 'function' ? [...headers.entries()] : Object.entries(headers);
  for (const [k, v] of entries) args.push('-H', `${k}: ${v}`);
  if (body !== null) args.push('--data-binary', body);
  args.push('-w', '\n%{http_code}', url);

  const res = spawnSync('curl', args, { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 });
  if (res.error || res.status !== 0) {
    return Promise.reject(new Error(`curl failed for ${url}: ${res.stderr || `exit ${res.status}`}`));
  }
  const out = res.stdout || '';
  const cut = out.lastIndexOf('\n');
  const text = cut === -1 ? out : out.slice(0, cut);
  const status = Number((cut === -1 ? '' : out.slice(cut + 1)).trim()) || 0;

  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: () => null },
    text: async () => text,
    json: async () => JSON.parse(text),
  });
}

if (!IN_CI && has('curl') && has('dig')) {
  (neonConfig as any).fetchFunction = curlFetch;
}
