import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findEventBySlugApi, getEventBarsApi, isEventMemberApi, joinEventApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { EventBaratonaProvider } from '@/contexts/EventBaratonaContext';
import { Header } from '@/components/Header';
import { MainTabs } from '@/components/MainTabs';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SyncIndicator } from '@/components/SyncIndicator';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { QuickAddFAB } from '@/components/QuickAddFAB';
import { useBaratona } from '@/contexts/BaratonaContext';
import NotFound from './NotFound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, Beer } from 'lucide-react';

function EventLiveInner({ event }: { event: PlatformEvent }) {
  const { currentUser, secondsAgo, isRefreshing, refreshAll } = useBaratona();

  // If no currentUser (not a member), show join prompt
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <Beer className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-xl font-bold">{event.name}</h2>
            <p className="text-muted-foreground">
              Você precisa participar deste evento para acessar o modo ao vivo.
            </p>
            <Button asChild>
              <Link to={`/baratona/${event.slug}`}>Ir para a página do evento</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <PullToRefresh onRefresh={refreshAll} className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-lg mx-auto px-4 py-4 pb-24">
          <div className="flex justify-center mb-3">
            <SyncIndicator secondsAgo={secondsAgo} isRefreshing={isRefreshing} />
          </div>
          <MainTabs />
        </main>
      </PullToRefresh>
      <QuickAddFAB />
    </>
  );
}

export default function EventLive() {
  const { slug = '' } = useParams();
  const { user, loading: authLoading } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ev = await findEventBySlugApi(slug);
        setEvent(ev);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading || authLoading) return <div className="p-8 text-center">Carregando...</div>;
  if (!event) return <NotFound />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <LogIn className="w-10 h-10 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Login necessário</h2>
            <p className="text-muted-foreground">Faça login para acessar o modo ao vivo.</p>
            <Button asChild>
              <Link to={`/baratona/${slug}`}>Voltar ao evento</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <EventBaratonaProvider eventId={event.id}>
      <EventLiveInner event={event} />
    </EventBaratonaProvider>
  );
}
