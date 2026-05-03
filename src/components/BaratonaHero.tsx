import { useEffect, useRef, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlatformEvent } from '@/lib/platformEvents';

interface BaratonaHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  overlayChildren?: ReactNode;
  asH1?: boolean;
  className?: string;
  /**
   * Featured event for the hero badge.
   * null  → still loading (renders skeleton)
   * undefined → no event (badge hidden)
   * object → show badge if eventType === 'special_circuit'
   */
  featuredEvent?: (PlatformEvent & { barCount: number; memberCount: number }) | null;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function BaratonaHero({
  title,
  subtitle,
  overlayChildren,
  asH1 = false,
  className = '',
  featuredEvent,
}: BaratonaHeroProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const reduceMotion = prefersReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const fn = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    };

    // Listen for media query changes at runtime (e.g. user changes OS setting)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMqChange = (e: MediaQueryListEvent) => {
      if (e.matches && imgRef.current) {
        imgRef.current.style.transform = '';
        window.removeEventListener('scroll', fn);
      }
    };
    mq.addEventListener('change', onMqChange);
    window.addEventListener('scroll', fn, { passive: true });

    return () => {
      window.removeEventListener('scroll', fn);
      mq.removeEventListener('change', onMqChange);
    };
  }, [reduceMotion]);

  const TitleTag = asH1 ? 'h1' : 'h2';

  const imgWrapStyle = reduceMotion
    ? { height: '100%', top: '0' }
    : { height: '115%', top: '-7.5%', willChange: 'transform' as const };

  // Badge states
  const badgeLoading = featuredEvent === null;
  const badgeEvent =
    featuredEvent && featuredEvent.eventType === 'special_circuit' ? featuredEvent : null;

  return (
    <section
      className={`relative flex flex-col justify-end overflow-hidden bg-background min-h-[85vh] ${className}`}
    >
      {/* Parallax image — height oversize disabled under prefers-reduced-motion */}
      <div ref={imgRef} className="absolute inset-0" style={imgWrapStyle}>
        <img
          src="/assets/hero-illustration.png"
          alt="Baratona hero"
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
      </div>

      {/* Top gradient */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '33%',
          background: 'linear-gradient(180deg, rgba(10,10,15,0.75) 0%, transparent 100%)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 50%, rgba(10,10,15,0.5) 100%)',
        }}
      />

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '65%',
          background:
            'linear-gradient(0deg, rgba(10,10,15,0.97) 0%, rgba(10,10,15,0.85) 35%, rgba(10,10,15,0.4) 65%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container max-w-5xl mx-auto px-4 pb-10 space-y-5">

        {/* Badge — skeleton while loading, event name when ready */}
        {badgeLoading && (
          <Skeleton className="h-6 w-64 rounded-full" style={{ background: 'rgba(245,166,35,0.12)' }} />
        )}
        {badgeEvent && (
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: 'rgba(245,166,35,0.15)',
              border: '1px solid rgba(245,166,35,0.35)',
              color: '#F5A623',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#F5A623' }}
            />
            {badgeEvent.name} · {badgeEvent.city} ativo
          </div>
        )}

        <TitleTag
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(40px, 6vw, 76px)',
            lineHeight: 1.05,
          }}
          className="text-foreground"
        >
          Monte sua{' '}
          <span className="text-primary">baratona épica</span>
        </TitleTag>

        {subtitle && (
          <p
            className="text-muted-foreground max-w-[460px]"
            style={{ fontSize: 'clamp(15px, 1.8vw, 18px)' }}
          >
            {subtitle}
          </p>
        )}

        {overlayChildren && <div className="w-full">{overlayChildren}</div>}
      </div>
    </section>
  );
}
