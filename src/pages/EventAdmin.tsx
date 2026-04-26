import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
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
import { ChevronLeft, Settings, Beer, Users, Radio, Megaphone, Clock, Download, Loader2, KeyRound, Copy, Trash2, PartyPopper, Info, Pencil, BarChart3 } from 'lucide-react';
import { useEventMembers } from '@/hooks/useEventData';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createInviteApi, listInvitesApi, deleteInviteApi, type EventInvite } from '@/lib/platformApi';
import { EventRetrospective } from '@/components/EventRetrospective';
import { EventWrapped } from '@/components/EventWrapped';
import { EventInfoEditor } from '@/components/admin/EventInfoEditor';
import { EventBarsEditor } from '@/components/admin/EventBarsEditor';

function EventAdminInner({ event, slug }: { event: PlatformEvent; slug: string }) {
  const {
    bars, appConfig, updateAppConfig, participants, getCurrentBar, getNextBar,
    currentBarId, getBarVotes,
  } = useBaratona();
  const { members } = useEventMembers(event.id);

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [activeTab, setActiveTab] = useState('status');
  const [scraping, setScraping] = useState(false);
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const isCircuit = event.eventType === 'special_circuit';
  const isComidaDiButeco = event.slug === 'comida-di-buteco-rj-2026';
  const isPrivate = event.visibility === 'private';

  useEffect(() => {
    if (isPrivate) {
      listInvitesApi(event.id).then(setInvites).catch(() => setInvites([]));
    }
  }, [event.id, isPrivate]);

  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try {
      const inv = await createInviteApi(event.id, { maxUses: 50 });
      setInvites((prev) => [inv, ...prev]);
      toast({ title: `Código gerado: ${inv.code}` });
    } catch {
      toast({ title: 'Erro ao gerar código', variant: 'destructive' });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInvite = (code: string) => {
    const url = `${window.location.origin}/baratona/${event.slug}?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!' });
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await deleteInviteApi(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast({ title: 'Código revogado' });
    } catch {
      toast({ title: 'Erro ao revogar', variant: 'destructive' });
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-comida-di-boteco', {
        body: { slug: event.slug },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha no scrape');
      toast({ title: `Scrape concluído: ${data.count} butecos importados` });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erro no scrape', description: msg, variant: 'destructive' });
    } finally {
      setScraping(false);
    }
  };

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

        {isComidaDiButeco && (
          <Card className="border-secondary/40 bg-secondary/5">
            <CardContent className="py-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-secondary" /> Importar do site oficial
              </h3>
              <p className="text-xs text-muted-foreground">
                Sincroniza a lista de butecos a partir de comidadibuteco.com.br (idempotente).
              </p>
              <Button onClick={handleScrape} disabled={scraping} size="sm" variant="secondary" className="w-full">
                {scraping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</> : 'Importar / Atualizar butecos'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isPrivate && (
          <Card className="border-primary/30">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" /> Convites
                </h3>
                <Button onClick={handleCreateInvite} disabled={creatingInvite} size="sm" variant="outline">
                  {creatingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gerar código'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe o link para que pessoas entrem no evento privado.
              </p>
              {invites.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum código ainda.</p>
              ) : (
                <div className="space-y-2">
                  {invites.map((inv) => {
                    const exhausted = inv.maxUses != null && inv.usedCount >= inv.maxUses;
                    return (
                      <div key={inv.id} className="flex items-center gap-2 bg-muted/40 rounded-md p-2">
                        <code className="font-mono font-bold text-base tracking-wider flex-1">{inv.code}</code>
                        <span className={`text-[10px] ${exhausted ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {inv.usedCount}/{inv.maxUses ?? '∞'}
                        </span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyInvite(inv.code)} title="Copiar link">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteInvite(inv.id)} title="Revogar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info"><Info className="w-3.5 h-3.5" /></TabsTrigger>
            <TabsTrigger value="status">Controle</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="bars">{isCircuit ? 'Butecos' : 'Bares'}</TabsTrigger>
            <TabsTrigger value="retro"><BarChart3 className="w-3.5 h-3.5" /></TabsTrigger>
          </TabsList>

          {/* Info tab — edit metadata */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <EventInfoEditor event={event} isSuperAdmin={false} />
          </TabsContent>

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

            {!isCircuit && (
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
            )}

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

          {/* Bars tab — full CRUD editor */}
          <TabsContent value="bars" className="space-y-2 mt-4">
            <EventBarsEditor eventId={event.id} />
          </TabsContent>

          {/* Retrospective tab */}
          <TabsContent value="retro" className="space-y-3 mt-4">
            <Button onClick={() => setShowWrapped(true)} variant="secondary" className="w-full">
              <PartyPopper className="w-4 h-4 mr-2" /> Abrir Wrapped do evento
            </Button>
            <EventRetrospective isCircuit={isCircuit} />
          </TabsContent>
        </Tabs>
      </div>

      {showWrapped && (
        <EventWrapped
          eventName={event.name}
          isCircuit={isCircuit}
          onClose={() => setShowWrapped(false)}
        />
      )}
    </div>
  );
}

export default function EventAdmin() {
  const { slug = '' } = useParams();
  const { user, loading } = usePlatformAuth();
  const { isSuperAdmin, loading: adminLoading } = usePlatformAdmin();
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

  if (loading || eventLoading || adminLoading) return <div className="p-8">Carregando...</div>;
  if (!event) return <NotFound />;
  const canEdit = !!user && (event.ownerId === user.id || isSuperAdmin);
  if (!canEdit) {
    return (
      <div className="container max-w-xl mx-auto p-10 space-y-3">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-muted-foreground">Somente o organizador (ou super-admin) pode acessar esse painel.</p>
        <Button asChild variant="outline"><Link to={`/baratona/${slug}`}>Voltar ao evento</Link></Button>
      </div>
    );
  }

  return (
    <EventBaratonaProvider eventId={event.id} eventType={event.eventType}>
      <EventAdminInner event={event} slug={slug} />
    </EventBaratonaProvider>
  );
}
