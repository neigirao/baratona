import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { normalizeSlug } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { useSeo } from '@/hooks/useSeo';
import { createEventApi, ensureProfile, findEventBySlugApi, isReservedSlug } from '@/lib/platformApi';

export default function CreateEvent() {
  useSeo('Criar baratona | Baratona Platform', 'Crie sua baratona com login Google e compartilhe por slug.');
  const { user, loading, signInWithGoogle, signOut } = usePlatformAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Rio de Janeiro');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug) return;
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
      const newEvent = await createEventApi({
        slug,
        name,
        description,
        city,
        visibility,
        eventType: 'open_baratona',
        ownerId: user.id,
        ownerName: user.user_metadata?.full_name || user.email || 'Organizador',
      });

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
        <Button variant="outline" onClick={signOut}>Sair</Button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 border rounded-xl p-6">
        <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
        <div><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} required /></div>
        <div><Label>Slug</Label><Input value={slug} readOnly /></div>
        <div>
          <Label>Visibilidade</Label>
          <div className="flex gap-2 mt-2">
            <Button type="button" variant={visibility === 'public' ? 'default' : 'outline'} onClick={() => setVisibility('public')}>Pública</Button>
            <Button type="button" variant={visibility === 'private' ? 'default' : 'outline'} onClick={() => setVisibility('private')}>Privada</Button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Criando...' : 'Criar evento'}</Button>
      </form>
    </div>
  );
}
