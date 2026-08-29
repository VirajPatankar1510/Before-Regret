export interface HeadSeoOptions {
  title: string;
  description: string;
  canonicalUrl: string;
  robotsDirective: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
  ogType?: string;
  ogImage?: string;
  jsonLdSchema?: Record<string, any> | Array<Record<string, any>>;
}

function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function applyHeadSeo({ 
  title, 
  description, 
  canonicalUrl, 
  robotsDirective, 
  ogType = 'website',
  ogImage = 'https://www.beforeregret.com/og-image.png',
  jsonLdSchema 
}: HeadSeoOptions) {
  if (typeof document === 'undefined') return;

  // Set title
  document.title = title;

  // Standard Meta Tags
  setMetaTag('name', 'description', description);
  setMetaTag('name', 'robots', robotsDirective);

  // Set or create Canonical Link
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonicalUrl);

  // Open Graph Meta Tags
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', ogImage);
  setMetaTag('property', 'og:site_name', 'Before Regret');

  // Twitter Card Meta Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage);

  // Remove existing JSON-LD scripts before re-injecting: both our own previously-injected
  // "dynamic" scripts AND the "prerendered" block the prerender scripts (prerender-guides /
  // -counties / -legal-pages / -advertise / -homepage) bake into the static HTML.
  //
  // The prerendered removal is load-bearing: without it, a guide or county page ends up with TWO
  // identical Article/BreadcrumbList(/FAQPage) groups in the *rendered* DOM -- the prerendered one
  // a JS-less crawler reads, plus this identical dynamic one appended on mount -- because Googlebot
  // executes JS and sees both. Raw static HTML is unaffected (still exactly one page-specific block
  // until React boots), so non-JS crawlers keep their block; JS-rendering crawlers now see exactly
  // one. The global Organization/WebSite block carries no data-seo attribute and is intentionally
  // left in place by this selector.
  const existingScripts = document.querySelectorAll(
    'script[type="application/ld+json"][data-seo="dynamic"], script[type="application/ld+json"][data-seo="prerendered"]'
  );
  existingScripts.forEach(el => el.remove());

  // Inject JSON-LD Schema if provided
  if (jsonLdSchema) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo', 'dynamic');
    script.textContent = JSON.stringify(jsonLdSchema);
    document.head.appendChild(script);
  }
}

