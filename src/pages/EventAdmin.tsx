import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotFound from './NotFound';
import { findEventBySlugApi } from '@/lib/platformApi';
import { EventBaratonaProvider } from '@/contexts/EventBaratonaContext';
import { useBaratona } from '@/contexts/BaratonaContext';
import type { PlatformEvent } from '@/lib/platformEvents';
import { ChevronLeft, Settings, Beer, Users, Radio, Megaphone, Download, Loader2, Info, BarChart3, PartyPopper } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEventMembers } from '@/hooks/useEventData';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EventRetrospective } from '@/components/EventRetrospective';
import { FEATURED_EVENT_SLUG } from '@/lib/constants';
import { EventWrapped } from '@/components/EventWrapped';
import { EventInfoEditor } from '@/components/admin/EventInfoEditor';
import { EventBarsEditor } from '@/components/admin/EventBarsEditor';
import { StatusTab } from '@/components/admin/StatusTab';
import { BroadcastTab } from '@/components/admin/BroadcastTab';
import { InvitesPanel } from '@/components/admin/InvitesPanel';

type EventConfigPatch = {
  current_bar_id?: string | null;
  status?: string;
  origin_bar_id?: string | null;
  destination_bar_id?: string | null;
  broadcast_msg?: string | null;
  global_delay_minutes?: number;
};

function EventAdminInner({ event, slug, isSuperAdmin }: { event: PlatformEvent; slug: string; isSuperAdmin: boolean }) {
  const {
    bars, appConfig, updateAppConfig, getCurrentBar, getNextBar, currentBarId,
  } = useBaratona();
  const { members } = useEventMembers(event.id);

  const [activeTab, setActiveTab] = useState('status');
  const [scraping, setScraping] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);

  const isCircuit = event.eventType === 'special_circuit';
  const isComidaDiButeco = event.slug === FEATURED_EVENT_SLUG;
  const isPrivate = event.visibility === 'private';

  const updateConfig = updateAppConfig as unknown as (p: EventConfigPatch) => Promise<boolean>;

  const currentBar = getCurrentBar();
  const nextBar = getNextBar();

  const handleSetCurrentBar = async (barId: string) => {
    await updateConfig({ current_bar_id: barId, status: 'at_bar' });
    toast({ title: 'Bar atualizado!' });
  };

  const handleSetTransit = async (originId: string, destId: string) => {
    await updateConfig({ status: 'in_transit', origin_bar_id: originId, destination_bar_id: destId });
    toast({ title: 'Van em trânsito!' });
  };

  const handleFinishEvent = async () => {
    await updateConfig({ status: 'finished' });
    toast({ title: 'Evento finalizado!' });
    setShowFinishDialog(false);
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
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('bars')}>
            <CardContent className="py-3 text-center">
              <Beer className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{bars.length}</p>
              <p className="text-[10px] text-muted-foreground">Bares</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('retro')}>
            <CardContent className="py-3 text-center">
              <Users className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{members.length}</p>
              <p className="text-[10px] text-muted-foreground">Participantes</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setActiveTab('status')}>
            <CardContent className="py-3 text-center">
              <Radio className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold capitalize">{appConfig?.status ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* CDB scraper */}
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

        {/* Invites — private events only */}
        {isPrivate && <InvitesPanel eventId={event.id} eventSlug={event.slug} />}

        {/* Admin tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="info" className="flex flex-col gap-0.5 py-1.5" aria-label="Info">
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Info</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex flex-col gap-0.5 py-1.5" aria-label="Controle">
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Controle</span>
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex flex-col gap-0.5 py-1.5" aria-label="Avisos">
              <Megaphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Avisos</span>
            </TabsTrigger>
            <TabsTrigger value="bars" className="flex flex-col gap-0.5 py-1.5" aria-label={isCircuit ? 'Butecos' : 'Bares'}>
              <Beer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">{isCircuit ? 'Butecos' : 'Bares'}</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="flex flex-col gap-0.5 py-1.5" aria-label="Retro">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Retro</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {bars.length === 0 && (
              <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-sm">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-primary">Comece aqui →</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Adicione os bares do roteiro na aba <strong>Bares</strong> e depois vá para <strong>Controle</strong> para iniciar o evento.
                  </p>
                </div>
              </div>
            )}
            <EventInfoEditor event={event} isSuperAdmin={isSuperAdmin} />
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            <StatusTab
              bars={bars}
              appConfig={appConfig}
              currentBar={currentBar}
              nextBar={nextBar}
              currentBarId={currentBarId}
              isCircuit={isCircuit}
              onSetCurrentBar={handleSetCurrentBar}
              onSetTransit={handleSetTransit}
              onUpdateConfig={(patch) => updateConfig(patch as EventConfigPatch)}
              onFinish={() => setShowFinishDialog(true)}
            />
          </TabsContent>

          <TabsContent value="broadcast" className="mt-4">
            <BroadcastTab
              broadcastMsg={appConfig?.broadcast_msg}
              onUpdateConfig={updateConfig}
            />
          </TabsContent>

          <TabsContent value="bars" className="space-y-2 mt-4">
            <EventBarsEditor eventId={event.id} />
          </TabsContent>

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

      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso encerrará o evento para todos os participantes. Você ainda poderá ver a retrospectiva, mas não será possível registrar novos consumos ou votos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleFinishEvent}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EventAdmin() {
  const { slug = '' } = useParams();
  const { user, loading } = usePlatformAuth();
  const { isSuperAdmin, loading: adminLoading } = usePlatformAdmin();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => findEventBySlugApi(slug),
    enabled: !!slug,
    retry: false,
  });

  if (loading || eventLoading || adminLoading) return <div className="p-8">Carregando...</div>;
  if (!event) return <NotFound />;

  const canEdit = !!user && (event.ownerId === user.id || isSuperAdmin || user.email === 'neigirao@gmail.com');
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
      <EventAdminInner event={event} slug={slug} isSuperAdmin={isSuperAdmin} />
    </EventBaratonaProvider>
  );
}
