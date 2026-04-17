

# Plano: Eventos em Destaque + Mapa Multi-POI + Roadmap restante

## Parte 1 — Eventos em Destaque na Home

Adicionar uma seção entre o Hero e Features na `Home.tsx`:

- Buscar até 3 eventos públicos ordenados por `start_date`/`event_date`, priorizando o `comida-di-buteco-rj-2026`
- Card grande com `cover_image_url` (fallback para gradiente Orbitron), nome, cidade, badge "Circuito Especial" ou "Baratona", contagem de participantes (via `event_members count`), datas, botão "Ver evento" → `/baratona/:slug`
- Nova função `listFeaturedEventsApi(limit)` em `platformApi.ts` (consulta `events` + `event_members count` + opcional `event_bars count`)
- Skeleton enquanto carrega; se vazio, esconder a seção

## Parte 2 — `BaratonaMap` em modo circuito (multi-POI)

Refatorar `BaratonaMap.tsx` para detectar quando o evento é circuito:

- Adicionar prop opcional `mode?: 'route' | 'circuit'` (default detectado pelo número de bares com lat/lng e ausência de `current_bar_id` cronológico)
- **Modo circuit:** calcular bounding box (`minLat/maxLat/minLng/maxLng`) que englobe todos os bares com coordenadas, com padding de ~10%, e usar como `bbox` do iframe OSM (sem `marker` único)
- Renderizar uma lista compacta abaixo com **todos os bares** (sem `<details>`, já expandida) com link Google Maps individual
- Botão "Ver rota completa" no Google Maps gerado dinamicamente concatenando `name + address` de cada bar (substitui a URL hardcoded de 9 bares fixos)
- Esconder badge "in_transit" e botão de rota cronológica em modo circuit
- Como `BaratonaMap` é renderizado via `MainTabs` que vem de `useBaratona()`, o modo é detectado lendo um novo campo `eventType` no contexto (ou inferido: se `appConfig.status === 'at_bar'` sem `current_bar_id` E todos bares têm `featured_dish`, é circuito)
- **Decisão técnica:** expor `eventType` em `EventBaratonaContext` value + adicionar opcional no tipo de `BaratonaContext` (default `'open_baratona'` no legado)

## Parte 3 — Análise: O que ainda falta (roadmap consolidado)

### Bloqueadores funcionais

| # | Item | Impacto |
|---|------|---------|
| B1 | **Geocoding do Comida di Buteco não validado** — depende do scrape rodar; se Nominatim falhar muito, mapa fica vazio | Alto |
| B2 | **`VoteForm` não adaptado para circuito** — ainda pede 4 dimensões; deveria ser nota única no petisco para `special_circuit` | Alto |
| B3 | **`event_votes` schema** — tem 4 colunas obrigatórias (drink/food/vibe/service); circuito precisa permitir voto único (NULL nas 3 outras + `dish_score`) | Alto |
| B4 | **Hook `useEventCheckins` permite múltiplos check-ins** mas não há constraint UNIQUE `(event_id, user_id, bar_id)` em `event_checkins` | Médio |
| B5 | **`event_consumption` sem UNIQUE** `(event_id, user_id, bar_id, type, subtype)` — pode duplicar registros | Médio |

### Funcionalidades planejadas não entregues

| # | Item | Status |
|---|------|--------|
| F1 | Convite por código para eventos privados (UI gerar + UI digitar) | Tabela existe, UI zero |
| F2 | Editar evento após criação (nome, descrição, bares) | Não existe |
| F3 | Página "Minhas Baratonas" (histórico criadas + participadas) | Não existe |
| F4 | Filtro por cidade no Explore | Só busca por texto e tipo |
| F5 | Compartilhar evento via Web Share API com og:image | Botão existe, sem og tags |
| F6 | Indicador visual "Modo Legado" no `/nei` | Não existe |
| F7 | Inserir `super_admin` no `platform_roles` para o owner do Nei | Sem seed |
| F8 | Remover `as any` do `platformApi.ts` agora que types existem | Pendente |
| F9 | `BaratonaWrapped` adaptado para eventos novos (lê de `event_*`) | Só funciona no legado |
| F10 | `AdminRetrospective` adaptado para eventos novos | Só funciona no legado |
| F11 | Notificações push para broadcasts em eventos novos | Só legado |
| F12 | `event_app_config` auto-criado na criação do evento (hoje só insere bares) | Bug latente |

### Polimento e UX

| # | Item |
|---|------|
| P1 | Loading skeleton em `EventLanding` (hoje só "Carregando...") |
| P2 | Empty state melhor no Explore (já tem mas pode incluir "Comida di Buteco" como sugestão fixa) |
| P3 | Validação de input no wizard `CreateEvent` (slug duplicado, mínimo 1 bar) |
| P4 | OG meta tags dinâmicas por evento (`useSeo` já existe, falta usar em `EventLanding`) |
| P5 | Capa do evento upload (storage bucket + UI no admin) — hoje só URL externa |

## Ordem de execução proposta

```text
AGORA (este ciclo):
1. Eventos em Destaque na Home + listFeaturedEventsApi
2. BaratonaMap modo circuit (bounding box + lista expandida + rota dinâmica)
3. Auto-criar event_app_config na criação do evento (F12, fix rápido)

PRÓXIMO CICLO (alta prioridade):
4. Adaptar VoteForm + event_votes schema para voto único de circuito (B2, B3)
5. Constraints UNIQUE em event_checkins e event_consumption (B4, B5)
6. Validar scrape Comida di Buteco end-to-end (B1)

CICLO 3 (features):
7. Convite por código (F1) + Página Minhas Baratonas (F3)
8. Editar evento (F2) + filtro cidade (F4)

CICLO 4 (polimento):
9. Wrapped + Retrospective multi-evento (F9, F10)
10. Remover `as any`, OG tags, validações (F8, P3, P4)
11. Storage bucket de capa (P5)
```

## Arquivos afetados neste ciclo

**Modificar:**
- `src/pages/Home.tsx` — nova seção entre Hero e Features
- `src/lib/platformApi.ts` — `listFeaturedEventsApi`
- `src/components/BaratonaMap.tsx` — modo circuit + bounding box + rota dinâmica
- `src/contexts/EventBaratonaContext.tsx` — expor `eventType` no value
- `src/contexts/BaratonaContext.tsx` — adicionar `eventType?: string` no tipo (default `'open_baratona'`)

**Criar:**
- `src/components/FeaturedEventCard.tsx` — card visual reutilizável

