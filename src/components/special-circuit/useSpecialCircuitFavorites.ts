import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getBarFavoritesApi,
  getBarFavoriteCountsApi,
  toggleBarFavoriteApi,
} from '@/lib/platformApi';
import type { EventBar } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { createElement } from 'react';

const PENDING_FAV_KEY = 'baratona:pending-favorite';

/**
 * Encapsulates favorites state + sharing for SpecialCircuitLanding.
 * - server-synced when logged in
 * - tolerates `?favs=id1,id2` shared links (works logged out)
 * - re-applies a pending favorite after Google sign-in
 */
export function useSpecialCircuitFavorites(event: PlatformEvent, bars: EventBar[]) {
  const { user, signInWithGoogle } = usePlatformAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favOrder, setFavOrder] = useState<string[]>([]);
  const [favCounts, setFavCounts] = useState<Record<string, number>>({});
  const sharedFavsApplied = useRef(false);

  const countsQuery = useQuery({
    queryKey: ['bar-fav-counts', event.id],
    queryFn: () => getBarFavoriteCountsApi(event.id),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (countsQuery.data) setFavCounts(countsQuery.data);
  }, [countsQuery.data]);

  // Apply ?favs= once on load
  useEffect(() => {
    if (sharedFavsApplied.current) return;
    const raw = searchParams.get('favs');
    if (!raw) return;
    const validIds = new Set(bars.map((b) => b.id).filter(Boolean) as string[]);
    const ids = raw.split(',').map((s) => s.trim()).filter((id) => validIds.has(id));
    if (ids.length === 0) return;
    sharedFavsApplied.current = true;
    setFavorites((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setFavOrder((prev) => {
      const merged = [...prev];
      ids.forEach((id) => { if (!merged.includes(id)) merged.push(id); });
      return merged;
    });
    track('shared_favorites_opened', { event: event.slug, count: ids.length });
    toast({
      title: `${ids.length} ${ids.length === 1 ? 'bar carregado' : 'bares carregados'} do link`,
      description: user ? 'Marque pra salvar na sua conta.' : 'Faça login pra salvar.',
    });
    const next = new URLSearchParams(searchParams);
    next.delete('favs');
    setSearchParams(next, { replace: true });
  }, [bars, searchParams, setSearchParams, event.slug, toast, user]);

  // Sync server favorites
  useEffect(() => {
    if (!user) return;
    getBarFavoritesApi(event.id, user.id).then((set) => {
      setFavorites((prev) => {
        const merged = new Set(prev);
        set.forEach((id) => merged.add(id));
        return merged;
      });
      setFavOrder((prev) => {
        const merged = [...prev];
        set.forEach((id) => { if (!merged.includes(id)) merged.push(id); });
        return merged;
      });
    });
  }, [event.id, user]);

  // Replay pending favorite after login
  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem(PENDING_FAV_KEY);
    if (!pending) return;
    try {
      const { eventId, barId } = JSON.parse(pending);
      if (eventId === event.id && barId) {
        toggleBarFavoriteApi(event.id, user.id, barId, true)
          .then(() => {
            setFavorites((prev) => new Set(prev).add(barId));
            setFavOrder((prev) => (prev.includes(barId) ? prev : [...prev, barId]));
            toast({ title: 'Bar marcado!', description: 'Adicionado à sua rota.' });
          })
          .catch(() => {})
          .finally(() => localStorage.removeItem(PENDING_FAV_KEY));
      } else {
        localStorage.removeItem(PENDING_FAV_KEY);
      }
    } catch {
      localStorage.removeItem(PENDING_FAV_KEY);
    }
  }, [user, event.id, toast]);

  async function toggleFavorite(barId: string) {
    if (!user) {
      localStorage.setItem(PENDING_FAV_KEY, JSON.stringify({ eventId: event.id, barId }));
      track('favorite_blocked_login', { event: event.slug, bar: barId });
      toast({
        title: 'Faça login para salvar sua rota',
        description: 'Entre com Google e continuamos de onde você parou.',
        action: createElement(Button, { size: 'sm', onClick: () => signInWithGoogle() }, 'Entrar'),
      });
      return;
    }
    const isFav = favorites.has(barId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(barId); else next.add(barId);
      return next;
    });
    setFavOrder((prev) => (isFav ? prev.filter((id) => id !== barId) : [...prev, barId]));
    setFavCounts((prev) => ({ ...prev, [barId]: Math.max(0, (prev[barId] || 0) + (isFav ? -1 : 1)) }));
    track(isFav ? 'bar_unfavorited' : 'bar_favorited', { event: event.slug, bar: barId });
    try {
      await toggleBarFavoriteApi(event.id, user.id, barId, !isFav);
    } catch (e) {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(barId); else next.delete(barId);
        return next;
      });
      setFavCounts((prev) => ({ ...prev, [barId]: Math.max(0, (prev[barId] || 0) + (isFav ? 1 : -1)) }));
      const msg = e instanceof Error ? e.message : 'Tente novamente';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    }
  }

  async function shareFavorites() {
    if (favOrder.length === 0) return;
    const url = `${window.location.origin}/baratona/${event.slug}?favs=${favOrder.join(',')}`;
    const text = `Olha minha rota no ${event.name} (${favOrder.length} ${favOrder.length === 1 ? 'buteco' : 'butecos'})`;
    track('favorites_shared', { event: event.slug, count: favOrder.length });
    try {
      if (navigator.share) {
        await navigator.share({ title: text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copiado!', description: 'Mande pros amigos.' });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copiado!' });
      } catch {
        toast({ title: 'Não foi possível compartilhar', variant: 'destructive' });
      }
    }
  }

  return {
    favorites,
    favOrder,
    setFavOrder,
    favCounts,
    countsQuery,
    toggleFavorite,
    shareFavorites,
  };
}
