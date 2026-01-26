
# Plano de Garantia de Qualidade - Baratona 2026

## Personas Analisadas

### 1. Participante (26 pessoas)
O usuário principal do aplicativo durante o pub crawl.

**Jornada do Participante:**
- Seleciona seu nome na lista
- Faz check-in ao chegar em cada bar
- Registra bebidas e comidas consumidas
- Vê o ranking em tempo real
- Avalia cada bar visitado
- Usa painel de emergência se necessário

### 2. Admin (Nei)
Organizador do evento com controle total.

**Jornada do Admin:**
- Gerencia status da van (no bar/em trânsito)
- Ajusta atrasos globais
- Envia broadcasts de emergência
- Monitora participantes

### 3. Observador (no próprio celular)
Participante que quer acompanhar estatísticas do grupo.

**Jornada do Observador:**
- Vê Baratometro (totais do grupo)
- Acompanha ranking de consumo
- Visualiza quem fez check-in em cada bar

---

## Checklist de Funcionalidades por Persona

### Participante

| Funcionalidade | Status Real-time | Testado |
|----------------|------------------|---------|
| Login (selecionar nome) | N/A | Pendente |
| Logout com confirmacao | N/A | Pendente |
| Check-in no bar | Sim (Realtime) | Pendente |
| Adicionar bebida (+1, +5) | Sim (debounce 2s) | Pendente |
| Adicionar comida (+1, +5) | Sim (debounce 2s) | Pendente |
| Ver ranking | Sim (Realtime) | Pendente |
| Avaliar bar (1-5 estrelas) | Sim (Realtime) | Pendente |
| Ver countdown para proximo bar | Sim (1s interval) | Pendente |
| Ver status da van | Sim (Realtime) | Pendente |
| Pull-to-refresh | Manual | Pendente |
| Ver quem esta no bar | Sim (Realtime) | Pendente |
| Painel de emergencia | N/A | Pendente |

### Admin

| Funcionalidade | Status Real-time | Testado |
|----------------|------------------|---------|
| Toggle status van | Propaga Realtime | Pendente |
| Ajustar delay global | Propaga Realtime | Pendente |
| Enviar broadcast | Propaga Realtime | Pendente |
| Ver todas as estatisticas | N/A | Pendente |

---

## Problemas Identificados e Correcoes

### 1. Realtime - CRITICO

**Tabelas com Realtime ativo:**
- `participants` - OK
- `app_config` - OK
- `votes` - OK
- `consumption` - OK
- `checkins` - OK

**Problema potencial:** A tabela `bars` nao tem subscription Realtime.

**Correcao:** Adicionar subscription para a tabela `bars` no hook `useBars`:
```text
src/hooks/useSupabaseData.ts - useBars()
- Adicionar canal Realtime para mudancas em bars
- Garantir que roteiro atualiza em tempo real se admin editar
```

### 2. Consistencia de Dados - MEDIO

**Problema:** O consumo usa debounce de 2 segundos, mas nao ha indicador visual claro de "pendente" vs "salvo".

**Correcao:**
```text
src/components/ConsumptionCounter.tsx
- Mostrar badge "Salvando..." enquanto aguarda debounce
- Mostrar "Salvo!" apos confirmacao (ja implementado)
- Adicionar animacao de pulse no contador enquanto pendente
```

### 3. Tratamento de Erros - ALTO

**Problema:** Varios componentes nao tratam falhas de rede adequadamente.

**Correcoes por componente:**
```text
src/components/BarCheckin.tsx
- Adicionar toast de erro se check-in falhar
- Manter estado otimista, mas reverter em caso de erro

src/components/VoteForm.tsx
- Adicionar toast de erro se voto falhar
- Desabilitar botao durante submissao (ja feito)
- Mostrar feedback de sucesso mais visivel
```

### 4. Estado Offline - BAIXO

**Problema:** App nao funciona offline.

**Correcao opcional:**
```text
- Implementar Service Worker basico para cache de assets
- Mostrar banner "Sem conexao" quando detectar offline
- Fila de operacoes para sync quando voltar online
```

### 5. Seguranca - AVISO

**Problema identificado pelo linter:**
RLS com `USING (true)` em INSERT/UPDATE/DELETE e permissivo demais.

**Contexto:** Para este app de pub crawl com participantes pre-definidos, o modelo "sem autenticacao" e intencional. As politicas permissivas foram escolhidas para reduzir fricao.

**Recomendacao:** Manter como esta para o evento, mas documentar que o app nao deve ser usado para dados sensiveis.

---

## Plano de Testes por Fluxo

### Fluxo 1: Jornada Completa do Participante

```text
1. Abrir app -> Ver tela de selecao
2. Selecionar nome -> Verificar que vai para MainTabs
3. Clicar "Cheguei!" -> Verificar check-in aparece na lista
4. Adicionar bebida (+1) -> Verificar contador atualiza
5. Adicionar +5 bebidas -> Verificar debounce e save
6. Puxar para atualizar -> Verificar dados recarregam
7. Navegar para tab "Consumo" -> Ver Baratometro
8. Verificar ranking atualiza em tempo real
9. Navegar para "Explorar" -> Ver mapa e itinerario
10. Clicar em bar visitado -> Abrir drawer de avaliacao
11. Avaliar bar (4 categorias) -> Submeter voto
12. Verificar voto aparece imediatamente
13. Trocar de usuario (logout) -> Confirmar dialog
14. Selecionar outro nome -> Verificar dados do novo usuario
```

