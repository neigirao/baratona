import { useCountUp } from '@/hooks/useCountUp';

interface StatRevealProps {
  value: number;
  label: string;
  icon: React.ElementType;
  delay?: number;
  active?: boolean;
}

export function StatReveal({ value, label, icon: Icon, delay = 0, active = true }: StatRevealProps) {
  const animatedValue = useCountUp(value, 1500, active);

  return (
    <div 
      className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Icon className="w-10 h-10 text-white" />
      </div>
      <span className="font-display text-5xl md:text-7xl font-black text-white drop-shadow-lg">
        {animatedValue}
      </span>
      <span className="text-white/80 text-lg font-medium">{label}</span>
    </div>
  );
}
