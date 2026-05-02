import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { BaratonaProvider } from '@/contexts/BaratonaContext';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { BackendHealthBanner } from '@/components/BackendHealthBanner';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Code-splitting: heavy/secondary routes load on demand
const FAQ = lazy(() => import('./pages/FAQ'));
const Explore = lazy(() => import('./pages/Explore'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const JoinByInvite = lazy(() => import('./pages/JoinByInvite'));
const MyBaratonas = lazy(() => import('./pages/MyBaratonas'));
const EventLanding = lazy(() => import('./pages/EventLanding'));
const EventLive = lazy(() => import('./pages/EventLive'));
const EventAdmin = lazy(() => import('./pages/EventAdmin'));
const Admin = lazy(() => import('./pages/Admin'));
const PlatformAdmin = lazy(() => import('./pages/PlatformAdmin'));
const NeiLegacy = lazy(() => import('./pages/NeiLegacy'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function EventProviderShell({ children }: { children: ReactNode }) {
  return <BaratonaProvider>{children}</BaratonaProvider>;
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label="Carregando" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BackendHealthBanner />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/explorar" element={<Explore />} />
              <Route path="/criar" element={<CreateEvent />} />
              <Route path="/entrar" element={<JoinByInvite />} />
              <Route path="/minhas-baratonas" element={<MyBaratonas />} />
              <Route path="/baratona/:slug" element={<EventLanding />} />
              <Route path="/baratona/:slug/live" element={<EventLive />} />
              <Route path="/baratona/:slug/admin" element={<EventAdmin />} />
              <Route path="/admin/plataforma" element={<PlatformAdmin />} />
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AppErrorBoundary>
  </QueryClientProvider>
);

export default App;
