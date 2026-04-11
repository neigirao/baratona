# Arquitetura da Aplicação Baratona

## 1) Visão geral

A **Baratona** é uma aplicação web mobile-first para acompanhar um roteiro de bares em tempo real, com:

- seleção de participante;
- status da van e logística entre bares;
- check-in por bar;
- contadores de consumo (bebida/comida) com consolidação por bar e total;
- votação por bar (bebida, comida, vibe, atendimento);
- ranking e estatísticas;
- conquistas (achievements);
- painel administrativo para operação do evento;
- retrospectiva final (Baratona Wrapped).

A arquitetura é centrada em **React + Context API** no frontend e **Supabase (Postgres + Realtime + RLS)** no backend.

---

## 2) Stack técnica

### Frontend
- **React 18 + TypeScript + Vite**
- **React Router DOM** para roteamento
- **TanStack Query** para provider global (infra pronta para cache de query)
- **Tailwind CSS + shadcn/ui + Radix** para UI
- **Recharts** para gráficos
- **Leaflet / React-Leaflet** para mapa

### Backend (BaaS)
- **Supabase**
  - Postgres (tabelas de domínio)
  - Realtime subscriptions (`postgres_changes`)
  - RLS liberado para uso público (evento sem autenticação tradicional)

---

## 3) Estrutura de pastas

```text
src/
  components/
    ui/                 # biblioteca de componentes base (shadcn)
    wrapped/            # componentes específicos da retrospectiva
    *.tsx               # componentes de domínio (bar, check-in, consumo etc.)
  contexts/
    BaratonaContext.tsx # estado global de domínio + ações
  hooks/
    useSupabaseData.ts  # acesso a participantes, bares, config, votos, consumo
    useCheckins.ts      # check-ins por bar
    useAchievements.ts  # catálogo + desbloqueio de conquistas
    useAchievementChecker.ts # motor de regras de conquistas
    useNotifications.ts # notificações do browser
    useSyncStatus.ts    # indicador de sincronização
    useRetry.ts         # retry com backoff exponencial
  integrations/supabase/
    client.ts           # client Supabase
    types.ts            # tipos de DB gerados
  pages/
    Index.tsx           # app principal
    Admin.tsx           # painel administrativo
    NotFound.tsx
  lib/
    constants.ts        # i18n + tipos de domínio locais
    errorMessages.ts
    utils.ts
```

`supabase/migrations/` contém o versionamento de schema e evolução das entidades.

---

## 4) Arquitetura lógica (camadas)

## 4.1 Camada de apresentação (UI)
Responsável por renderização, interação e navegação entre abas/telas.

- `Index.tsx` orquestra a experiência principal do usuário.
- `MainTabs.tsx` organiza os contextos funcionais em 3 áreas: **Agora**, **Consumo**, **Explorar**.
- `Admin.tsx` concentra operações de controle operacional.
- `BaratonaWrapped.tsx` entrega a narrativa final de dados do evento.

## 4.2 Camada de estado e orquestração
`BaratonaContext` é o **núcleo de estado do domínio**, expondo:

- usuário atual, idioma e traduções;
- dados sincronizados (participantes, bares, config, votos, consumo);
- comandos de escrita (consumo, voto, config);
- agregações/computações (bar atual, próximo bar, projeção de horário, totais);
- estado de sincronização (refresh e “última atualização”).

## 4.3 Camada de dados
Hooks especializados isolam acesso ao Supabase:

- `useParticipants`, `useBars`, `useAppConfig`, `useVotes`, `useConsumption`.
- Cada hook executa:
  1. fetch inicial;
  2. subscribe realtime em mudanças;
  3. refetch após alterações.

Essa abordagem simplifica o fluxo para um evento social (consistência eventual com feedback rápido).

## 4.4 Persistência e modelo de dados
Postgres no Supabase com tabelas para:

- `participants`
- `bars`
- `app_config` (singleton id=1)
- `votes`
- `consumption` (com `bar_id` e `subtype`)
- `checkins`
- `achievements`

---

## 5) Fluxos principais da aplicação

## 5.1 Login leve do participante
1. Usuário escolhe nome na `ParticipantSelector`.
2. Seleção é salva no `localStorage`.
3. Contexto restaura automaticamente em sessões futuras.

## 5.2 Consumo (bebida/comida)
1. UI chama `addDrink`, `removeDrink`, `addFood`, `removeFood`.
2. `useConsumption` faz **atualização otimista** local.
3. Persiste no Supabase com `withRetry` (backoff exponencial).
4. Realtime/refetch normaliza estado final.

## 5.3 Check-in por bar
1. Usuário marca presença no bar atual.
2. `useCheckins` aplica update otimista.
3. Persistência no Supabase com retry.
4. Estado reflete em tempo real para todos.

## 5.4 Votação por bar
1. Participante envia notas de 1–5 por dimensão.
2. `votes` usa `upsert` com conflito `(participant_id, bar_id)`.
3. Cada participante mantém no máximo um voto por bar.

## 5.5 Operação da van (admin)
1. Admin alterna status entre `at_bar` e `in_transit`.
2. Em trânsito, define origem/destino.
3. Ao chegar, define `current_bar_id`.
4. Pode ajustar atraso global e disparar broadcast.

