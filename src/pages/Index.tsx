import { useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { ParticipantSelector } from '@/components/ParticipantSelector';
import { Header } from '@/components/Header';
import { MainTabs } from '@/components/MainTabs';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SyncIndicator } from '@/components/SyncIndicator';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { BaratonaWrapped } from '@/components/BaratonaWrapped';
import { QuickAddFAB } from '@/components/QuickAddFAB';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';

export default function Index() {
  const { currentUser, secondsAgo, isRefreshing, refreshAll, appConfig } = useBaratona();
  const [showWrapped, setShowWrapped] = useState(false);
  
  // Auto-check and unlock achievements
  useAchievementChecker();
  
  if (!currentUser) {
    return <ParticipantSelector />;
  }
  
  // Show Wrapped view when event is finished
  if (appConfig?.status === 'finished') {
    return <BaratonaWrapped />;
  }

  // Show Wrapped preview on demand
  if (showWrapped) {
    return <BaratonaWrapped onClose={() => setShowWrapped(false)} />;
  }
  
  return (
    <>
      <OfflineIndicator />
      <OnboardingOverlay />
      <PullToRefresh onRefresh={refreshAll} className="min-h-screen bg-background">
        <Header onShowWrapped={() => setShowWrapped(true)} />
        
        <main className="container max-w-lg mx-auto px-4 py-4 pb-24">
          {/* Sync Indicator */}
          <div className="flex justify-center mb-3">
            <SyncIndicator secondsAgo={secondsAgo} isRefreshing={isRefreshing} />
          </div>
          
          <MainTabs />
        </main>
      </PullToRefresh>
      
      {/* Quick Add FAB */}
      <QuickAddFAB />
    </>
  );
}