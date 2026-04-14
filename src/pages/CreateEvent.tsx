import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { normalizeSlug } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { useSeo } from '@/hooks/useSeo';
import { createEventApi, ensureProfile, findEventBySlugApi, isReservedSlug, type EventBar } from '@/lib/platformApi';
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';

type BarDraft = Omit<EventBar, 'id' | 'eventId'>;

export default function CreateEvent() {
  useSeo('Criar baratona | Baratona Platform', 'Crie sua baratona com login Google, adicione bares e compartilhe.');
  const { user, loading, signInWithGoogle, signOut } = usePlatformAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Rio de Janeiro');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [eventType, setEventType] = useState<'open_baratona' | 'special_circuit'>('open_baratona');
  const [bars, setBars] = useState<BarDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const slug = useMemo(() => normalizeSlug(name), [name]);

  if (loading) return <div className="p-8">Carregando...</div>;

  if (!user) {
    return (
      <div className="container max-w-xl mx-auto px-4 py-12 space-y-4">
        <h1 className="text-3xl font-bold">Entrar para criar</h1>
        <p className="text-muted-foreground">Para criar sua baratona você precisa entrar com Google.</p>
        <Button onClick={signInWithGoogle}>Entrar com Google</Button>
      </div>
    );
  }

  const addBar = () => {
    setBars((prev) => [
      ...prev,
      { name: '', address: '', barOrder: prev.length + 1, scheduledTime: '18:00' },
    ]);
  };

  const updateBar = (index: number, field: keyof BarDraft, value: string | number) => {
    setBars((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const removeBar = (index: number) => {
    setBars((prev) => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, barOrder: i + 1 })));
  };

  const canProceedStep1 = name.trim() && slug && description.trim() && city.trim();
  const canProceedStep2 = bars.length >= 2 && bars.every((b) => b.name.trim() && b.address.trim());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug || !canProceedStep2) return;
    if (isReservedSlug(slug)) {
      alert('Esse slug é reservado.');
      return;
    }
    const existing = await findEventBySlugApi(slug);
    if (existing) {
      alert('Slug já existe. Ajuste o nome da baratona.');
      return;
    }

    setSaving(true);
    try {
      await ensureProfile(user);
      const newEvent = await createEventApi(
        {
          slug,
          name,
          description,
          city,
          visibility,
          eventType,
          ownerId: user.id,
          ownerName: user.user_metadata?.full_name || user.email || 'Organizador',
        },
        bars
      );
      navigate(`/baratona/${newEvent.slug}`);
    } catch (err: any) {
      alert(err?.message || 'Não foi possível criar a baratona agora.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Criar baratona</h1>
        <Button variant="outline" size="sm" onClick={signOut}>Sair</Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Dados gerais', 'Bares do roteiro', 'Revisão'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i + 1 ? 'bg-primary text-primary-foreground' :
              step === i + 1 ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>{i + 1}</div>
            <span className={step === i + 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{label}</span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: General info */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div><Label>Nome da baratona</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Baratona do Centro" required /></div>
            <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte o que rola nessa baratona..." required /></div>
            <div><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required /></div>
            <div><Label>Slug (URL)</Label><Input value={slug} readOnly className="text-muted-foreground" /></div>
            <div>
              <Label>Tipo de evento</Label>
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" variant={eventType === 'open_baratona' ? 'default' : 'outline'} onClick={() => setEventType('open_baratona')}>Baratona aberta</Button>
                <Button type="button" size="sm" variant={eventType === 'special_circuit' ? 'default' : 'outline'} onClick={() => setEventType('special_circuit')}>Circuito especial</Button>
              </div>
            </div>
            <div>
              <Label>Visibilidade</Label>
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" variant={visibility === 'public' ? 'default' : 'outline'} onClick={() => setVisibility('public')}>Pública</Button>
                <Button type="button" size="sm" variant={visibility === 'private' ? 'default' : 'outline'} onClick={() => setVisibility('private')}>Privada</Button>
              </div>
            </div>
            <Button className="w-full" disabled={!canProceedStep1} onClick={() => setStep(2)}>
              Próximo: Adicionar bares <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Bars */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bares do roteiro</CardTitle>
            <p className="text-sm text-muted-foreground">Adicione pelo menos 2 bares na ordem do roteiro.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {bars.map((bar, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold text-primary">Bar #{bar.barOrder}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeBar(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nome</Label><Input value={bar.name} onChange={(e) => updateBar(i, 'name', e.target.value)} placeholder="Nome do bar" /></div>
                  <div><Label className="text-xs">Horário previsto</Label><Input type="time" value={bar.scheduledTime} onChange={(e) => updateBar(i, 'scheduledTime', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs">Endereço</Label><Input value={bar.address} onChange={(e) => updateBar(i, 'address', e.target.value)} placeholder="Rua, número, bairro" /></div>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={addBar}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar bar
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button className="flex-1" disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Revisar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revisão final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p className="text-muted-foreground">Nome:</p><p className="font-medium">{name}</p>
                <p className="text-muted-foreground">Slug:</p><p className="font-medium">/{slug}</p>
                <p className="text-muted-foreground">Cidade:</p><p className="font-medium">{city}</p>
                <p className="text-muted-foreground">Visibilidade:</p><p className="font-medium">{visibility === 'public' ? 'Pública' : 'Privada'}</p>
                <p className="text-muted-foreground">Tipo:</p><p className="font-medium">{eventType === 'open_baratona' ? 'Baratona aberta' : 'Circuito especial'}</p>
                <p className="text-muted-foreground">Bares:</p><p className="font-medium">{bars.length}</p>
              </div>

              <div className="border-t border-border/50 pt-3">
                <p className="font-semibold mb-2">Roteiro</p>
                {bars.map((b) => (
                  <div key={b.barOrder} className="flex items-center gap-2 py-1">
                    <span className="text-xs font-bold text-primary w-6">#{b.barOrder}</span>
                    <span>{b.name}</span>
                    <span className="text-muted-foreground text-xs">— {b.scheduledTime}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">{description}</p>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Editar bares
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? 'Criando...' : 'Criar baratona'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