## 5.6 Conquistas automáticas
`useAchievementChecker` avalia regras ao detectar mudanças em consumo/check-ins/votos.

Exemplos: primeiro drink, 10+ drinks, 20+ drinks, 5+ check-ins, presença no primeiro/último bar, etc.

## 5.7 Retrospectiva final (Wrapped)
1. Status `finished` no `app_config` troca a experiência para `BaratonaWrapped`.
2. Métricas pessoais e do grupo são calculadas client-side a partir de consumo, check-ins, votos e conquistas.

---

## 6) Diagrama textual de componentes

```text
main.tsx
  └── App.tsx
      ├── QueryClientProvider
      ├── AppErrorBoundary
      ├── BaratonaProvider
      │   └── BrowserRouter
      │       ├── /      -> pages/Index
      │       │   ├── ParticipantSelector (sem usuário)
      │       │   ├── BaratonaWrapped (evento finalizado)
      │       │   └── Layout principal
      │       │       ├── Header
      │       │       ├── SyncIndicator
      │       │       ├── MainTabs
      │       │       └── QuickAddFAB
      │       ├── /admin -> pages/Admin (guard por isAdmin)
      │       └── *      -> pages/NotFound
      └── Toasters/TooltipProvider
```

---

## 7) Modelo de dados (resumo)

## 7.1 Entidades e relacionamentos
- **participants** (1) — (N) **votes**
- **bars** (1) — (N) **votes**
- **participants** (1) — (N) **consumption**
- **bars** (1) — (N) **consumption** (quando `bar_id` preenchido)
- **participants** (1) — (N) **checkins**
- **bars** (1) — (N) **checkins**
- **participants** (1) — (N) **achievements**
- **app_config** controla estado operacional global

## 7.2 Regras de integridade relevantes
- `votes`: unicidade `(participant_id, bar_id)`.
- `consumption`: unicidade por participante + tipo + bar (via índice funcional com `COALESCE(bar_id, -1)`).
- `checkins`: unicidade `(participant_id, bar_id)`.
- `achievements`: unicidade `(participant_id, achievement_key)`.

---

## 8) Estado, sincronização e consistência

A estratégia adotada combina:

- **UI otimista** para baixa latência percebida;
- **Retry** com backoff para robustez em rede instável;
- **Realtime** para convergência entre dispositivos;
- **Refetch** após operações críticas para correção de divergências.

Trade-off: há eventual consistência no curtíssimo prazo, mas ótima experiência em cenário móvel/evento.

---

## 9) Segurança e riscos atuais

O projeto está configurado para **acesso público amplo** nas tabelas (RLS com políticas permissivas), adequado para evento fechado com baixo requisito de segurança formal.

Para produção aberta, recomenda-se:

1. Autenticação real (Supabase Auth);
2. RLS por usuário/papel;
3. Políticas de update restritas para `app_config` (somente admins);
4. Auditoria mínima (quem alterou status, broadcast, atraso);
5. Rate limiting para writes frequentes.

---

## 10) Observabilidade e confiabilidade

Pontos positivos atuais:
- tratamento de erro com logs;
- retries em operações críticas;
- `AppErrorBoundary` para prevenir crash total de tela.

Melhorias sugeridas:
- telemetria centralizada (Sentry/LogRocket);
- métricas de latência por operação;
- dashboard de saúde realtime;
- testes e2e dos fluxos críticos (check-in, votação, admin status).

---

## 11) Escalabilidade e performance

Características atuais:
- volume de dados pequeno/moderado (evento);
- queries simples e indexadas no essencial;
- cálculo de rankings e agregações no cliente.

Se crescer (múltiplos eventos/anos), considerar:
- particionar por `event_id` em todas as tabelas;
- mover agregações pesadas para SQL views/materialized views;
- paginação/limites em consultas amplas;
- cache de leitura por sessão/aba.

---

## 12) Decisões arquiteturais importantes

1. **Context API como fachada de domínio**
   - Simplifica consumo do estado pelos componentes.
2. **Supabase Realtime como backbone colaborativo**
   - Remove necessidade de backend custom para sincronização básica.
3. **UI otimista + retry**
   - Excelente UX para contexto móvel com conectividade variável.
4. **Admin em rota dedicada com guard client-side**
   - Simples e suficiente para contexto de evento privado.

---

## 13) Roadmap técnico recomendado

Curto prazo:
- documentação de variáveis de ambiente;
- testes unitários de hooks de domínio;
- endurecimento de permissões no Supabase.

Médio prazo:
- multi-evento (suporte a histórico por edição/ano);
- autenticação por link mágico ou convite;
- analytics operacional.

Longo prazo:
- extração de camada de serviços para reduzir acoplamento do Context;
- backend dedicado para regras sensíveis;
- painel admin com trilha de auditoria e observabilidade.

---

## 14) Guia rápido para novos contribuidores

1. Inicie em `src/App.tsx` e `src/contexts/BaratonaContext.tsx`.
2. Entenda os hooks em `src/hooks/useSupabaseData.ts`.
3. Navegue pela experiência em `src/pages/Index.tsx` + `src/components/MainTabs.tsx`.
4. Revise o painel em `src/pages/Admin.tsx`.
5. Consulte migrations para compreender as regras de dados.

Com essa sequência, você cobre os principais fluxos de negócio e os pontos de extensão do sistema.
