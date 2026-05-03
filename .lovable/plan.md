Reescrever `src/pages/Home.tsx` para espelhar o mockup `Baratona_Home.html`, usando os tokens semânticos do Design System Gold Edition (já presentes em `src/index.css` e `tailwind.config.ts`).

## Estrutura nova da home
1. **Hero full-bleed** — imagem `/assets/hero-illustration.png` com parallax (translateY 35% no scroll), gradientes top/bottom + vignette, badge "Circuito Comida di Buteco RJ 2026 ativo", H1 com "Monte sua **baratona épica**", subtítulo, dois CTAs (gold "Criar minha Baratona" + ghost translúcido "Explorar baratonas"), social proof ("+2.400 baratoneiros") e — em ≥1100px — preview card de demo no canto direito (lista de bares fake, 2 visited / 1 pending).
2. **Personal rail** (apenas se logado e com eventos) — "Continue de onde parou" em grade 4 cols, mantendo a lógica atual de `listEventsByOwnerApi`/`listEventsJoinedByUserApi`.
3. **Em destaque** — eyebrow + título "Eventos pra você curtir" + link "Ver todos". Substituir o grid 3-col atual por um **banner card horizontal** por evento (logo do evento à esquerda em 130×130, infos no meio, CTA "Ver evento" à direita), com gradiente âmbar-escuro `linear-gradient(135deg,#1C1000,#2A1800,#1A0A00)` e barra lateral gold de 4px. Mantém logo Comida di Buteco para o slug famoso.
4. **Features** — 6 cards em auto-fill 280px+ com ícone em cápsula gold (44×44, bg primary/10, border primary/20), título Syne, descrição. Eyebrow "O que você ganha" + título "Tudo que você precisa pra uma **baratona épica**".
5. **Como funciona** — fundo `bg-background-2` com border-y, 3 steps com círculo gradient gold (72×72) numerado 01/02/03.
6. **CTA final** — radial gold glow centralizado, "Pronto pra montar sua rota?", botão gold "Começar agora" + ghost "Ver FAQ".
7. **Footer** — 3 colunas (Brand + Produto + Suporte), wordmark Bebas Neue, copyright + "🍺 Beba com responsabilidade".

## Regras de implementação
- **Zero hex direto**: tudo via Tailwind semântico (`bg-primary`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `shadow-gold-md/lg`, `bg-success/10`, `text-foreground-2`, `bg-background-2`, `duration-micro/ui`).
- Onde precisar de transparências dinâmicas (gradientes/sombras), usar `hsl(var(--primary) / 0.15)` etc.
- Tipografia: H1/H2/H3 com `font-heading` (Syne), wordmark com `font-display` (Bebas Neue), corpo herdado de DM Sans.
- Manter `useSeo`, `usePlatformAuth` e os hooks de listagem existentes.
- Reutilizar `comidaDiButecoLogo` de `@/assets/comida-di-buteco-logo.png` para o evento em destaque.
- Não tocar em `Header.tsx` (continua sticky por cima do hero — o hero já tem gradient top exatamente para legibilidade da nav).
- Lucide icons (Beer, MapPin, Star, Trophy, Users, Zap, ArrowRight, Sparkles, Calendar, ListChecks, Settings, ChevronRight) — substituem os SVGs inline do mockup.

## Arquivos
- `src/pages/Home.tsx` — reescrita completa.

Sem migrações, sem mudanças de rota, sem novos pacotes.