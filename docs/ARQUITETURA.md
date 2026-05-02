# Arquitetura da Aplicação Baratona

## 1) Visão geral

A **Baratona** é uma plataforma web mobile-first para criar e participar de roteiros de bares ("baratonas") em tempo real. Evoluiu de uma aplicação de evento único para uma plataforma multi-evento com:

- autenticação Google (Supabase Auth);
- criação de eventos públicos ou privados;
- dois tipos de evento: `open_baratona` e `special_circuit`;
- check-in, consumo, votação, ranking, conquistas e retrospectiva Wrapped;
- painel administrativo por evento;
- rota legada `/nei` restrita a super_admin;
- SEO técnico (metatags, Open Graph, schema.org, sitemap).

---

## 2) Stack técnica

### Frontend
- **React 18 + TypeScript + Vite**
- **React Router DOM v6** — roteamento com lazy loading por rota
- **TanStack Query v5** — cache de queries em páginas de listagem
- **Tailwind CSS + shadcn/ui + Radix** — UI
- **Recharts** — gráficos na retrospectiva
- **Leaflet / React-Leaflet** — mapa de bares
- **Zod** — validação de formulários

### Backend (BaaS)
- **Supabase**
  - Postgres (tabelas legadas + tabelas de plataforma `event_*`)
  - Realtime subscriptions (`postgres_changes`) por evento
  - RLS habilitado em todas as tabelas novas
  - Edge Function: `scrape-comida-di-boteco` (importação de circuito especial)

---

## 3) Estrutura de pastas

```text
src/
  components/
    ui/                     # shadcn + componentes base
    admin/                  # EventBarsEditor, EventInfoEditor, EventsPanel, RolesPanel
    special-circuit/        # BarGridCard, CircuitFiltersBar, FavoritesStickyBar
    wrapped/                # ConfettiEffect, ProgressBars, StatReveal, WrappedCard
    *.tsx                   # componentes de domínio
  contexts/
    BaratonaContext.tsx      # provider legado (tabelas participants/bars/etc.)
    EventBaratonaContext.tsx # provider de plataforma (tabelas event_*)
  hooks/
    useSupabaseData.ts       # hooks legados (participants, bars, config, votes, consumption)
    useEventData.ts          # hooks de plataforma (event_bars, event_members, etc.)
    useBaratonaComputed.ts   # lógica compartilhada entre os dois providers
    usePlatformAuth.ts       # autenticação Google via Supabase Auth
    usePlatformAdmin.ts      # verificação de super_admin
    useCheckins.ts           # check-ins legados
    useAchievements.ts       # conquistas legadas
    useAchievementChecker.ts # motor de regras de conquistas
    useSyncStatus.ts         # indicador de sincronização
    useRetry.ts              # retry com backoff exponencial
    useSeo.ts                # injeção de metatags + JSON-LD
    useNotifications.ts      # notificações do browser
  integrations/supabase/
    client.ts                # client Supabase (anon key)
    types.ts                 # tipos gerados pelo Supabase CLI
  lib/
    constants.ts             # PLATFORM_BASE_URL, PLATFORM_OG_IMAGE, FEATURED_EVENT_SLUG, i18n
    platformEvents.ts        # tipos PlatformEvent, EventType, EventVisibility
    platformApi.ts           # barrel deprecated → aponta para lib/api
    api/
      client.ts              # supabase client + isReservedSlug
      events.ts              # CRUD de eventos (listagens via RPC p/ evitar N+1)
      bars.ts                # CRUD de event_bars + favorites + createFromFavorites
      members.ts             # join, isMember, ensureProfile, isSuperAdmin
      votes.ts               # getDishRatings
      invites.ts             # create/list/delete/redeem convites
      admin.ts               # listagem/gestão de plataforma (super_admin)
      mappers.ts             # mapEventRow, mapBarRow, mapEnrichedEventRow
    legacyMode.ts            # flag isLegacyReadOnly() para /nei
    analytics.ts             # track() via window.gtag
    errorMessages.ts
    utils.ts
  pages/
    Home.tsx                 # landing institucional + featured events
    FAQ.tsx                  # perguntas frequentes (schema FAQPage)
    Explore.tsx              # listagem pública com filtros + paginação
    CreateEvent.tsx          # wizard de criação de baratona
    JoinByInvite.tsx         # entrada por código de convite
    MyBaratonas.tsx          # eventos do usuário + paginação
    EventLanding.tsx         # página pública do evento
    EventLive.tsx            # experiência ao vivo (EventBaratonaProvider)
    EventAdmin.tsx           # painel de operação do evento
    PlatformAdmin.tsx        # admin global da plataforma (super_admin)
    NeiLegacy.tsx            # evento legado (BaratonaProvider + guard super_admin)
    Admin.tsx                # painel legado (BaratonaProvider)
    Index.tsx                # app legado principal
    NotFound.tsx
supabase/
  migrations/               # versionamento de schema
  functions/
    scrape-comida-di-boteco/ # Edge Function de importação de circuito
```

