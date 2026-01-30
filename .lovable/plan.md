

# Plano de Melhorias - Baratona 2026

## Visao Geral

Este plano apresenta sugestoes organizadas em 5 categorias para elevar a experiencia da aplicacao Baratona.

---

## 1. DESIGN

### 1.1 Hierarquia Visual Aprimorada
**Problema:** Alguns elementos competem por atencao, especialmente no Baratometro e cards de status.

**Solucao:**
- Aumentar contraste entre elementos primarios e secundarios
- Adicionar sombras mais pronunciadas nos cards ativos
- Usar tamanhos de fonte mais distintos entre titulos e conteudo

**Arquivo:** `src/index.css`
- Refinar variaveis de sombra e glow
- Adicionar classes utilitarias para hierarquia

### 1.2 Indicadores de Progresso Visual
**Problema:** O itinerario nao mostra claramente o progresso do evento.

**Solucao:**
- Adicionar uma barra de progresso horizontal no topo do itinerario mostrando "3/9 bares visitados"
- Linha conectora vertical entre os bares com cores indicando status

**Arquivo:** `src/components/BarItinerary.tsx`

### 1.3 Avatares ou Iniciais dos Participantes
**Problema:** Lista de "Quem esta aqui" usa apenas nomes em texto.

**Solucao:**
- Mostrar avatares com iniciais coloridas (cores derivadas do nome)
- Aumentar visibilidade do proprio usuario com borda destacada

**Arquivo:** `src/components/BarCheckin.tsx`

---

## 2. USABILIDADE

### 2.1 Botao de Acao Flutuante (FAB) para Adicionar Bebida
**Problema:** Usuario precisa navegar ate a aba de consumo para registrar bebidas.

**Solucao:**
- Adicionar um botao flutuante no canto inferior direito (visivel em todas as abas)
- Ao clicar, abre um menu rapido com os 4 tipos de bebida
- Feedback haptico e visual imediato

**Arquivos:**
- Criar `src/components/QuickAddFAB.tsx`
- Modificar `src/pages/Index.tsx`

### 2.2 Gestos de Swipe
**Problema:** Navegacao entre abas requer toque preciso nas tabs.

**Solucao:**
- Implementar swipe horizontal para alternar entre abas
- Indicador visual sutil de que swipe e possivel

**Arquivo:** `src/components/MainTabs.tsx`

### 2.3 Atalho Rapido para Check-in
**Problema:** Quando usuario abre o app, pode querer fazer check-in rapidamente.

**Solucao:**
- Se o usuario nao esta checked-in no bar atual, mostrar banner destacado no topo
- Banner com botao de acao direta "Fazer Check-in no [Bar]"

**Arquivo:** `src/components/MainTabs.tsx` ou novo `QuickCheckinBanner.tsx`

### 2.4 Confirmacao Visual de Estado
**Problema:** Apos acoes, usuario pode se perguntar "funcionou?"

**Solucao:**
- Ampliar feedback visual apos acoes: check-in, voto, consumo
- Animacao de confete leve apos check-in bem-sucedido
- Toast mais persistente (3s em vez de 2s) para acoes importantes

**Arquivos:** `src/hooks/use-toast.ts`, `src/components/BarCheckin.tsx`

---

## 3. UX (Experiencia do Usuario)

### 3.1 Onboarding Rapido
**Problema:** Novos usuarios nao sabem o que fazer primeiro.

**Solucao:**
- Primeira vez que usuario entra, mostrar overlay com 3 dicas rapidas:
  1. "Faca check-in quando chegar"
  2. "Registre suas bebidas"
  3. "Avalie os bares"
- Botao "Entendi" para fechar

**Arquivo:** Criar `src/components/OnboardingOverlay.tsx`

### 3.2 Estado Vazio Amigavel
**Problema:** Quando nao ha dados (ranking vazio, sem check-ins), a tela fica sem contexto.

**Solucao:**
- Adicionar ilustracoes ou mensagens motivacionais
- Ex: Ranking vazio -> "Seja o primeiro a registrar uma bebida!"
- Ex: Sem check-ins -> "A festa ainda nao comecou... ou voce esqueceu de fazer check-in?"

**Arquivos:** `src/components/ConsumptionRanking.tsx`, `src/components/BarCheckin.tsx`

### 3.3 Historico de Consumo por Bar
**Problema:** Usuario so ve total, nao sabe quanto bebeu em cada bar.

**Solucao:**
- Na aba Consumo, adicionar secao colapsavel "Ver por bar"
- Lista simples: Bar 1: 3 bebidas, Bar 2: 5 bebidas, etc.

**Arquivo:** `src/components/ConsumptionCounter.tsx` ou novo componente

