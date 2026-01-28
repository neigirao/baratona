
# Plano: Otimizar Controles de Bebida

## Mudanca Proposta

Remover o botao '+' generico e manter apenas o botao '-' para correcoes, centralizando as adicoes nos botoes de tipo de bebida.

## Layout Visual Antes/Depois

**Antes:**
```text
[Cerveja] [Cachaca] [Drink] [Batida]
     
      [-]    Total: 5    [+]
```

**Depois:**
```text
[Cerveja] [Cachaca] [Drink] [Batida]
     
         [-]    Total: 5
```

## Justificativa de Design

| Heuristica | Aplicacao |
|------------|-----------|
| Prevencao de erros | Botao '-' permite corrigir cliques acidentais |
| Consistencia | Toda adicao passa pelos botoes de tipo |
| Minimalismo | Remove elemento redundante |
| Recuperacao | Usuario consegue subtrair se errar |

## Arquivo a Modificar

**src/components/ConsumptionCounter.tsx**

Localizar a secao do total de bebidas (linhas ~200-220) e:
1. Remover o botao '+' generico
2. Centralizar o display do total com o botao '-' ao lado
3. Ajustar o layout para ficar balanceado visualmente

## Codigo a Alterar

Substituir a estrutura atual de 3 elementos ([-] [total] [+]) por 2 elementos centralizados ([-] [total]).

O botao '-' permanece para permitir correcoes, enquanto as adicoes sao feitas exclusivamente pelos botoes de tipo de bebida acima.
