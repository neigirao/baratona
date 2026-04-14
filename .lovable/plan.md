

# Plano de Correcao e Melhorias - Analise pos-Codex

## Diagnostico: O que o Codex fez

O Codex criou uma camada de plataforma multi-evento **por cima** da aplicacao existente, incluindo:

1. **Novas tabelas** (migracoes `platform_v1` e `platform_event_runtime`): `profiles`, `platform_roles`, `events`, `event_members`, `event_invites`, `event_bars`, `event_app_config`, `event_checkins`, `event_consumption`, `event_votes`, `event_achievements`
2. **Novas paginas**: `Home.tsx`, `Explore.tsx`, `CreateEvent.tsx`, `EventLanding.tsx`, `EventAdmin.tsx`, `FAQ.tsx`
3. **Novos arquivos**: `platformApi.ts`, `platformEvents.ts`, `usePlatformAuth.ts`, `NeiLegacy.tsx`
4. **Rotas novas** no `App.tsx`: `/`, `/faq`, `/explorar`, `/criar`, `/baratona/:slug`, `/baratona/:slug/admin`, `/nei`

## Problemas Identificados

### P1. Layout da Home destruido
A `Home.tsx` foi substituida por uma pagina generica e sem identidade visual. Texto placeholder ("Baratona Platform"), sem cores, sem emocao, sem o estilo que o app original tinha.

### P2. FAQ vazio e sem conteudo real
Apenas 4 perguntas banais com respostas de uma linha. Nao reflete o espirito do evento.

### P3. Pagina Explore sem funcionar de verdade
Chama `listPublicEventsApi()` que consulta a tabela `events` (provavelmente vazia). As tabelas novas (`events`, `event_bars`, etc.) existem no SQL mas **nao estao refletidas no `types.ts`** (que so conhece as tabelas originais: `participants`, `bars`, `votes`, `consumption`, `checkins`, `app_config`, `achievements`). Isso significa que `platformApi.ts` usa `supabase as any` para contornar tipos -- funciona em runtime se as tabelas existirem, mas sem seguranca de tipos.

### P4. CreateEvent sem wizard de bares
O formulario de criacao grava em `events` mas nao tem nenhum passo para adicionar bares ao evento. O evento e criado vazio.

### P5. EventLanding minimalista demais
So mostra nome, descricao, cidade e dois botoes. Nao tem CTA de participar, nao tem informacao dos bares, nao tem mapa.

### P6. EventAdmin renderiza `<Admin />` diretamente
O `EventAdmin` verifica se o usuario e o owner e renderiza o componente `Admin.tsx` original, que usa `useBaratona()` -- que por sua vez le das tabelas **originais** (`bars`, `app_config`, `consumption`, etc.), nao das novas `event_*`. Ou seja, o admin de um evento novo nao vai funcionar -- vai mostrar dados do evento legado.

### P7. NeiLegacy funciona mas depende de auth
O `/nei` exige login Google + `platform_roles.super_admin`. Isso esta correto conceitualmente, mas o app original funcionava sem login (selecao de participante por nome). Precisa garantir que o fluxo legacy continue acessivel para o super_admin.

### P8. Codigo duplicado/morto
`platformEvents.ts` tem funcoes de localStorage (`getPlatformEvents`, `savePlatformEvents`, `createPlatformEvent`) que sao residuais -- o `platformApi.ts` ja faz tudo via Supabase. Codigo morto que confunde.

### P9. Nenhuma integracao real entre tabelas novas e UI existente
A UI existente (consumo, checkin, votos, mapa, retrospectiva, wrapped) le tudo via `BaratonaContext` que usa `useSupabaseData` apontando para as tabelas originais. As tabelas `event_*` criadas pelo Codex nao tem nenhum hook, context ou componente que as consuma. Sao tabelas orfas.

---

## Plano de Correcao (por prioridade)

### Fase 1: Restaurar e proteger o que funciona

**1.1 Reverter a Home para o estilo original**
- Redesenhar `Home.tsx` mantendo a identidade visual do app (cores, gradientes, estilo mobile-first)
- Hero section com emocao: titulo chamativo, descricao do conceito de baratona, CTA forte
- Secao de features com icones e descricoes reais
- Footer com links uteis
- Manter os CTAs "Criar minha Baratona" e "Explorar"

**1.2 Reescrever FAQ com conteudo real**
- Expandir para 10-15 perguntas reais sobre como funciona uma baratona
- Usar accordion/collapsible para melhor UX
- Conteudo que explique: o que e, como participar, como criar, como funciona no dia, privacidade, etc.

**1.3 Limpar codigo morto**
- Remover funcoes localStorage de `platformEvents.ts` (manter apenas `normalizeSlug` e os tipos)
- Ou mover tipos para arquivo proprio e remover `platformEvents.ts`

### Fase 2: Fazer as paginas novas funcionarem de verdade

