

# Plano: Melhorias de UX no Fluxo de Check-in e Consumo

## Resumo das Melhorias

Implementar tres melhorias de usabilidade:
1. Navegar automaticamente para a aba "Consumo" apos fazer check-in
2. Adicionar botoes para tipos especificos de bebida (cerveja, cachaca, drink, batida)
3. Permitir edicao de avaliacao enquanto o usuario esta no bar

---

## 1. Navegacao Automatica apos Check-in

### Problema Atual
Quando o usuario clica em "Cheguei!", ele permanece na aba "Agora" e precisa manualmente ir para a aba "Consumo" para registrar o que esta bebendo.

### Solucao
Passar uma funcao `onCheckinSuccess` do `MainTabs` para o `BarCheckin` que muda a aba ativa para "consumption" apos check-in bem-sucedido.

### Arquivos a Modificar

**src/components/MainTabs.tsx**
- Criar funcao `handleCheckinSuccess` que executa `setActiveTab('consumption')`
- Passar essa funcao como prop para o componente `BarCheckin`

**src/components/BarCheckin.tsx**
- Adicionar prop opcional `onCheckinSuccess?: () => void`
- Chamar `onCheckinSuccess?.()` apos check-in bem-sucedido (dentro do bloco `if (success)`)

---

## 2. Botoes de Bebida por Tipo

### Problema Atual
O contador atual so tem um botao generico "+1" e "+5" para bebidas, sem diferenciar tipos.

### Solucao
Substituir a secao de bebidas por uma grade de botoes para cada tipo: Cerveja, Cachaca, Drink, Batida. Cada botao adiciona +1 ao contador total de bebidas.

### Design Visual

```text
+------------------------------------------+
|        Meu Consumo Neste Bar             |
+------------------------------------------+
|                                          |
|   [Cerveja]  [Cachaca]  [Drink]  [Batida]|
|      +1         +1        +1        +1   |
|                                          |
|         Total Bebidas: 5                 |
|         [-]    [5]    [+]                |
|                                          |
+------------------------------------------+
|                                          |
|         [Comida]                         |
|      [-]   [3]   [+]                     |
|             +5                           |
+------------------------------------------+
```

### Arquivos a Modificar

**src/components/ConsumptionCounter.tsx**
- Adicionar constante `DRINK_TYPES` com os 4 tipos e seus emojis/icones:
  - Cerveja: emoji cerveja
  - Cachaca: emoji copo/shot
  - Drink: emoji coquetel
  - Batida: emoji tropical
- Criar grid 4 colunas com botoes coloridos para cada tipo
- Manter contador total abaixo com controles +/-
- Cada botao de tipo chama `handleAddDrink(1)` (soma no total geral)

### Nota Tecnica
Os tipos de bebida sao apenas para facilitar a contagem rapida. O banco de dados continua registrando apenas o total de "drinks" por bar, nao diferenciando tipos.

---

## 3. Edicao de Avaliacao no Bar Atual

### Problema Atual
Apos enviar uma avaliacao, o `VoteForm` mostra apenas os scores salvos sem opcao de editar. O usuario so consegue votar uma vez.

### Solucao
Quando o usuario esta com check-in ativo no bar:
1. Mostrar os scores atuais E um botao "Editar Avaliacao"
2. Ao clicar, reabrir o formulario com os valores pre-preenchidos
3. Permitir reenviar (update via `submitVote`)

### Logica de Elegibilidade
- Verificar se o usuario tem check-in ativo no bar sendo avaliado
- Se sim, mostrar botao de editar
- Se nao (avaliou depois de sair), mostrar apenas scores sem edicao

### Arquivos a Modificar

**src/components/VoteForm.tsx**
- Adicionar prop `isCheckedIn?: boolean` para saber se pode editar
- Adicionar estado `isEditing` (boolean, inicia como false)
- Quando `existingVote` existe E `isCheckedIn` e true:
  - Mostrar os scores atuais
  - Adicionar botao "Editar Avaliacao" / "Edit Review"
  - Ao clicar, setar `isEditing = true` e popular os estados com valores existentes
- Renderizar formulario normalmente quando `isEditing = true`

**src/components/MainTabs.tsx**
- Passar status de check-in para o VoteForm na aba "Explorar"
- Usar hook `useCheckins` para verificar se usuario esta checked-in no bar atual

**src/components/BarItinerary.tsx**
- Quando abrir drawer de bar visitado, passar `isCheckedIn` para VoteForm
- Verificar se o bar do drawer e o bar atual E se usuario tem check-in

---

## Resumo de Alteracoes por Arquivo

| Arquivo | Alteracoes |
|---------|------------|
| `MainTabs.tsx` | Adicionar callback para check-in, passar isCheckedIn para VoteForm, importar useCheckins |
| `BarCheckin.tsx` | Adicionar prop onCheckinSuccess e chamar apos sucesso |
| `ConsumptionCounter.tsx` | Redesenhar secao de bebidas com 4 botoes de tipo |
| `VoteForm.tsx` | Adicionar modo de edicao quando usuario esta no bar |
| `BarItinerary.tsx` | Passar isCheckedIn para VoteForm no drawer |

---

## Secao Tecnica

### Fluxo de Dados para Check-in -> Consumo

```text
MainTabs (state: activeTab)
    │
    ├── BarCheckin (prop: onCheckinSuccess)
    │       │
    │       └── handleToggleCheckin()
    │               │
    │               └── if success && !userIsCheckedIn
    │                       └── onCheckinSuccess() → setActiveTab('consumption')
    │
    └── ConsumptionCounter (aba consumption)
```

### Tipos de Bebida (UI apenas, nao persiste tipo)

```typescript
const DRINK_TYPES = [
  { key: 'cerveja', label: 'Cerveja', emoji: '🍺' },
  { key: 'cachaca', label: 'Cachaça', emoji: '🥃' },
  { key: 'drink', label: 'Drink', emoji: '🍹' },
  { key: 'batida', label: 'Batida', emoji: '🧉' },
];
```

### Verificacao de Elegibilidade para Editar Voto

```typescript
// No MainTabs ou VoteForm
const { isCheckedIn } = useCheckins();
const canEditVote = currentBarId && isCheckedIn(currentUser.id, currentBarId);
```