### 3.4 Notificacoes de Marco
**Problema:** Usuario nao percebe marcos importantes.

**Solucao:**
- Notificacao/toast especial quando:
  - Atinge 10, 20, 30 bebidas
  - Entra no top 3 do ranking
  - Visita o ultimo bar

**Arquivo:** `src/hooks/useNotifications.ts`, `src/contexts/BaratonaContext.tsx`

---

## 4. IDEIAS DIVERTIDAS

### 4.1 Conquistas/Badges
**Problema:** Falta gamificacao alem do ranking.

**Solucao:**
Criar sistema de conquistas desbloqueaeis:
- "Primeiro Gole" - Primeira bebida registrada
- "Sommelier" - Experimentou todos os 4 tipos de bebida
- "Social Butterfly" - Fez check-in em 5+ bares
- "Critico Gastronomico" - Avaliou todos os bares
- "Madrugador" - Presente no primeiro bar
- "Coruja" - Presente no ultimo bar
- "Equilibrista" - Mesma quantidade de comida e bebida

**Arquivos:**
- Criar `src/components/Achievements.tsx`
- Criar tabela `achievements` no banco
- Adicionar logica de unlock em `BaratonaContext`

---

## 5. PREVENCAO DE ERROS

### 5.1 Confirmacao para Check-out
**Problema:** Usuario pode fazer check-out acidentalmente.

**Solucao:**
- Adicionar dialog de confirmacao antes de check-out
- "Tem certeza que quer sair do bar? Voce pode fazer check-in novamente."

**Arquivo:** `src/components/BarCheckin.tsx`

### 5.2 Limite de Seguranca no Consumo
**Problema:** Registro acidental de muitas bebidas (ex: apertar +5 varias vezes).

**Solucao:**
- Se usuario tenta adicionar mais de 10 bebidas de uma vez, confirmar
- Mostrar alerta se consumo total passa de 20: "Voce ta bem? Lembre de beber agua!"

**Arquivo:** `src/components/ConsumptionCounter.tsx`

### 5.3 Prevencao de Voto Duplicado Acidental
**Problema:** Usuario pode nao perceber que ja votou e ficar confuso.

**Solucao:**
- Quando usuario clica em bar ja votado, destacar claramente "Voce ja avaliou este bar"
- Mostrar as notas que deu de forma mais proeminente

**Arquivo:** `src/components/BarItinerary.tsx`, `src/components/VoteForm.tsx`
- Status ja implementado, mas pode ser mais visualmente destacado

### 5.4 Tratamento de Erro Amigavel
**Problema:** Erros de rede mostram mensagens tecnicas.

**Solucao:**
- Centralizar tratamento de erro com mensagens amigaveis
- "Ops! Problema de conexao. Tente novamente."
- Adicionar botao "Tentar novamente" em erros recuperaveis

**Arquivo:** Criar `src/lib/errorMessages.ts`, atualizar hooks

### 5.5 Auto-Save com Indicador Claro
**Problema:** Usuario pode fechar app antes do debounce salvar.

**Solucao:**
- Mostrar indicador mais claro de "salvando..."
- Ao fechar/sair, verificar se ha pendencias e alertar
- Considerar salvar imediatamente ao sair da aba

**Arquivo:** `src/components/ConsumptionCounter.tsx`

---

## Resumo de Prioridades

| Prioridade | Item | Impacto | Esforco |
|------------|------|---------|---------|
| Alta | FAB para bebidas rapidas | Alto | Medio |
| Alta | Confirmacao de check-out | Alto | Baixo |
| Alta | Conquistas/Badges | Alto | Alto |
| Media | Progresso visual no itinerario | Medio | Baixo |
| Media | Onboarding rapido | Medio | Baixo |
| Media | Estados vazios amigaveis | Medio | Baixo |
| Media | Limite de seguranca consumo | Medio | Baixo |
| Baixa | Swipe entre abas | Baixo | Medio |

---

## Secao Tecnica

### Nova Tabela Sugerida

```sql
-- Conquistas dos participantes
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, achievement_key)
);
```

### Novo Componente: QuickAddFAB

```text
+-------------------+
|                   |
|   [Cerveja]       |
|   [Cachaca]       |
|   [Drink]         |
|   [Batida]        |
|                   |
|        [+]  <-- FAB principal
+-------------------+
```

Ao clicar no FAB, expande os 4 botoes de tipo de bebida em formato radial ou vertical.

### Fluxo de Conquistas

```text
Acao do Usuario
      |
      v
BaratonaContext detecta mudanca
      |
      v
Verifica criterios de conquista
      |
      v
Se desbloqueou nova:
  - Insere em 'achievements'
  - Dispara toast especial com confete
  - Atualiza UI de badges
```

