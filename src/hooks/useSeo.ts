import { useEffect } from 'react';

export function useSeo(title: string, description: string) {
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

    ensureMeta('description', 'name').content = description;
    ensureMeta('og:title', 'property').content = title;
    ensureMeta('og:description', 'property').content = description;
    ensureMeta('twitter:title', 'name').content = title;
    ensureMeta('twitter:description', 'name').content = description;
  }, [title, description]);
}
