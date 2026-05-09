# Pendências do Baratona — visão consolidada

Levantamento cruzando `docs/validacao-time-v1.md`, `docs/AI_PLAYBOOK.md`, `AGENTS.md` e o estado atual do código (`as any`, RLS, schema, refactors em curso).

## 1. Backend / Banco de dados

- **Enums no Postgres** (já discutido):
  - `platform_roles.role` → enum (`super_admin`, `user`, ...).
  - `event_consumption.subtype` e `consumption.subtype` → enum de categorias de bebida.
  - `events.visibility`, `events.event_type`, `events.status` → enums (hoje são `text` com defaults).
- **Campo `is_featured`** em `events` para eliminar `FEATURED_EVENT_SLUG` hardcoded em `src/lib/constants.ts`.
- **Endurecimento de RLS nas tabelas legadas** (`app_config`, `bars`, `participants`, `votes`, `checkins`, `consumption`, `achievements`) — hoje só têm SELECT público; alinhar com o modo read-only.
- **Auditoria formal de RLS**: suite de testes de policy (acesso autorizado vs não autorizado em todas as tabelas `event_*`).
- **Migração de dados históricos** do legado (`bars`, `participants`, ...) para o modelo `event_id`.
- **Trilha de auditoria** para ações administrativas (super_admin e owner).

## 2. Frontend — qualidade técnica

- **Eliminar `as any`** restantes (15 ocorrências mapeadas):
  - `src/contexts/EventBaratonaContext.tsx:155` — cast do `value` do provider.
  - `src/components/EventWrapped.tsx:90`, `BaratonaMap.tsx:102`, `ConsumptionCounter.tsx:47,68`, `QuickAddFAB.tsx:42`.
  - `src/lib/api/votes.ts:19-20`, `src/components/admin/retrospective/useRetrospectiveData.ts:129`.
  - `src/components/admin/EventInfoEditor.tsx:27,28,123,136`, `src/hooks/data/useConsumption.ts:71,98`.
- **`event_admin` delegado** (v2): suportar co-admins por evento além do owner.
- **Persistir filtros de URL** em `/minhas-baratonas` (mesmo padrão já aplicado em `/explorar`).

## 3. UX / Produto

- Estados de erro mais explícitos no **wizard de criação** (`/criar`).
- **Validação de usabilidade em campo** durante um evento real (pós-v1).
- **Checklist digital pré-evento** para owner/dono de bar.
- Fluxo de **contingência para internet instável** mais visível.
- **Anti-spam / limite de criação** de baratonas por usuário.
- **Plano de rollout com feature flag** para novas funcionalidades.

## 4. SEO / Conteúdo

- `sitemap.xml` **dinâmico** (gerar a partir de eventos públicos).
- Marcação **schema.org `Event`** nas páginas de evento.
- `robots.txt` por ambiente (preview vs produção).
- Copy de **SEO por intenção de busca** (clusters e páginas de apoio).
- Política editorial para páginas de evento público.
- Revisão final de microcopy (tom de voz consistente PT/EN).

## 5. Observabilidade & operação

- **Sentry** (ou equivalente) em produção: erros do front + edge functions.
- Métricas operacionais (ex: latência de mutações de consumo, falhas de realtime).
- Dashboard interno de saúde por evento ativo.

## 6. Funcionalidades novas (backlog)

- **Importação automática** de lista curada de bares para `special_circuit` (hoje manual).
- **Regras específicas de pontuação** para `special_circuit`.
- **Relatórios pós-evento** novos: taxa de presença por etapa, tempo de deslocamento real vs previsto, conversão de convidados.
- Refinamento visual da **landing pública** e cards de evento.
- **Design system documentado** (Storybook ou equivalente; já existe `docs/baratona-design-system.html`).

## 7. Já decidido como fora de escopo (não fazer)

- Vitest / E2E automatizados (memo `mem://technical/testing-strategy`).
- Integração com Leaflet (memo: usar OSM iframe ou link externo).
- Subtração de drinks (apenas incremento).

---

## Sugestão de priorização (próximas 2–3 sprints)

1. Enums de banco + `is_featured` + endurecer RLS legado (1 PR coeso, baixo risco).
2. Eliminar `as any` críticos do `EventBaratonaContext` e da camada `lib/api`.
3. SEO técnico completo (sitemap dinâmico + schema.org Event).
4. Sentry em produção.
5. `event_admin` delegado.

Quer que eu transforme algum desses blocos num plano executável?
