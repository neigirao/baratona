

# Plano: Melhorias de UX no VoteForm e Bebidas

## Problema 1: Sem Navegacao Apos Voto

Quando o usuario envia uma avaliacao, ele ve a confirmacao mas nao tem como voltar facilmente para a aba de Consumo para continuar registrando o que esta bebendo.

### Solucao

Adicionar um botao "Voltar ao Consumo" / "Back to Consumption" no card de confirmacao do voto. Este botao chamara uma funcao passada como prop que navega de volta para a aba "consumption".

---

## Problema 2: Botao "-" de Bebidas Sem Sentido

O usuario levantou um ponto valido: quando clica em "-" para remover uma bebida, de qual tipo ela seria removida? Cerveja? Cachaca? Nao faz sentido ter esse controle.

### Solucao

Remover completamente o botao "-" da secao de bebidas. Se o usuario errar, pode "esperar" o debounce nao salvar (2 segundos) ou simplesmente aceitar o erro. A experiencia e mais limpa sem esse botao confuso.

---

## Arquivos a Modificar

### src/components/VoteForm.tsx

1. Adicionar prop `onNavigateToConsumption?: () => void`
2. No card de confirmacao (linhas 136-177), adicionar botao abaixo do "Editar Avaliacao":
   - Texto: "Voltar ao Consumo" / "Back to Consumption"
   - Icone: seta para esquerda ou icone de copo
   - Ao clicar, chama `onNavigateToConsumption?.()`

### src/components/ConsumptionCounter.tsx

1. Remover o botao "-" da secao de bebidas (linhas 222-229)
2. Centralizar apenas o display do total (linhas 209-220)
3. Remover a funcao `handleRemoveDrink` que nao sera mais usada
4. Remover import do `Minus` se nao for mais usado em outro lugar

### src/components/MainTabs.tsx

1. Passar callback `onNavigateToConsumption` para o VoteForm
2. Este callback executa `setActiveTab('consumption')`

---

## Layout Visual Apos Mudancas

### VoteForm (apos voto)

```text
+--------------------------------+
|   ✓ Voto registrado!           |
|   [🍺 4] [🍴 3] [🎵 5] [👥 4]  |
|                                |
|   [Editar Avaliação]           |
|   [← Voltar ao Consumo]        |
+--------------------------------+
```

### ConsumptionCounter (bebidas)

```text
+------------------------------------------+
| [Cerveja] [Cachaça] [Drink] [Batida]     |
|                                          |
|              Total: 5                    |
+------------------------------------------+
```

---

## Secao Tecnica

### Props do VoteForm Atualizadas

```typescript
interface VoteFormProps {
  barId?: number;
  barName?: string;
  compact?: boolean;
  isCheckedIn?: boolean;
  onNavigateToConsumption?: () => void; // NOVO
}
```

### Remocao do Botao "-" em Bebidas

O botao sera removido completamente. A comida mantem os botoes +/- porque:
- Comida e generica (nao tem tipos)
- Faz sentido corrigir "pedi 3 porcoes, na verdade foram 2"

Bebidas agora sao only-add, pois cada tipo e um clique distinto.

