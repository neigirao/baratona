# Mapa reage automaticamente aos bares marcados

## Comportamento desejado

- **Nenhum bar marcado** → mapa mostra **todos** os bares do circuito.
- **Pelo menos 1 bar marcado** → mapa mostra **apenas os marcados** (some o resto, incluindo pinos e rota).
- Ao desmarcar o último, volta a mostrar todos automaticamente.

## Onde mexer

### 1. `src/components/CircuitMap.tsx`

Substituir o estado interno `view` (`'all' | 'favorites'`) por uma derivação automática:

```ts
const hasFavorites = favorites.size > 0;
const visibleBars = hasFavorites
  ? barsWithCoords.filter((b) => favorites.has(b.id || ''))
  : barsWithCoords;
```

- Remover o bloco do toggle (`!hideViewToggle && (...)`) e a prop `hideViewToggle` (não é mais necessária — sempre automático).
- Atualizar o contador no cabeçalho para refletir o modo atual:
  - sem favoritos: `"X bares no mapa"`
  - com favoritos: `"X marcados no mapa (de Y)"`
- Atualizar o texto do botão "Abrir no Google Maps":
  - com favoritos: `"Abrir N marcados no Google Maps"`
  - sem favoritos: `"Abrir N bares no Google Maps"`
- Remover o overlay "Nenhum bar marcado ainda" (não pode mais ocorrer, pois sem favoritos mostramos todos).
- O bbox passa a ser calculado a partir de `visibleBars` (mantendo o fallback atual já está correto).

### 2. `src/components/SpecialCircuitLanding.tsx`

- O `CircuitMap` hoje recebe `bars={filteredBars}`, ou seja, ele também responde aos filtros de busca/bairro/sort/onlyFavorites da lista. Isso polui o comportamento pedido (o usuário pode "esconder" bares marcados ao filtrar por bairro, por exemplo).
- Passar **`bars={bars}`** (lista completa do evento) para o mapa, deixando os filtros aplicados apenas à grade de cards abaixo. O mapa fica governado **só** pelos favoritos.
- Remover a prop `hideViewToggle` e `totalCount` da chamada (não usadas mais).

## Notas técnicas

- O hook `useSpecialCircuitFavorites` já mantém `favorites: Set<string>` reativo (server + link compartilhado + replay pós-login), então o mapa re-renderiza sozinho.
- Bares sem coordenadas continuam fora do mapa (mantém o filtro `barsWithCoords`).
- Sem mudanças em banco, RLS, edge functions ou rotas.

## Riscos

- Baixo. Mudança puramente de UI/derivação de estado em 2 arquivos. Não afeta favoritos, criação de baratona, nem outras telas que usam `BaratonaMap` (componente separado).
