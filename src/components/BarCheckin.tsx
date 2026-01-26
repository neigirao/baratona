import { useBaratona } from '@/contexts/BaratonaContext';
import { useCheckins } from '@/hooks/useCheckins';
import { MapPin, Check, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function BarCheckin() {
  const { currentUser, getCurrentBar, participants, language, currentBarId } = useBaratona();
  const { checkIn, checkOut, getBarCheckins, isCheckedIn } = useCheckins();
  
  const currentBar = getCurrentBar();
  
  if (!currentUser || !currentBar || !currentBarId) return null;
  
  const userIsCheckedIn = isCheckedIn(currentUser.id, currentBarId);
  const barCheckins = getBarCheckins(currentBarId);
  const checkedInParticipants = participants.filter(p => 
    barCheckins.some(c => c.participant_id === p.id)
  );
  
  const handleToggleCheckin = async () => {
    if (userIsCheckedIn) {
      const success = await checkOut(currentUser.id, currentBarId);
      if (success) {
        toast({
          title: language === 'pt' ? 'Check-out realizado!' : 'Checked out!',
          description: language === 'pt' 
            ? `Você saiu do ${currentBar.name}` 
            : `You left ${currentBar.name}`,
        });
      } else {
        toast({
          title: language === 'pt' ? 'Erro no check-out' : 'Check-out failed',
          description: language === 'pt' 
            ? 'Não foi possível fazer check-out. Tente novamente.' 
            : 'Could not check out. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      const success = await checkIn(currentUser.id, currentBarId);
      if (success) {
        toast({
          title: language === 'pt' ? 'Check-in realizado!' : 'Checked in!',
          description: language === 'pt' 
            ? `Você está no ${currentBar.name}! 🍻` 
            : `You're at ${currentBar.name}! 🍻`,
        });
      } else {
        toast({
          title: language === 'pt' ? 'Erro no check-in' : 'Check-in failed',
          description: language === 'pt' 
            ? 'Não foi possível fazer check-in. Tente novamente.' 
            : 'Could not check in. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };
  
  return (
    <div className="bg-card rounded-2xl p-4 border border-border animate-slide-up">
      {/* Current bar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-display font-semibold text-foreground">
              {currentBar.name}
            </h3>
            <p className="text-xs text-muted-foreground">{currentBar.address}</p>
          </div>
        </div>
        
        {/* Checked in count */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">{checkedInParticipants.length}</span>
        </div>
      </div>
      
      {/* Check-in button */}
      <button
        onClick={handleToggleCheckin}
        className={`w-full py-4 rounded-xl font-display font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
          userIsCheckedIn 
            ? 'bg-baratona-green text-white shadow-lg shadow-baratona-green/30' 
            : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
        }`}
      >
        {userIsCheckedIn ? (
          <>
            <Check className="w-6 h-6" />
            {language === 'pt' ? 'Estou aqui! ✓' : "I'm here! ✓"}
          </>
        ) : (
          <>
            <MapPin className="w-6 h-6" />
            {language === 'pt' ? 'Cheguei!' : 'I arrived!'}
          </>
        )}
      </button>
      
      {/* Checked in participants list */}
      {checkedInParticipants.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            {language === 'pt' ? 'Quem está aqui:' : 'Who is here:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {checkedInParticipants.map(p => (
              <span 
                key={p.id}
                className={`text-xs px-2 py-1 rounded-full ${
                  p.id === currentUser.id 
                    ? 'bg-baratona-green/20 text-baratona-green font-semibold' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {p.name}
                {p.id === currentUser.id && ' (você)'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
