import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import {
  Beer, MapPin, Trophy, Users, Star, Zap, ArrowRight,
  ListChecks, Settings, ChevronRight, Calendar,
} from 'lucide-react';
import {
  listFeaturedEventsApi, listEventsByOwnerApi, listEventsJoinedByUserApi,
} from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { PLATFORM_BASE_URL, PLATFORM_OG_IMAGE } from '@/lib/constants';
import comidaDiButecoLogo from '@/assets/comida-di-buteco-logo.png';

type FeaturedEvent = PlatformEvent & { barCount: number; memberCount: number };
type MyEvent = PlatformEvent & { barCount: number; memberCount: number; role?: string };

/* ── HERO ─────────────────────────────────────────────────────── */
function Hero() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex items-end overflow-hidden bg-background pb-12 md:pb-24">
      <div ref={imgRef} className="absolute inset-0 z-0 will-change-transform">
        <img
          src="/assets/hero-illustration.png"
          alt="Baratona — festa carioca de butecos"
          className="w-full h-[115%] object-cover object-top block"
          loading="eager"
        />
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-[35%] z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, hsl(var(--background) / 0.75) 0%, transparent 100%)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[65%] z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(0deg, hsl(var(--background) / 0.97) 0%, hsl(var(--background) / 0.85) 35%, hsl(var(--background) / 0.4) 65%, transparent 100%)' }}
      />
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 50%, hsl(var(--background) / 0.5) 100%)' }}
      />

      <div className="relative z-[2] w-full max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between gap-10 flex-wrap">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 bg-primary/15 border border-primary/35 backdrop-blur-sm">
              <span
                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                style={{ boxShadow: '0 0 8px hsl(var(--primary))' }}
              />
              <span className="text-xs font-semibold tracking-wide text-primary">
                Circuito Comida di Buteco RJ 2026 ativo
              </span>
            </div>

            <h1
              className="font-heading font-extrabold text-foreground mb-5"
              style={{
                fontSize: 'clamp(40px, 6vw, 76px)',
                lineHeight: 1.05,
                letterSpacing: '-1px',
                textShadow: '0 2px 20px rgba(0,0,0,0.6)',
              }}
            >
              Monte sua <span className="text-primary">baratona épica</span>
            </h1>

            <p
              className="text-foreground-2 mb-9 max-w-[460px] leading-relaxed"
              style={{
                fontSize: 'clamp(15px, 1.8vw, 18px)',
                textShadow: '0 1px 8px rgba(0,0,0,0.8)',
              }}
            >
              Ranking, check-in e votação com os amigos — em tempo real. Para quem leva buteco a sério.
            </p>

            <div className="flex flex-wrap gap-3 items-center mb-8">
              <Link
                to="/criar"
                className="inline-flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-[15px] font-bold shadow-gold-md hover:-translate-y-0.5 hover:shadow-gold-lg transition-all"
              >
                <Beer className="w-5 h-5" /> Criar minha Baratona
              </Link>
              <Link
                to="/explorar"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 text-foreground px-6 py-3.5 text-[15px] font-medium border border-white/20 backdrop-blur-sm hover:bg-white/[0.18] hover:border-primary/50 transition-colors"
              >
                Explorar baratonas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex">
                {['hsl(33 91% 47%)', 'hsl(36 91% 55%)', 'hsl(42 100% 70%)', 'hsl(33 91% 47%)'].map((c, i) => (
                  <div
                    key={i}
                    className="w-[30px] h-[30px] rounded-full border-2 border-background/80"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${c}, ${c}66)`,
                      marginLeft: i === 0 ? 0 : -8,
                    }}
                  />
                ))}
              </div>
              <p
                className="text-[13px] text-muted-foreground"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
              >
                <span className="text-foreground font-semibold">+2.400 baratoneiros</span> já usam o app
              </p>
            </div>
          </div>

          <div className="hidden xl:block flex-shrink-0">
            <HeroPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPreviewCard() {
  const bars = [
    { name: 'Pavão Azul', bairro: 'Copacabana', score: 9.1, visited: true },
    { name: 'SuraBufe', bairro: 'Lapa', score: 8.7, visited: true },
    { name: 'Rio Top Beer', bairro: 'Flamengo', score: null as number | null, visited: false },
  ];
  return (
    <div
      className="rounded-xl p-6 backdrop-blur-xl"
      style={{
        background: 'hsl(var(--card) / 0.8)',
        border: '1px solid hsl(var(--foreground) / 0.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        width: 320,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-1">Sua baratona</p>
          <p className="text-base font-bold text-foreground">Comida di Buteco RJ</p>
        </div>
        <div className="rounded-md px-2.5 py-1 bg-primary/15 border border-primary/30">
          <span className="text-xs font-bold text-primary">Ativo</span>
        </div>
      </div>
      {bars.map((bar, i) => (
        <div
          key={bar.name}
          className={`flex items-center gap-3 py-2.5 ${i < bars.length - 1 ? 'border-b border-foreground/5' : ''}`}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: bar.visited ? 'hsl(var(--success))' : 'hsl(var(--border-2))',
              boxShadow: bar.visited ? '0 0 8px hsl(var(--success))' : 'none',
            }}
          />
          <div className="flex-1">
            <p
              className="text-[13px] font-semibold"
              style={{ color: bar.visited ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
            >
              {bar.name}
            </p>
            <p className="text-[11px] text-muted-foreground">{bar.bairro}</p>
          </div>
          {bar.score && <span className="text-[13px] font-bold text-primary">★ {bar.score}</span>}
          {!bar.visited && (
            <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full">
              ir
            </span>
          )}
        </div>
      ))}
      <div className="mt-4 rounded-md px-3.5 py-2.5 flex gap-2 items-center bg-success/10 border border-success/15">
        <span className="text-[11px] text-success">✓</span>
        <span className="text-xs text-success/80">2 de 114 bares visitados</span>
      </div>
    </div>
  );
}

/* ── FEATURED EVENT BANNER ────────────────────────────────────── */
function FeaturedEventBanner({ event }: { event: FeaturedEvent }) {
  const isComidaDiButeco =
    event.slug.includes('comida') || event.name.toLowerCase().includes('comida di buteco');
  const coverSrc = isComidaDiButeco ? comidaDiButecoLogo : event.coverImageUrl;

  const dateLabel = (() => {
    const fmt = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    if (event.startDate && event.endDate) return `${fmt(event.startDate)} – ${fmt(event.endDate)}`;
    if (event.startDate) return fmt(event.startDate);
    if (event.eventDate) return fmt(event.eventDate);
    return null;
  })();

  return (
    <Link
      to={`/baratona/${event.slug}`}
      className="group block rounded-xl overflow-hidden border border-primary/20 transition-all hover:-translate-y-1 hover:shadow-gold-md"
      style={{
        background: 'linear-gradient(135deg, #1C1000 0%, #2A1800 50%, #1A0A00 100%)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
      }}
    >
      <div
        className="w-1"
        style={{ background: 'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary-dark)))' }}
      />
      <div className="p-6 sm:p-8 lg:p-10 flex gap-5 sm:gap-8 lg:gap-12 items-center flex-wrap">
        <div
          className="rounded-xl flex-shrink-0 flex items-center justify-center p-2 overflow-hidden border border-primary/20"
          style={{
            width: 'clamp(100px, 13vw, 130px)',
            height: 'clamp(100px, 13vw, 130px)',
            background: 'linear-gradient(135deg, #2a1800, #4a2c00)',
          }}
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={event.name}
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
            />
          ) : (
            <Beer className="w-12 h-12 text-primary/60" />
          )}
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="text-[11px] font-bold tracking-wide text-primary bg-primary/15 px-2.5 py-0.5 rounded-full">
              {event.eventType === 'special_circuit' ? 'Circuito Especial' : 'Baratona'}
            </span>
            <span className="text-[11px] font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full">
              ● Ativo
            </span>
          </div>
          <h3
            className="font-heading font-extrabold text-foreground mb-2"
            style={{ fontSize: 'clamp(20px, 2.5vw, 28px)' }}
          >
            {event.name}
          </h3>
          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-[400px] line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex gap-5 flex-wrap text-[13px] text-muted-foreground">
            {event.barCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Beer className="w-3.5 h-3.5" /> {event.barCount} bares
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {event.city}
            </span>
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {dateLabel}
              </span>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 text-sm font-bold whitespace-nowrap flex-shrink-0 group-hover:opacity-85 transition-opacity">
          Ver evento <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

/* ── FEATURES ─────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Zap, title: 'Consumo em tempo real', desc: 'Acompanhe bebidas e comidas por bar, com ranking de quem mandou mais.' },
  { icon: Star, title: 'Votação e ranking', desc: 'Avalie cada bar em bebida, comida, ambiente e atendimento.' },
  { icon: MapPin, title: 'Mapa e navegação', desc: 'Veja todos os bares no mapa e abra no Google Maps com 1 toque.' },
  { icon: Users, title: 'Check-in por bar', desc: 'Registre presença. Quem visitar mais bares ganha o galão.' },
  { icon: Trophy, title: 'Conquistas e Wrapped', desc: 'Desbloqueie conquistas e receba um resumo tipo Spotify Wrapped.' },
  { icon: Zap, title: 'Admin em tempo real', desc: 'Painel do organizador com controle de status, broadcast e retrospectiva.' },
];

function Features() {
  return (
    <section
      className="py-16 md:py-24 px-5 sm:px-8 lg:px-16"
      style={{ background: 'linear-gradient(180deg, transparent, hsl(var(--primary) / 0.03) 50%, transparent)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-[11px] tracking-widest uppercase text-primary mb-3">O que você ganha</p>
          <h2
            className="font-heading font-extrabold text-foreground"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1 }}
          >
            Tudo que você precisa pra uma <span className="text-primary">baratona épica</span>
          </h2>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl p-6 bg-card border border-border transition-all hover:border-primary/25 hover:-translate-y-1"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ─────────────────────────────────────────────── */
const STEPS = [
  { num: '01', title: 'Crie o evento', desc: 'Defina nome, cidade, visibilidade e adicione os bares do rolê.' },
  { num: '02', title: 'Convide os amigos', desc: 'Compartilhe o link. Público ou privada, você escolhe.' },
  { num: '03', title: 'Curta e acompanhe', desc: 'No dia, todo mundo registra consumo, vota e acompanha em tempo real.' },
];

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-16 md:py-24 px-5 sm:px-8 lg:px-16 bg-background-2 border-y border-border"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-widest uppercase text-primary mb-3">Simples assim</p>
          <h2
            className="font-heading font-extrabold text-foreground"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
          >
            Como funciona
          </h2>
        </div>

        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {STEPS.map((s) => (
            <div key={s.num} className="text-center">
              <div
                className="w-[72px] h-[72px] rounded-full mx-auto mb-6 flex items-center justify-center border border-primary/25"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))' }}
              >
                <span className="font-heading font-extrabold text-primary text-2xl">{s.num}</span>
              </div>
              <h3 className="font-heading font-bold text-foreground text-xl mb-3">{s.title}</h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FINAL CTA ────────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="py-20 md:py-28 px-5 text-center relative overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
        style={{
          width: 600,
          height: 400,
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-[600px] mx-auto relative z-[1]">
        <h2
          className="font-heading font-extrabold text-foreground mb-4"
          style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
        >
          Pronto pra montar sua rota?
        </h2>
        <p className="text-[17px] text-muted-foreground mb-10">
          É grátis e leva menos de 2 minutos.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/criar"
            className="inline-flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground px-8 py-4 text-base font-bold shadow-gold-md hover:-translate-y-0.5 hover:shadow-gold-lg transition-all"
          >
            <Beer className="w-5 h-5" /> Começar agora
          </Link>
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 rounded-full bg-transparent text-muted-foreground px-7 py-4 text-[15px] font-medium border border-border hover:text-foreground hover:border-border-2 transition-colors"
          >
            Ver FAQ
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── FOOTER ───────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    {
      title: 'Produto',
      links: [
        { label: 'Explorar baratonas', to: '/explorar' },
        { label: 'Criar baratona', to: '/criar' },
        { label: 'Minhas baratonas', to: '/minhas-baratonas' },
        { label: 'Entrar com código', to: '/entrar' },
      ],
    },
    {
      title: 'Suporte',
      links: [{ label: 'FAQ', to: '/faq' }],
    },
  ];
  return (
    <footer className="bg-background border-t border-border px-5 sm:px-8 lg:px-16 pt-12 md:pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid gap-12 mb-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <div
              className="font-display text-primary mb-3"
              style={{ fontSize: 28, letterSpacing: 3 }}
            >
              BARATONA
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[220px]">
              Crie e viva baratonas e circuitos de butecos com os amigos.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold text-primary tracking-wide uppercase mb-4">
                {col.title}
              </p>
              <div className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex justify-between items-center flex-wrap gap-3">
          <p className="text-[13px] text-muted-foreground/60">
            © 2026 Baratona. Feito para butequeiros de verdade.
          </p>
          <p className="text-[13px] text-muted-foreground/60">
            🍺 Beba com responsabilidade
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── PAGE ─────────────────────────────────────────────────────── */
export default function Home() {
  useSeo(
    'Baratona — Monte sua rota de bares com os amigos',
    'Crie sua baratona: roteiro de bares com check-in, ranking, votação, mapa ao vivo e retrospectiva. Grátis para criar.',
    {
      image: PLATFORM_OG_IMAGE,
      imageAlt: 'Baratona 2026 — Monte sua baratona épica no Rio de Janeiro',
      imageWidth: 3168,
      imageHeight: 1344,
      url: `${PLATFORM_BASE_URL}/`,
      type: 'website',
      locale: 'pt_BR',
      keywords: 'baratona, rota de bares, butecos, app de bar, check-in, votação de bar, comida di boteco',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Baratona',
        url: `${PLATFORM_BASE_URL}/`,
        logo: PLATFORM_OG_IMAGE,
        description:
          'Plataforma para criar e viver baratonas: rotas de bares com check-in, votação e ranking.',
      },
    }
  );

  const { user } = usePlatformAuth();
  const [featured, setFeatured] = useState<FeaturedEvent[] | null>(null);
  const [myEvents, setMyEvents] = useState<MyEvent[] | null>(null);

  useEffect(() => {
    listFeaturedEventsApi(3)
      .then(setFeatured)
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setMyEvents(null);
      return;
    }
    Promise.all([
      listEventsByOwnerApi(user.id),
      listEventsJoinedByUserApi(user.id),
    ])
      .then(([owned, joined]) => {
        const seen = new Set<string>();
        const merged: MyEvent[] = [];
        for (const e of [...owned, ...joined]) {
          if (!seen.has(e.id)) {
            seen.add(e.id);
            merged.push(e);
          }
        }
        merged.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMyEvents(merged.slice(0, 4));
      })
      .catch(() => setMyEvents([]));
  }, [user]);

  const features = [
    {
      icon: Beer,
      title: 'Consumo em tempo real',
      desc: 'Contador de bebidas e comidas por bar, com ranking de quem mandou mais.',
    },
    {
      icon: Trophy,
      title: 'Votação e ranking',
      desc: 'Avalie cada bar em bebida, comida, ambiente e atendimento. O melhor bar ganha.',
    },
    {
      icon: MapPin,
      title: 'Mapa e navegação',
      desc: 'Veja todos os bares no mapa, rota completa e abra no Google Maps com 1 toque.',
    },
    {
      icon: Users,
      title: 'Check-in por bar',
      desc: 'Registre presença em cada bar. Quem visitou mais bares ganha o selo de fidelidade.',
    },
    {
      icon: Star,
      title: 'Conquistas e Wrapped',
      desc: 'Desbloqueie conquistas durante o evento e receba um resumo tipo Spotify Wrapped.',
    },
    {
      icon: Zap,
      title: 'Admin em tempo real',
      desc: 'Painel do organizador com controle de status, broadcast e retrospectiva completa.',
    },
  ];

  // featured === null → loading; first special_circuit event becomes the hero badge
  const heroBadgeEvent = featured === null
    ? null
    : (featured.find((e) => e.eventType === 'special_circuit') ?? undefined);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <BaratonaHero
        title="BARATONA"
        subtitle="Crie sua rota de bares com os amigos. Ranking, votação, check-in, mapa, conquistas e retrospectiva — tudo num app que funciona até com sinal ruim."
        height="xl"
        asH1
        featuredEvent={heroBadgeEvent}
      />
      <section className="container max-w-5xl mx-auto px-4 -mt-6 pb-10 relative z-10">
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild size="lg" className="text-base font-bold px-8 shadow-lg shadow-primary/30">
            <Link to="/criar">
              Criar minha Baratona
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base border-muted-foreground/30">
            <Link to="/explorar">Explorar baratonas</Link>
          </Button>
          {user && (
            <Button asChild variant="ghost" size="lg" className="text-base">
              <Link to="/minhas-baratonas">
                <ListChecks className="w-5 h-5 mr-1" /> Minhas baratonas
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Personalized section for logged-in users */}
      {user && (myEvents === null || myEvents.length > 0) && (
        <section className="container max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-4 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-1">
                <Clock className="w-4 h-4" />
                <span>Suas baratonas</span>
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Hero />

      {user && myEvents && myEvents.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 py-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-2">
                  <span className="w-5 h-px bg-primary inline-block" />
                  Suas baratonas
                </p>
                <h2 className="font-heading font-extrabold text-foreground text-xl">
                  Continue de onde parou
                </h2>
              </div>
              <Link
                to="/minhas-baratonas"
                className="text-sm text-primary inline-flex items-center gap-1.5 font-medium hover:opacity-80"
              >
                <ListChecks className="w-4 h-4" /> Ver todas
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {myEvents.map((e) => (
                <Link
                  key={e.id}
                  to={`/baratona/${e.slug}`}
                  className="block rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate text-foreground">{e.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.city}</p>
                    </div>
                    {e.ownerId === user.id && (
                      <Settings className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        e.status === 'live'
                          ? 'bg-success/20 text-success'
                          : e.status === 'finished'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {e.status === 'live'
                        ? '● Ao vivo'
                        : e.status === 'finished'
                        ? 'Finalizado'
                        : e.status === 'draft'
                        ? 'Rascunho'
                        : 'Publicado'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{e.barCount} bares</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featured !== null && featured.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-2">
                  <span className="w-5 h-px bg-primary inline-block" />
                  Em destaque
                </p>
                <h2
                  className="font-heading font-extrabold text-foreground"
                  style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}
                >
                  Eventos pra você curtir
                </h2>
              </div>
              <Link
                to="/explorar"
                className="text-sm text-primary inline-flex items-center gap-1.5 font-medium hover:opacity-80"
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {featured.map((e) => (
                <FeaturedEventBanner key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Features />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </div>
  );
}
