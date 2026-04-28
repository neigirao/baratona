import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck } from 'lucide-react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import {
  adminListAllEventsApi, adminListPlatformRolesApi,
  type PlatformRoleRow,
} from '@/lib/api';
import type { PlatformEvent } from '@/lib/platformEvents';
import { toast } from '@/hooks/use-toast';
import { EventsPanel } from '@/components/admin/EventsPanel';
import { RolesPanel } from '@/components/admin/RolesPanel';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

export default function PlatformAdmin() {
  const { isSuperAdmin, loading } = usePlatformAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [roles, setRoles] = useState<PlatformRoleRow[]>([]);
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

  useEffect(() => {
    if (!isSuperAdmin) return;
    refreshEvents();
    refreshRoles();
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
      <Header />
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

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
            <TabsTrigger value="roles">Papéis ({roles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4">
            <EventsPanel events={events} loading={eventsLoading} onChanged={refreshEvents} />
          </TabsContent>

          <TabsContent value="roles" className="mt-4">
            <RolesPanel roles={roles} onChanged={refreshRoles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
