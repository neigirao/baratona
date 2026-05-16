import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BASE_URL = 'https://baratona.lovable.app';

const STATIC_URLS = [
  { loc: '/',               changefreq: 'weekly',  priority: '1.0' },
  { loc: '/explorar',       changefreq: 'daily',   priority: '0.9' },
  { loc: '/criar',          changefreq: 'monthly', priority: '0.7' },
  { loc: '/faq',            changefreq: 'monthly', priority: '0.6' },
  { loc: '/minhas-baratonas', changefreq: 'weekly', priority: '0.5' },
  { loc: '/entrar',         changefreq: 'monthly', priority: '0.4' },
];

const RESERVED_SLUGS = new Set(['nei', 'admin', 'plataforma', 'criar', 'explorar', 'entrar', 'faq', 'minhas-baratonas']);

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'active')
    .not('slug', 'is', null);

  const now = new Date().toISOString().split('T')[0];

  const staticEntries = STATIC_URLS.map(
    ({ loc, changefreq, priority }) =>
      `  <url>\n    <loc>${BASE_URL}${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');

  const eventEntries = (events ?? [])
    .filter(e => e.slug && !RESERVED_SLUGS.has(e.slug))
    .map(e => {
      const lastmod = e.updated_at ? e.updated_at.split('T')[0] : now;
      return [
        `  <url>\n    <loc>${BASE_URL}/baratona/${e.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`,
        `  <url>\n    <loc>${BASE_URL}/baratona/${e.slug}/live</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${eventEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
