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
  imageUrl?: string | null;
  height?: HeroHeight;
  /** Renders inside the centered overlay, below title/subtitle. */
  overlayChildren?: ReactNode;
  /** When true, title is rendered as h1 (use for landing/page heroes). */
  asH1?: boolean;
  className?: string;
}

/**
 * Unified hero banner — preserves the iconic "Nei" look:
 * background image at 60% opacity, descending black gradient,
 * Orbitron title with the yellow gradient.
 *
 * Falls back to the original Baratona banner when no image is provided.
 */
export function BaratonaHero({
  title,
  subtitle,
  imageUrl,
  height = 'md',
  overlayChildren,
  asH1 = false,
  className = '',
}: BaratonaHeroProps) {
  const bg = imageUrl || baratonaBanner;
  const TitleTag = asH1 ? 'h1' : 'div';

  return (
    <div className={`relative w-full overflow-hidden ${heightClasses[height]} ${className}`}>
      <img
        src={bg}
        alt={title}
        className="w-full h-full object-cover opacity-60"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <TitleTag
          className="font-display font-black text-gradient-yellow text-3xl sm:text-5xl md:text-6xl tracking-tight"
        >
          {title}
        </TitleTag>
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
