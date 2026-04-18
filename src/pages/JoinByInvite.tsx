import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, KeyRound, Loader2 } from 'lucide-react';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { redeemInviteApi } from '@/lib/platformApi';
import { toast } from '@/hooks/use-toast';
import { useSeo } from '@/hooks/useSeo';

export default function JoinByInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = usePlatformAuth();
  const [code, setCode] = useState(params.get('code') || '');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useSeo('Entrar com código | Baratona', 'Use seu código de convite para entrar em uma baratona privada.');

  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.user_metadata?.full_name || user.email || '');
    }
  }, [user, displayName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Faça login para continuar', variant: 'destructive' });
      return;
    }
    if (!code.trim()) {
      toast({ title: 'Digite o código', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { slug } = await redeemInviteApi(code, displayName || 'Participante');
      toast({ title: 'Você entrou na baratona! 🎉' });
      navigate(`/baratona/${slug}`);
    } catch (err) {
      toast({
        title: 'Erro ao entrar',
        description: err instanceof Error ? err.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> Entrar com código
          </h1>
        </div>

        <Card>
          <CardContent className="py-6 space-y-4">
            {!user ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Faça login para usar seu código de convite.
                </p>
                <Button onClick={signInWithGoogle} className="w-full">
                  Entrar com Google
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de convite</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: AB12CD"
                    maxLength={12}
                    autoCapitalize="characters"
                    className="font-mono text-lg tracking-widest text-center uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Como quer aparecer no evento?</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validando...</> : 'Entrar na baratona'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Não tem código?{' '}
          <Link to="/explorar" className="text-primary underline">Explore baratonas públicas</Link>
        </p>
      </div>
    </div>
  );
}