**2.1 Wizard de criacao completo (`CreateEvent.tsx`)**
- Step 1: Nome, descricao, cidade, visibilidade, tipo (open_baratona / special_circuit)
- Step 2: Adicionar bares (nome, endereco, horario, ordem) -- interface de lista editavel
- Step 3: Revisao e confirmacao
- Ao salvar: criar evento + `event_bars` + `event_app_config` numa transacao

**2.2 Pagina Explore funcional (`Explore.tsx`)**
- Cards visuais com data, cidade, numero de bares, status
- Filtros por cidade e tipo de evento
- Skeleton loading
- Estado vazio com CTA para criar

**2.3 Event Landing rica (`EventLanding.tsx`)**
- Mostrar lista de bares do evento (consultar `event_bars`)
- Mapa com localizacao dos bares
- Botao "Participar" (criar `event_member`)
- Compartilhar link
- Se o evento for privado, exigir codigo de convite

### Fase 3: Conectar a UI existente ao modelo multi-evento

**3.1 Criar `EventBaratonaContext`**
- Novo context que aceita um `event_id` e le/escreve nas tabelas `event_*`
- Mesma interface do `BaratonaContext` atual, mas parametrizado por evento
- Hooks internos: `useEventBars(eventId)`, `useEventAppConfig(eventId)`, `useEventConsumption(eventId)`, etc.

**3.2 Criar pagina `/baratona/:slug/live`**
- Pagina do participante durante o evento (equivalente ao `Index.tsx` atual)
- Usa `EventBaratonaContext` com o `event_id` do slug
- Reutiliza todos os componentes existentes: `MainTabs`, `Header`, `ConsumptionCounter`, `VoteForm`, `BaratonaMap`, `BarCheckin`, etc.

**3.3 Adaptar `/baratona/:slug/admin`**
- Em vez de renderizar `<Admin />` com o context legado, renderizar um admin que usa `EventBaratonaContext`
- Mesma UI do admin atual, mas lendo/escrevendo nas tabelas `event_*`

### Fase 4: Manter o legado `/nei` intacto

**4.1 Garantir que `/nei` continue usando as tabelas originais**
- `NeiLegacy.tsx` ja renderiza `<Index />` dentro de `<BaratonaProvider>` (via `EventProviderShell` no App.tsx)
- Isso esta correto -- o legado continua usando `participants`, `bars`, `app_config`, etc.
- Apenas garantir que o guard de `super_admin` funcione com o Google Auth configurado

**4.2 Adicionar indicador visual de "modo legado"**
- Badge ou banner sutil no `/nei` indicando que e o evento original

### Fase 5: Tipos e seguranca

**5.1 Regenerar types.ts**
- As tabelas novas (`events`, `event_bars`, `event_app_config`, etc.) precisam aparecer no `types.ts`
- Isso acontece automaticamente quando as migracoes sao aplicadas pelo Lovable -- pode ser necessario triggerar a regeneracao

**5.2 Remover `as any` do platformApi.ts**
- Apos types.ts atualizado, usar tipos corretos em todas as queries
- Adicionar validacao de input nos endpoints de criacao

---

## Detalhes Tecnicos

### Arquivos a criar
- `src/contexts/EventBaratonaContext.tsx` -- context multi-evento
- `src/hooks/useEventData.ts` -- hooks para tabelas `event_*`
- `src/pages/EventLive.tsx` -- pagina do participante no evento

### Arquivos a modificar significativamente
- `src/pages/Home.tsx` -- redesign completo
- `src/pages/FAQ.tsx` -- conteudo real + accordion
- `src/pages/CreateEvent.tsx` -- wizard multi-step com bares
- `src/pages/Explore.tsx` -- cards visuais + filtros
- `src/pages/EventLanding.tsx` -- landing rica com bares e mapa
- `src/pages/EventAdmin.tsx` -- usar EventBaratonaContext
- `src/lib/platformApi.ts` -- remover `as any`, adicionar funcoes para bares
- `src/lib/platformEvents.ts` -- limpar codigo morto
- `src/App.tsx` -- adicionar rota `/baratona/:slug/live`

### Arquivos que NAO devem ser tocados
- `src/contexts/BaratonaContext.tsx` -- continua funcionando para o legado `/nei`
- `src/hooks/useSupabaseData.ts` -- idem, serve o legado
- `src/components/AdminRetrospective.tsx` -- funciona com o context atual
- `src/components/BaratonaWrapped.tsx` -- idem
- `src/pages/Index.tsx` -- pagina legada, intacta
- `src/pages/Admin.tsx` -- admin legado, intacto
- Todos os componentes de UI existentes (MainTabs, ConsumptionCounter, VoteForm, etc.)

### Migracoes necessarias
- Nenhuma nova migracao de schema (as tabelas do Codex ja estao corretas)
- Pode ser necessario seed data para testes

### Ordem de execucao recomendada
1. Limpar codigo morto + restaurar Home e FAQ (visual, sem risco)
2. Wizard de criacao com bares (funcionalidade core)
3. EventBaratonaContext + EventLive (conectar UI existente ao multi-evento)
4. Explore e EventLanding melhoradas
5. EventAdmin conectado ao novo context
6. Testes end-to-end do fluxo completo

