import { cn } from '@/lib/utils';

interface WrappedCardProps {
  children: React.ReactNode;
  gradient: string;
  delay?: number;
  active: boolean;
}

export function WrappedCard({ children, gradient, delay = 0, active }: WrappedCardProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-out",
        gradient,
        active 
          ? "opacity-100 translate-x-0 scale-100" 
          : "opacity-0 translate-x-full scale-95 pointer-events-none"
      )}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
