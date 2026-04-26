## Sprint S8 — Super-admin global + Edição completa de eventos ✅

Entregue:
- RLS estendida: dono ou super_admin podem editar `events`, `event_bars`, `event_app_config`, `event_invites`.
- RPCs admin (SECURITY DEFINER): `admin_list_all_events`, `admin_update_event_owner`, `admin_set_platform_role`, `admin_remove_platform_role`, `admin_list_platform_roles`. Com guard de "último super_admin".
- Buckets de Storage públicos `event-covers` e `bar-dishes` com policies de upload restritas a owner/super_admin.
- Painel `/admin/plataforma`: listagem global com filtros, mudar status/visibilidade, transferir propriedade, arquivar; gestão de papéis (promover/remover super_admin).
- `EventInfoEditor` (aba "Info" no `EventAdmin`): edita name, description, city, datas, capa (com upload), URL externa, owner_name, visibility, event_type. Slug editável só para super_admin.
- `EventBarsEditor` (substitui aba "Bares"): CRUD completo, reordenação por setas, upload de foto do prato.
- `usePlatformAdmin` hook + atalho `<ShieldCheck />` no Header para super_admins.
- `EventAdmin` agora libera acesso a super_admin (não só owner).

## O que ainda falta nos planos consolidados

### Sprint S5 — Discovery & SEO
1. Sitemap + robots dinâmicos (`/sitemap.xml`).
2. OpenGraph dinâmico por evento (Edge Function + canvas).
3. Página `/circuitos` institucional.
4. Páginas de cidade `/cidade/<slug>` para SEO local.

### Sprint S6 — Engajamento profundo
1. Deep-link do `BarDetailDrawer` em `/baratona/:slug/bar/:id`.
2. Comentários públicos por bar (moderados pelo dono).
3. Push opt-in por evento via `useNotifications`.
4. `EventWrapped` genérico para qualquer evento.

### Sprint S7 — Confiabilidade
1. Testes dos hooks `usePlatformAuth`, `useEventData` e funções críticas de `lib/api`.
2. Error boundaries por rota com retry contextualizado.
3. Logs estruturados em `scrape-comida-di-boteco`.
4. Já entregue antes: `BackendHealthBanner` global.

### Débitos pequenos
- Split de `SpecialCircuitLanding.tsx` (>500 linhas) em `CircuitFilters`/`BarGrid`/`FavoritesStickyBar`.
- Extrair `useEventMembership` em `EventLanding.tsx`.
- Adaptar `OnboardingOverlay` para qualquer evento (hoje só Nei legado).
- Meta tags PWA + manifest no `index.html` para "add to home screen".
- Extrair camada de serviços de `BaratonaContext` (AGENTS.md item 7.3).

### Auditoria
- Linter rodou na S8: warnings restantes são de tabelas legadas do Nei (intencionais) + buckets públicos com listing (esperado para imagens públicas). Nenhum issue novo crítico.
- `security--run_security_scan` ainda não foi disparado pós-S8 — opcional rodar depois de S5/S6.

## Fora de escopo (contratos de produto)
- Reescrita do esquema legado do Nei (`mem://features/legacy-access-nei`).
- Pagamentos / monetização.

## Próximo passo sugerido
P2 — Discovery & SEO (Sprint S5), começando por sitemap + OG dinâmico, ou P3 (deep-link do BarDrawer + Wrapped genérico).
