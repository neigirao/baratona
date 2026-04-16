// Edge function: scrape Comida di Buteco RJ via Firecrawl and populate event_bars
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_SLUG = 'comida-di-buteco-rj-2026';
const DEFAULT_URL = 'https://comidadibuteco.com.br/butecos/rio-de-janeiro/';

interface ScrapedBar {
  name: string;
  address?: string;
  neighborhood?: string;
  dish_name?: string;
  dish_description?: string;
  dish_image_url?: string;
  phone?: string;
  instagram?: string;
  external_id?: string;
}

async function firecrawlScrape(url: string, apiKey: string) {
  const schema = {
    type: 'object',
    properties: {
      bars: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do buteco/bar participante' },
            address: { type: 'string', description: 'Endereço completo (rua, número)' },
            neighborhood: { type: 'string', description: 'Bairro do bar no Rio de Janeiro' },
            dish_name: { type: 'string', description: 'Nome do petisco em concurso' },
            dish_description: { type: 'string', description: 'Descrição/ingredientes do petisco' },
            dish_image_url: { type: 'string', description: 'URL absoluta da foto do petisco' },
            phone: { type: 'string', description: 'Telefone com DDD' },
            instagram: { type: 'string', description: 'Handle do Instagram (@xxx) ou URL' },
            external_id: { type: 'string', description: 'Identificador único do bar (slug ou ID na URL)' },
          },
          required: ['name'],
        },
      },
    },
    required: ['bars'],
  };

  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: [
        {
          type: 'json',
          schema,
          prompt:
            'Extraia todos os butecos/bares participantes listados na página. Para cada um, capture nome, endereço completo, bairro, nome do petisco em concurso, descrição do petisco, URL absoluta da foto do petisco, telefone e Instagram. Use o slug da URL do bar como external_id.',
        },
      ],
      onlyMainContent: true,
      waitFor: 2500,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Firecrawl error ${res.status}: ${JSON.stringify(data)}`);
  }
  // Firecrawl v2 returns either { data: { json: {...} } } or { json: {...} }
  const json = data?.data?.json ?? data?.json ?? data?.data ?? {};
  const bars: ScrapedBar[] = Array.isArray(json?.bars) ? json.bars : [];
  return bars;
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${address}, Rio de Janeiro, Brasil`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
      headers: { 'User-Agent': 'Baratona/1.0 (contact@baratona.app)' },
    });
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  } catch {
    return null;
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole);

    let body: { slug?: string; url?: string; geocode?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine
    }
    const slug = body.slug ?? DEFAULT_SLUG;
    const url = body.url ?? DEFAULT_URL;
    const doGeocode = body.geocode !== false;

    // 1. Find event
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (eventErr) throw eventErr;
    if (!event) {
      return new Response(
        JSON.stringify({ success: false, error: `Event '${slug}' not found. Run seed migration first.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Scrape
    console.log(`Scraping ${url}...`);
    const bars = await firecrawlScrape(url, apiKey);
    console.log(`Found ${bars.length} bars`);

    if (bars.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No bars extracted from page', raw: bars }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Upsert each bar
    const results: Array<{ name: string; status: string; error?: string }> = [];
    let order = 1;
    for (const bar of bars) {
      try {
        const externalId = bar.external_id || slugify(bar.name);
        let lat: number | null = null;
        let lng: number | null = null;
        if (doGeocode && bar.address) {
          const geo = await geocode(`${bar.address}${bar.neighborhood ? ', ' + bar.neighborhood : ''}`);
          if (geo) {
            lat = geo.lat;
            lng = geo.lng;
          }
          // Nominatim rate limit: 1 req/s
          await new Promise((r) => setTimeout(r, 1100));
        }

        // Check if exists
        const { data: existing } = await supabase
          .from('event_bars')
          .select('id')
          .eq('event_id', event.id)
          .eq('external_id', externalId)
          .maybeSingle();

        const payload = {
          event_id: event.id,
          name: bar.name,
          address: bar.address || '',
          neighborhood: bar.neighborhood || null,
          featured_dish: bar.dish_name || null,
          dish_description: bar.dish_description || null,
          dish_image_url: bar.dish_image_url || null,
          phone: bar.phone || null,
          instagram: bar.instagram || null,
          external_id: externalId,
          latitude: lat,
          longitude: lng,
          bar_order: order,
          scheduled_time: null,
        };

        if (existing) {
          const { error } = await supabase.from('event_bars').update(payload).eq('id', existing.id);
          if (error) throw error;
          results.push({ name: bar.name, status: 'updated' });
        } else {
          const { error } = await supabase.from('event_bars').insert(payload);
          if (error) throw error;
          results.push({ name: bar.name, status: 'inserted' });
        }
        order++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ name: bar.name, status: 'error', error: msg });
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: bars.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('scrape-comida-di-boteco error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
