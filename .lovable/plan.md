

## Plano: Hero Banner unificado + roadmap restante do Comida di Buteco

### Parte 1 — Reaproveitar o hero do Nei como banner padrão da plataforma

**Problema:** O banner icônico (`src/assets/baratona-banner.jpeg` + título Orbitron com `text-gradient-yellow`) só aparece no `ParticipantSelector` do `/nei`. As outras páginas (Home, EventLanding) usam um hero genérico ou só a `coverImageUrl` do evento.

**Solução:** Extrair o hero num componente reutilizável e aplicá-lo em 3 pontos.

**Novo componente:** `src/components/BaratonaHero.tsx`
- Props: `title`, `subtitle?`, `imageUrl?` (default = banner do Nei), `height?` (`sm` 32 / `md` 48 / `lg` 64), `overlayChildren?` (botões/badges opcionais)
- Mantém: imagem com `opacity-60`, gradiente preto descendo, título Orbitron com `text-gradient-yellow`
- Quando o evento tem `coverImageUrl`, usa a do evento como background; senão, fallback para o banner do Nei (assim todo evento ganha um visual coeso)

**Aplicação:**
1. `Home.tsx` — substituir o hero atual (gradiente sintético) pelo `BaratonaHero` com título "BARATONA" e subtítulo "Crie sua rota com os amigos". Mantém os CTAs sobrepostos.
2. `EventLanding.tsx` — trocar o `<img>` cru no topo pelo `BaratonaHero` (altura `lg`), passando `coverImageUrl` do evento e o nome como título. O metadata (cidade, contagem, data) continua abaixo.
3. `ParticipantSelector.tsx` — refatorar para usar o mesmo componente (sem regressão visual).

**Resultado:** identidade visual consistente em toda a plataforma com o banner que o usuário gosta.

---

### Parte 2 — O que ainda falta para o Comida di Buteco ficar 100%

**Estado atual confirmado no banco:**
- ✅ 120 bares importados (meta 60+ batida)
- ✅ 114/120 com coordenadas (95%)
- ✅ 118/120 com nome do petisco
- ✅ 120/120 com foto
- ✅ Marcar bares + criar baratona derivada funcionando
- ✅ Mapa com pins customizados destacando favoritos

**Gaps remanescentes (em ordem de impacto):**

| # | Gap | Esforço | Por quê importa |
|---|-----|---------|-----------------|
| 1 | **6 bares sem coordenadas** somem do mapa | XS | Polish — completar 100% geo |
| 2 | **2 bares sem petisco** (Bar do David e mais 1) | XS | Dados oficiais incompletos |
| 3 | **Sem contador social** "X pessoas marcaram este bar" | S | Prova social aumenta engajamento |
| 4 | **Sem deep-link de compartilhamento de favoritos** (não dá pra mandar a rota antes de criar a baratona) | S | Fricção pra grupos decidirem juntos |
| 5 | **Sem filtro por região da cidade** (Zona Sul / Norte / Centro / Oeste) — só por bairro | S | Bairros são muitos (~30); região agruparia melhor |
| 6 | **Sem indicador de distância** entre bares marcados (rota total km / tempo a pé) | M | Ajuda a decidir se a rota é viável |
| 7 | **CircuitMap usa SVG sobreposto a iframe OSM** — pins podem desalinhar em alguns níveis de zoom | M | Risco de UX ruim em mobile pequeno |
| 8 | **Sem página de detalhe do buteco** (modal/drawer com endereço completo, telefone, IG, descrição completa do petisco) | M | Hoje tudo está cru no card |

**Plano sugerido em sprints:**

```text
SPRINT D (polish dados — 30 min):
  • Geocoding manual dos 6 faltantes via Google Maps (lat/lng direto via SQL update)
  • Buscar petisco dos 2 sem dish (scraping individual ou edição manual no admin)

SPRINT E (engajamento social — 1 ciclo):
  • RPC get_bar_favorite_counts(event_id) → Record<barId, count>
  • Badge "🔖 N marcaram" no card quando count >= 3
  • Compartilhar rota: gerar URL /baratona/<slug>?favs=id1,id2,id3 que pré-marca os bares ao abrir

SPRINT F (descoberta — 1 ciclo):
  • Coluna region em event_bars (derivada do bairro via mapa estático Zona Sul/Norte/Centro/Oeste/Niterói)
  • Chips de região acima dos chips de bairro
  • Modal/Drawer de detalhe ao clicar no card (foto grande, descrição completa, ações)

SPRINT G (rota inteligente — 1 ciclo):
  • Calcular distância total entre favoritos selecionados (Haversine)
  • Exibir no header sticky: "5 bares · ~3.2 km · ~40min a pé"
  • Sugerir ordem otimizada (nearest neighbor) no dialog de criação
```

---

### Arquivos afetados (Parte 1 — único entregável desta rodada)

**Novos:**
- `src/components/BaratonaHero.tsx`

**Modificados:**
- `src/pages/Home.tsx` (substituir bloco hero)
- `src/pages/EventLanding.tsx` (substituir bloco da imagem de capa)
- `src/components/ParticipantSelector.tsx` (refatorar pra usar o componente)

### Decisão pendente

Qual sprint atacar depois do hero unificado? Recomendação: **Sprint D + E juntos** (dados 100% + prova social) — alto impacto visível com pouco código.

