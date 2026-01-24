import { useBaratona } from '@/contexts/BaratonaContext';
import { ParticipantSelector } from '@/components/ParticipantSelector';
import { Header } from '@/components/Header';
import { MainTabs } from '@/components/MainTabs';

export default function Index() {
  const { currentUser } = useBaratona();
  
  if (!currentUser) {
    return <ParticipantSelector />;
  }
  
  return (
    <div className="min-h-screen bg-background pb-6">
      <Header />
      
      <main className="container max-w-lg mx-auto px-4 py-4">
        <MainTabs />
      </main>
    </div>
  );
}