---

## 4) Dois contextos de execução

### 4.1 Contexto legado (`/nei`, `/admin`)

Usa `BaratonaProvider` + hooks legados (`useSupabaseData`, `useCheckins`, `useAchievements`), que acessam as tabelas originais: `participants`, `bars`, `app_config`, `votes`, `consumption`, `checkins`, `achievements`.

O modo `/nei` ativa `setLegacyReadOnly(true)` — todos os hooks legados bloqueiam escrita e exibem toast informativo.

### 4.2 Contexto de plataforma (`/baratona/:slug/*`)

Usa `EventBaratonaProvider`, que implementa a **mesma interface** `BaratonaContext` para que todos os componentes de domínio funcionem sem modificação. Os dados vêm das tabelas `event_*` filtradas por `event_id`.

**Por que o cast `as any`?** IDs de bar no contexto de plataforma são UUIDs (`string`), enquanto o tipo original usa `number`. O cast é isolado em `EventBaratonaContext.tsx:157` e documentado.

### 4.3 Hook compartilhado

`useBaratonaComputed` (novo) contém `getProjectedTime`, `getCurrentBar` e `getNextBar` — usados por ambos os providers sem duplicação.

---

## 5) Arquitetura de rotas

```text
/                           Home institucional
/faq                        FAQ
/explorar                   Listagem pública (paginada, com filtros)
/criar                      Wizard de criação (requer login)
/entrar                     Entrada por código de convite
/minhas-baratonas           Eventos do usuário logado (paginado)
/baratona/:slug             Landing pública do evento
/baratona/:slug/live        Modo ao vivo (EventBaratonaProvider)
/baratona/:slug/admin       Painel do organizador
/admin/plataforma           Admin global (super_admin)
/admin                      Painel legado (BaratonaProvider)
/nei                        Evento legado (super_admin only, noindex)
```

Todas as rotas secundárias são lazy-loaded via `React.lazy` + `Suspense`.

---

## 6) Modelo de dados

### 6.1 Tabelas de plataforma (novas)

| Tabela | Descrição |
|---|---|
| `profiles` | Perfil do usuário (vinculado a `auth.users`) |
| `platform_roles` | Papéis globais (`super_admin`) |
| `events` | Evento/baratona (slug único, visibilidade, tipo) |
| `event_members` | Participantes + papel (`event_owner`, `participant`) |
| `event_bars` | Bares do evento com coordenadas, prato em destaque |
| `event_app_config` | Configuração operacional por evento (singleton) |
| `event_votes` | Votos por usuário + bar (upsert por `event_id,user_id,bar_id`) |
| `event_consumption` | Consumo por usuário + bar + tipo |
| `event_checkins` | Check-ins por usuário + bar |
| `event_achievements` | Conquistas desbloqueadas |
| `event_invites` | Códigos de convite com limite de usos e expiração |
| `event_bar_favorites` | Favoritos de bar por usuário (para circuitos especiais) |

