import { EditorialGuide } from '../types/seoTypes.js';

// This file previously held a hardcoded per-ZIP dataset (radon pCi/L, fiber coverage %, ambient
// noise dBA, and similar figures) with no live data source behind any of it, presented on public
// pages as if pulled from FEMA/EPA/FCC/USGS. That whole ZIP/city/state/topic/compare pSEO surface
// (36 live URLs) was removed in one pass rather than patched, since softening the wording around
// invented numbers doesn't fix the underlying problem -- the numbers themselves weren't real. See
// the removed src/utils/seoLongformGenerator.ts, seoUniquenessEvaluator.ts, and the
// StateHubView/CityHubView/ZipHubView/TopicDeepPageView/ZipComparePageView components.
//
// EDITORIAL_GUIDES_DATASET is what's left standing: hand-written, non-geographic articles at
// /guides/:slug/, with no per-ZIP figures baked in. Empty for now -- the two guides that lived
// here before (Austin flood zones, moving to Austin) both cited the same invented figures and are
// gone with the rest. New articles go here once written.
export const EDITORIAL_GUIDES_DATASET: EditorialGuide[] = [];
