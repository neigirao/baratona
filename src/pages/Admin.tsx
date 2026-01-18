import { useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BARS } from '@/lib/constants';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Plus, 
  Minus, 
  Send, 
  Car,
  Phone,
  AlertTriangle
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
  const { isAdmin, appConfig, setAppConfig, t } = useBaratona();
  const [broadcastInput, setBroadcastInput] = useState('');
  const [transitOrigin, setTransitOrigin] = useState<string>('');
  const [transitDest, setTransitDest] = useState<string>('');
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  const handleToggleStatus = () => {
    if (appConfig.status === 'at_bar') {
      // Going to transit - need to select origin and destination
      if (!transitOrigin || !transitDest) {
        alert('Selecione origem e destino!');
        return;
      }
      setAppConfig({
        ...appConfig,
        status: 'in_transit',
        originBarId: parseInt(transitOrigin),
        destinationBarId: parseInt(transitDest),
      });
    } else {
      // Arriving at bar
      setAppConfig({
        ...appConfig,
        status: 'at_bar',
        currentBarId: appConfig.destinationBarId || appConfig.currentBarId,
        originBarId: undefined,
        destinationBarId: undefined,
      });
    }
  };
  
  const handleDelayChange = (delta: number) => {
    setAppConfig({
      ...appConfig,
      globalDelayMinutes: Math.max(0, appConfig.globalDelayMinutes + delta),
    });
  };
  
  const handleBroadcast = () => {
    if (!broadcastInput.trim()) return;
    setAppConfig({
      ...appConfig,
      broadcastMsg: broadcastInput.trim(),
    });
    setBroadcastInput('');
  };
  
  const clearBroadcast = () => {
    setAppConfig({
      ...appConfig,
      broadcastMsg: undefined,
    });
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
                        {BARS.map(bar => (
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
                        {BARS.map(bar => (
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
              className={`w-full h-14 font-display font-bold text-lg ${
                appConfig.status === 'at_bar'
                  ? 'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground'
                  : 'bg-gradient-to-r from-baratona-green to-baratona-green/80 text-primary-foreground'
              }`}
            >
              {appConfig.status === 'at_bar' ? (
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
              className="h-12 w-12"
            >
              <Minus className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <span className="font-display text-3xl font-bold text-foreground">
                {appConfig.globalDelayMinutes > 0 ? '+' : ''}{appConfig.globalDelayMinutes}
              </span>
              <p className="text-xs text-muted-foreground">{t.minutes}</p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelayChange(5)}
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
            <Button onClick={handleBroadcast}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {appConfig.broadcastMsg && (
            <div className="mt-3 flex items-center justify-between bg-destructive/10 p-2 rounded">
              <span className="text-sm text-destructive">{appConfig.broadcastMsg}</span>
              <Button variant="ghost" size="sm" onClick={clearBroadcast}>
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
