import { cn } from '@/lib/utils';

interface ParticipantAvatarProps {
  name: string;
  isCurrentUser?: boolean;
  size?: 'sm' | 'md';
}

// Generate a consistent color based on name
function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'bg-lime-500/20 text-lime-400 border-lime-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'bg-violet-500/20 text-violet-400 border-violet-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-rose-500/20 text-rose-400 border-rose-500/30',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ParticipantAvatar({ name, isCurrentUser, size = 'sm' }: ParticipantAvatarProps) {
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center font-semibold border transition-all",
        colorClass,
        size === 'sm' && "w-7 h-7 text-xs",
        size === 'md' && "w-9 h-9 text-sm",
        isCurrentUser && "ring-2 ring-baratona-green ring-offset-2 ring-offset-card"
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
