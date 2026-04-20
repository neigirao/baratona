

## O que falta para a página do Comida di Buteco ficar 100%

### Diagnóstico atual

**Estado real do banco** (slug `comida-di-buteco-rj-2026`):
- 12 bares importados (oficial RJ tem ~80 — Firecrawl pegou só a primeira página)
- 10/12 geocodados, 12/12 com foto, 11/12 com petisco
- 2 bares sem coordenadas (Bar da Áurea, Bar da Tati) — não aparecem no mapa
- 1 bar sem petisco (Bar do David)

**O que já existe e funciona:**
- `SpecialCircuitLanding` com busca, filtro por bairro, ordenação por nota
- Mapa modo circuito com bounding box
- Voto único `dish_score` por petisco
- Botão "Importar / Atualizar" no admin

**O que está faltando (gap analysis):**

| Eixo | Lacuna | Impacto |
|---|---|---|
| **Engenharia** | Scrape pega só 1 página → 12/80 bares | Crítico — produto incompleto |
| **Engenharia** | 2 bares sem geocoding (timeout Nominatim) | Médio — somem do mapa |
| **Arquitetura** | Não existe schema para "lista pessoal de bares favoritos" dentro de um circuito | Bloqueia feature pedida |
| **Produto** | Não existe "criar minha baratona a partir de N bares marcados" | Feature core do pedido |
| **UX** | Sem botão "marcar/desmarcar" nos cards de petisco | Falta affordance |
| **UX** | Mapa não destaca bares marcados vs não-marcados | Sem feedback visual |
| **Design** | Cards iguais para marcados/não-marcados | Sem hierarquia |

---

### Plano de execução (3 frentes paralelas)

#### Frente 1 — Completar dados (Engenharia + Produto)

**1.1** Refatorar `scrape-comida-di-boteco` para paginação:
- Site usa filtro por região/página. Estratégia: `firecrawl map` para descobrir todas URLs de butecos `/buteco/<slug>/`, depois `scrape` em lote (ou usar `crawl` com `includePaths: ['/buteco/']`)
- Fallback: scrape direto da listagem com `waitFor: 5000` + scroll infinito (Firecrawl `actions`)
- Meta: ≥60 bares importados

**1.2** Reprocessar geocoding dos 2 faltantes:
- Adicionar parâmetro `?onlyMissingGeo=true` na edge function
- Retry com endereço alternativo (só bairro + cidade) quando endereço completo falha

**1.3** QA: validar que ≥90% têm coordenadas e ≥95% têm petisco+foto

#### Frente 2 — Feature "Marcar bares e criar baratona derivada" (Arquitetura + Produto + UX)

**2.1 Schema novo** (migration):
```sql
-- Lista de bares marcados pelo usuário dentro de um circuito
CREATE TABLE event_bar_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  bar_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id, bar_id)
);
-- RLS: user lê/escreve só os próprios; SELECT público para contar "X pessoas marcaram"
```

**2.2 RPC nova**: `create_baratona_from_favorites(_source_event_id, _name, _bar_ids[])`
- Cria novo `events` (visibility=private, event_type=open_baratona) com owner = auth.uid()
- Copia bares selecionados de `event_bars` do circuito original para o novo evento
- Cria `event_app_config` automaticamente
- Adiciona owner como `event_members` (organizer)
- Retorna `{ event_id, slug }` para redirecionar

**2.3 API** (`platformApi.ts`):
- `toggleBarFavoriteApi(eventId, barId)`
- `getBarFavoritesApi(eventId, userId)` → `Set<barId>`
- `getBarFavoriteCountsApi(eventId)` → `Record<barId, number>` (social proof opcional)
- `createBaratonaFromFavoritesApi(sourceEventId, name, barIds)`

**2.4 UX nos cards** (`SpecialCircuitLanding`):
- Heart/bookmark icon canto superior esquerdo do card (toggle)
- Estado marcado: borda primary + checkbox preenchido
- Filtro extra "Só marcados" nas chips
- Contador fixo no topo: **"X bares marcados · [Criar minha baratona]"**

**2.5 Modal "Criar baratona"**:
- Input nome (default: "Minha rota Comida di Buteco")
- Resumo: lista dos N bares selecionados (drag para reordenar)
- Botão "Criar e abrir" → navega para `/baratona/<novo-slug>/admin`

**2.6 Mapa adaptado** (`BaratonaMap`):
- Quando há favoritos: bbox calculado só com favoritos + pins destacados
- Toggle visual "Mostrar todos / Só marcados"

#### Frente 3 — Login obrigatório fluido (UX)

- Marcar bar sem login → toast "Faça login para salvar sua rota" + botão Google
- Persistir intenção em `localStorage` e re-aplicar após login

---

### Arquivos afetados

**Novos:**
- `supabase/migrations/<timestamp>_event_bar_favorites.sql` (tabela + RLS + RPC)
- `src/components/CreateBaratonaFromFavoritesDialog.tsx`

**Modificados:**
- `supabase/functions/scrape-comida-di-boteco/index.ts` (paginação + retry geo)
- `src/lib/platformApi.ts` (4 funções novas)
- `src/components/SpecialCircuitLanding.tsx` (toggle favorito, filtro, CTA)
- `src/components/BaratonaMap.tsx` (destacar favoritos)
- `src/integrations/supabase/types.ts` (auto-regenerado)

---

### Ordem de entrega proposta

```text
SPRINT A (dados — 1 ciclo):
  1. Refatorar scrape para múltiplas páginas/crawl
  2. Re-rodar e validar ≥60 bares com geo

SPRINT B (feature de marcar — 1 ciclo):
  3. Migration: event_bar_favorites + RPC create_baratona_from_favorites
  4. API + UX de toggle nos cards + contador
  5. Modal de criação + redirecionamento

SPRINT C (polish — meio ciclo):
  6. Mapa destacando favoritos
  7. Fluxo de login intencional
  8. QA end-to-end no /baratona/comida-di-buteco-rj-2026
```

### Decisões pendentes (perguntar antes de codar?)

1. **Limite de bares por baratona derivada**: 3-15? (sugiro 3 mín / 12 máx para uma noite)
2. **Visibilidade do evento derivado**: sempre privado com convite? Ou opção pública?
3. **Contador social** ("X pessoas marcaram este bar"): mostrar agora ou deixar para depois?
4. **Sprint A vs B primeiro**: começar pela frente de dados (sem ela a feature B parece pobre) ou pela feature de marcação (mais visível)?

