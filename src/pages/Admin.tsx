import { useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Plus, 
  Minus, 
  Send, 
  Car,
  Phone,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Admin() {
  const { isAdmin, appConfig, updateAppConfig, bars, t } = useBaratona();
  const [broadcastInput, setBroadcastInput] = useState('');
  const [transitOrigin, setTransitOrigin] = useState<string>('');
  const [transitDest, setTransitDest] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  if (!appConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  
  const handleToggleStatus = async () => {
    setUpdating(true);
    
    if (appConfig.status === 'at_bar') {
      // Going to transit - need to select origin and destination
      if (!transitOrigin || !transitDest) {
        alert('Selecione origem e destino!');
        setUpdating(false);
        return;
      }
      await updateAppConfig({
        status: 'in_transit',
        origin_bar_id: parseInt(transitOrigin),
        destination_bar_id: parseInt(transitDest),
      });
    } else {
      // Arriving at bar
      await updateAppConfig({
        status: 'at_bar',
        current_bar_id: appConfig.destination_bar_id || appConfig.current_bar_id,
        origin_bar_id: null,
        destination_bar_id: null,
      });
    }
    
    setUpdating(false);
    setTransitOrigin('');
    setTransitDest('');
  };
  
  const handleDelayChange = async (delta: number) => {
    setUpdating(true);
    await updateAppConfig({
      global_delay_minutes: Math.max(0, (appConfig.global_delay_minutes || 0) + delta),
    });
    setUpdating(false);
  };
  
  const handleBroadcast = async () => {
    if (!broadcastInput.trim()) return;
    setUpdating(true);
    await updateAppConfig({
      broadcast_msg: broadcastInput.trim(),
    });
    setBroadcastInput('');
    setUpdating(false);
  };
  
  const clearBroadcast = async () => {
    setUpdating(true);
    await updateAppConfig({
      broadcast_msg: null,
    });
    setUpdating(false);
  };
  
  const handleCallUber = () => {
    window.open('uber://', '_blank');
  };
  
  const handleSOSNei = () => {
    window.open('https://wa.me/5521999999999?text=SOS%20Baratona!', '_blank');
  };
  
  return (
    <div className="min-h-screen bg-background pb-6">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-destructive">
            Painel Admin
          </h1>
          <p className="text-sm text-muted-foreground">Controle total da Baratona</p>
        </div>
        
        {/* Van Status Control */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-display text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Bus className="w-4 h-4" />
            Controle da Van
          </h3>
          
          <div className="space-y-4">
            {appConfig.status === 'at_bar' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Origem</label>
                    <Select value={transitOrigin} onValueChange={setTransitOrigin}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {bars.map(bar => (
                          <SelectItem key={bar.id} value={bar.id.toString()}>
                            {bar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Destino</label>
                    <Select value={transitDest} onValueChange={setTransitDest}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {bars.map(bar => (
                          <SelectItem key={bar.id} value={bar.id.toString()}>
                            {bar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            
            <Button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`w-full h-14 font-display font-bold text-lg ${
                appConfig.status === 'at_bar'
                  ? 'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground'
                  : 'bg-gradient-to-r from-baratona-green to-baratona-green/80 text-primary-foreground'
              }`}
            >
              {updating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : appConfig.status === 'at_bar' ? (
                <>
                  <Bus className="w-5 h-5 mr-2" />
                  Iniciar Deslocamento
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 mr-2" />
                  Chegamos!
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Delay Control */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-display text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Atraso Global
          </h3>
          
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelayChange(-5)}
              disabled={updating}
              className="h-12 w-12"
            >
              <Minus className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-foreground">
                {(appConfig.global_delay_minutes || 0) > 0 ? '+' : ''}{appConfig.global_delay_minutes || 0}
              </span>
              <p className="text-xs text-muted-foreground">{t.minutes}</p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelayChange(5)}
              disabled={updating}
              className="h-12 w-12"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Broadcast */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-display text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Send className="w-4 h-4" />
            {t.broadcast}
          </h3>
          
          <div className="flex gap-2">
            <Input
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
              placeholder="Mensagem para todos..."
              className="bg-input"
            />
            <Button onClick={handleBroadcast} disabled={updating}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {appConfig.broadcast_msg && (
            <div className="mt-3 flex items-center justify-between bg-destructive/10 p-2 rounded">
              <span className="text-sm text-destructive">{appConfig.broadcast_msg}</span>
              <Button variant="ghost" size="sm" onClick={clearBroadcast} disabled={updating}>
                Limpar
              </Button>
            </div>
          )}
        </div>
        
        {/* Emergency Buttons */}
        <div className="bg-card rounded-2xl p-4 border border-destructive/50">
          <h3 className="font-display text-sm font-semibold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Emergência
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCallUber}
              className="h-14 border-primary text-primary hover:bg-primary/10"
            >
              <Car className="w-5 h-5 mr-2" />
              {t.callUber}
            </Button>
            
            <Button
              onClick={handleSOSNei}
              className="h-14 bg-gradient-to-r from-destructive to-destructive/80"
            >
              <Phone className="w-5 h-5 mr-2" />
              {t.sosNei}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
