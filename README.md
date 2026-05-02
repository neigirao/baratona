# Baratona

Plataforma web para criar e participar de "baratonas" — roteiros de bares com check-in, consumo, votação, ranking, mapa e retrospectiva final. Funciona em tempo real, mobile-first, com autenticação Google e suporte a eventos públicos e privados.

## Sumário
- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração local](#configuração-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Modelo de dados](#modelo-de-dados)
- [Dois contextos de execução](#dois-contextos-de-execução)
- [Decisões e trade-offs](#decisões-e-trade-offs)
- [Evolução assistida por IA](#evolução-assistida-por-ia)
- [Contribuição](#contribuição)

---

## Visão geral

A Baratona é uma plataforma multi-evento onde qualquer usuário pode:

1. Criar sua própria baratona (pública ou privada) com bares, datas e roteiro.
2. Convidar amigos via link ou código.
3. Rodar o evento ao vivo: check-in, consumo, votação em tempo real.
4. Acompanhar ranking, conquistas e retrospectiva (Wrapped) ao final.

Também suporta **circuitos especiais** (ex.: Comida di Buteco) com curadoria de bares, filtros por bairro, favoritos e criação de sub-baratonas.

---

## Funcionalidades

### Participante
- Login com Google (Supabase Auth OAuth).
- Entrada em baratonas públicas ou por código de convite.
- Check-in por bar com atualização otimista.
- Contador de bebida/comida com feedback háptico.
- Votação por bar (bebida, comida, vibe, atendimento, prato em destaque).
- Conquistas automáticas com notificações toast.
- Retrospectiva pessoal e do grupo (Wrapped).

### Organizador
- Wizard de criação com seleção de visibilidade e bares.
- Painel admin: controle de status da van, atraso global, broadcast.
- Gerenciamento de bares (CRUD + reordenação).
- Geração e revogação de códigos de convite (para eventos privados).
- Retrospectiva analítica pós-evento.

### Plataforma
- Home institucional com eventos em destaque e FAQ.
- Explorar baratonas públicas com filtros e paginação.
- Rota `/nei` restrita ao super_admin (evento legado, somente leitura).
- Painel de platform admin (`/admin/plataforma`).
- SEO técnico: metatags dinâmicas, Open Graph, schema.org, sitemap, robots.

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Roteamento | React Router DOM v6 (lazy loading) |
| Cache/queries | TanStack Query v5 |
| Estilo | Tailwind CSS + shadcn/ui + Radix UI |
| Gráficos | Recharts |
| Mapa | Leaflet / React-Leaflet |
| Backend/DB | Supabase (Postgres + Realtime + RLS + Auth) |
| Testes | Vitest + Testing Library |
| Validação | Zod |

---

## Estrutura do projeto

```text
src/
  components/         # Componentes de domínio e base (shadcn)
  contexts/           # BaratonaContext (legado) + EventBaratonaContext (plataforma)
  hooks/              # Hooks de integração e regras de negócio
  integrations/       # Client e tipos gerados do Supabase
  lib/
    api/              # Camada de API modular (events, bars, members, invites, …)
    constants.ts      # PLATFORM_BASE_URL, PLATFORM_OG_IMAGE, FEATURED_EVENT_SLUG
    platformEvents.ts # Tipos PlatformEvent, EventType, EventVisibility
  pages/              # Rotas principais
supabase/
  migrations/         # Evolução do schema (fonte de verdade)
  functions/          # Edge Functions
docs/
  ARQUITETURA.md      # Documentação técnica detalhada
  AI_PLAYBOOK.md      # Playbook para evolução por IA
```

---

## Configuração local

```bash
# 1) Instalar dependências
npm install

# 2) Configurar variáveis de ambiente
cp .env.example .env
# edite .env com suas credenciais Supabase

# 3) Subir ambiente de desenvolvimento
npm run dev
```

---

## Variáveis de ambiente

```bash
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

Definidas em `src/integrations/supabase/client.ts`.

---

## Scripts

```bash
npm run dev           # desenvolvimento
npm run build         # build de produção
npm run preview       # preview local do build
npm run lint          # lint ESLint
npm run typecheck     # TypeScript sem emit
npm run test          # testes (vitest run)
npm run test:watch    # testes em watch mode
npm run check         # typecheck + lint + test + build
```

---

## Modelo de dados

### Tabelas de plataforma (multi-evento)

- `profiles` / `platform_roles`
- `events` (slug, visibility, event_type, status)
- `event_members` (event_owner | participant)
- `event_bars` (com coordenadas, prato em destaque, instagram)
- `event_app_config` (status da van, atraso, broadcast)
- `event_votes`, `event_consumption`, `event_checkins`, `event_achievements`
- `event_invites` (código, max_uses, expires_at)
- `event_bar_favorites` (para circuitos especiais)

### Tabelas legadas (evento `/nei`)

`participants`, `bars`, `app_config`, `votes`, `consumption`, `checkins`, `achievements`

Detalhes de constraints, índices e políticas RLS em `supabase/migrations/`.

---

## Dois contextos de execução

| Contexto | Rotas | Provider | Tabelas |
|---|---|---|---|
| Legado | `/nei`, `/admin` | `BaratonaProvider` | `participants`, `bars`, … |
| Plataforma | `/baratona/:slug/*` | `EventBaratonaProvider` | `event_*` |

Ambos expõem a **mesma interface** `BaratonaContext`, permitindo que os componentes de domínio funcionem sem modificação.

---

## Decisões e trade-offs

- **UI otimista + realtime**: UX rápida em rede instável; consistência eventual de curtíssimo prazo.
- **Dois providers com interface comum**: reutilização máxima de componentes sem refatoração total do legado.
- **RLS no banco**: segurança por padrão; tabelas legadas têm políticas mais permissivas (evento privado/fechado).
- **RPCs para listagens**: elimina N+1 queries em `listEventsByOwnerApi` e `listEventsJoinedByUserApi`.
- **Slug hardcoded de featured event**: solução temporária; evoluir para campo `is_featured` na tabela `events`.

---

## Evolução assistida por IA

O projeto tem infraestrutura para evolução segura por agentes:

- `AGENTS.md`: regras operacionais, contratos críticos e checklist de PR.
- `docs/AI_PLAYBOOK.md`: fluxo de execução, prompt base e definição de pronto.
- `.github/pull_request_template.md`: template padronizado de PR.
- `src/test/setup.ts` + testes em `src/hooks/*.test.ts(x)`: base de testes com Vitest/JSDOM.

Sequência recomendada antes de qualquer mudança:

1. Ler `README.md`, `docs/ARQUITETURA.md` e `AGENTS.md`.
2. Trabalhar em mudanças pequenas e reversíveis.
3. Validar: `npm run typecheck && npm run lint && npm run test && npm run build`.
4. Atualizar documentação junto com o código.

---

## Contribuição

- Guia de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Regras para agentes: [`AGENTS.md`](AGENTS.md)
- Playbook de IA: [`docs/AI_PLAYBOOK.md`](docs/AI_PLAYBOOK.md)
- CI em PR/push: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
