import { ReactNode } from 'react';
import baratonaBanner from '@/assets/baratona-banner.jpeg';

type HeroHeight = 'sm' | 'md' | 'lg' | 'xl';

const heightClasses: Record<HeroHeight, string> = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64 sm:h-80',
  xl: 'h-72 sm:h-96',
};

interface BaratonaHeroProps {
  title: string;
  subtitle?: string;
  /** Background photo. If it looks like a logo (URL contains "logo"), it is auto-promoted to logoUrl. */
  imageUrl?: string | null;
  /** Explicit logo (transparent PNG / SVG). When set, replaces the Orbitron title and is rendered contained, no opacity. */
  logoUrl?: string | null;
  height?: HeroHeight;
  /** Renders inside the centered overlay, below title/subtitle. */
  overlayChildren?: ReactNode;
  /** When true, title is rendered as h1 (use for landing/page heroes). */
  asH1?: boolean;
  className?: string;
}

const looksLikeLogo = (url?: string | null) => !!url && /logo/i.test(url);

/**
 * Unified hero banner — preserves the iconic "Nei" look:
 * background image at 60% opacity, descending black gradient,
 * Orbitron title with the yellow gradient.
 *
 * When a logo is provided (or auto-detected from a URL containing "logo"),
 * the logo replaces the title and the background falls back to a subtle gradient
 * so the brand mark isn't darkened or stretched.
 */
export function BaratonaHero({
  title,
  subtitle,
  imageUrl,
  logoUrl,
  height = 'md',
  overlayChildren,
  asH1 = false,
  className = '',
}: BaratonaHeroProps) {
  // Auto-promote: if the cover URL looks like a logo, treat it as one.
  const resolvedLogo = logoUrl || (looksLikeLogo(imageUrl) ? imageUrl : null);
  const resolvedImage = resolvedLogo ? null : (imageUrl || baratonaBanner);
  const TitleTag = asH1 ? 'h1' : 'div';

  return (
    <div className={`relative w-full overflow-hidden ${heightClasses[height]} ${className}`}>
      {resolvedImage && (
        <>
          <img
            src={resolvedImage}
            alt={title}
            className="w-full h-full object-cover opacity-60"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </>
      )}
      {!resolvedImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-background" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        {resolvedLogo ? (
          <>
            <img
              src={resolvedLogo}
              alt={title}
              className="max-h-24 sm:max-h-32 w-auto object-contain"
              loading="eager"
            />
            {asH1 && <h1 className="sr-only">{title}</h1>}
          </>
        ) : (
          <TitleTag
            className="font-display font-black text-gradient-yellow text-3xl sm:text-5xl md:text-6xl tracking-tight"
          >
            {title}
          </TitleTag>
        )}
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 max-w-2xl">
            {subtitle}
          </p>
        )}
        {overlayChildren && <div className="mt-4 w-full">{overlayChildren}</div>}
      </div>
    </div>
  );
}
