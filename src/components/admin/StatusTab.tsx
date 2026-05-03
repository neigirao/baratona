import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Minimal bar shape that works for both legacy (bars table) and platform (event_bars table)
// Both are returned by useBaratona() in snake_case from the context.
interface Bar {
  id: string | number;
  name: string;
  bar_order: number;
}

type AppConfig = {
  status?: string;
  global_delay_minutes?: number;
  broadcast_msg?: string | null;
  current_bar_id?: string | number | null;
};

type EventConfigPatch = Partial<AppConfig>;

interface StatusTabProps {
  bars: Bar[];
  appConfig: AppConfig | null;
  currentBar: Bar | null | undefined;
  nextBar: Bar | null | undefined;
  currentBarId: string | number | null | undefined;
  isCircuit: boolean;
  onSetCurrentBar: (barId: string) => Promise<void>;
  onSetTransit: (originId: string, destId: string) => Promise<void>;
  onUpdateConfig: (patch: EventConfigPatch) => Promise<boolean>;
  onFinish: () => void;
}

export function StatusTab({
  bars, appConfig, currentBar, nextBar, currentBarId,
  isCircuit, onSetCurrentBar, onSetTransit, onUpdateConfig, onFinish,
}: StatusTabProps) {
  return (
    <div className="space-y-4">
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
                onClick={() => onSetCurrentBar(String(bar.id))}
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
                onClick={() => onSetTransit(String(currentBar.id), String(nextBar.id))}
              >
                🚐 {currentBar.name} → {nextBar.name}
              </Button>
            )}
            <h3 className="font-semibold text-sm mt-3">Atraso Global</h3>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateConfig({ global_delay_minutes: Math.max(0, (appConfig?.global_delay_minutes ?? 0) - 5) })}
              >
                -5 min
              </Button>
              <span className="text-sm font-mono w-16 text-center">{appConfig?.global_delay_minutes ?? 0} min</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateConfig({ global_delay_minutes: (appConfig?.global_delay_minutes ?? 0) + 5 })}
              >
                +5 min
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="destructive" className="w-full" onClick={onFinish}>
        Finalizar Evento
      </Button>
    </div>
  );
}
