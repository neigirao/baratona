import { useEffect } from 'react';

interface SeoOptions {
  image?: string | null;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  url?: string | null;
  type?: string;
  /** JSON-LD structured data (object or array). Replaces any existing baratona JSON-LD. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  /** Optional locale (defaults to pt_BR). */
  locale?: string;
  /** Optional keywords meta. */
  keywords?: string;
}

const JSONLD_SCRIPT_ID = 'baratona-jsonld';

export function useSeo(title: string, description: string, options: SeoOptions = {}) {
  useEffect(() => {
    document.title = title;

    const ensureMeta = (name: string, attr: 'name' | 'property') => {
      let tag = document.head.querySelector(`meta[${attr}='${name}']`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      return tag;
    };

    const ensureLink = (rel: string) => {
      let tag = document.head.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      return tag;
    };

    ensureMeta('description', 'name').content = description;
    ensureMeta('og:title', 'property').content = title;
    ensureMeta('og:description', 'property').content = description;
    ensureMeta('og:type', 'property').content = options.type || 'website';
    ensureMeta('og:locale', 'property').content = options.locale || 'pt_BR';
    ensureMeta('og:site_name', 'property').content = 'Baratona';
    ensureMeta('twitter:title', 'name').content = title;
    ensureMeta('twitter:description', 'name').content = description;
    ensureMeta('twitter:card', 'name').content = options.image ? 'summary_large_image' : 'summary';

    if (options.keywords) {
      ensureMeta('keywords', 'name').content = options.keywords;
    }

    const url = options.url || window.location.href;
    ensureMeta('og:url', 'property').content = url;
    ensureLink('canonical').href = url;

    if (options.image) {
      ensureMeta('og:image', 'property').content = options.image;
      ensureMeta('twitter:image', 'name').content = options.image;
      if (options.imageAlt) {
        ensureMeta('og:image:alt', 'property').content = options.imageAlt;
        ensureMeta('twitter:image:alt', 'name').content = options.imageAlt;
      }
      if (options.imageWidth)  ensureMeta('og:image:width',  'property').content = String(options.imageWidth);
      if (options.imageHeight) ensureMeta('og:image:height', 'property').content = String(options.imageHeight);
    }

    // JSON-LD: replace any previous baratona block
    const existing = document.getElementById(JSONLD_SCRIPT_ID);
    if (existing) existing.remove();
    if (options.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSONLD_SCRIPT_ID;
      script.text = JSON.stringify(options.jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const stale = document.getElementById(JSONLD_SCRIPT_ID);
      if (stale) stale.remove();
    };
  }, [title, description, options.image, options.imageAlt, options.imageWidth, options.imageHeight, options.url, options.type, options.locale, options.keywords, options.jsonLd]);
}
