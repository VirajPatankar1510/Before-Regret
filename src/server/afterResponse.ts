// Keeps post-response background work alive on Vercel.
//
// THE BUG THIS EXISTS FOR. This Express app does not run as a long-lived server: vercel.json
// rewrites every path to /api/index, so it runs inside a serverless function. Once the response is
// sent, Vercel is free to freeze or terminate that function -- and any promise still running,
// having been fired with `void`, is killed wherever it happens to be.
//
// Observed live on 2026-08-29 with the report email. The chain got through the fast steps and died
// on the slow one:
//
//   lookupClerkEmail          completed   (Clerk API call)
//   UPDATE recipient_email    completed   (Neon HTTP query)
//   sendMail                  completed   (only just -- TLS + AUTH + submit)
//   UPDATE report_emailed_at  NEVER RAN   (function already gone)
//
// The email genuinely arrived and the database still said it had not been sent. Nothing errored;
// the work simply stopped mid-chain. Fire-and-forget is correct on a long-lived server and wrong
// here, and every `void somePromise()` in this codebase is exposed to the same thing -- IndexNow
// submissions, deploy hooks, crawler logging and the Gemini usage log are all the same shape. They
// have survived because each is a single fast HTTP call; the mail chain was the first thing slow
// enough to lose the race.
//
// waitUntil tells Vercel to hold the function open until the promise settles, which is exactly the
// primitive this needs. Outside Vercel -- local `npm run dev`, or any long-lived host -- there is
// no context to register with, so it falls back to plain fire-and-forget, which is correct there
// because the process is not going anywhere.
//
// NOT a queue. waitUntil extends the function's life, it does not make it unbounded, and work
// started this way still competes with the platform's overall execution limit. It suits a few
// seconds of SMTP. If report volume ever makes delivery unreliable, the durable answer is to write
// the job to a table and drain it from the existing daily cron (see vercel.json), so delivery stops
// depending on a request's lifetime at all.

let waitUntilFn: ((p: Promise<unknown>) => void) | null | undefined;

/**
 * Run `promise` after the response has been sent, without the platform killing it mid-flight.
 * Never throws, and never rejects into the caller -- a background task's failure is logged where it
 * happens, and must not surface as an error on a request that already succeeded.
 */
export function runAfterResponse(promise: Promise<unknown>, label = 'background task'): void {
  const settled = promise.catch((err) => {
    console.error(`[after-response] ${label} failed:`, err?.message || err);
  });

  if (waitUntilFn === undefined) {
    try {
      // Required lazily so a missing or version-skewed package degrades to fire-and-forget rather
      // than taking down module load for every route in the app.
      waitUntilFn = require('@vercel/functions').waitUntil;
    } catch {
      waitUntilFn = null;
    }
  }

  if (!waitUntilFn) {
    void settled;
    return;
  }

  try {
    waitUntilFn(settled);
  } catch {
    // waitUntil throws when called outside a request context (local dev, scripts). The promise is
    // already running; letting it run unsupervised is the right fallback there.
    void settled;
  }
}
