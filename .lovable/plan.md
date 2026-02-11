

# Retrospectiva Admin Enriquecida - Medias por Bar, Ranking por Tipo e Extras

## Resumo das Mudancas

Adicionar ao `AdminRetrospective.tsx`:
1. **Resumo Completo por Bar** - uma tabela consolidada mostrando, para cada bar: nota media (bebida, comida, ambiente, atendimento), quantidade total de bebidas, quantidade total de comidas e numero de check-ins, tudo numa unica visao
2. **Ranking por tipo de bebida** - nota sobre limitacao atual e migracao para viabilizar
3. **Novos insights extras** que faltam

---

## 1. Card "Resumo Completo por Bar"

Nova secao que cruza dados de notas, consumo e presenca num unico lugar para cada bar:

| Bar | Nota Media | Bebida | Comida | Ambiente | Atendimento | Total Bebidas | Total Comidas | Presenca |
|-----|-----------|--------|--------|----------|-------------|--------------|--------------|----------|
| Bar A | 4.2 | 4.5 | 3.8 | 4.0 | 4.5 | 45 | 12 | 8 |

- Combina dados de `barRatings`, `consumptionPerBar` e `checkinsPerBar` ja calculados
- Ordenado por nota media geral (descendente)
- Destaque visual para o bar campeao

## 2. Ranking por Tipo de Bebida

**Limitacao atual**: o banco de dados grava apenas `type = 'drink'` sem distinguir cerveja, cachaca, drink ou batida. Os botoes de tipo na interface sao puramente visuais e nao persistem o subtipo.

**Solucao**: Criar uma migracao adicionando uma coluna `subtype` na tabela `consumption` (nullable, para manter compatibilidade) e atualizar o fluxo de gravacao para registrar o subtipo. Com isso, a retrospectiva podera mostrar rankings como "quem mais tomou cerveja" vs "quem mais tomou cachaca".

**Migracao necessaria**:
- `ALTER TABLE consumption ADD COLUMN subtype text;`

**Alteracao no codigo**:
- `useConsumption` / `BaratonaContext`: ao chamar `updateConsumption` para drinks, passar o subtipo (cerveja, cachaca, drink, batida)
- `ConsumptionCounter.tsx`: ajustar `handleAddDrink` para passar o `drinkTypeKey` ate o banco
- `AdminRetrospective.tsx`: novo ranking agrupando por `subtype`, mostrando top bebedores por categoria

Apos a migracao, a retrospectiva tera:
- Ranking "Rei da Cerveja" (quem mais tomou cerveja)
- Ranking "Rei da Cachaca"
- Ranking "Rei do Drink"
- Ranking "Rei da Batida"
- Cada um com medalhas e totais

## 3. Extras que Faltam (sugestoes)

### 3a. "Hora de Pico" por Bar
- Usando o campo `checked_in_at` dos check-ins, calcular em qual horario cada bar teve mais atividade
- Exibir como "Bar X teve mais movimento as 21h"

### 3b. "Quem Votou / Quem Nao Votou"
- Semelhante ao "quem usou/nao usou", mas especifico para avaliacoes
- Mostrar quais participantes deixaram avaliacoes e quais nao

### 3c. "Fidelidade" - Quem Visitou Mais Bares
- Ranking de participantes por numero de bares visitados (check-ins unicos por bar)
- Medalhas para quem passou por todos os bares

### 3d. Media Global de Notas
- Uma linha de resumo com a media geral de todos os bares combinados (todas as categorias)
- "A nota media geral da Baratona foi 3.8/5"

---

## Detalhes Tecnicos

### Migracao SQL
```text
ALTER TABLE consumption ADD COLUMN subtype text;
```
- Coluna nullable para nao quebrar dados existentes
- Valores esperados: 'cerveja', 'cachaca', 'drink', 'batida' (ou null para registros antigos/comida)

### Alteracoes em arquivos

**`src/hooks/useSupabaseData.ts`** (ou equivalente):
- Atualizar a funcao de upsert de consumo para incluir `subtype` quando disponivel

**`src/contexts/BaratonaContext.tsx`**:
- Ajustar assinatura de `addDrink`/`updateConsumption` para aceitar `subtype` opcional
- Propagar o parametro ate a camada de persistencia

**`src/components/ConsumptionCounter.tsx`**:
- Passar `type.key` (cerveja, cachaca, etc.) como subtype na chamada de persistencia

**`src/components/AdminRetrospective.tsx`**:
- Novo `useMemo` para o resumo consolidado por bar (cruzando ratings + consumo + checkins)
- Novo `useMemo` para ranking por subtipo de bebida (agrupando consumption por subtype + participant_id)
- Novo `useMemo` para "quem votou / nao votou" (cruzando votos com participantes)
- Novo `useMemo` para ranking de fidelidade (contando bares unicos por participante via checkins)
- Novo `useMemo` para hora de pico (agrupando checkins por hora do dia por bar)
- Novo `useMemo` para media global de todas as avaliacoes
- Novos cards/tabelas para cada secao

### Ordem das Secoes na Retrospectiva
```text
1. Estatisticas Gerais (existente, atualizado com media global de notas)
2. Resumo Completo por Bar (NOVO - tabela consolidada)
3. Ranking de Bebidas (existente)
4. Ranking por Tipo de Bebida (NOVO - cerveja, cachaca, drink, batida)
5. Ranking de Comida (existente)
6. Ranking de Conquistas (existente)
7. Ranking de Fidelidade (NOVO - quem visitou mais bares)
8. Consumo por Bar (existente)
9. Presenca por Bar (existente)
10. Notas dos Restaurantes (existente)
11. Quem Votou / Quem Nao Votou (NOVO)
12. Piadas (existente)
13. Quem Usou / Quem Nao Usou (existente)
```