### 6.2 Tabelas legadas (mantidas)

`participants`, `bars`, `app_config`, `votes`, `consumption`, `checkins`, `achievements`

### 6.3 RPCs principais

| RPC | Finalidade |
|---|---|
| `get_public_events_with_counts` | Listagem pública com bar_count + member_count em 1 query |
| `get_events_by_owner` | Eventos do owner com contagens (substitui N+1) |
| `get_events_joined_by_user` | Eventos em que o usuário participa com contagens |
| `get_bar_favorite_counts` | Contagem de favoritos por bar |
| `create_baratona_from_favorites` | Cria evento a partir de bares favoritos de um circuito |
| `redeem_event_invite` | Valida e resgata código de convite |

---

## 7) Camada de API (`src/lib/api/`)

Módulos independentes re-exportados por `src/lib/api/index.ts` (e por `platformApi.ts` como barrel deprecated):

- `events.ts` — CRUD de eventos, usa RPCs para listagens (sem N+1)
- `bars.ts` — CRUD de `event_bars`, toggle de favoritos, `createBaratonaFromFavoritesApi`
- `members.ts` — join, isMember, `ensureProfile`, `isSuperAdminApi`
- `votes.ts` — `getDishRatingsApi`
- `invites.ts` — criar/listar/deletar/resgatar convites com mensagens de erro distintas por tipo de falha
- `admin.ts` — operações de platform admin
- `mappers.ts` — `mapEventRow`, `mapBarRow`, `mapEnrichedEventRow`
- `client.ts` — instância do Supabase + `isReservedSlug`

---

## 8) Diagrama textual de componentes

```text
main.tsx
  └── App.tsx
      ├── QueryClientProvider
      ├── AppErrorBoundary
      ├── TooltipProvider + Toasters
      └── BrowserRouter
          ├── BackendHealthBanner        ← dentro do router (acesso a useLocation)
          └── Suspense (lazy routes)
              ├── /             → Home
              ├── /faq          → FAQ
              ├── /explorar     → Explore
              ├── /criar        → CreateEvent
              ├── /entrar       → JoinByInvite
              ├── /minhas-baratonas → MyBaratonas
              ├── /baratona/:slug → EventLanding
              ├── /baratona/:slug/live
              │     └── EventBaratonaProvider
              │           └── EventLiveInner (Header + MainTabs + QuickAddFAB)
              ├── /baratona/:slug/admin
              │     └── EventBaratonaProvider
              │           └── EventAdminInner
              ├── /admin/plataforma → PlatformAdmin (super_admin guard)
              ├── /admin
              │     └── BaratonaProvider (legado)
              │           └── Admin
              ├── /nei
              │     └── BaratonaProvider (legado, readOnly=true)
              │           └── NeiLegacy (super_admin guard)
              └── * → NotFound
```

---

## 9) Fluxos principais

### 9.1 Criar e participar de evento (plataforma)
1. Usuário faz login com Google (`usePlatformAuth` → Supabase Auth OAuth).
2. `ensureProfile` cria/atualiza `profiles`.
3. Wizard `/criar` chama `createEventApi` (insere `events` + `event_members` + `event_app_config`).
4. Evento recebe slug único; organizador acessa `/baratona/:slug/admin`.
5. Participante entra via link público ou código de convite (`redeemInviteApi`).
6. Modo ao vivo em `/baratona/:slug/live` usa `EventBaratonaProvider`.

### 9.2 Circuito especial (ex.: Comida di Buteco)
1. Evento criado com `event_type = 'special_circuit'`.
2. Admin pode importar bares via Edge Function `scrape-comida-di-boteco`.
3. `SpecialCircuitLanding` exibe grid com filtros (bairro, busca, favoritos).
4. Usuário marca favoritos (`toggleBarFavoriteApi`) e cria sua baratona via `createBaratonaFromFavoritesApi` (RPC, mín. 3 / máx. 15 bares).

