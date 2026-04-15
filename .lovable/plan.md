

# Analise do Plano e Proximos Passos

## O que ja foi feito (Fases 1 e 2)

| Item | Status |
|------|--------|
| Home redesenhada com identidade visual | Feito |
| FAQ com 14+ perguntas reais em accordion | Feito |
| Codigo morto limpo do platformEvents.ts | Feito |
| Wizard de criacao com 3 steps (dados, bares, revisao) | Feito |
| Explore com busca, skeleton e estado vazio | Feito |
| EventLanding com lista de bares, join e share | Feito |
| Tabelas event_* criadas com RLS | Feito |
| platformApi.ts com funcoes completas | Feito |
| Rotas configuradas no App.tsx | Feito |

## O que falta (Fases 3, 4 e 5 + extras)

### Fase 3: EventBaratonaContext (CRITICO - sem isso o "modo live" nao funciona)

O `EventLive.tsx` atual e apenas um placeholder com "modo ao vivo em breve". Nenhum componente existente (consumo, check-in, votacao, mapa, conquistas, wrapped) funciona para eventos novos porque todos dependem do `BaratonaContext` que le das tabelas legadas.

**O que precisa ser feito:**
1. Criar `src/contexts/EventBaratonaContext.tsx` - context identico ao `BaratonaContext` mas parametrizado por `event_id`, lendo/escrevendo nas tabelas `event_*`
2. Criar `src/hooks/useEventData.ts` - hooks equivalentes ao `useSupabaseData.ts` para tabelas `event_checkins`, `event_consumption`, `event_votes`, `event_app_config`, `event_achievements`
3. Reescrever `EventLive.tsx` para usar o novo context e renderizar os mesmos componentes (`MainTabs`, `Header`, `ConsumptionCounter`, `VoteForm`, `BaratonaMap`, etc.)
4. Reescrever `EventAdmin.tsx` para ter o painel admin completo (controle de status, broadcast, retrospectiva) usando o novo context

### Fase 4: Legado /nei

O `/nei` exige `super_admin` no `platform_roles`, mas ninguem tem esse role no banco. Precisa:
1. Inserir o role de super_admin para o usuario correto via migracao ou seed
2. Adicionar badge visual "Evento Original" no `/nei`

### Fase 5: Tipos e seguranca

1. Remover `as any` do `platformApi.ts` - as tabelas `event_*` ja existem no `types.ts`, entao pode-se tipar corretamente
2. Validacao de input na criacao de eventos

---

## Extras que podemos fazer alem do plano original

### E1. Data e horario do evento
As tabelas `events` nao tem campo de data do evento (`event_date`). Sem isso, nao da pra mostrar "quando vai ser" no Explore nem ordenar por data. Migracao simples: `ALTER TABLE events ADD COLUMN event_date date;`

### E2. Contador de participantes no Explore e Landing
O card de Explore e a Landing nao mostram quantos participantes ja entraram. Basta uma query `count` em `event_members`.

### E3. Editar evento apos criacao
Nao existe tela para o owner editar nome, descricao, adicionar/remover bares depois de criar. Isso e essencial para organizadores.

### E4. Convite por codigo para eventos privados
A tabela `event_invites` ja existe mas nao ha UI para gerar codigos nem tela para o participante digitar o codigo.

### E5. Notificacoes e broadcast para eventos novos
O sistema de broadcast do admin legado (`app_config.broadcast_msg`) nao esta conectado aos eventos novos. O `event_app_config` tem o campo mas nao ha UI.

### E6. Galeria de fotos do evento
Storage bucket para participantes enviarem fotos durante o evento, com galeria na retrospectiva.

### E7. Ranking em tempo real durante o evento
Leaderboard ao vivo mostrando quem mais bebeu, quem mais fez check-in, com animacoes de mudanca de posicao.

### E8. Historico de baratonas do usuario
Pagina "Minhas Baratonas" mostrando eventos que o usuario criou e participou, com stats resumidos.

---

## Ordem de execucao recomendada

```text
1. EventBaratonaContext + useEventData (base para tudo)
2. EventLive funcional (reutilizando componentes existentes)
3. EventAdmin funcional (admin completo para eventos novos)
4. Data do evento + contador de participantes (UX basica)
5. Remover `as any` do platformApi
6. Editar evento apos criacao
7. Convite por codigo
8. Historico de baratonas do usuario
```

## Detalhes tecnicos

O `EventBaratonaContext` precisa expor a mesma interface (`BaratonaContextType`) para que os componentes existentes funcionem sem alteracao. A diferenca e interna: em vez de queries em `bars`, `consumption`, `checkins`, `votes`, `app_config`, ele consulta `event_bars`, `event_consumption`, `event_checkins`, `event_votes`, `event_app_config` filtrado por `event_id`. Os tipos de ID mudam de `integer` (legado) para `uuid` (event_*), entao sera necessario adaptar a interface para aceitar ambos ou criar um wrapper.

Os componentes existentes (`ConsumptionCounter`, `VoteForm`, `BarCheckin`, `BaratonaMap`) usam `useBaratona()`. Para reutiliza-los, o `EventBaratonaContext` deve ser fornecido via um provider que exponha o mesmo hook `useBaratona()` ou os componentes devem aceitar o context via prop/generic hook.

