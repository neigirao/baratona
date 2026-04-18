import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BaratonaProvider } from '@/contexts/BaratonaContext';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Explore from './pages/Explore';
import CreateEvent from './pages/CreateEvent';
import JoinByInvite from './pages/JoinByInvite';
import EventLanding from './pages/EventLanding';
import EventLive from './pages/EventLive';
import EventAdmin from './pages/EventAdmin';
import Admin from './pages/Admin';
import NeiLegacy from './pages/NeiLegacy';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function EventProviderShell({ children }: { children: ReactNode }) {
  return (
    <BaratonaProvider>
      {children}
    </BaratonaProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/explorar" element={<Explore />} />
            <Route path="/criar" element={<CreateEvent />} />
            <Route path="/entrar" element={<JoinByInvite />} />
            <Route path="/baratona/:slug" element={<EventLanding />} />
            <Route path="/baratona/:slug/live" element={<EventLive />} />
            <Route path="/baratona/:slug/admin" element={<EventAdmin />} />
            <Route
              path="/admin"
              element={
                <EventProviderShell>
                  <Admin />
                </EventProviderShell>
              }
            />
            <Route
              path="/nei"
              element={
                <EventProviderShell>
                  <NeiLegacy />
                </EventProviderShell>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppErrorBoundary>
  </QueryClientProvider>
);

export default App;
