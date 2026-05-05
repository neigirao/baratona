
# Auditoria 360° — Plataforma Baratona

Análise consolidada do código, banco, design system e UX. Cada seção traz **diagnóstico** + **ações recomendadas**. Ao final, um plano de execução priorizado.

---

## 1) Saúde da aplicação

**Diagnóstico**
- Build/typecheck rodam limpos. ESLint reporta **72 erros + 16 warnings** (sobretudo `@typescript-eslint/no-explicit-any` em `src/lib/api/*`, `EventBaratonaContext`, edge function e `tailwind.config.ts`).
- Console do preview: sem erros runtime no momento.
- Linter Supabase: **26 alertas** — `Extension in Public`, 2× `Public Bucket Allows Listing`, várias `Public Can Execute SECURITY DEFINER Function` (anon pode chamar funções sensíveis), além de avisos de `auth` (OTP/leaked password).
- `package.json` ainda tem `leaflet`, `react-leaflet`, `@types/leaflet` instalados — contraria a regra do projeto ("Avoid Leaflet"). Aumenta bundle e superfície.
- Vitest/Testing-Library ainda presentes (`npm run test`, `src/test/setup.ts`, `*.test.ts`) — contraria a regra "Exclude Vitest/E2E testing".

**Ações**
1. Resolver alertas de SECURITY DEFINER (revogar EXECUTE de `anon` ou mover p/ schema interno).
2. Restringir buckets públicos (policy de SELECT específica).
3. Habilitar proteção de senha vazada e OTP curto no Auth.
4. Remover dependências Leaflet e arquivos relacionados (`CircuitMap`, `BaratonaMap` se usar Leaflet).
5. Remover Vitest + arquivos `*.test.ts(x)` + `src/test/setup.ts` + scripts `test*` do `package.json`.
6. Zerar erros de ESLint (substituir `any` por tipos do `Database` gerado).

---

## 2) Arquitetura

**Diagnóstico**
- Padrão de **dois providers com mesma interface** (`BaratonaContext` legado + `EventBaratonaContext` plataforma) é elegante e funciona, mas o legado carrega ~290 linhas e mistura cast `as any` para compatibilizar IDs `string|number`.
- `useEventData.ts` virou re-export de 7 linhas — boa modularização para `hooks/eventData/*`.
- Camada `src/lib/api/*` bem dividida (events, bars, members, invites, votes, admin). Mas `client.ts` faz `as unknown as { rpc: … }` para chamar RPC — sintoma de tipos RPC não regenerados.
- `FEATURED_EVENT_SLUG` ainda hardcoded em `constants.ts` (já listado como dívida em AGENTS.md).
- Circuito legado `/nei` deveria estar **read-only** (memória `legacy-readonly-mode`) — verificar se `isLegacyReadOnly()` cobre todos os hooks de mutação.
- Realtime: cada hook de plataforma abre canal próprio. `BaratonaContext` (memória) deveria centralizar para evitar duplicações — ok no contexto plataforma via `EventBaratonaProvider`, mas confirmar que `ConsumptionRanking` consome do contexto e não abre canal próprio.

**Ações**
1. Adicionar coluna `events.is_featured` + endpoint, eliminar `FEATURED_EVENT_SLUG`.
2. Tipar RPC corretamente (gerar tipos atualizados ou wrapper genérico tipado).
3. Auditar `useCheckins`, `useSupabaseData` e API legada para garantir bloqueio via `isLegacyReadOnly()`.
4. Extrair lógica duplicada `EventBaratonaContext` ↔ `BaratonaContext` em hook `useBaratonaState` compartilhado.

---

## 3) Engenharia de software

**Diagnóstico**
- TypeScript estrito ativo, mas `any` espalhado em camada de API e no provider de plataforma — fere o contrato do AGENTS.md ("evite `any`").
- `tailwind.config.ts` usa `require()` (proibido pelo ESLint do projeto).
- Não há observabilidade (sem Sentry/log estruturado) — backlog citado mas pendente.
- `useRetry` existe e tem teste — bom, mas teste será removido se seguirmos a regra de excluir testes.
- Code-splitting em `vite.config.ts` está bem feito (manualChunks). `recharts`, `supabase`, `radix` separados.
- Lazy loading de rotas em `App.tsx` deve ser confirmado (todas as páginas pesadas com `lazy()`).

**Ações**
1. Substituir todos os `any` por tipos do `Database['public']['Tables'][...]['Row']` ou genéricos.
2. Trocar `require('tailwindcss-animate')` por `import` ESM.
3. Adicionar Sentry (ou equivalente) com DSN via env, capturando erros do `AppErrorBoundary`.
4. Verificar `lazy()` em todas rotas pesadas (`EventLive`, `EventAdmin`, `Wrapped`, `SpecialCircuitLanding`, `Admin`).

---

## 4) Desenvolvimento (DX e dívida)

**Diagnóstico**
- Componentes grandes: `SpecialCircuitLanding.tsx` (470), `ConsumptionCounter.tsx` (360), `SelectBarsForBaratonaDialog.tsx` (338), `VoteForm.tsx` (299), `EventRetrospective.tsx` (298). Difíceis de manter.
- 30 migrations — ok, mas arquivo `legacy_rls_hardening` + `qa_security_fixes` indicam ondas de correção; consolidar documentação em `docs/ARQUITETURA.md`.
- `src/hooks/useSupabaseData.ts` virou re-export de 7 linhas — confirmar se ainda é necessário ou consolidar imports.
- `FeaturedEventCard` existe além do novo `FeaturedEventBanner` da Home — verificar duplicação.

