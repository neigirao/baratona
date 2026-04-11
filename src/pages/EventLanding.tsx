import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSeo } from '@/hooks/useSeo';
import NotFound from './NotFound';
import { findEventBySlugApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';

export default function EventLanding() {
  const { slug = '' } = useParams();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    findEventBySlugApi(slug)
      .then(setEvent)
      .catch(() => setError('Erro ao carregar evento.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useSeo(
    event ? `${event.name} | Baratona` : 'Baratona não encontrada',
    event?.description || 'Baratona na plataforma Baratona'
  );

  if (slug === 'nei') return <Navigate to="/nei" replace />;
  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!event) return <NotFound />;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-3xl font-bold">{event.name}</h1>
      <p className="text-muted-foreground">{event.description}</p>
      <Card>
        <CardContent className="pt-6 space-y-2 text-sm">
          <p><strong>Cidade:</strong> {event.city}</p>
          <p><strong>Visibilidade:</strong> {event.visibility === 'public' ? 'Pública' : 'Privada'}</p>
          <p><strong>Organizador:</strong> {event.ownerName}</p>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button asChild><Link to={`/baratona/${event.slug}/admin`}>Painel do evento</Link></Button>
        <Button variant="outline" asChild><Link to="/explorar">Voltar para explorar</Link></Button>
      </div>
    </div>
  );
}
