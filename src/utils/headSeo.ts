export interface HeadSeoOptions {
  title: string;
  description: string;
  canonicalUrl: string;
  robotsDirective: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
  jsonLdSchema?: Record<string, any> | Array<Record<string, any>>;
}

export function applyHeadSeo({ title, description, canonicalUrl, robotsDirective, jsonLdSchema }: HeadSeoOptions) {
  if (typeof document === 'undefined') return;

  // Set title
  document.title = title;

  // Set or create Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // Set or create Meta Robots
  let metaRobots = document.querySelector('meta[name="robots"]');
  if (!metaRobots) {
    metaRobots = document.createElement('meta');
    metaRobots.setAttribute('name', 'robots');
    document.head.appendChild(metaRobots);
  }
  metaRobots.setAttribute('content', robotsDirective);

  // Set or create Canonical Link
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonicalUrl);

  // Remove existing dynamic JSON-LD scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-seo="dynamic"]');
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
