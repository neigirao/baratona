import { useState, useCallback } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { useCheckins } from '@/hooks/useCheckins';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Beer, Compass } from 'lucide-react';

// Tab: Agora (Now)
import { VanStatus } from '@/components/VanStatus';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BarCheckin } from '@/components/BarCheckin';
import { NotificationPrompt } from '@/components/NotificationPrompt';

// Tab: Meu Consumo (My Consumption)
import { ConsumptionCounter } from '@/components/ConsumptionCounter';
import { Baratometro } from '@/components/Baratometro';
import { Achievements } from '@/components/Achievements';
import { ConsumptionRanking } from '@/components/ConsumptionRanking';

// Tab: Explorar (Explore)
import { BaratonaMap } from '@/components/BaratonaMap';
import { VoteForm } from '@/components/VoteForm';
import { BarItinerary } from '@/components/BarItinerary';
import { EmergencyPanel } from '@/components/EmergencyPanel';

export function MainTabs() {
  const { language, currentUser, currentBarId } = useBaratona();
  const { isCheckedIn } = useCheckins();
  const [activeTab, setActiveTab] = useState('now');
  
  // Navigate to consumption tab
  const navigateToConsumption = useCallback(() => {
    setActiveTab('consumption');
  }, []);
  
  // Check if current user is checked in at current bar
  const userIsCheckedInAtCurrentBar = currentUser && currentBarId 
    ? isCheckedIn(currentUser.id, currentBarId) 
    : false;
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4 h-14 bg-card border border-border">
        <TabsTrigger 
          value="now" 
          className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Clock className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {language === 'pt' ? 'Agora' : 'Now'}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="consumption" 
          className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Beer className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {language === 'pt' ? 'Consumo' : 'My Stats'}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="explore" 
          className="flex flex-col gap-0.5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          <Compass className="w-4 h-4" />
          <span className="text-xs font-semibold">
            {language === 'pt' ? 'Explorar' : 'Explore'}
          </span>
        </TabsTrigger>
      </TabsList>
      
      {/* Tab: Agora (Now) */}
      <TabsContent value="now" className="space-y-4 mt-0">
        {/* Notification prompt */}
        <div className="flex justify-center">
          <NotificationPrompt />
        </div>
        
        {/* Van Status */}
        <VanStatus />
        
        {/* Countdown Timer */}
        <CountdownTimer />
        
        {/* Bar Check-in */}
        <BarCheckin onCheckinSuccess={navigateToConsumption} />
        
        {/* Vote Form for current bar */}
        <VoteForm 
          isCheckedIn={userIsCheckedInAtCurrentBar} 
          onNavigateToConsumption={navigateToConsumption} 
        />
      </TabsContent>
      
      {/* Tab: Meu Consumo (My Consumption) */}
      <TabsContent value="consumption" className="space-y-4 mt-0">
        {/* Consumption Counter */}
        <ConsumptionCounter />
        
        {/* Achievements */}
        <Achievements />
        
        {/* Baratômetro */}
        <Baratometro />
        
        {/* Consumption Ranking */}
        <ConsumptionRanking />
      </TabsContent>
      
      {/* Tab: Explorar (Explore) */}
      <TabsContent value="explore" className="space-y-4 mt-0">
        {/* Interactive Map */}
        <BaratonaMap />
        
        {/* Vote Form */}
        <VoteForm isCheckedIn={userIsCheckedInAtCurrentBar} onNavigateToConsumption={navigateToConsumption} />
        
        {/* Bar Itinerary */}
        <BarItinerary onNavigateToConsumption={navigateToConsumption} />
        
        {/* Emergency Panel */}
        <EmergencyPanel />
      </TabsContent>
    </Tabs>
  );
}
