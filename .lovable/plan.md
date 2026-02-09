

# Retrospectiva Enriquecida - Mais Dados sobre Pessoas e Grupo

Vamos adicionar novas secoes tanto no **AdminRetrospective** (painel admin) quanto no **BaratonaWrapped** (retrospectiva do usuario), trazendo dados sobre outras pessoas e o grupo como um todo.

---

## Novas Secoes no AdminRetrospective

### 1. Ranking de Conquistas
- Buscar todas as conquistas do banco (tabela `achievements`) para todos os participantes
- Agrupar por `participant_id`, contar quantas conquistas cada um desbloqueou
- Exibir tabela com medalhas, nome e total de conquistas
- Mostrar quais conquistas especificas cada top-3 desbloqueou (com emojis)

### 2. Consumo por Bar
- Agrupar consumo por `bar_id` (somando drinks + food de todos os participantes)
- Tabela: Bar | Total Bebidas | Total Comidas | Total Geral
- Destacar o bar com maior consumo total

### 3. Check-ins por Bar (Presenca)
- Contar check-ins unicos por bar (quantas pessoas fizeram check-in em cada bar)
- Tabela: Bar | Pessoas Presentes
- Destacar o bar mais popular

### 4. Estatisticas Gerais do Grupo
- Card com numeros resumidos:
  - Total de participantes
  - Media de bebidas por pessoa
  - Media de comidas por pessoa
  - Total de conquistas desbloqueadas
  - Total de avaliacoes feitas (votos)

---

## Novos Cards no BaratonaWrapped (usuario)

### Card: Top 3 Bebedores do Grupo (apos card pessoal de ranking)
- Mostra os 3 participantes que mais beberam com medalhas
- Usa dados de ranking que ja sao calculados

### Card: Top 3 Comedores do Grupo
- Mesmo estilo, para comida

### Card: Bar Mais Popular
- Bar com mais check-ins do grupo
- Mostra quantas pessoas passaram por la

### Card: Conquistas do Grupo
- Total de conquistas desbloqueadas por todos os participantes
- "O grupo desbloqueou X de Y conquistas possiveis"

O total de cards passa de 10 para 14.

---

## Detalhes Tecnicos

### Alteracoes em `src/components/AdminRetrospective.tsx`
1. Buscar conquistas de todos os participantes do banco via query direta ao Supabase (nao usa o hook `useAchievements` que filtra por usuario)
2. Novo `useMemo` para ranking de conquistas: agrupar por `participant_id`, contar, ordenar desc
3. Novo `useMemo` para consumo por bar: agrupar `consumption` por `bar_id`, somar drinks e food separadamente
4. Novo `useMemo` para check-ins por bar: contar participantes unicos por `bar_id`
5. Novo `useMemo` para estatisticas gerais: medias, totais
6. Importar `useEffect/useState` para buscar achievements e importar `supabase` client
7. Importar `ACHIEVEMENTS` de `useAchievements` para mapear emojis
8. Novos cards com `Card`, `Table`, `Badge`

### Alteracoes em `src/components/BaratonaWrapped.tsx`
1. Incrementar `TOTAL_CARDS` de 10 para 14
2. Adicionar 4 novos cards entre o card 4 (ranking pessoal) e o card 5 (bares visitados):
   - Card 5: Top 3 Bebedores (gradiente amber)
   - Card 6: Top 3 Comedores (gradiente orange)
   - Card 7: Bar Mais Popular (gradiente cyan)
   - Card 8: Conquistas do Grupo (gradiente violet)
3. Renumerar os cards existentes (bares visitados passa a ser card 9, conquistas pessoais card 10, etc.)
4. Buscar todas as conquistas do grupo via query Supabase dentro de `useMemo`/`useEffect`
5. Calcular bar mais popular a partir dos check-ins (contar check-ins unicos por bar)
6. Atualizar `handleShare` com novos dados

### Fluxo de Cards Atualizado no Wrapped
```text
0: Intro (Baratona 2026)
1: Bebidas Pessoais
2: Comida Pessoal
3: Bar Favorito
4: Posicao no Ranking
5: Top 3 Bebedores (NOVO)
6: Top 3 Comedores (NOVO)
7: Bar Mais Popular (NOVO)
8: Conquistas do Grupo (NOVO)
9: Bares Visitados (renumerado)
10: Conquistas Pessoais (renumerado)
11: Piadas (renumerado)
12: Stats do Grupo (renumerado)
13: Campeoes + Melhor Bar (renumerado)
```

### Dados Necessarios
- Conquistas de todos: query `SELECT * FROM achievements` (nova query no AdminRetrospective e useEffect no Wrapped)
- Check-ins por bar: ja disponivel via `useCheckins()`
- Consumo por bar: ja disponivel via `consumption` do contexto
- Nao precisa de migracoes no banco

