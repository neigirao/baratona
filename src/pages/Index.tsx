import { useBaratona } from '@/contexts/BaratonaContext';
import { ParticipantSelector } from '@/components/ParticipantSelector';
import { Header } from '@/components/Header';
import { MainTabs } from '@/components/MainTabs';
import { PullToRefresh } from '@/components/PullToRefresh';
import { SyncIndicator } from '@/components/SyncIndicator';

export default function Index() {
  const { currentUser, secondsAgo, isRefreshing, refreshAll } = useBaratona();
  
  if (!currentUser) {
    return <ParticipantSelector />;
  }
  
  return (
    <PullToRefresh onRefresh={refreshAll} className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-4 pb-6">
        {/* Sync Indicator */}
        <div className="flex justify-center mb-3">
          <SyncIndicator secondsAgo={secondsAgo} isRefreshing={isRefreshing} />
        </div>
        
        <MainTabs />
      </main>
    </PullToRefresh>
  );
}