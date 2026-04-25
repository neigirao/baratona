## O que já foi entregue (resumo)

- **Plano da logo do Comida di Buteco** — concluído (BaratonaHero com logoUrl, scroll horizontal de bairros, footer do organizador).
- **Sprint S1 — Segurança & fundação** — RLS endurecida (`has_platform_role`, votes imutáveis, app_config restrito), RPC `get_public_events_with_counts`, índices, code-splitting, React Query global.
- **Sprint S2 — Engajamento & social** — `analytics.ts`, RPC `get_bar_favorite_counts`, badge social nos cards, share por URL `?favs=...`, deep-link aplicando favoritos.
- **Sprint S3 — UX & performance** — migração para `useQuery` em EventLanding/SpecialCircuit, `BarDetailDrawer`, modo alto contraste com toggle persistente.
- **Skeletons + erros/retry** — `LoadError`, `EventCardSkeleton`, `BarCardSkeleton`, `EventLandingSkeleton`, fallbacks de imagem no drawer.

## O que ainda falta

### Sprint S4 — Arquitetura & escala
1. **Modularizar `src/lib/platformApi.ts`** (hoje é um arquivo único gigante). Quebrar em:
   - `platformApi/events.ts`, `platformApi/bars.ts`, `platformApi/favorites.ts`, `platformApi/ratings.ts`, `platformApi/members.ts`, `index.ts` re-exportando.
2. **Imagens em Supabase Storage** — bucket `event-covers` e `bar-dishes` com policies públicas de leitura; uploader no admin; migrar URLs externas (Comida di Buteco) para storage interno por cache/fallback.
3. **Limpeza de RLS legadas** — sprint listou warnings em `achievements`, `participants`, e tabelas do esquema antigo de votação do Nei. Auditar com `supabase--linter` e `security--run_security_scan`, marcar/eliminar.
4. **Extrair camada de serviços do `BaratonaContext`** (apontado no AGENTS.md item 7.3): mover lógica de domínio para hooks/serviços e deixar o context só com estado.

### Sprint S5 — Discovery & SEO (do `docs/pacote-v1-implementacao.md` Sprint 4)
1. **Sitemap + robots dinâmicos** — `/sitemap.xml` gerado a partir de eventos públicos.
2. **OpenGraph dinâmico por evento** — gerar imagem OG (Edge Function + canvas) usando logo + cidade + nº de bares.
3. **Página `/circuitos`** — landing institucional dos circuitos especiais, separada de `/explorar`.
4. **Páginas de cidade** — `/cidade/rio-de-janeiro` listando todos os eventos da cidade (SEO local).

### Sprint S6 — Engajamento profundo (continuação do S2)
1. **Deep-link do BarDetailDrawer** — rota `/baratona/:slug/bar/:id` abre o drawer direto, com share próprio.
2. **Comentários/notas nos bares** — usuário logado deixa um comentário curto público, moderado pelo dono do evento.
3. **Push notification opt-in por evento** — usar `useNotifications` existente para alertar quando bares forem adicionados ou status mudar.
4. **Wrapped da edição** — `EventWrapped` já existe pro Nei; adaptar para qualquer baratona/circuito ao final.

### Sprint S7 — Operação & confiabilidade
1. **Testes**: cobertura mínima dos hooks de domínio (`usePlatformAuth`, `useEventData`) e funções críticas de `platformApi`. Já temos vitest configurado mas só `useRetry.test.ts` e `useSyncStatus.test.tsx` rodando.
2. **Error boundaries por rota** — `AppErrorBoundary` existe global; adicionar boundaries específicos por página com retry contextualizado.
3. **Logs estruturados das Edge Functions** — `scrape-comida-di-boteco` precisa de logging consistente e dead-letter.
4. **`cloud_status` no boot** — banner global se backend estiver `ACTIVE_UNHEALTHY` ou em transição.

### Débitos técnicos pequenos identificados no histórico
- `Explore.tsx` ainda renderiza `Skeleton` import não removido (já corrigido no último loop, validar).
- `SpecialCircuitLanding.tsx` tem 504 linhas — candidato a split (`CircuitFilters`, `BarGrid`, `FavoritesStickyBar`).
- `EventLanding.tsx` mistura lógica de invite, member-check e render — extrair `useEventMembership` hook.
- Onboarding (`OnboardingOverlay`) só roda no Nei legado — adaptar para primeira visita em qualquer evento.
- `index.html` precisa de meta tags PWA + manifest se quisermos "add to home screen" no dia do evento.

### Auditoria de segurança pendente (nunca rodada após S1)
- Rodar `security--run_security_scan` + `supabase--linter` e tratar findings novos.
- Revisar policies de `event_*` para garantir que `joined` ≠ `member` (papéis).

## Priorização sugerida

```text
P0 (próxima sprint)   → S7.4 cloud_status + S4.3 limpeza RLS + auditoria de segurança
P1 (logo depois)      → S4.1 modularizar platformApi + S4.2 storage de imagens
P2 (discovery)        → S5.1 sitemap + S5.2 OG dinâmico
P3 (engajamento)      → S6.1 deep-link drawer + S6.4 wrapped genérico
P4 (qualidade)        → S7.1 testes + S7.2 boundaries + débitos pequenos
```

## Fora de escopo deste consolidado
- Nova coluna `logo_url` em `events` (heurística atual resolve).
- Reescrita do esquema legado do Nei (preservado intacto por contrato — ver `mem://features/legacy-access-nei`).
- Pagamentos / monetização — não foi mencionado em nenhum plano anterior.

## Próximo passo
Confirme qual bloco quer atacar primeiro (P0, P1, etc.) ou peça para detalhar uma sprint específica antes de implementar.
