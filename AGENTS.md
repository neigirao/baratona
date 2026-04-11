# AGENTS.md — Guia para evolução assistida por IA

Este repositório foi preparado para mudanças frequentes por agentes de IA. Siga estas regras para manter qualidade e previsibilidade.

## 1) Objetivo

Permitir que agentes façam mudanças seguras, pequenas e verificáveis, preservando regras de negócio da Baratona.

## 2) Mapa de contexto (leitura obrigatória)

1. `README.md` — visão geral e setup.
2. `docs/ARQUITETURA.md` — camadas, fluxos e decisões.
3. `src/contexts/BaratonaContext.tsx` — contratos globais da aplicação.
4. `src/hooks/useSupabaseData.ts` — principal acesso a dados.
5. `supabase/migrations/*.sql` — fonte de verdade do schema.

## 3) Regras para mudanças

- Faça PRs pequenos e focados (1 problema por PR).
- Não misture refatoração estrutural com feature nova sem necessidade.
- Evite acoplamento: prefira extrair funções utilitárias antes de duplicar lógica.
- Preserve UX otimista e comportamento de realtime.
- Não remova constraints/regras de banco sem migration reversível.

## 4) Contratos críticos que não podem quebrar

- `app_config` é singleton (`id = 1`).
- `votes` mantém unicidade por `(participant_id, bar_id)`.
- `checkins` mantém unicidade por `(participant_id, bar_id)`.
- `consumption` considera granularidade por `participant + type + bar_id`.

## 5) Checklist de PR para IA

Antes de abrir PR:

1. Atualizar docs se houve mudança de comportamento/fluxo.
2. Rodar validações locais mínimas:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
3. Incluir seção "riscos" no PR quando alterar fluxo de dados.
4. Se tocar schema, incluir migration + impacto na leitura do frontend.

## 6) Convenções de implementação

- TypeScript estrito: evite `any` sem justificativa.
- Funções de negócio com nomes explícitos (`getCurrentBar`, `updateConsumption`, etc.).
- Componentes de domínio em `src/components`; lógica em hooks/context.
- Mensagens de erro e fallback devem ser amigáveis para uso em evento (rede instável).

## 7) Estratégia de evolução recomendada

Prioridades para próximos agentes:

1. Cobertura de testes unitários dos hooks de domínio.
2. Endurecimento gradual de RLS (especialmente rotas/admin updates).
3. Extração de camada de serviços de dados para reduzir complexidade do Context.
4. Suporte a multi-evento (`event_id`) em todas as entidades principais.
