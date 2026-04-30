# AGENTS.md — Guia para evolução assistida por IA

## 1) Objetivo

Permitir que agentes façam mudanças seguras, pequenas e verificáveis, preservando os contratos da plataforma Baratona.

---

## 2) Mapa de contexto (leitura obrigatória)

1. `README.md` — visão geral, setup e decisões.
2. `docs/ARQUITETURA.md` — camadas, dois contextos, fluxos e modelo de dados.
3. `src/contexts/BaratonaContext.tsx` — interface global legada.
4. `src/contexts/EventBaratonaContext.tsx` — interface de plataforma (mesmo contrato).
5. `src/hooks/useEventData.ts` — acesso a dados de plataforma.
6. `src/hooks/useSupabaseData.ts` — acesso a dados legados.
7. `src/lib/api/` — camada de API modular.
8. `supabase/migrations/*.sql` — fonte de verdade do schema.

---

## 3) Regras para mudanças

- PRs pequenos e focados (1 problema por PR).
- Não misturar refatoração estrutural com feature nova.
- Preserve UX otimista, realtime e retry em operações críticas.
- Não remover constraints/regras de banco sem migration reversível.
- Ao criar uma nova tabela `event_*`, sempre incluir `event_id` e habilitar RLS.
- Ao adicionar um novo hook de dados de plataforma, seguir o padrão de `useEventData.ts`:
  fetch inicial → channel realtime filtrado por `event_id` → cleanup.

---

## 4) Contratos críticos que não podem quebrar

### Banco
- `app_config` é singleton (`id = 1`) — legado.
- `votes`: unicidade `(participant_id, bar_id)` — legado.
- `checkins`: unicidade `(participant_id, bar_id)` — legado.
- `event_votes`: upsert por `(event_id, user_id, bar_id)`.
- `event_checkins`: insert único por `(event_id, user_id, bar_id)`.
- `event_members`: unique `(event_id, user_id)`.
- `events.slug`: único, formato `[a-z0-9-]`, 4–50 chars, nunca uma palavra reservada.
- `event_app_config`: singleton por `event_id`.

### Frontend
- `useBaratona()` deve funcionar dentro de **qualquer** provider (BaratonaProvider ou EventBaratonaProvider).
- `isLegacyReadOnly()` deve ser verificado em toda operação de escrita dos hooks legados.
- `PLATFORM_BASE_URL`, `PLATFORM_OG_IMAGE` e `FEATURED_EVENT_SLUG` vêm de `src/lib/constants.ts` — não hardcode URLs.

---

## 5) Os dois contextos — regras de modificação

| Contexto | Provider | Quando modificar |
|---|---|---|
| Legado | `BaratonaContext.tsx` + `useSupabaseData.ts` + `useCheckins.ts` | Apenas para bugs ou manutenção do `/nei` |
| Plataforma | `EventBaratonaContext.tsx` + `useEventData.ts` | Para toda evolução nova |

Ao adicionar campo ao contexto, adicione em **ambos** os providers (ou explique por que não se aplica ao legado).

O hook `useBaratonaComputed.ts` contém lógica compartilhada — qualquer mudança em `getProjectedTime`, `getCurrentBar` ou `getNextBar` afeta os dois providers.

---

## 6) Checklist de PR para IA

Antes de abrir PR:

1. Atualizar docs se houve mudança de comportamento ou fluxo.
2. Rodar validações locais:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
3. Se tocar schema: incluir migration + avaliar impacto no frontend.
4. Se tocar RLS: testar cenários de acesso autorizado E não autorizado.
5. Incluir seção "riscos" no PR ao alterar fluxo de dados ou auth.

---

## 7) Convenções de implementação

- TypeScript estrito: evite `any` sem justificativa documentada no código.
- Funções de API com nomes explícitos e sufixo `Api` (ex: `joinEventApi`).
- Componentes de domínio em `src/components`; lógica em hooks/context.
- Hooks de dados novos em `src/hooks/useEventData.ts` (plataforma) ou arquivo próprio.
- Mensagens de erro amigáveis: usuário está num evento ao vivo com rede instável.
- Erros de convite devem distinguir: inválido, expirado, esgotado, sem login.

---

## 8) Palavras reservadas de slug

Não podem ser usadas como slug de evento (verificar em `src/lib/api/client.ts` → `isReservedSlug`):

`admin`, `api`, `faq`, `explorar`, `explorar`, `criar`, `entrar`, `minhas-baratonas`, `nei`, `www`, `app`, `static`, `assets`

---

## 9) Estratégia de evolução recomendada

Prioridades para próximos agentes:

1. Substituir `as any` em `EventBaratonaContext` com tipos de interseção.
2. Adicionar campo `is_featured` na tabela `events` para eliminar `FEATURED_EVENT_SLUG` hardcoded.
3. Cobertura de testes de hooks de plataforma com React Testing Library.
4. Endurecimento de RLS nas tabelas legadas (especialmente `app_config`).
5. Suporte a `event_admin` delegado (v2 da plataforma).
6. Observabilidade centralizada (Sentry + métricas de operação).
