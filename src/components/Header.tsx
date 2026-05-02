import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Globe, Settings, PartyPopper, KeyRound, ShieldCheck, LogIn } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { HighContrastToggle } from '@/components/HighContrastToggle';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';

export function Header({ onShowWrapped }: { onShowWrapped?: () => void }) {
  const { language, setLanguage, currentUser, setCurrentUser, isAdmin, appConfig } = useBaratona();
  const { isSuperAdmin } = usePlatformAdmin();
  const { user: platformUser, signInWithGoogle, signOut: platformSignOut } = usePlatformAuth();
  const { slug } = useParams<{ slug?: string }>();
  const adminPath = slug ? `/baratona/${slug}/admin` : '/admin';
  
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
          {/* Wrapped Preview */}
          {onShowWrapped && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowWrapped}
              className="h-8 w-8 p-0 text-primary"
              title="Retrospectiva"
            >
              <PartyPopper className="h-4 w-4" />
            </Button>
          )}
          
          {/* Join with code */}
          <Link to="/entrar" title="Entrar com código">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary">
              <KeyRound className="h-4 w-4" />
            </Button>
          </Link>

          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className="h-8 px-2 gap-1.5 text-xs font-medium"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="uppercase">{language}</span>
          </Button>

          {/* High contrast */}
          <HighContrastToggle />

          {/* Platform super-admin shortcut */}
          {isSuperAdmin && (
            <Link to="/admin/plataforma" title="Admin da plataforma">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {/* Admin Button (Nei legacy) */}
          {isAdmin && (
            <Link to={adminPath}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
          
          {/* Google Sign-in (when not logged in to platform) */}
          {!platformUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signInWithGoogle()}
              className="h-8 gap-1.5 text-xs font-medium"
              title="Entrar com Google"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>
          )}

          {/* Platform user indicator */}
          {platformUser && !currentUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => platformSignOut()}
              className="h-8 px-2 text-xs"
              title={platformUser.email ?? 'Sair'}
            >
              {(platformUser.user_metadata?.full_name as string)?.split(' ')[0] ?? 'Sair'}
            </Button>
          )}

          {/* User/Logout with confirmation (legacy participant) */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                {currentUser.name}
              </span>
              <LogoutConfirmDialog onConfirm={() => setCurrentUser(null)} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}