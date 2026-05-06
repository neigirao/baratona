# Changelog

All notable changes to this project will be documented in this file.
Format: [Semantic Versioning](https://semver.org/). Entries in Portuguese.

## [Unreleased]

### Adicionado
- Aba "Pessoas" no EventAdmin com listagem, remoção e exportação CSV de membros
- Papel `moderator` disponível no painel de Papéis do super admin
- Contagem de alcance no broadcast ("Será visível para N participantes")
- Carregamento paralelo de dados no PlatformAdmin (events + roles + stats juntos)
- Estado de erro com botão "Tentar novamente" na aba Visão Geral do admin
- Filtro de status "Ao vivo" no painel de eventos do super admin

### Corrigido
- Constraint `events.status` expandida para incluir `live` e `archived`
- Query `recurring_creators` no RPC de estatísticas retornava contagem errada
- Casts `(e as any).status` removidos — `EventStatus` tipado corretamente
- Bypass de edição por e-mail removido do EventAdmin (`canEdit` usa `isSuperAdmin`)
- Canais Realtime recebem ID aleatório por instância (evita canais zombie)
- Prevenção de race condition em fetches legados (version counter)

### Alterado
- `isSuperAdminApi` usa RPC SECURITY DEFINER `has_platform_role` (não SELECT direto)
- `reorderBarsApi` delegado ao RPC atômico `reorder_event_bars` (PL/pgSQL transaction)

---

## [0.9.0] — 2026-04-25

### Adicionado
- Multi-tenant: qualquer usuário pode criar e gerenciar sua própria baratona
- Plataforma de eventos com slugs únicos, check-in, consumo, votação e mapa
- Super admin com painel global (eventos, papéis, estatísticas)
- Realtime via Supabase para check-ins, votos e configuração ao vivo
- Evento legado `/nei` preservado com contexto separado
