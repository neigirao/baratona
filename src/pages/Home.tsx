import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeo } from '@/hooks/useSeo';
import { Beer, MapPin, Trophy, Users, Star, Zap, ChevronRight, Sparkles, ListChecks } from 'lucide-react';
import { listFeaturedEventsApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { FeaturedEventCard } from '@/components/FeaturedEventCard';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { BaratonaHero } from '@/components/BaratonaHero';
import { PLATFORM_BASE_URL, PLATFORM_OG_IMAGE } from '@/lib/constants';

type FeaturedEvent = PlatformEvent & { barCount: number; memberCount: number };

export default function Home() {
  useSeo(
    'Baratona — Crie sua rota de bares com os amigos',
    'Plataforma para criar baratonas: roteiros de bares com ranking, check-in, votação, mapa e retrospectiva. Gratuita.',
    {
      image: PLATFORM_OG_IMAGE,
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
        description: 'Plataforma para criar e viver baratonas: rotas de bares com check-in, votação e ranking.',
      },
    }
  );

  const { user } = usePlatformAuth();
  const [featured, setFeatured] = useState<FeaturedEvent[] | null>(null);
  useEffect(() => {
    listFeaturedEventsApi(3).then(setFeatured).catch(() => setFeatured([]));
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <BaratonaHero
        title="BARATONA"
        subtitle="Crie sua rota de bares com os amigos. Ranking, votação, check-in, mapa, conquistas e retrospectiva — tudo num app que funciona até com sinal ruim."
        height="xl"
        asH1
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
        <div className="flex justify-center mt-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
            <Beer className="w-4 h-4" />
            Gratuita na v1
          </span>
        </div>
      </section>

      {/* Featured Events */}
      {(featured === null || featured.length > 0) && (
        <section className="container max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between mb-6 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-secondary text-sm font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Em destaque</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos pra você curtir</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link to="/explorar">Ver todos <ChevronRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>

          {featured === null ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((e) => (
                <FeaturedEventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Features */}
      <section className="container max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Tudo que você precisa pra uma <span className="text-primary">baratona épica</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="bg-card/60 border-border/50 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Crie o evento', desc: 'Defina nome, cidade, visibilidade e adicione os bares do roteiro.' },
            { step: '02', title: 'Convide os amigos', desc: 'Compartilhe o link. Público ou privado, você escolhe.' },
            { step: '03', title: 'Curta e acompanhe', desc: 'No dia, todo mundo registra consumo, vota e acompanha em tempo real.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/15 text-secondary font-black text-xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {step}
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold">Pronto pra montar sua rota?</h2>
        <p className="text-muted-foreground">É grátis e leva menos de 2 minutos.</p>
        <div className="flex justify-center gap-3">
          <Button asChild size="lg" className="font-bold px-8">
            <Link to="/criar">Começar agora</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/faq">Ver FAQ</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p style={{ fontFamily: 'Orbitron, sans-serif' }} className="font-bold text-foreground">BARATONA</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/explorar" className="hover:text-foreground transition-colors">Explorar</Link>
            <Link to="/criar" className="hover:text-foreground transition-colors">Criar</Link>
            <Link to="/minhas-baratonas" className="hover:text-foreground transition-colors">Minhas baratonas</Link>
            <Link to="/entrar" className="hover:text-foreground transition-colors">Entrar com código</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
