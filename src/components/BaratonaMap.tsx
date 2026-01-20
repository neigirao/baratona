import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBaratona } from '@/contexts/BaratonaContext';
import { MapPin, Clock, Bus } from 'lucide-react';

// Leaflet module interop (CJS/ESM): normalize to the actual Leaflet namespace object.
// In some bundling edge-cases, the imported module can look like an Array; guard against that.
function resolveLeafletNamespace(mod: any) {
  const candidate = mod?.default ?? mod;
  if (Array.isArray(candidate)) {
    return (
      candidate.find((x: any) => x && (x.Icon || x.divIcon || x.marker)) ?? candidate[0]
    );
  }
  return candidate;
}

const Leaflet: any = resolveLeafletNamespace(L);

// Fix Leaflet default marker icons (guarded to avoid crashing if Leaflet shape differs)
try {
  if (Leaflet?.Icon?.Default?.prototype) {
    delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
    Leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("Leaflet default icon setup skipped:", e);
}

const safeDivIcon = (options: any) => {
  try {
    if (typeof Leaflet?.divIcon === "function") {
      return Leaflet.divIcon(options);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Leaflet divIcon failed:", e);
  }
  return undefined;
};

// Custom icons for bar status
const createBarIcon = (status: "completed" | "current" | "upcoming"): any => {
  const colors = {
    completed: { bg: "hsl(142, 76%, 36%)", border: "hsl(142, 76%, 50%)" },
    current: { bg: "hsl(197, 100%, 47%)", border: "hsl(197, 100%, 60%)" },
    upcoming: { bg: "hsl(0, 0%, 40%)", border: "hsl(0, 0%, 60%)" },
  };

  const color = (colors as any)[status];

  return safeDivIcon({
    className: "custom-bar-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${color.bg};
        border: 3px solid ${color.border};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ${status === "current" ? "animation: pulse-marker 2s ease-in-out infinite;" : ""}
      ">
        <span style="color: white; font-weight: bold; font-size: 12px;">${status === "current" ? "🍺" : status === "completed" ? "✓" : "○"}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Van icon with pulse animation
const createVanIcon = (isTransit: boolean): any => {
  return safeDivIcon({
    className: `custom-van-marker ${isTransit ? "van-pulse-marker" : ""}`,
    html: `
      <div class="${isTransit ? "van-icon-transit" : "van-icon-static"}" style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(45, 100%, 50%), hsl(35, 100%, 45%));
        border: 3px solid hsl(45, 100%, 60%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px hsla(45, 100%, 50%, 0.6);
        font-size: 20px;
      ">
        🚐
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Component to update map view when van position changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [center, map]);
  
  return null;
}

export function BaratonaMap() {
  const { bars, barsLoading, appConfig, getProjectedTime, t } = useBaratona();

  // Get bar status based on current bar
  const getBarStatus = (barId: number): 'completed' | 'current' | 'upcoming' => {
    if (!appConfig?.current_bar_id) return 'upcoming';
    
    const currentBar = bars.find(b => b.id === appConfig.current_bar_id);
    const bar = bars.find(b => b.id === barId);
    
    if (!currentBar || !bar) return 'upcoming';
    
    if (bar.bar_order < currentBar.bar_order) return 'completed';
    if (bar.id === appConfig.current_bar_id) return 'current';
    return 'upcoming';
  };

  // Calculate van position
  const vanPosition = useMemo((): [number, number] | null => {
    if (!appConfig || bars.length === 0) return null;

    if (appConfig.status === 'in_transit' && appConfig.origin_bar_id && appConfig.destination_bar_id) {
      const origin = bars.find(b => b.id === appConfig.origin_bar_id);
      const dest = bars.find(b => b.id === appConfig.destination_bar_id);
      
      if (origin?.latitude && origin?.longitude && dest?.latitude && dest?.longitude) {
        // Position van at midpoint between origin and destination
        const midLat = (origin.latitude + dest.latitude) / 2;
        const midLng = (origin.longitude + dest.longitude) / 2;
        return [midLat, midLng];
      }
    }

    // At bar - position at current bar
    const currentBar = bars.find(b => b.id === appConfig.current_bar_id);
    if (currentBar?.latitude && currentBar?.longitude) {
      return [currentBar.latitude, currentBar.longitude];
    }

    // Default to first bar
    const firstBar = bars[0];
    if (firstBar?.latitude && firstBar?.longitude) {
      return [firstBar.latitude, firstBar.longitude];
    }

    return null;
  }, [appConfig, bars]);

  // Route polyline - all bars in order
  const routePositions = useMemo((): [number, number][] => {
    return bars
      .filter(bar => bar.latitude && bar.longitude)
      .sort((a, b) => a.bar_order - b.bar_order)
      .map(bar => [bar.latitude!, bar.longitude!] as [number, number]);
  }, [bars]);

  // Active route segment (when in transit)
  const activeSegment = useMemo((): [number, number][] | null => {
    if (!appConfig || appConfig.status !== 'in_transit') return null;
    
    const origin = bars.find(b => b.id === appConfig.origin_bar_id);
    const dest = bars.find(b => b.id === appConfig.destination_bar_id);
    
    if (origin?.latitude && origin?.longitude && dest?.latitude && dest?.longitude) {
      return [
        [origin.latitude, origin.longitude],
        [dest.latitude, dest.longitude]
      ];
    }
    return null;
  }, [appConfig, bars]);

  // Map center - center on van position or Rio de Janeiro
  const mapCenter = useMemo((): [number, number] => {
    if (vanPosition) return vanPosition;
    // Default center: Rio de Janeiro (between all bars)
    return [-22.93, -43.20];
  }, [vanPosition]);

  if (barsLoading) {
    return (
      <div className="bar-card h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="bar-card overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">{t.map}</h2>
        {appConfig?.status === 'in_transit' && (
          <span className="status-badge status-in-transit ml-auto flex items-center gap-1">
            <Bus className="w-3 h-3" />
            {t.inTransit}
          </span>
        )}
      </div>

      <div className="rounded-lg overflow-hidden h-64 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {vanPosition && <MapUpdater center={vanPosition} />}

          {/* Full route line */}
          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: 'hsl(197, 100%, 47%)',
                weight: 3,
                opacity: 0.4,
                dashArray: '10, 10',
              }}
            />
          )}

          {/* Active transit segment */}
          {activeSegment && (
            <Polyline
              positions={activeSegment}
              pathOptions={{
                color: 'hsl(45, 100%, 50%)',
                weight: 5,
                opacity: 1,
              }}
            />
          )}

          {/* Bar markers */}
          {bars.map((bar) => {
            if (!bar.latitude || !bar.longitude) return null;
            const status = getBarStatus(bar.id);
            const projectedTime = getProjectedTime(bar.scheduled_time);

            return (
              <Marker
                key={bar.id}
                position={[bar.latitude, bar.longitude]}
                icon={createBarIcon(status)}
              >
                <Popup className="baratona-popup">
                  <div className="text-sm">
                    <div className="font-bold text-base mb-1">
                      {bar.bar_order}. {bar.name}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      {bar.address}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {projectedTime}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Van marker */}
          {vanPosition && (
            <Marker
              position={vanPosition}
              icon={createVanIcon(appConfig?.status === 'in_transit')}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-sm font-medium">
                  🚐 {appConfig?.status === 'in_transit' ? t.inTransit : t.atBar}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)]" />
          <span>{t.completed}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>{t.current}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span>{t.upcoming}</span>
        </div>
      </div>
    </div>
  );
}
