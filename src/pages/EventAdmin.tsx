import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import Admin from './Admin';
import NotFound from './NotFound';
import { findEventBySlugApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';

export default function EventAdmin() {
  const { slug = '' } = useParams();
  const { user, loading } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    findEventBySlugApi(slug)
      .then(setEvent)
      .catch(() => setError('Erro ao carregar evento.'))
      .finally(() => setEventLoading(false));
  }, [slug]);

  if (loading || eventLoading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!event) return <NotFound />;
  if (!user || event.ownerId !== user.id) {
    return (
      <div className="container max-w-xl mx-auto p-10">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-muted-foreground">Somente o organizador pode acessar esse painel.</p>
      </div>
    );
  }

  return <Admin />;
}
