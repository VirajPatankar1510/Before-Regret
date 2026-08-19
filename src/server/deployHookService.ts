// Vercel Deploy Hooks: a single POST to a project-specific URL that triggers a new production
// build + deploy, no auth token needed (the URL itself is the credential -- treat it like one).
//
// Needed because this site's guide pages are static-prerendered at build time (see
// scripts/prerender-guides.tsx) into dist/guides/<slug>/index.html, with the article's content
// baked directly into the HTML plus a __PRELOADED_GUIDE__ script tag the client trusts without
// re-fetching. Publishing, unpublishing, updating, or deleting an article through the admin panel
// only writes to the database -- the live page for that slug keeps serving whatever was baked in
// at the last actual deploy until a new one runs.
//
// Confirmed as a real production bug, not a theoretical one: an admin deleted a truncated article
// and republished a complete one under the same slug, and the live page kept serving the deleted
// version's content indefinitely -- no hard refresh or cache-clearing could fix it client-side,
// because GuidePageView.tsx's readPreloadedGuide() only checks that the slug matches, not that
// the content is current, so it never re-fetched.
export function isDeployHookConfigured(): boolean {
  return Boolean(process.env.VERCEL_DEPLOY_HOOK_URL);
}

// Fire-and-forget by design, same convention as submitUrlsToIndexNow in indexNowService.ts --
// never throws, so a network hiccup here can never fail the publish/unpublish/update/delete
// action it's called from. A full Vercel build takes minutes, far longer than any reasonable
// request timeout, so this deliberately doesn't wait for the deploy to finish -- it only confirms
// Vercel accepted the trigger.
export async function triggerRedeploy(reason: string): Promise<void> {
  // Logged rather than returned silently. The silent version cost a 15-minute controlled
  // experiment to diagnose: an article published to the database sat serving dist/shell.html --
  // homepage title, canonical pointing at the homepage -- and there was no way to tell from
  // outside whether the hook had fired slowly, failed, or was never configured at all. One line
  // here distinguishes "not configured" from "fired and we are waiting" instantly.
  if (!isDeployHookConfigured()) {
    console.warn(`[deploy-hook] VERCEL_DEPLOY_HOOK_URL is not set -- skipping redeploy (${reason}). The static page for this change will keep serving stale content until some other deploy runs.`);
    return;
  }
  try {
    const res = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL as string, { method: 'POST' });
    if (!res.ok) {
      console.warn(`[deploy-hook] Trigger failed (${reason}): ${res.status} ${await res.text()}`);
      return;
    }
    // Success is worth logging too, with the expectation attached. Measured on this project:
    // a hook-triggered build took ~14.5 minutes to go live, versus 40-80 seconds for the same
    // build triggered by a git push. So "nothing has changed yet" is normal for far longer than
    // it looks, and knowing the trigger was accepted is what stops that from reading as failure.
    console.log(`[deploy-hook] Redeploy triggered (${reason}). Vercel accepted it; the new build typically takes several minutes to go live.`);
  } catch (err) {
    console.warn(`[deploy-hook] Trigger failed (${reason}):`, err);
  }
}
