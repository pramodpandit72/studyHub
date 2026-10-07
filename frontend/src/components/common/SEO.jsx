import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'StudyHub — Online Meetings, Classes & Study Sessions';
const DEFAULT_DESCRIPTION =
  'StudyHub delivers clear video meetings, interactive virtual classes, automated attendance, chat, and host controls for students, teachers, and teams.';
const SITE_URL = 'https://studyhub.online';
const DEFAULT_IMAGE = `${SITE_URL}/studyhub-og.png`;

/**
 * Production-ready SEO Head component
 * Dynamically updates document title, canonical link, meta descriptions,
 * robots indexing rules, Open Graph tags, Twitter cards, and structured data.
 */
export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  noindex = false,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  structuredData,
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title
      ? title.includes('StudyHub')
        ? title
        : `${title} | StudyHub`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to get or create a meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 2. Meta Description
    setMetaTag('name', 'description', description);

    // 3. Robots meta (noindex for private/protected routes)
    const robotsContent = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    setMetaTag('name', 'robots', robotsContent);

    // 4. Canonical URL
    const canonicalHref = canonical || `${SITE_URL}${location.pathname === '/' ? '' : location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalHref);

    // 5. Open Graph Metadata
    setMetaTag('property', 'og:site_name', 'StudyHub');
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalHref);
    setMetaTag('property', 'og:image', ogImage);

    // 6. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 7. Structured Data (JSON-LD)
    let jsonLdScript = document.getElementById('studyhub-jsonld-page');
    if (structuredData) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'studyhub-jsonld-page';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(structuredData);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [title, description, canonical, noindex, ogType, ogImage, structuredData, location.pathname]);

  return null;
};
