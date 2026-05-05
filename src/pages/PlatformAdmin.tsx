import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck } from 'lucide-react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import {
  adminListAllEventsApi, adminListPlatformRolesApi, adminGetPlatformStatsApi,
  type PlatformRoleRow, type PlatformStats,
} from '@/lib/api';
import type { PlatformEvent } from '@/lib/platformEvents';
import { toast } from '@/hooks/use-toast';
import { EventsPanel } from '@/components/admin/EventsPanel';
import { RolesPanel } from '@/components/admin/RolesPanel';
import { StatsPanel } from '@/components/admin/StatsPanel';
import { ActivityPanel } from '@/components/admin/ActivityPanel';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { AlertsPanel } from '@/components/admin/AlertsPanel';
import { UsersPanel } from '@/components/admin/UsersPanel';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

export default function PlatformAdmin() {
  const { isSuperAdmin, loading } = usePlatformAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [roles, setRoles] = useState<PlatformRoleRow[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);

  const refreshEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await adminListAllEventsApi();
      setEvents(data);
    } catch {
      toast({ title: 'Erro ao listar eventos', variant: 'destructive' });
    } finally {
      setEventsLoading(false);
    }
  };

  const refreshRoles = async () => {
    try {
      setRoles(await adminListPlatformRolesApi());
    } catch {
      // ignore
    }
  };

  const refreshStats = async () => {
    setStatsError(false);
    try {
      setStats(await adminGetPlatformStatsApi());
    } catch {
      setStatsError(true);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    refreshEvents();
    refreshRoles();
    refreshStats();
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin da plataforma</h1>
            <p className="text-sm text-muted-foreground">
              Gestão global de baratonas, circuitos e papéis.
            </p>
          </div>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="stats" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Atividade</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">Relatórios</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs sm:text-sm">Alertas</TabsTrigger>
            <TabsTrigger value="events" className="text-xs sm:text-sm">Eventos ({events.length})</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Usuários</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs sm:text-sm">Papéis ({roles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4">
            {stats ? (
              <StatsPanel stats={stats} />
            ) : statsError ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-sm text-muted-foreground">Erro ao carregar estatísticas.</p>
                <button onClick={refreshStats} className="text-xs text-primary underline underline-offset-2">
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityPanel events={events} />
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            {stats ? (
              <ReportsPanel events={events} stats={stats} />
            ) : statsError ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                Estatísticas indisponíveis — recarregue a aba Visão Geral.
              </p>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <AlertsPanel events={events} />
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <EventsPanel events={events} loading={eventsLoading} onChanged={refreshEvents} />
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <UsersPanel />
          </TabsContent>

          <TabsContent value="roles" className="mt-4">
            <RolesPanel roles={roles} onChanged={refreshRoles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