### 9.3 Sincronização em tempo real
Cada hook em `useEventData.ts` abre um canal Supabase Realtime filtrado por `event_id`. Ao detectar mudança, executa refetch. Combinado com atualização otimista + retry (`useRetry`), garante UX fluida mesmo com conectividade instável.

### 9.4 Retrospectiva (Wrapped)
Quando `event_app_config.status = 'finished'`, `EventLive` exibe botão para `EventWrapped`. Métricas são calculadas client-side a partir de consumo, check-ins, votos e conquistas.

---

## 10) Segurança e RLS

| Tabela | SELECT | INSERT | UPDATE/DELETE |
|---|---|---|---|
| `events` | público (visibility=public) ou membro/owner/super_admin | `owner_user_id = auth.uid()` | owner ou super_admin |
| `event_members` | membros do evento | usuário logado + (evento público OU owner OU convite válido) | — |
| `event_bars` | membros | owner | owner |
| `event_*` (config, votes, etc.) | membros | próprio user_id | próprio user_id |
| `profiles` | público | `auth.uid() = id` | `auth.uid() = id` |
| `platform_roles` | próprio user_id | — | — |

**Atenção**: tabelas legadas (`bars`, `participants`, `consumption`, etc.) têm RLS permissivo. A proteção de escrita no `/nei` é feita via `isLegacyReadOnly()` no frontend.

---

## 11) Observabilidade e confiabilidade

- `AppErrorBoundary` previne crash total da UI.
- `useRetry` com backoff exponencial em todas as operações críticas (3 tentativas, base 1s).
- `BackendHealthBanner` detecta indisponibilidade do Supabase e alerta o usuário.
- `OfflineIndicator` detecta perda de conexão de rede.
- `analytics.ts` registra eventos de comportamento via `track()`.

---

## 12) Constantes de plataforma (`src/lib/constants.ts`)

| Constante | Uso |
|---|---|
| `PLATFORM_BASE_URL` | URL base dinâmica (window.location.origin em runtime) |
| `PLATFORM_OG_IMAGE` | Imagem padrão para Open Graph |
| `FEATURED_EVENT_SLUG` | Slug do evento em destaque na home |

---

## 13) Guia para novos contribuidores

1. Leia `src/App.tsx` para entender as rotas e os dois contextos.
2. Para funcionalidades de evento, explore `src/contexts/EventBaratonaContext.tsx` e `src/hooks/useEventData.ts`.
3. Para a experiência legada (`/nei`), explore `src/contexts/BaratonaContext.tsx` e `src/hooks/useSupabaseData.ts`.
4. A camada de API está em `src/lib/api/` — cada módulo tem responsabilidade única.
5. Migrations em `supabase/migrations/` são a fonte de verdade do schema.
6. Para adicionar um novo fluxo de evento, siga o padrão de `useEventData.ts`: fetch inicial + realtime channel + refetch.

---

## 14) Roadmap técnico

### Curto prazo
- Testes de integração dos hooks de plataforma (`useEventConsumption`, `useEventCheckins`).
- Substituir `as any` em `EventBaratonaContext` com tipos de interseção explícitos.
- Adicionar `is_featured` na tabela `events` para eliminar o `FEATURED_EVENT_SLUG` hardcoded.

### Médio prazo
- Mover agregações de Wrapped para SQL views/materialized views.
- Adicionar `event_admin` delegado (v2) com política RLS própria.
- Observabilidade centralizada (Sentry ou LogRocket).

### Longo prazo
- Extração de camada de serviços para desacoplar Context da lógica de negócio.
- Backend dedicado para regras sensíveis (rate limiting, anti-spam, moderação).
- Suporte a multi-organização com billing por plano.
