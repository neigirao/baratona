import { cn } from '@/lib/utils';

interface ProgressBarsProps {
  totalCards: number;
  currentCard: number;
  onNavigate: (index: number) => void;
}

export function ProgressBars({ totalCards, currentCard, onNavigate }: ProgressBarsProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
      {Array.from({ length: totalCards }).map((_, i) => (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          className="flex-1 h-1 rounded-full overflow-hidden bg-white/30"
          aria-label={`Card ${i + 1}`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              i < currentCard
                ? "w-full bg-white"
                : i === currentCard
                  ? "w-full bg-white animate-pulse"
                  : "w-0 bg-white"
            )}
          />
        </button>
      ))}
    </div>
  );
}
