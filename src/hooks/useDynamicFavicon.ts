import { useEffect } from 'react';

/**
 * Substitui temporariamente o favicon (`<link rel="icon">`) enquanto o
 * componente está montado. Restaura o href original no cleanup.
 *
 * Passe `null` para não fazer nada (mantém o favicon padrão).
 */
export function useDynamicFavicon(href: string | null) {
  useEffect(() => {
    if (!href) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    let created = false;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
      created = true;
    }

    const previousHref = link.href;
    const previousType = link.type;
    link.href = href;
    if (href.endsWith('.png')) link.type = 'image/png';
    else if (href.endsWith('.svg')) link.type = 'image/svg+xml';

    return () => {
      if (created && link?.parentNode) {
        link.parentNode.removeChild(link);
      } else if (link) {
        link.href = previousHref;
        link.type = previousType;
      }
    };
  }, [href]);
}
