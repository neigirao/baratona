import { useState, useEffect } from 'react';
import { MapPin, Beer, Star, X } from 'lucide-react';
import { useBaratona } from '@/contexts/BaratonaContext';

const ONBOARDING_KEY = 'baratona_onboarding_completed';

interface OnboardingStep {
  icon: React.ElementType;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: MapPin,
    titlePt: 'Faça check-in',
    titleEn: 'Check in',
    descPt: 'Quando chegar em cada bar, toque em "Cheguei!" para marcar sua presença.',
    descEn: 'When you arrive at each bar, tap "I arrived!" to mark your presence.',
    color: 'text-baratona-green',
  },
  {
    icon: Beer,
    titlePt: 'Registre suas bebidas',
    titleEn: 'Log your drinks',
    descPt: 'Toque nos tipos de bebida para contar. Use o botão flutuante (+) para acesso rápido!',
    descEn: 'Tap drink types to count. Use the floating button (+) for quick access!',
    color: 'text-primary',
  },
  {
    icon: Star,
    titlePt: 'Avalie os bares',
    titleEn: 'Rate the bars',
    descPt: 'Dê notas para bebida, comida, vibe e atendimento de cada bar visitado.',
    descEn: 'Rate drinks, food, vibe, and service at each visited bar.',
    color: 'text-secondary',
  },
];

export function OnboardingOverlay() {
  const { language } = useBaratona();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Delay a bit to let the app load
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 relative">
        {/* Close button */}
        <button 
          onClick={handleComplete}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className={`inline-flex p-4 rounded-full bg-muted ${step.color}`}>
            <Icon className="w-8 h-8" />
          </div>

          <h3 className="font-display text-xl font-bold text-foreground">
            {language === 'pt' ? step.titlePt : step.titleEn}
          </h3>

          <p className="text-muted-foreground text-sm">
            {language === 'pt' ? step.descPt : step.descEn}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold transition-all active:scale-95"
        >
          {currentStep < STEPS.length - 1 
            ? (language === 'pt' ? 'Próximo' : 'Next')
            : (language === 'pt' ? 'Entendi!' : 'Got it!')
          }
        </button>
      </div>
    </div>
  );
}
