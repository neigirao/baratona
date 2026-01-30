import { useBaratona } from '@/contexts/BaratonaContext';
import { useAchievements, ACHIEVEMENTS } from '@/hooks/useAchievements';
import { Lock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Achievements() {
  const { currentUser, language } = useBaratona();
  const { unlockedAchievements, loading, isUnlocked } = useAchievements(currentUser?.id);

  if (!currentUser) return null;

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="bg-card rounded-2xl p-4 border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-secondary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'pt' ? 'Conquistas' : 'Achievements'}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = isUnlocked(achievement.key);
            return (
              <div
                key={achievement.key}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all",
                  unlocked 
                    ? "bg-secondary/20 border border-secondary/30" 
                    : "bg-muted/50 border border-border opacity-50"
                )}
                title={language === 'pt' ? achievement.descPt : achievement.descEn}
              >
                {unlocked ? (
                  <>
                    <span className="text-2xl">{achievement.emoji}</span>
                    <span className="text-[10px] text-center mt-1 font-medium text-foreground leading-tight">
                      {language === 'pt' ? achievement.titlePt : achievement.titleEn}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-center mt-1 text-muted-foreground leading-tight">
                      ???
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
