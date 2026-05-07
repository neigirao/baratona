# Persistir filtros do /explorar na URL

Substituir os três `useState` (`search`, `typeFilter`, `page`) em `src/pages/Explore.tsx` por leitura/escrita via `useSearchParams` do React Router. Resultado: refresh, back/forward do navegador e compartilhamento de link mantêm o estado.

## Mudanças em `src/pages/Explore.tsx`

1. **Imports**
   - Adicionar `useSearchParams` ao import de `react-router-dom`.
   - Remover `useState` (manter apenas `useMemo`).

2. **Substituir state local por query params**
   - `q` → busca textual (omitido quando vazio)
   - `type` → `open_baratona` | `special_circuit` (omitido quando `all`)
   - `page` → número (omitido quando `1`)
   - Validar `type` contra a união `FilterType` (fallback `all`).
   - Validar `page` como inteiro > 0 (fallback `1`).

3. **Helper `updateParams`**
   - Recebe patch parcial `{ q?, type?, page? }`.
   - Limpa o param quando o valor é o default (string vazia, `all`, `1`) para manter URLs limpas.
   - Usa `setSearchParams(..., { replace: true })` para não poluir o histórico a cada tecla digitada na busca.

4. **Setters compatíveis com a JSX existente**
   - `setSearch(q)` → `updateParams({ q, page: 1 })`
   - `setTypeFilter(type)` → `updateParams({ type, page: 1 })`
   - `setPage(updater)` → aceita number ou `(p) => p ± 1` (mantém assinatura usada nos botões Anterior/Próxima).

5. **Sem mudanças na renderização** — `filtered`, `paginated`, `safePage`, skeletons, paginação e empty state permanecem iguais.

## Notas técnicas

- `replace: true` evita criar uma entrada de histórico por caractere digitado; o back do navegador volta para a página anterior, não para cada estado intermediário do input.
- Mudanças de filtro/busca resetam `page` para 1 (já era o comportamento desejado, agora explícito no helper).
- Não é necessário `useEffect` de sincronização: a URL é a única fonte de verdade.

## Fora de escopo

- Debounce do input de busca (pode ser adicionado depois se necessário; o `replace: true` já evita poluição do histórico).
- Persistir filtros em outras páginas (`/minhas-baratonas`).
