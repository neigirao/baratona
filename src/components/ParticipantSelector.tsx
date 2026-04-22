import { useState, useMemo } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Loader2, Search, X } from 'lucide-react';
import { BaratonaHero } from '@/components/BaratonaHero';

export function ParticipantSelector() {
  const { setCurrentUser, participants, participantsLoading, t } = useBaratona();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get last used participants from localStorage
  const lastUsed = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('baratona_last_used') || '{}') as Record<string, number>;
    } catch {
      return {};
    }
  }, []);
  
  // Get last selected user
  const lastSelectedName = localStorage.getItem('baratona_user');
  
  // Filter and sort participants
  const sortedParticipants = useMemo(() => {
    let filtered = participants;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = participants.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }
    
    // Sort: last selected first, then by recent usage, then alphabetically
    return [...filtered].sort((a, b) => {
      // Last selected comes first
      if (a.name === lastSelectedName) return -1;
      if (b.name === lastSelectedName) return 1;
      
      // Then sort by recent usage
      const aLastUsed = lastUsed[a.id] || 0;
      const bLastUsed = lastUsed[b.id] || 0;
      if (aLastUsed !== bLastUsed) {
        return bLastUsed - aLastUsed;
      }
      
      // Finally alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [participants, searchQuery, lastUsed, lastSelectedName]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Banner */}
      <BaratonaHero
        title="BARATONA 2026"
        subtitle="07/02 - Sábado"
        height="md"
        asH1
      />
      
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
          <>
            {/* Search field */}
            <div className="relative max-w-md mx-auto mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.selectName}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 bg-card border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {/* Participants grid */}
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {sortedParticipants.map((participant) => {
                const isLastSelected = participant.name === lastSelectedName;
                
                return (
                  <Button
                    key={participant.id}
                    variant="outline"
                    onClick={() => setCurrentUser(participant)}
                    className={`h-14 justify-start gap-2 transition-all ${
                      isLastSelected 
                        ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/30' 
                        : 'bg-card hover:bg-primary/10 hover:border-primary/50'
                    }`}
                  >
                    <User className={`w-4 h-4 flex-shrink-0 ${
                      participant.is_admin ? 'text-destructive' : 'text-primary'
                    }`} />
                    <span className="truncate text-sm font-medium">{participant.name}</span>
                    {participant.is_admin && (
                      <span className="ml-auto text-xs text-destructive flex-shrink-0">👑</span>
                    )}
                    {isLastSelected && !participant.is_admin && (
                      <span className="ml-auto text-xs text-primary flex-shrink-0">✓</span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            {sortedParticipants.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum participante encontrado</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
