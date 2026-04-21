// Edge function: scrape Comida di Buteco RJ via Firecrawl (map + batch scrape) and populate event_bars
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_SLUG = 'comida-di-buteco-rj-2026';
const DEFAULT_LIST_URL = 'https://comidadibuteco.com.br/butecos/rio-de-janeiro/';
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v2';

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
  source_url?: string;
}

const BAR_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Nome do buteco/bar' },
    address: { type: 'string', description: 'Endereço completo (rua, número, bairro)' },
    neighborhood: { type: 'string', description: 'Bairro' },
    dish_name: { type: 'string', description: 'Nome do petisco em concurso' },
    dish_description: { type: 'string', description: 'Descrição/ingredientes do petisco' },
    dish_image_url: { type: 'string', description: 'URL absoluta da foto do petisco' },
    phone: { type: 'string', description: 'Telefone com DDD' },
    instagram: { type: 'string', description: 'Handle do Instagram (@xxx) ou URL completa' },
  },
  required: ['name'],
};

// === Firecrawl helpers ===

async function firecrawlMap(url: string, apiKey: string, search?: string): Promise<string[]> {
  const res = await fetch(`${FIRECRAWL_BASE}/map`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, search, limit: 500, includeSubdomains: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl map ${res.status}: ${JSON.stringify(data)}`);
  return Array.isArray(data?.links) ? data.links : (Array.isArray(data?.data?.links) ? data.data.links : []);
}

async function firecrawlScrapeBar(url: string, apiKey: string): Promise<ScrapedBar | null> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      formats: [
        {
          type: 'json',
          schema: BAR_SCHEMA,
          prompt:
            'Extraia os dados do buteco/bar nesta página. Capture nome do bar, endereço completo, bairro, nome e descrição do petisco em concurso, URL absoluta da foto do petisco, telefone com DDD e Instagram.',
        },
      ],
      onlyMainContent: true,
      waitFor: 1500,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.warn(`scrape ${url} failed: ${res.status}`, data);
    return null;
  }
  const json = data?.data?.json ?? data?.json ?? null;
  if (!json || !json.name) return null;
  return { ...json, source_url: url } as ScrapedBar;
}

async function firecrawlScrapeListing(url: string, apiKey: string): Promise<ScrapedBar[]> {
  // Fallback: extract a list of bars directly from the listing page
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      formats: [
        {
          type: 'json',
          schema: { type: 'object', properties: { bars: { type: 'array', items: BAR_SCHEMA } }, required: ['bars'] },
          prompt:
            'Extraia TODOS os butecos/bares participantes listados na página (não apenas alguns). Para cada um capture nome, endereço completo, bairro, nome e descrição do petisco, URL absoluta da foto, telefone e Instagram.',
        },
      ],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.warn('listing scrape failed', data);
    return [];
  }
  const json = data?.data?.json ?? data?.json ?? {};
  return Array.isArray(json?.bars) ? json.bars : [];
}

// === Geocoding ===

async function geocodeOnce(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Baratona/1.0 (contact@baratona.app)' } }
    );
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  } catch {
    return null;
  }
}

async function geocode(address: string, neighborhood?: string | null): Promise<{ lat: number; lng: number } | null> {
  const tries: string[] = [];
  if (address) tries.push(`${address}, Rio de Janeiro, Brasil`);
  if (neighborhood) tries.push(`${neighborhood}, Rio de Janeiro, Brasil`);
  for (const q of tries) {
    const r = await geocodeOnce(q);
    if (r) return r;
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim 1 req/s
  }
  return null;
}

// === Utils ===

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isBarUrl(url: string): boolean {
  // Patterns observed: /buteco/<slug>/ or /butecos/<city>/<slug>/
  // Avoid: city listings, /votar, /sobre, /regulamento, etc.
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (!u.hostname.includes('comidadibuteco.com.br')) return false;
    if (/\/(votar|sobre|regulamento|contato|imprensa|blog|noticias|ranking|vencedores|edicao)/.test(path)) return false;
    // Match individual bar pages
    if (/^\/buteco\/[a-z0-9-]+\/?$/.test(path)) return true;
    // Some sites use /butecos/<city>/<bar-slug>
    if (/^\/butecos\/[a-z0-9-]+\/[a-z0-9-]+\/?$/.test(path)) return true;
    return false;
  } catch {
    return false;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (e) {
        console.warn(`worker error at ${idx}:`, e);
        results[idx] = undefined as any;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// === Main handler ===

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let body: {
      slug?: string;
      url?: string;
      geocode?: boolean;
      onlyMissingGeo?: boolean;
      maxBars?: number;
      concurrency?: number;
      geoLimit?: number;
    } = {};
    try { body = await req.json(); } catch { /* empty body */ }

    const slug = body.slug ?? DEFAULT_SLUG;
    const listUrl = body.url ?? DEFAULT_LIST_URL;
    const doGeocode = body.geocode !== false;
    const maxBars = body.maxBars ?? 100;
    const concurrency = Math.min(body.concurrency ?? 4, 8);

    // 1. Find event
    const { data: event, error: eventErr } = await supabase
      .from('events').select('id').eq('slug', slug).maybeSingle();
    if (eventErr) throw eventErr;
    if (!event) {
      return new Response(JSON.stringify({ success: false, error: `Event '${slug}' not found.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === Mode: re-geocode existing bars only ===
    if (body.onlyMissingGeo) {
      const limit = Math.max(1, Math.min(body.geoLimit ?? 40, 120));
      const { data: missing, error } = await supabase
        .from('event_bars').select('id, name, address, neighborhood')
        .eq('event_id', event.id).is('latitude', null).limit(limit);
      if (error) throw error;
      console.log(`Re-geocoding ${missing?.length || 0} bars (limit=${limit})`);
      const results: any[] = [];
      for (const bar of missing || []) {
        const geo = await geocode(bar.address || '', bar.neighborhood);
        if (geo) {
          await supabase.from('event_bars')
            .update({ latitude: geo.lat, longitude: geo.lng }).eq('id', bar.id);
          results.push({ name: bar.name, status: 'geocoded', ...geo });
        } else {
          results.push({ name: bar.name, status: 'failed' });
        }
      }
      const ok = results.filter(r => r.status === 'geocoded').length;
      return new Response(JSON.stringify({ success: true, mode: 'geocode-only', processed: results.length, geocoded: ok, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Discover ALL listing pages: try map on root + brute-force /page/2..15
    console.log(`Discovering listing pages from ${listUrl}...`);
    let allLinks: string[] = [];
    try {
      allLinks = await firecrawlMap('https://comidadibuteco.com.br', apiKey, 'rio de janeiro');
    } catch (e) {
      console.warn('Map call failed:', e);
    }

    const baseListing = listUrl.replace(/\/$/, '');
    const basePath = new URL(baseListing).pathname.toLowerCase();
    const pageUrls = new Set<string>([listUrl]);
    for (const link of allLinks) {
      try {
        const u = new URL(link);
        if (u.pathname.toLowerCase().startsWith(basePath) && /\/page\/\d+\/?$/.test(u.pathname)) {
          pageUrls.add(u.toString());
        }
      } catch { /* ignore */ }
    }
    // Brute-force pages 2..15 in case map missed any (404s will simply return zero bars)
    for (let p = 2; p <= 15; p++) {
      pageUrls.add(`${baseListing}/page/${p}`);
    }
    const pages = Array.from(pageUrls);
    console.log(`Will scrape ${pages.length} listing pages`);

    // 3. Scrape each listing page in parallel and merge bars
    const bars: ScrapedBar[] = [];
    const seenNames = new Set<string>();
    const pageResults = await mapWithConcurrency(pages, Math.min(concurrency, 4), async (pageUrl) => {
      const list = await firecrawlScrapeListing(pageUrl, apiKey);
      console.log(`Page ${pageUrl} returned ${list.length} bars`);
      return list;
    });
    for (const list of pageResults) {
      for (const b of list || []) {
        if (!b?.name) continue;
        const key = slugify(b.name);
        if (seenNames.has(key)) continue;
        seenNames.add(key);
        bars.push(b);
        if (bars.length >= maxBars) break;
      }
      if (bars.length >= maxBars) break;
    }

    console.log(`Total bars to upsert: ${bars.length}`);

    if (bars.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No bars extracted' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Upsert each bar (geocoding sequentially due to Nominatim 1req/s)
    const results: Array<{ name: string; status: string; error?: string }> = [];
    let order = 1;
    for (const bar of bars) {
      try {
        const externalId = bar.external_id || (bar.source_url ? slugify(new URL(bar.source_url).pathname) : slugify(bar.name));
        let lat: number | null = null;
        let lng: number | null = null;
        if (doGeocode && (bar.address || bar.neighborhood)) {
          const geo = await geocode(bar.address || '', bar.neighborhood);
          if (geo) { lat = geo.lat; lng = geo.lng; }
        }

        const { data: existing } = await supabase
          .from('event_bars').select('id, latitude, longitude')
          .eq('event_id', event.id).eq('external_id', externalId).maybeSingle();

        const payload: any = {
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
          bar_order: order,
          scheduled_time: null,
        };
        // Only set coords if we got them; preserve existing on update
        if (lat !== null) { payload.latitude = lat; payload.longitude = lng; }

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
        console.error('upsert error', bar.name, msg);
        results.push({ name: bar.name, status: 'error', error: msg });
      }
    }

    const inserted = results.filter((r) => r.status === 'inserted').length;
    const updated = results.filter((r) => r.status === 'updated').length;
    const errored = results.filter((r) => r.status === 'error').length;

    return new Response(
      JSON.stringify({ success: true, count: bars.length, inserted, updated, errored, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('scrape-comida-di-boteco error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
