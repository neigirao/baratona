import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  bucket: 'event-covers' | 'bar-dishes';
  eventId: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ImageUploader({ bucket, eventId, value, onChange, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: 'Imagem enviada' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro no upload';
      toast({ title: 'Falha no upload', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-24 w-24 object-cover rounded-md border" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            aria-label="Remover imagem"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <Button asChild size="sm" variant="outline" disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
              Upload
            </span>
          </Button>
        </label>
        <Input
          placeholder="ou cole uma URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="text-xs h-8"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (urlInput.trim()) {
              onChange(urlInput.trim());
              setUrlInput('');
            }
          }}
        >
          Usar URL
        </Button>
      </div>
    </div>
  );
}
