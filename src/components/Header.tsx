import { useContext } from 'react';
import { BaratonaContext } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Globe, PartyPopper, ShieldCheck, LogIn, LogOut, Menu, Settings, HelpCircle, ListChecks, KeyRound, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { LogoutConfirmDialog } from '@/components/LogoutConfirmDialog';
import { HighContrastToggle } from '@/components/HighContrastToggle';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';

export function Header({ onShowWrapped }: { onShowWrapped?: () => void }) {
  const baratona = useContext(BaratonaContext);
  const language = baratona?.language ?? 'pt';
  const setLanguage = baratona?.setLanguage ?? (() => {});
  const currentUser = baratona?.currentUser ?? null;
  const setCurrentUser = baratona?.setCurrentUser ?? (() => {});
  const isAdmin = baratona?.isAdmin ?? false;
  const appConfig = baratona?.appConfig ?? null;

  const { isSuperAdmin } = usePlatformAdmin();
  const { user: platformUser, signInWithGoogle, signOut: platformSignOut } = usePlatformAuth();
  const { slug } = useParams<{ slug?: string }>();
  const adminPath = slug ? `/baratona/${slug}/admin` : '/admin';
  const displayName = (platformUser?.user_metadata?.full_name as string)?.split(' ')[0]
    ?? platformUser?.email
    ?? null;

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
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '3px', fontSize: '24px' }} className="text-primary">BARATONA</span>
          <span className="text-xs font-display text-primary">2026</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Wrapped Preview */}
          {onShowWrapped && (
            <Button variant="ghost" size="sm" onClick={onShowWrapped} className="h-8 w-8 p-0 text-primary" title="Retrospectiva">
              <PartyPopper className="h-4 w-4" />
            </Button>
          )}

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

          {/* Main navigation menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Logged-in user info */}
              {platformUser && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2 font-normal text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {displayName ?? platformUser.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Legacy participant info */}
              {currentUser && !platformUser && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2 font-normal text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    {currentUser.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* FAQ */}
              <DropdownMenuItem asChild>
                <Link to="/faq" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" /> FAQ
                </Link>
              </DropdownMenuItem>

              {/* Entrar com código */}
              <DropdownMenuItem asChild>
                <Link to="/entrar" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Entrar com código
                </Link>
              </DropdownMenuItem>

              {/* Minhas baratonas */}
              {platformUser && (
                <DropdownMenuItem asChild>
                  <Link to="/minhas-baratonas" className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Minhas baratonas
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Event admin (legacy or platform) */}
              {(isAdmin || slug) && (
                <DropdownMenuItem asChild>
                  <Link to={adminPath} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Admin do evento
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Super admin — only for neigirao@gmail.com */}
              {isSuperAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin/plataforma" className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" /> Super admin
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Login / Logout */}
              {!platformUser && !currentUser && (
                <DropdownMenuItem onClick={() => signInWithGoogle()} className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Entrar com Google
                </DropdownMenuItem>
              )}

              {platformUser && (
                <DropdownMenuItem onClick={() => platformSignOut()} className="flex items-center gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              )}

              {currentUser && (
                <LogoutConfirmDialog
                  onConfirm={() => setCurrentUser(null)}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4" /> Sair ({currentUser.name})
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}