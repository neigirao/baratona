import { useMemo } from 'react';

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A'];

interface Particle {
  id: number;
  left: string;
  color: string;
  size: number;
  delay: string;
  duration: string;
}

export function ConfettiEffect() {
  const particles = useMemo<Particle[]>(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 2}s`,
    })),
  []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute -top-2 rounded-full animate-confetti-fall"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
