import { useEffect } from 'react';

interface SeoOptions {
  image?: string | null;
  url?: string | null;
  type?: string;
}

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
    ensureMeta('twitter:title', 'name').content = title;
    ensureMeta('twitter:description', 'name').content = description;
    ensureMeta('twitter:card', 'name').content = options.image ? 'summary_large_image' : 'summary';

    const url = options.url || window.location.href;
    ensureMeta('og:url', 'property').content = url;
    ensureLink('canonical').href = url;

    if (options.image) {
      ensureMeta('og:image', 'property').content = options.image;
      ensureMeta('twitter:image', 'name').content = options.image;
    }
  }, [title, description, options.image, options.url, options.type]);
}
