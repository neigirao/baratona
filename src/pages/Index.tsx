import { useBaratona } from '@/contexts/BaratonaContext';
import { ParticipantSelector } from '@/components/ParticipantSelector';
import { Header } from '@/components/Header';
import { Baratometro } from '@/components/Baratometro';
import { VanStatus } from '@/components/VanStatus';
import { BaratonaMap } from '@/components/BaratonaMap';
import { ConsumptionCounter } from '@/components/ConsumptionCounter';
import { VoteForm } from '@/components/VoteForm';
import { BarItinerary } from '@/components/BarItinerary';

export default function Index() {
  const { currentUser } = useBaratona();
  
  if (!currentUser) {
    return <ParticipantSelector />;
  }
  
  return (
    <div className="min-h-screen bg-background pb-6">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Baratômetro */}
        <Baratometro />
        
        {/* Van Status */}
        <VanStatus />
        
        {/* Interactive Map */}
        <BaratonaMap />
        
        {/* Consumption Counter */}
        <ConsumptionCounter />
        
        {/* Vote Form */}
        <VoteForm />
        
        {/* Bar Itinerary */}
        <BarItinerary />
      </main>
    </div>
  );
}
