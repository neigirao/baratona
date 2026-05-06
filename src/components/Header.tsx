import { useContext } from 'react';
import { useTheme } from 'next-themes';
import { BaratonaContext } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Globe, PartyPopper, ShieldCheck, LogIn, LogOut, Menu, Settings, HelpCircle, ListChecks, KeyRound, User, Sun, Moon } from 'lucide-react';
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
  const { theme, setTheme } = useTheme();
  const { slug } = useParams<{ slug?: string }>();
  const adminPath = slug ? `/baratona/${slug}/admin` : '/admin';
  const displayName = (platformUser?.user_metadata?.full_name as string)?.split(' ')[0]
    ?? platformUser?.email
    ?? null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Pular para o conteúdo
      </a>
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      {/* Broadcast Banner */}
      {appConfig?.broadcast_msg && (
        <div role="status" aria-live="polite" className="w-full bg-destructive/20 border-b border-destructive/50 px-4 py-2">
          <p className="text-center text-sm font-medium text-destructive animate-pulse">
            📢 {appConfig.broadcast_msg}
          </p>
        </div>
      )}

      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group" aria-label="Baratona — início">
          <span className="font-display text-2xl tracking-[3px] text-primary group-hover:text-primary-light transition-colors">BARATONA</span>
          <span className="text-[10px] font-display tracking-widest text-foreground-2 border border-border rounded-sm px-1 py-0.5">2026</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Wrapped Preview */}
          {onShowWrapped && (
            <Button variant="ghost" size="sm" onClick={onShowWrapped} className="h-8 w-8 p-0 text-primary" aria-label="Retrospectiva">
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

          {/* Dark/light mode toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 p-0"
            aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          {/* High contrast */}
          <HighContrastToggle />

          {/* Main navigation menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="Abrir menu">
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

              {/* Super admin */}
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
    </>
  );
}