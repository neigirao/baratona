import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import NotFound from './NotFound';
import { findEventBySlugApi, getEventBarsApi, type EventBar } from '@/lib/platformApi';
import { EventBaratonaProvider } from '@/contexts/EventBaratonaContext';
import { useBaratona } from '@/contexts/BaratonaContext';
import type { PlatformEvent } from '@/lib/platformEvents';
import { ChevronLeft, Settings, Beer, Users, Radio, MessageSquare, MapPin, Clock, Megaphone, BarChart3 } from 'lucide-react';
import { useEventMembers } from '@/hooks/useEventData';
import { toast } from '@/hooks/use-toast';

function EventAdminInner({ event, slug }: { event: PlatformEvent; slug: string }) {
  const {
    bars, appConfig, updateAppConfig, participants, getCurrentBar, getNextBar,
    currentBarId, getBarVotes,
  } = useBaratona();
  const { members } = useEventMembers(event.id);

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [activeTab, setActiveTab] = useState('status');

  const currentBar = getCurrentBar();
  const nextBar = getNextBar();

  const handleSetCurrentBar = async (barId: string) => {
    await updateAppConfig({ current_bar_id: barId, status: 'at_bar' } as any);
    toast({ title: 'Bar atualizado!' });
  };

  const handleSetTransit = async (originId: string, destId: string) => {
    await updateAppConfig({ status: 'in_transit', origin_bar_id: originId, destination_bar_id: destId } as any);
    toast({ title: 'Van em trânsito!' });
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    await updateAppConfig({ broadcast_msg: broadcastMsg } as any);
    toast({ title: 'Mensagem enviada!' });
    setBroadcastMsg('');
  };

  const handleClearBroadcast = async () => {
    await updateAppConfig({ broadcast_msg: null } as any);
    toast({ title: 'Mensagem removida' });
  };

  const handleFinishEvent = async () => {
    await updateAppConfig({ status: 'finished' } as any);
    toast({ title: 'Evento finalizado!' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/baratona/${slug}`}><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Admin — {event.name}
            </h1>
            <p className="text-xs text-muted-foreground">{event.city} · {event.visibility === 'public' ? 'Público' : 'Privado'}</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="py-3 text-center">
            <Beer className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{bars.length}</p>
            <p className="text-[10px] text-muted-foreground">Bares</p>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <Users className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{members.length}</p>
            <p className="text-[10px] text-muted-foreground">Participantes</p>
          </CardContent></Card>
          <Card><CardContent className="py-3 text-center">
            <Radio className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold capitalize">{appConfig?.status || '—'}</p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </CardContent></Card>
        </div>

        {/* Admin tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Controle</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="bars">Bares</TabsTrigger>
          </TabsList>

          {/* Control tab */}
          <TabsContent value="status" className="space-y-4 mt-4">
            <Card>
              <CardContent className="py-4 space-y-3">
                <h3 className="font-semibold text-sm">Bar Atual</h3>
                <p className="text-sm text-muted-foreground">
                  {currentBar ? `${currentBar.bar_order}. ${currentBar.name}` : 'Nenhum selecionado'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {bars.map((bar) => (
                    <Button
                      key={bar.id}
                      size="sm"
                      variant={bar.id === currentBarId ? 'default' : 'outline'}
                      className="text-xs"
                      onClick={() => handleSetCurrentBar(bar.id as any)}
                    >
                      {bar.bar_order}. {bar.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 space-y-3">
                <h3 className="font-semibold text-sm">Van em Trânsito</h3>
                {currentBar && nextBar && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetTransit(currentBar.id as any, nextBar.id as any)}
                  >
                    🚐 {currentBar.name} → {nextBar.name}
                  </Button>
                )}
                <h3 className="font-semibold text-sm mt-3">Atraso Global</h3>
                <div className="flex gap-2 items-center">
                  <Button size="sm" variant="outline" onClick={() => updateAppConfig({ global_delay_minutes: Math.max(0, (appConfig?.global_delay_minutes || 0) - 5) } as any)}>-5 min</Button>
                  <span className="text-sm font-mono w-16 text-center">{appConfig?.global_delay_minutes || 0} min</span>
                  <Button size="sm" variant="outline" onClick={() => updateAppConfig({ global_delay_minutes: (appConfig?.global_delay_minutes || 0) + 5 } as any)}>+5 min</Button>
                </div>
              </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={handleFinishEvent}>
              Finalizar Evento
            </Button>
          </TabsContent>

          {/* Broadcast tab */}
          <TabsContent value="broadcast" className="space-y-4 mt-4">
            <Card>
              <CardContent className="py-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Mensagem de Broadcast
                </h3>
                {appConfig?.broadcast_msg && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <p className="text-sm">📢 {appConfig.broadcast_msg}</p>
                    <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={handleClearBroadcast}>
                      Remover mensagem
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder="Ex: A van vai sair em 5 minutos!"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleBroadcast} className="w-full">Enviar Broadcast</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bars tab */}
          <TabsContent value="bars" className="space-y-2 mt-4">
            {bars.map((bar) => {
              const barVotes = getBarVotes(bar.id as any);
              const avgScore = barVotes.length > 0
                ? (barVotes.reduce((s: number, v: any) => s + v.drink_score + v.food_score + v.vibe_score + v.service_score, 0) / (barVotes.length * 4)).toFixed(1)
                : '—';
              return (
                <Card key={bar.id} className="bg-card/60">
                  <CardContent className="py-3 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">{bar.bar_order}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{bar.name}</p>
                      <p className="text-xs text-muted-foreground">{bar.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {bar.scheduled_time}</p>
                      <p className="text-xs font-semibold">⭐ {avgScore}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function EventAdmin() {
  const { slug = '' } = useParams();
  const { user, loading } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ev = await findEventBySlugApi(slug);
        setEvent(ev);
      } catch {
        // ignore
      } finally {
        setEventLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading || eventLoading) return <div className="p-8">Carregando...</div>;
  if (!event) return <NotFound />;
  if (!user || event.ownerId !== user.id) {
    return (
      <div className="container max-w-xl mx-auto p-10 space-y-3">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-muted-foreground">Somente o organizador pode acessar esse painel.</p>
        <Button asChild variant="outline"><Link to={`/baratona/${slug}`}>Voltar ao evento</Link></Button>
      </div>
    );
  }

  return (
    <EventBaratonaProvider eventId={event.id}>
      <EventAdminInner event={event} slug={slug} />
    </EventBaratonaProvider>
  );
}
