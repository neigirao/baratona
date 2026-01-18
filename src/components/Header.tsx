import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Globe, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { language, setLanguage, currentUser, setCurrentUser, isAdmin, appConfig, t } = useBaratona();
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Broadcast Banner */}
      {appConfig?.broadcast_msg && (
        <div className="w-full bg-destructive/20 border-b border-destructive/50 px-4 py-2">
          <p className="text-center text-sm font-medium text-destructive animate-pulse">
            📢 {appConfig.broadcast_msg}
          </p>
        </div>
      )}
      
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-gradient-yellow">
            BARATONA
          </span>
          <span className="text-xs font-display text-primary">2026</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className="h-8 w-8 p-0"
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only">Toggle language</span>
          </Button>
          
          {/* Admin Button */}
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
          
          {/* User/Logout */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                {currentUser.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentUser(null)}
                className="h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
