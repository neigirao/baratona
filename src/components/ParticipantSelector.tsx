import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { User, Loader2 } from 'lucide-react';
import baratonaBanner from '@/assets/baratona-banner.jpeg';

export function ParticipantSelector() {
  const { setCurrentUser, participants, participantsLoading, t } = useBaratona();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Banner */}
      <div className="relative w-full h-48 overflow-hidden">
        <img 
          src={baratonaBanner} 
          alt="Baratona 2026" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="font-display text-3xl font-black text-gradient-yellow">
            BARATONA 2026
          </h1>
          <p className="text-sm text-muted-foreground mt-1">07/02 - Sábado</p>
        </div>
      </div>
      
      {/* Participant Selection */}
      <div className="flex-1 p-4 animate-slide-up">
        <div className="mb-6 text-center">
          <h2 className="font-display text-lg font-bold text-foreground">
            {t.selectName}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            "Hoje não tem garçom parado, nem puta triste!"
          </p>
        </div>
        
        {participantsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
            {participants.map((participant) => (
              <Button
                key={participant.id}
                variant="outline"
                onClick={() => setCurrentUser(participant)}
                className="h-12 justify-start gap-2 bg-card hover:bg-primary/10 hover:border-primary/50 transition-all"
              >
                <User className={`w-4 h-4 ${participant.is_admin ? 'text-destructive' : 'text-primary'}`} />
                <span className="truncate text-sm">{participant.name}</span>
                {participant.is_admin && (
                  <span className="ml-auto text-xs text-destructive">👑</span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
