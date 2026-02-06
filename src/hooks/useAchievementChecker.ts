import { useEffect, useRef } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { useAchievements } from '@/hooks/useAchievements';
import { useCheckins } from '@/hooks/useCheckins';

/**
 * Hook that automatically checks and unlocks achievements based on user actions.
 * Should be used once at the app level (e.g., in Index.tsx).
 * 
 * IMPORTANT: Uses hasInitialized flag to skip the first effect run,
 * preventing achievements from being re-created on page load with pre-existing data.
 */
export function useAchievementChecker() {
  const { 
    currentUser, 
    bars, 
    consumption,
    getTotalParticipantConsumption,
    getBarVotes,
    language,
  } = useBaratona();
  
  const { unlockAchievement, isUnlocked } = useAchievements(currentUser?.id);
  const { checkins } = useCheckins();
  
  // Track previous values to detect changes (-1 means not yet initialized)
  const prevDrinks = useRef<number>(-1);
  const prevCheckins = useRef<number>(-1);
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (!currentUser) return;
    
    const participantId = currentUser.id;
    const { drinks, food } = getTotalParticipantConsumption(participantId);
    
    // Get participant's checkins
    const userCheckins = checkins.filter(c => c.participant_id === participantId);
    const checkinCount = userCheckins.length;
    const checkedInBarIds = new Set(userCheckins.map(c => c.bar_id));
    
    // Get participant's consumption by type
    const userConsumption = consumption.filter(c => c.participant_id === participantId);
    
    // Get user votes
    const userVotes = bars.filter(bar => {
      const votes = getBarVotes(bar.id);
      return votes.some(v => v.participant_id === participantId);
    });
    
    // Check for first and last bar
    const sortedBars = [...bars].sort((a, b) => a.bar_order - b.bar_order);
    const firstBar = sortedBars[0];
    const lastBar = sortedBars[sortedBars.length - 1];
    
    // Skip the first effect run to avoid re-creating achievements from pre-existing data
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevDrinks.current = drinks;
      prevCheckins.current = checkinCount;
      return;
    }
    
    // ========== ACHIEVEMENT CHECKS ==========
    
    // 1. First Drink - Registered first drink (only if prev was 0, meaning user just added)
    if (drinks > 0 && prevDrinks.current === 0 && !isUnlocked('first_drink')) {
      unlockAchievement('first_drink', language);
    }
    
    // 2. Ten Drinks - Reached 10 drinks (only when crossing threshold during session)
    if (drinks >= 10 && prevDrinks.current > 0 && prevDrinks.current < 10 && !isUnlocked('ten_drinks')) {
      unlockAchievement('ten_drinks', language);
    }
    
    // 3. Twenty Drinks (Legend) - Reached 20 drinks
    if (drinks >= 20 && prevDrinks.current > 0 && prevDrinks.current < 20 && !isUnlocked('twenty_drinks')) {
      unlockAchievement('twenty_drinks', language);
    }
    
    // 4. Social Butterfly - Checked in at 5+ bars (only when crossing threshold during session)
    if (checkinCount >= 5 && prevCheckins.current > 0 && prevCheckins.current < 5 && !isUnlocked('social_butterfly')) {
      unlockAchievement('social_butterfly', language);
    }
    
    // 5. Early Bird - Present at first bar
    if (firstBar && checkedInBarIds.has(firstBar.id) && !isUnlocked('early_bird')) {
      unlockAchievement('early_bird', language);
    }
    
    // 6. Night Owl - Present at last bar
    if (lastBar && checkedInBarIds.has(lastBar.id) && !isUnlocked('night_owl')) {
      unlockAchievement('night_owl', language);
    }
    
    // 7. Balanced - Equal food and drink count (both > 0)
    if (drinks > 0 && food > 0 && drinks === food && !isUnlocked('balanced')) {
      unlockAchievement('balanced', language);
    }
    
    // 8. Food Critic - Rated all visited bars
    if (checkinCount > 0 && userVotes.length >= checkinCount && !isUnlocked('food_critic')) {
      // Check if user voted for all bars they checked into
      const votedBarIds = new Set(userVotes.map(b => b.id));
      const allVoted = [...checkedInBarIds].every(barId => votedBarIds.has(barId));
      if (allVoted && checkinCount >= 3) { // Require at least 3 bars
        unlockAchievement('food_critic', language);
      }
    }
    
    // 9. Sommelier - Tried all 4 drink types
    // Since we track drinks per bar, we check if user has drinks at 4+ different bars as proxy
    // A better implementation would add a drink_type column to consumption
    const barsWithDrinks = new Set(
      userConsumption
        .filter(c => c.type === 'drink' && c.count > 0 && c.bar_id !== null)
        .map(c => c.bar_id)
    );
    if (barsWithDrinks.size >= 4 && !isUnlocked('sommelier')) {
      unlockAchievement('sommelier', language);
    }
    
    // Update refs for next comparison
    prevDrinks.current = drinks;
    prevCheckins.current = checkinCount;
    
  }, [
    currentUser,
    consumption,
    checkins,
    bars,
    getTotalParticipantConsumption,
    getBarVotes,
    unlockAchievement,
    isUnlocked,
    language,
  ]);
}
