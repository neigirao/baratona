# CLAUDE.md — Baratona Platform

Guia de onboarding para agentes IA. Leia também: `docs/ARQUITETURA.md` (arquitetura completa) e `AGENTS.md` (regras de modificação segura).

## O que é este projeto

Plataforma multi-evento para "baratonas" — roteiros noturnos entre bares, com check-in, consumo, votação, ranking e mapa ao vivo. Qualquer usuário pode criar sua baratona; há também um evento legado (`/nei`) restrito a super_admin.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage)
- **State**: TanStack Query + Context API (sem Redux)
- **Roteamento**: React Router v6 com lazy loading

## Dois contextos de execução

O mesmo hook `useBaratona()` funciona em dois providers distintos:

| Provider | Rota | Banco | IDs de bar |
|---|---|---|---|
| `BaratonaProvider` | `/nei`, `/admin` | Tabelas legadas (`bars`, `participants`, etc.) | `number` |
| `EventBaratonaProvider` | `/baratona/:slug/*` | Tabelas de plataforma (`event_*`) | `string` (UUID) |

**Nunca chame hooks de dados diretamente em componentes** — sempre consuma pelo contexto. Componentes que chamarem `useCheckins()` diretamente (em vez de `useBaratona()`) usarão a tabela errada no contexto de plataforma.

## Estrutura de pastas relevante

```
src/
  contexts/
    BaratonaContext.tsx        — provider legado
    EventBaratonaContext.tsx   — provider de plataforma
  hooks/
    eventData/                 — hooks de plataforma (useEventBars, etc.)
    useCheckins.ts             — legado apenas
    useSupabaseData.ts         — legado apenas
  lib/
    api/                       — camada de serviços da plataforma
      events.ts, bars.ts, members.ts, invites.ts, votes.ts, admin.ts
      mappers.ts               — mapEventRow, mapBarRow
    platformEvents.ts          — tipos PlatformEvent, EventType, normalizeSlug
    constants.ts               — TRANSLATIONS, slugs reservados
  pages/
    EventLive.tsx              — app de evento ao vivo (usa EventBaratonaProvider)
    EventAdmin.tsx             — painel do owner
    NeiLegacy.tsx              — evento legado (usa BaratonaProvider)
  components/
    Header.tsx                 — detecta slug via useParams para link de admin correto
    QuickAddFAB.tsx            — FAB de adição rápida de bebida
    BarCheckin.tsx             — check-in/check-out por bar
```

## Comandos

```bash
npm run dev          # inicia servidor de desenvolvimento
npm run build        # build de produção
npm run typecheck    # verificação de tipos TypeScript
npm run lint         # ESLint
npm run test         # Vitest
```

## Variáveis de ambiente

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Contratos críticos

1. `BaratonaContextType` — interface compartilhada pelos dois providers. Qualquer novo campo deve ser adicionado em ambos (`BaratonaContext.tsx` e `EventBaratonaContext.tsx`).
2. `event_app_config` — tabela singleton por evento. Sempre use `upsert` com `onConflict: 'event_id'`.
3. IDs de bar em `EventBaratonaProvider` são UUIDs (`string`); no legado são inteiros (`number`). O cast `as any` no provider de plataforma é intencional.
4. Slugs reservados estão em `src/lib/constants.ts` — nunca criar eventos com esses slugs.

## Fluxo de autenticação

- Login Google via Supabase Auth (`usePlatformAuth`)
- Super admin verificado em `platform_roles` via `usePlatformAdmin`
- Participantes legados identificados por nome em `localStorage` (sem OAuth)

## Antes de modificar

1. Verificar se a mudança afeta legado, plataforma ou ambos.
2. Mudanças no `BaratonaContextType` exigem atualização nos dois providers e no array de dependências do `useMemo`.
3. Hooks de dados da plataforma ficam em `src/hooks/eventData/` — padrão: fetch inicial + subscription realtime + cleanup.
4. Rodar `npm run typecheck` e `npm run build` antes do commit.

## Documentação complementar

- `docs/ARQUITETURA.md` — arquitetura completa, rotas, modelo de dados, RLS
- `AGENTS.md` — regras para agentes IA, checklist de PR, contratos de banco
- `docs/AI_PLAYBOOK.md` — fluxo de trabalho e backlog técnico
- `docs/validacao-time-v1.md` — status de implementação do v1

## Git e GitHub

### Push

O proxy CCR (`origin`) só permite leitura. Para fazer push, use o PAT diretamente:

```bash
git push "https://oauth2:<SEU_PAT_AQUI>@github.com/neigirao/baratona.git" <branch>
```

### Pull Requests

O tool `mcp__github__create_pull_request` retorna 403 neste repositório. Sempre crie PRs via curl:

```bash
curl -s -X POST \
  -H "Authorization: token <SEU_PAT_AQUI>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/neigirao/baratona/pulls \
  -d '{"title":"...","head":"<branch>","base":"main","body":"..."}'
```
