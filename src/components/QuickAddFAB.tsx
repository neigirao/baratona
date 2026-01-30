import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DRINK_TYPES = [
  { key: 'cerveja', label: 'Cerveja', emoji: '🍺' },
  { key: 'cachaca', label: 'Cachaça', emoji: '🥃' },
  { key: 'drink', label: 'Drink', emoji: '🍹' },
  { key: 'batida', label: 'Batida', emoji: '🧉' },
];

export function QuickAddFAB() {
  const { currentUser, updateConsumption, currentBarId, getCurrentBar, language } = useBaratona();
  const [isOpen, setIsOpen] = useState(false);
  const [animatingType, setAnimatingType] = useState<string | null>(null);

  if (!currentUser) return null;

  const currentBar = getCurrentBar();

  const handleAddDrink = async (typeKey: string) => {
    // Visual feedback
    setAnimatingType(typeKey);
    setTimeout(() => setAnimatingType(null), 300);

    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate(30);

    // Add drink
    const success = await updateConsumption(currentUser.id, 'drink', 1, currentBarId);
    
    if (success) {
      const drinkType = DRINK_TYPES.find(d => d.key === typeKey);
      toast({
        title: `${drinkType?.emoji} +1`,
        description: currentBar 
          ? (language === 'pt' ? `Adicionado em ${currentBar.name}` : `Added at ${currentBar.name}`)
          : (language === 'pt' ? 'Bebida adicionada!' : 'Drink added!'),
        duration: 2000,
      });
    }

    // Close menu after adding
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col-reverse items-end gap-2">
      {/* Drink type buttons (appear when open) */}
      {isOpen && (
        <div className="flex flex-col gap-2 mb-2 animate-fade-in">
          {DRINK_TYPES.map((type, index) => (
            <button
              key={type.key}
              onClick={() => handleAddDrink(type.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-full bg-card border border-border shadow-lg transition-all",
                "hover:bg-primary/10 hover:border-primary active:scale-95",
                animatingType === type.key && "bg-primary scale-110 border-primary"
              )}
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: 'slide-in-right 0.2s ease-out forwards'
              }}
            >
              <span className={cn(
                "text-2xl transition-transform",
                animatingType === type.key && "scale-125"
              )}>
                {type.emoji}
              </span>
              <span className="text-sm font-medium text-foreground">{type.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 -z-10 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
          "active:scale-95",
          isOpen 
            ? "bg-destructive text-destructive-foreground rotate-45" 
            : "bg-primary text-primary-foreground"
        )}
        style={{
          boxShadow: isOpen 
            ? '0 4px 20px hsl(357 86% 52% / 0.4)' 
            : '0 4px 20px hsl(197 100% 47% / 0.4)'
        }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
