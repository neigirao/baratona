

# Melhorias na Retrospectiva (Baratona Wrapped)

A retrospectiva atual tem 6 cards com conteudo basico. O plano abaixo adiciona novos cards, melhora as animacoes, inclui navegacao por swipe e enriquece os dados exibidos.

---

## Novos Cards e Dados

### Card: Posicao no Ranking (novo - apos o bar favorito)
- Mostra em que posicao o usuario ficou no ranking de bebidas e comidas
- Exibe algo como "Voce ficou em 3o lugar nas bebidas!" com uma medalha correspondente (ouro/prata/bronze ou numero)
- Usa os dados de ranking que ja sao calculados no componente

### Card: Bares Visitados (novo - apos posicao no ranking)
- Mostra quantos bares o usuario visitou (dados de check-in)
- Lista os bares visitados com icones de check
- Importa o hook `useCheckins` para acessar os dados de check-in

### Card: Conquistas Desbloqueadas (novo - apos bares visitados)
- Mostra as conquistas que o usuario desbloqueou durante o evento
- Grid de emojis das conquistas desbloqueadas
- Exibe "X de 9 conquistas"
- Importa o hook `useAchievements`

### Card: Contador de Piadas (novo - antes dos campeoes)
- Puxa o contador local de piadas do localStorage
- Mostra o total de piadas contadas com animacao divertida

---

## Melhorias de Navegacao

### Suporte a Swipe/Touch
- Adiciona handlers de touch (touchstart/touchend) no container principal
- Swipe para esquerda = proximo card
- Swipe para direita = card anterior
- Threshold de 50px para evitar swipes acidentais

### Barra de Progresso no Topo
- Substitui os dots por uma barra de progresso tipo Instagram Stories
- Cada segmento representa um card
- O segmento ativo tem preenchimento animado

---

## Melhorias Visuais

### Animacoes de Contagem
- Numeros grandes usam efeito de contagem animada (de 0 ate o valor final)
- Cria um hook `useCountUp` simples que anima o valor durante ~1.5s

### Particulas/Confetti no Card Final
- Adiciona efeito de confetti no ultimo card (Campeoes) usando CSS puro
- Pequenos circulos coloridos caindo pela tela

### Texto de Compartilhamento Melhorado
- Inclui posicao no ranking, bares visitados e conquistas no texto de compartilhamento

---

## Detalhes Tecnicos

### Alteracoes em `src/components/BaratonaWrapped.tsx`
1. Importar `useCheckins` e `useAchievements`
2. Criar hook interno `useCountUp(target, duration)` para animar numeros
3. Adicionar estado e handlers de touch para swipe navigation
4. Incrementar `totalCards` de 6 para 10
5. Adicionar novos cards:
   - Card 4: Posicao no Ranking (gradiente indigo)
   - Card 5: Bares Visitados (gradiente teal, usa `useCheckins`)
   - Card 6: Conquistas (gradiente violet, usa `useAchievements`)
   - Card 7: Piadas (gradiente pink, le `localStorage`)
   - Cards 8-9: Group Stats e Champions (renumerados)
6. Substituir dots de progresso por barras segmentadas estilo Stories
7. Adicionar touch event listeners no container
8. Melhorar `handleShare` com dados adicionais

### Componentes Internos Novos (dentro do mesmo arquivo)
- `CountUpNumber`: componente que anima um numero de 0 ao valor final usando `requestAnimationFrame`
- `ProgressBars`: componente que renderiza a barra de progresso segmentada no topo
- `ConfettiEffect`: particulas CSS animadas no card final

### Fluxo de Cards Atualizado

```text
0: Intro (Baratona 2026)
1: Bebidas Pessoais
2: Comida Pessoal
3: Bar Favorito
4: Posicao no Ranking (NOVO)
5: Bares Visitados (NOVO)
6: Conquistas (NOVO)
7: Piadas (NOVO)
8: Stats do Grupo
9: Campeoes + Melhor Bar (final)
```

### Navegacao por Swipe
```text
- onTouchStart: salva posicao X inicial
- onTouchEnd: calcula delta X
  - delta < -50px: nextCard()
  - delta > 50px: prevCard()
```

