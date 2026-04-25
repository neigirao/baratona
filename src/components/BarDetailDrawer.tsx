import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Phone,
  Instagram,
  Star,
  Bookmark,
  Users,
  Clock,
  Utensils,
  ImageOff,
} from 'lucide-react';
import type { EventBar, DishRating } from '@/lib/platformApi';
import { track } from '@/lib/analytics';

interface Props {
  bar: EventBar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating?: DishRating;
  favoriteCount?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (barId: string) => void;
  eventSlug?: string;
}

function googleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function instagramUrl(handle: string) {
  if (handle.startsWith('http')) return handle;
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

export function BarDetailDrawer({
  bar,
  open,
  onOpenChange,
  rating,
  favoriteCount = 0,
  isFavorite = false,
  onToggleFavorite,
  eventSlug,
}: Props) {
  if (!bar) return null;

  const handleAction = (kind: string, href: string) => {
    track('bar_detail_action', { event: eventSlug, bar: bar.id, action: kind });
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) track('bar_detail_opened', { event: eventSlug, bar: bar.id });
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto p-0 rounded-t-2xl">
        {bar.dishImageUrl && (
          <div className="aspect-[16/10] bg-muted overflow-hidden">
            <img
              src={bar.dishImageUrl}
              alt={bar.featuredDish || bar.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="p-5 space-y-4">
          <SheetHeader className="space-y-2 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <SheetTitle className="text-2xl leading-tight">{bar.name}</SheetTitle>
                {bar.neighborhood && (
                  <SheetDescription className="text-sm text-muted-foreground mt-1">
                    {bar.neighborhood}
                  </SheetDescription>
                )}
              </div>
              {onToggleFavorite && bar.id && (
                <Button
                  variant={isFavorite ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToggleFavorite(bar.id!)}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? 'Remover dos marcados' : 'Marcar bar'}
                  className="flex-shrink-0"
                >
                  <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {rating && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="font-bold">{rating.averageScore.toFixed(1)}</span>
                  <span className="opacity-70">({rating.voteCount})</span>
                </Badge>
              )}
              {favoriteCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {favoriteCount} {favoriteCount === 1 ? 'marcou' : 'marcaram'}
                </Badge>
              )}
              {bar.scheduledTime && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {bar.scheduledTime}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {bar.featuredDish && (
            <div className="bg-primary/10 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Utensils className="w-4 h-4" />
                <p className="text-sm font-bold uppercase tracking-wide">Petisco em concurso</p>
              </div>
              <p className="font-semibold">{bar.featuredDish}</p>
              {bar.dishDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bar.dishDescription}
                </p>
              )}
            </div>
          )}

          {bar.address && (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Endereço</p>
              <p>{bar.address}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 pt-2">
            {bar.address && (
              <Button
                variant="default"
                size="lg"
                onClick={() => handleAction('maps', googleMapsUrl(`${bar.name} ${bar.address}`))}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Abrir no mapa
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {bar.phone && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleAction('call', `tel:${bar.phone!.replace(/\D/g, '')}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
              )}
              {bar.instagram && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleAction('instagram', instagramUrl(bar.instagram!))}
                  className={!bar.phone ? 'col-span-2' : ''}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