### Fluxo 2: Jornada do Admin

```text
1. Login como Nei (admin)
2. Acessar /admin -> Verificar painel carrega
3. Selecionar origem e destino
4. Clicar "Iniciar Deslocamento"
5. Verificar status muda para "Em transito" em TODOS os clients
6. Ajustar delay global (+5 min)
7. Verificar countdown atualiza em todos os clients
8. Enviar broadcast "Proximo bar em 5 min!"
9. Verificar mensagem aparece para todos
10. Clicar "Chegamos!"
11. Verificar status volta para "No bar"
```

### Fluxo 3: Sincronizacao Multi-Device

```text
1. Abrir app em 2 dispositivos (usuarios diferentes)
2. Device A: adicionar bebida
3. Device B: verificar ranking atualiza em < 3 segundos
4. Device A: fazer check-in
5. Device B: verificar lista "Quem esta aqui" atualiza
6. Admin: mudar status da van
7. Ambos devices: verificar VanStatus atualiza
```

---

## Melhorias de UX Recomendadas

### 1. Feedback Haptico
Ja implementado em: check-in, contadores, votos.

**Verificar:**
- Intensidade adequada (50ms)
- Nao muito frequente

### 2. Estados de Loading
```text
Componentes que precisam de loading state:
- ParticipantSelector - OK (Loader2)
- BarItinerary - OK (Loader2)
- VanStatus - OK (Loader2)
- ConsumptionCounter - Parcial (falta loading inicial)
- ConsumptionRanking - Falta loading state
```

### 3. Empty States
```text
Verificar mensagens quando:
- Nenhum check-in no bar atual
- Nenhum voto em um bar
- Ranking vazio
```

### 4. Acessibilidade
```text
Verificar:
- Tamanho minimo de botoes (44x44px)
- Contraste de cores
- Labels em inputs
- Aria-labels em botoes icone
```

---

## Secao Tecnica: Arquitetura de Dados

### Subscriptions Ativas

| Hook | Tabela | Canal | Eventos |
|------|--------|-------|---------|
| useParticipants | participants | participants-changes | * |
| useAppConfig | app_config | app-config-changes | * |
| useVotes | votes | votes-changes | * |
| useConsumption | consumption | consumption-changes | * |
| useCheckins | checkins | checkins-changes | * |

### Problema de Performance Potencial

**Observacao:** Cada hook cria sua propria subscription. Com 26 usuarios simultaneos, cada um tera 5 subscriptions ativas = 130 conexoes WebSocket.

**Recomendacao:** Para escala, consolidar em um unico canal multiplexado. Para o tamanho atual (26 pessoas), e aceitavel.

### Estrutura do Banco

```text
app_config (1 row) - Configuracao global
  - status: 'at_bar' | 'in_transit'
  - current_bar_id
  - global_delay_minutes
  - broadcast_msg

bars (N rows) - Roteiro de bares
  - id, name, address, scheduled_time
  - latitude, longitude

participants (26 rows) - Lista fixa
  - id, name, is_admin

consumption (N rows) - Consumo por bar
  - participant_id, bar_id, type, count

votes (N rows) - Avaliacoes
  - participant_id, bar_id, drink/food/vibe/service_score

checkins (N rows) - Presenca
  - participant_id, bar_id, checked_in_at
```

---

## Implementacao Sugerida

### Fase 1: Estabilidade (Prioridade Alta)

1. **Adicionar Realtime na tabela bars**
   - Arquivo: `src/hooks/useSupabaseData.ts`
   - Impacto: Admin pode editar roteiro e todos veem

2. **Melhorar tratamento de erros**
   - Arquivos: `BarCheckin.tsx`, `VoteForm.tsx`, `ConsumptionCounter.tsx`
   - Impacto: Usuarios nao perdem dados

3. **Adicionar loading states faltantes**
   - Arquivo: `ConsumptionRanking.tsx`
   - Impacto: UX consistente

### Fase 2: Robustez (Prioridade Media)

4. **Indicador de conexao offline**
   - Novo arquivo: `src/components/OfflineIndicator.tsx`
   - Impacto: Usuario sabe quando esta sem conexao

5. **Retry automatico em falhas**
   - Modificar hooks de mutation
   - Impacto: Resiliencia a falhas temporarias

### Fase 3: Finalizacao (Prioridade Baixa)

6. **Testes E2E basicos**
   - Criar scripts de teste manual
   - Verificar fluxos principais

7. **Documentar numero real do Nei**
   - Arquivo: `src/components/EmergencyPanel.tsx`
   - Substituir placeholder `5521999999999`

---

## Proximos Passos

Ao aprovar este plano, implementarei:

1. Subscription Realtime para tabela `bars`
2. Loading state no `ConsumptionRanking`
3. Tratamento de erro aprimorado nos componentes criticos
4. Indicador visual de conexao/sync
5. Verificacao de todos os fluxos de usuario

O objetivo e garantir que no dia 07/02 (sabado), todos os 26 participantes tenham uma experiencia fluida sem perda de dados ou dessincronizacao.
