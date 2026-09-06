// Makes Neon reachable from this machine by routing its HTTP transport through curl.
//
//   import './lib/neon-curl.js';   // side-effect import, BEFORE anything that touches the db
//
// WHY. Node's undici hangs on api.c-4.us-east-2.aws.neon.tech from this machine -- every address,
// IPv4 and IPv6 alike -- and returns UND_ERR_CONNECT_TIMEOUT after 10s, while curl reaches the same
// endpoint in well under a second. src/server/countyDataFetcher.ts documents the identical fault
// against api.census.gov and services.arcgis.com and solves it the same way, but its curlFetch is
// GET-only; the Neon serverless driver POSTs a JSON body with auth headers, so it needs its own.
//
// The retry-loop workaround used elsewhere in this project (5-8 attempts with sleeps) works when
// the fault is intermittent and fails outright when it is not -- ten consecutive attempts returned
// nothing while building this. A shim removes the coin flip rather than re-flipping it.
//
// neonConfig.fetchFunction is the supported hook. Passing fetchFunction through neon(url, {...})
// is NOT honoured by the driver, which is the trap worth knowing.
import { spawnSync } from 'node:child_process';
import { neonConfig } from '@neondatabase/serverless';

// THE ACTUAL FAULT, diagnosed 2026-09-06. This machine's system resolver REFUSES the Neon endpoint:
//
//     host api.c-4.us-east-2.aws.neon.tech   ->  not found: 5(REFUSED)
//     dig +short @1.1.1.1 <same host>        ->  16.59.10.57  18.226.241.3  13.58.18.166
//
// So it is a DNS refusal, not a network partition -- which is why the symptom presented two
// different ways all session and why retry loops sometimes "fixed" it: undici caches a resolution
// and reports ENOTFOUND when it has none and a connect timeout when it has a stale one, while curl
// reports "Could not resolve host" immediately. Nothing was ever wrong with the route.
//
// Resolving through 1.1.1.1 once and pinning the answer with --resolve removes the local resolver
// from the path entirely. Cached for the process, since a per-query dig would be wasteful.
let pinned: string[] | null = null;
function resolveHost(host: string): string[] {
  if (pinned) return pinned;
  const dig = spawnSync('dig', ['+short', '+time=3', '+tries=2', '@1.1.1.1', host], { encoding: 'utf8' });
  const ips = (dig.stdout || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\d{1,3}(\.\d{1,3}){3}$/.test(l));
  pinned = ips;
  return ips;
}

// Only the surface the driver actually uses: ok, status, text(), json().
function curlFetch(input: any, init: any = {}): Promise<any> {
  const url = typeof input === 'string' ? input : input?.url;
  const args = ['-4', '-sS', '--max-time', '45', '-X', init.method || 'GET'];

  try {
    const host = new URL(url).hostname;
    for (const ip of resolveHost(host)) args.push('--resolve', `${host}:443:${ip}`);
  } catch { /* not a parseable URL; let curl fail with its own message */ }

  const headers = init.headers || {};
  const entries = typeof headers.entries === 'function' ? [...headers.entries()] : Object.entries(headers);
  for (const [k, v] of entries) args.push('-H', `${k}: ${v}`);

  if (init.body) args.push('--data-binary', typeof init.body === 'string' ? init.body : String(init.body));
  args.push('-w', '\n%{http_code}', url);

  const res = spawnSync('curl', args, { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 });
  if (res.error || res.status !== 0) {
    return Promise.reject(new Error(`curl failed for ${url}: ${res.stderr || `exit ${res.status}`}`));
  }
  const out = res.stdout || '';
  const cut = out.lastIndexOf('\n');
  const body = cut === -1 ? out : out.slice(0, cut);
  const status = Number((cut === -1 ? '' : out.slice(cut + 1)).trim()) || 0;

  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: () => null },
    text: async () => body,
    json: async () => JSON.parse(body),
  });
}

(neonConfig as any).fetchFunction = curlFetch;
