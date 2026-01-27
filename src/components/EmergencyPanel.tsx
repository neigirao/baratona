import { Phone, Car, AlertTriangle, Ambulance } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBaratona } from '@/contexts/BaratonaContext';

// Emergency contact numbers
const NEI_PHONE = '5521989921711';
const SAMU_PHONE = '192';

export function EmergencyPanel() {
  const { language, getCurrentBar } = useBaratona();
  const currentBar = getCurrentBar();
  
  const handleCallNei = () => {
    if ('vibrate' in navigator) navigator.vibrate(100);
    window.open(`tel:${NEI_PHONE}`, '_self');
  };
  
  const handleCallSamu = () => {
    if ('vibrate' in navigator) navigator.vibrate(100);
    window.open(`tel:${SAMU_PHONE}`, '_self');
  };
  
  const handleCallUber = () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    
    // Get current bar coordinates for pickup location
    const pickupLat = currentBar?.latitude || -22.9068;
    const pickupLng = currentBar?.longitude || -43.1729;
    const pickupName = currentBar?.name ? encodeURIComponent(currentBar.name) : '';
    
    // Try deep link first, fallback to web
    const deepLink = `uber://?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&pickup[nickname]=${pickupName}`;
    const webLink = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&pickup[nickname]=${pickupName}`;
    
    // Try to open deep link, fallback to web after a short delay
    const startTime = Date.now();
    window.location.href = deepLink;
    
    // If we're still here after 1.5 seconds, the app isn't installed
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        window.open(webLink, '_blank');
      }
    }, 1500);
  };
  
  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h3 className="font-display font-semibold text-destructive">
          {language === 'pt' ? 'Emergência' : 'Emergency'}
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {/* SOS Nei */}
        <Button
          variant="outline"
          onClick={handleCallNei}
          className="h-16 flex flex-col items-center justify-center gap-1 bg-card hover:bg-destructive/10 border-destructive/30"
        >
          <Phone className="w-5 h-5 text-destructive" />
          <span className="text-xs font-semibold">SOS Nei</span>
        </Button>
        
        {/* SAMU */}
        <Button
          variant="outline"
          onClick={handleCallSamu}
          className="h-16 flex flex-col items-center justify-center gap-1 bg-card hover:bg-destructive/10 border-destructive/30"
        >
          <Ambulance className="w-5 h-5 text-destructive" />
          <span className="text-xs font-semibold">SAMU 192</span>
        </Button>
        
        {/* Uber */}
        <Button
          variant="outline"
          onClick={handleCallUber}
          className="h-16 flex flex-col items-center justify-center gap-1 bg-card hover:bg-primary/10 border-primary/30"
        >
          <Car className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold">Uber</span>
        </Button>
      </div>
      
      {currentBar && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          📍 {currentBar.name}
        </p>
      )}
    </div>
  );
}