**Ações**
1. Quebrar componentes >250 linhas em subcomponentes/hooks (`SpecialCircuitLanding`, `ConsumptionCounter`, `VoteForm`).
2. Excluir `FeaturedEventCard` se substituído pelo banner novo.
3. Atualizar `docs/ARQUITETURA.md` com migrations recentes (sprint security, anon access, etc.).

---

## 5) Design System

**Diagnóstico**
- Gold Edition v1.0 implementado em `src/index.css` + `tailwind.config.ts` + `docs/baratona-design-system.html`. Bom.
- Home e Special Circuit já refeitos com tokens. Restante do app provavelmente ainda mistura cores antigas (`bg-card`, classes ad-hoc).
- Verificar uso de `font-display` (Bebas Neue), `font-heading` (Syne), `font-body` (Inter) e `Orbitron` em todas as telas — o legado `/nei` ainda usa `font-display` antigo.
- Botões: confirmar que `Button` (shadcn) recebeu variants Gold; senão, há inconsistência visual.
- Sombras `shadow-gold-md` e radius (`rounded-2xl` vs `rounded-xl`) precisam estar consistentes.

**Ações**
1. Auditar tela por tela aplicando tokens (EventLive, EventAdmin, MyBaratonas, Explore, FAQ, JoinByInvite, NotFound, ParticipantSelector, BarCheckin, ConsumptionCounter, VoteForm, Wrapped, Header, MainTabs, FAB).
2. Estender `button.tsx` com variants `gold`, `gold-outline`, `ghost-gold`.
3. Criar `Card` wrapper Gold (gradient + border + shadow padrão) e substituir cards manuais.
4. Padronizar tipografia: títulos Syne, números Bebas, branding Orbitron, body Inter.

---

## 6) UX

**Diagnóstico**
- Boas práticas já presentes: optimistic UI, pull-to-refresh, sync indicator, FAB, onboarding, alert dialogs em ações destrutivas, mobile-first, alvos grandes.
- Possíveis melhorias:
  - **Onboarding**: 3 telas estáticas — adicionar skip + indicador de progresso visual mais claro.
  - **Empty states**: `Explore`, `MyBaratonas` sem ilustração ou CTA claro quando vazio.
  - **Loading states**: usar `Skeleton` consistente em todas listas (já existe `list-skeletons.tsx`).
  - **Acessibilidade**: confirmar contraste do True Black + dourado (≥4.5:1), alt em imagens, labels em ícones-only buttons.
  - **Erros amigáveis**: padronizar via `errorMessages.ts` + toast.
  - **Feedback háptico**: já existe em vote; estender para check-in/out e adicionar bebida.

**Ações**
1. Refazer empty states de `Explore` e `MyBaratonas` com ilustração + CTA Gold.
2. Aplicar `Skeleton` Gold consistente em loadings.
3. Auditoria de acessibilidade (Lighthouse + axe), corrigir contraste e aria-labels.
4. Centralizar mensagens de erro via `errorMessages.ts`.

---

## 7) Conteúdo

**Diagnóstico**
- Tom mistura formal/informal. PT/EN com `TRANSLATIONS` mas várias strings novas (Home, Circuito) provavelmente hardcoded em PT, quebrando i18n.
- FAQ existe mas pode estar desatualizada vs. funcionalidades novas (circuito especial, wrapped, convites privados).
- SEO: `useSeo` aplicado nas principais páginas? Confirmar que `/baratona/:slug`, `/explorar`, `/faq` têm meta + OG + JSON-LD.
- Microcopy: CTA de "Criar baratona" ok; falta consistência ("Entrar", "Participar", "Acessar" para mesma ação).
- Footer: links institucionais (sobre, termos, privacidade) — verificar se existem.

**Ações**
1. Migrar strings hardcoded das telas novas para `TRANSLATIONS` (PT + EN).
2. Atualizar FAQ com novos fluxos (circuito, convites, wrapped).
3. Padronizar microcopy de CTAs (criar guia de tom em `docs/`).
4. Garantir SEO técnico em todas rotas públicas + sitemap atualizado.

---

## Plano de execução priorizado

### Fase 1 — Segurança & Saúde (urgente)
- Corrigir alertas Supabase Linter (SECURITY DEFINER, buckets, auth).
- Remover Leaflet (dependências + arquivos).
- Remover Vitest/Testing Library + scripts.
- Zerar `any` da camada API.
- Trocar `require` por `import` no Tailwind config.

### Fase 2 — Design System
- Estender Button/Card variants Gold.
- Aplicar tokens em telas restantes (EventLive, EventAdmin, Explore, MyBaratonas, FAQ, BarCheckin, ConsumptionCounter, VoteForm, Wrapped, Header, MainTabs).
- Padronizar tipografia/spacing.

### Fase 3 — UX/Conteúdo
- Empty states + skeletons consistentes.
- Acessibilidade (contraste, aria, labels).
- Microcopy + i18n + FAQ + SEO.

### Fase 4 — Arquitetura/DX
- `events.is_featured` + remover slug hardcoded.
- Tipar RPC corretamente.
- Quebrar componentes >250 linhas.
- Adicionar Sentry/observabilidade.
- Atualizar `docs/ARQUITETURA.md`.

---

## Detalhes técnicos (resumo numérico)

```text
ESLint:        72 errors, 16 warnings
TypeScript:    OK (sem erros)
Supabase:      26 alertas (security definer, buckets, auth)
Migrations:    30 arquivos
Bundle extra:  leaflet + react-leaflet + @types/leaflet (≈170KB gzip)
Maiores comps: SpecialCircuitLanding 470L · ConsumptionCounter 360L
               SelectBarsForBaratonaDialog 338L · VoteForm 299L
               EventRetrospective 298L · BaratonaContext 290L
```

Quer que eu comece pela **Fase 1 (segurança + limpeza)** ou prefere outra priorização?
