

# Retrospectiva Geral no Admin

Novo componente `AdminRetrospective` adicionado ao painel admin com um resumo completo do evento, visivel apenas para o administrador.

---

## Secoes do Painel

### 1. Ranking de Bebidas (quem mais bebeu)
- Tabela com todos os participantes ordenados por total de bebidas (descendente)
- Medalhas para os 3 primeiros
- Dados vindos do array `consumption` filtrado por `type === 'drink'`

### 2. Ranking de Comida (quem mais comeu)
- Mesma estrutura, filtrado por `type === 'food'`

### 3. Ranking de Piadas
- Como piadas sao salvas em localStorage (chave `baratona_jokes`), so o admin vera o proprio contador local
- Alternativa: exibir uma nota explicando que piadas sao locais e nao ha ranking global
- Exibir apenas o total de piadas do admin como referencia

### 4. Notas dos Restaurantes
- Para cada bar, calcular a media de cada categoria (Bebida, Comida, Ambiente, Atendimento) e a media geral
- Exibir em tabela: Bar | Bebida | Comida | Ambiente | Atendimento | Media
- Destacar o melhor bar (maior media geral)

### 5. Quem Usou / Quem Nao Usou
- Comparar lista de participantes com quem tem pelo menos 1 check-in ou 1 consumo registrado
- Exibir duas listas: "Participaram" (com icone verde) e "Nao participaram" (com icone cinza)

---

## Detalhes Tecnicos

### Novo arquivo: `src/components/AdminRetrospective.tsx`
- Importa `useBaratona` para acessar `participants`, `consumption`, `bars`, `getBarVotes`
- Importa `useCheckins` para verificar quem fez check-in
- Toda a logica de agregacao e feita com `useMemo` dentro do componente
- Usa componentes `Table` do shadcn/ui para as tabelas
- Usa `Card` para agrupar cada secao

### Alteracao em `src/pages/Admin.tsx`
- Importa e renderiza `<AdminRetrospective />` como uma nova secao no final da pagina (antes dos botoes de emergencia)
- Envolvido em um `Collapsible` ou accordion para nao poluir a tela, com titulo "Retrospectiva Geral" e icone `BarChart3`

### Calculo dos Rankings
```text
consumption.filter(type === 'drink')
  -> agrupar por participant_id (somando count)
  -> ordenar desc
  -> mapear nome do participante
```

### Calculo das Notas dos Bares
```text
Para cada bar:
  votes.filter(bar_id === bar.id)
  -> media de drink_score, food_score, vibe_score, service_score
  -> media geral = (drink + food + vibe + service) / 4
```

### Calculo de Uso
```text
participantesAtivos = Set de participant_id que aparecem em checkins OU consumption
participaram = participants.filter(id in participantesAtivos)
naoParticiparam = participants.filter(id NOT in participantesAtivos)
```

### Sobre Piadas
Como o contador de piadas e local (localStorage), nao e possivel criar um ranking global. O componente exibira uma nota explicando isso, e mostrara apenas o total local do dispositivo atual.

