import { useEffect, useRef, type ReactNode } from 'react';

interface BaratonaHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  overlayChildren?: ReactNode;
  asH1?: boolean;
  className?: string;
}

export function BaratonaHero({
  title,
  subtitle,
  overlayChildren,
  asH1 = false,
  className = '',
}: BaratonaHeroProps) {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const TitleTag = asH1 ? 'h1' : 'h2';

  return (
    <section
      className={`relative flex flex-col justify-end overflow-hidden bg-background min-h-[85vh] ${className}`}
    >
      {/* Parallax image */}
      <div
        ref={imgRef}
        className="absolute inset-0 will-change-transform"
        style={{ height: '115%', top: '-7.5%' }}
      >
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
        {/* Badge */}
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
          Circuito Comida di Buteco RJ 2026 ativo
        </div>

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
