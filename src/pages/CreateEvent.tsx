import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { normalizeSlug } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useSeo } from '@/hooks/useSeo';
import { createEventApi, ensureProfile, findEventBySlugApi, isReservedSlug, type EventBar } from '@/lib/platformApi';
import { getUserBarCatalogApi, type CatalogBar } from '@/lib/api';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2, MapPin, Plus, Trash2, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

type BarDraft = Omit<EventBar, 'id' | 'eventId'>;

export default function CreateEvent() {
  useSeo('Criar baratona | Baratona Platform', 'Crie sua baratona com login Google, adicione bares e compartilhe.');
  const { user, loading, signInWithGoogle } = usePlatformAuth();
  const { isSuperAdmin } = usePlatformAdmin();
  const navigate = useNavigate();

  // Temp ID used only for image upload path before event is created
  const [tempId] = useState(() => crypto.randomUUID());

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Rio de Janeiro');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [eventType, setEventType] = useState<'open_baratona' | 'special_circuit'>('open_baratona');
  const [bars, setBars] = useState<BarDraft[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved'>('idle');
  const [catalog, setCatalog] = useState<CatalogBar[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const slug = useMemo(() => normalizeSlug(name), [name]);
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlug = useCallback(async (s: string) => {
    if (!s) { setSlugStatus('idle'); return; }
    if (isReservedSlug(s)) { setSlugStatus('reserved'); return; }
    setSlugStatus('checking');
    const existing = await findEventBySlugApi(s).catch(() => null);
    setSlugStatus(existing ? 'taken' : 'available');
  }, []);

  useEffect(() => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(() => checkSlug(slug), 500);
    return () => { if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current); };
  }, [slug, checkSlug]);

  useEffect(() => {
    if (!user) return;
    setCatalogLoading(true);
    getUserBarCatalogApi(user.id)
      .then(setCatalog)
      .finally(() => setCatalogLoading(false));
  }, [user]);

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

  const addFromCatalog = (cat: CatalogBar) => {
    setBars((prev) => [
      ...prev,
      {
        name: cat.name,
        address: cat.address,
        barOrder: prev.length + 1,
        scheduledTime: cat.scheduledTime ?? '18:00',
      },
    ]);
  };

  const moveBar = (index: number, direction: 'up' | 'down') => {
    setBars((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((b, i) => ({ ...b, barOrder: i + 1 }));
    });
  };

  const canProceedStep1 = name.trim() && slug && city.trim() && slugStatus !== 'taken' && slugStatus !== 'reserved' && slugStatus !== 'checking';
  // Bars are optional — allow 0 or require filled fields if any were added
  const canProceedStep2 = bars.length === 0 || bars.every((b) => b.name.trim());

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canProceedStep2) return;
    if (slugStatus === 'reserved') {
      toast({ title: 'Slug reservado', description: 'Esse slug não pode ser usado. Ajuste o nome da baratona.', variant: 'destructive' });
      return;
    }
    if (slugStatus === 'taken') {
      toast({ title: 'Slug já existe', description: 'Já existe uma baratona com esse nome. Tente um nome diferente.', variant: 'destructive' });
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
          eventDate: eventDate || null,
          coverImageUrl: coverImageUrl || null,
        },
        bars
      );
      toast({ title: 'Baratona criada!', description: 'Agora configure os detalhes no painel de admin.' });
      navigate(`/baratona/${newEvent.slug}/admin`);
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar', description: err instanceof Error ? err.message : 'Não foi possível criar a baratona agora.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Criar baratona</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Dados gerais', 'Bares do roteiro', 'Revisão'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i + 1 ? 'bg-baratona-green text-white' :
              step === i + 1 ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
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
            <div><Label>Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte o que rola nessa baratona..." /></div>
            <div><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required /></div>
            <div>
              <Label>Slug (URL)</Label>
              <div className="relative">
                <Input value={slug} readOnly className="text-muted-foreground pr-8" />
                {slugStatus === 'checking' && <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
                {slugStatus === 'available' && <CheckCircle2 className="absolute right-2.5 top-2.5 w-4 h-4 text-green-500" />}
                {(slugStatus === 'taken' || slugStatus === 'reserved') && <AlertCircle className="absolute right-2.5 top-2.5 w-4 h-4 text-destructive" />}
              </div>
              {slugStatus === 'taken' && <p className="text-xs text-destructive mt-1">Slug já existe. Tente um nome diferente.</p>}
              {slugStatus === 'reserved' && <p className="text-xs text-destructive mt-1">Esse slug é reservado e não pode ser usado.</p>}
            </div>
            <div><Label>Data do evento</Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>

            {/* Cover image */}
            <div>
              <Label>Imagem de capa <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <div className="mt-2">
                <ImageUploader
                  bucket="event-covers"
                  eventId={tempId}
                  value={coverImageUrl}
                  onChange={setCoverImageUrl}
                  label=""
                />
              </div>
            </div>

            {/* Event type — super admin only */}
            {isSuperAdmin && (
              <div>
                <Label>Tipo de evento</Label>
                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" variant={eventType === 'open_baratona' ? 'default' : 'outline'} onClick={() => setEventType('open_baratona')}>Baratona aberta</Button>
                  <Button type="button" size="sm" variant={eventType === 'special_circuit' ? 'default' : 'outline'} onClick={() => setEventType('special_circuit')}>Circuito especial</Button>
                </div>
              </div>
            )}

            <div>
              <Label>Visibilidade</Label>
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" variant={visibility === 'public' ? 'default' : 'outline'} onClick={() => setVisibility('public')}>Pública</Button>
                <Button type="button" size="sm" variant={visibility === 'private' ? 'default' : 'outline'} onClick={() => setVisibility('private')}>Privada</Button>
              </div>
            </div>
            <Button className="w-full" disabled={!canProceedStep1} onClick={() => setStep(2)}>
              Próximo: Bares do roteiro <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Bars (optional) */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bares do roteiro</CardTitle>
            <p className="text-sm text-muted-foreground">Adicione os bares agora ou depois pelo painel de admin.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Catalog — bars used in previous events */}
            {(catalogLoading || catalog.length > 0) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Bares cadastrados por você
                </p>
                {catalogLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando catálogo...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {catalog.map((cat) => {
                      const alreadyAdded = bars.some(
                        (b) => b.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
                      );
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => addFromCatalog(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            alreadyAdded
                              ? 'border-success/40 bg-success/10 text-success cursor-default'
                              : 'border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary cursor-pointer'
                          }`}
                        >
                          {alreadyAdded ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {bars.map((bar, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <Button variant="ghost" size="icon" className="h-5 w-6 p-0" disabled={i === 0} onClick={() => moveBar(i, 'up')}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-6 p-0" disabled={i === bars.length - 1} onClick={() => moveBar(i, 'down')}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <span className="text-sm font-bold text-primary">Bar #{bar.barOrder}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeBar(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nome</Label><Input value={bar.name} onChange={(e) => updateBar(i, 'name', e.target.value)} placeholder="Nome do bar" /></div>
                  <div><Label className="text-xs">Horário previsto</Label><Input type="time" value={bar.scheduledTime ?? ''} onChange={(e) => updateBar(i, 'scheduledTime', e.target.value)} /></div>
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
              {coverImageUrl && (
                <img src={coverImageUrl} alt="Capa" className="w-full h-36 object-cover rounded-lg" />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <p className="text-muted-foreground">Nome:</p><p className="font-medium">{name}</p>
                <p className="text-muted-foreground">Slug:</p><p className="font-medium">/{slug}</p>
                <p className="text-muted-foreground">Cidade:</p><p className="font-medium">{city}</p>
                <p className="text-muted-foreground">Visibilidade:</p><p className="font-medium">{visibility === 'public' ? 'Pública' : 'Privada'}</p>
                {isSuperAdmin && (
                  <><p className="text-muted-foreground">Tipo:</p><p className="font-medium">{eventType === 'open_baratona' ? 'Baratona aberta' : 'Circuito especial'}</p></>
                )}
                <p className="text-muted-foreground">Bares:</p><p className="font-medium">{bars.length > 0 ? bars.length : 'Nenhum (adicionar depois)'}</p>
              </div>

              {bars.length > 0 && (
                <div className="border-t border-border/50 pt-3">
                  <p className="font-semibold mb-2">Roteiro</p>
                  {bars.map((b) => (
                    <div key={b.barOrder} className="flex items-center gap-2 py-1">
                      <span className="text-xs font-bold text-primary w-6">#{b.barOrder}</span>
                      <span>{b.name}</span>
                      {b.scheduledTime && <span className="text-muted-foreground text-xs">— {b.scheduledTime}</span>}
                    </div>
                  ))}
                </div>
              )}

              {description && <p className="text-xs text-muted-foreground">{description}</p>}

              {bars.filter((b) => b.name && b.address).length >= 2 && (
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> Mapa do roteiro
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/${bars
                      .filter((b) => b.name && b.address)
                      .map((b) => encodeURIComponent(`${b.name}, ${b.address}`))
                      .join('/')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    Ver rota com {bars.filter((b) => b.name && b.address).length} paradas no Google Maps
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Editar bares
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : 'Criar baratona'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
