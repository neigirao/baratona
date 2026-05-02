# Playbook de Evolução por IA

Este documento descreve como planejar e executar mudanças no projeto com agentes de IA.

## 1) Princípios

- **Mudanças incrementais**: dividir tarefas em lotes pequenos.
- **Rastreabilidade**: cada mudança deve citar arquivos/linhas impactadas.
- **Validação automática**: toda mudança precisa de checks de qualidade.
- **Documentação viva**: docs devem evoluir junto com o código.

## 2) Fluxo sugerido por task

1. **Diagnóstico**
   - Ler `README.md`, `docs/ARQUITETURA.md` e arquivos de domínio impactados.
2. **Plano**
   - Definir objetivo, escopo, riscos e critérios de aceite.
3. **Execução**
   - Implementar em commits pequenos e sem ruído.
4. **Validação**
   - Rodar `typecheck`, `lint`, `test` e `build`.
5. **Entrega**
   - Atualizar docs e registrar trade-offs técnicos.

## 3) Prompt base para agentes

```text
Objetivo:
[descreva a funcionalidade/correção]

Restrições:
- Não quebrar contratos de dados existentes.
- Manter UX otimista e sincronização realtime.
- Atualizar documentação afetada.

Critérios de aceite:
- [ ] comportamento A
- [ ] comportamento B
- [ ] sem regressão em [fluxo crítico]

Validações:
- npm run typecheck
- npm run lint
- npm run test
- npm run build
```

## 4) Definição de pronto (DoD)

Uma tarefa feita por IA só é considerada pronta quando:

- atende critérios de aceite funcionais;
- passa nas validações automáticas;
- não introduz dívida técnica não documentada;
- inclui atualização de docs quando necessário.

## 5) Backlog técnico orientado a IA

### Curto prazo
- Adicionar testes de hooks de evento (`useEventConsumption`, `useEventCheckins`, `useEventVotes`).
- Cobrir cenários de falha de rede e retry nos hooks de plataforma.
- SEO técnico completo: sitemap.xml dinâmico, schema.org `Event`, robots.txt por ambiente.

### Médio prazo
- Migração de dados históricos do legado para o modelo `event_id`.
- Auditoria formal de RLS: suite de testes de policy Supabase.
- Observabilidade em produção (Sentry ou equivalente).
- Importação automática de lista curada de bares para circuitos especiais.

### Longo prazo
- Relatórios avançados pós-evento: taxa de presença por etapa, tempo de deslocamento real vs previsto.
- Delegação de co-admin por evento (`event_admin`).
- Anti-spam e limites de criação de baratonas por usuário.


## 6) Artefatos de suporte (já disponíveis no repositório)

- `.github/pull_request_template.md` para padronizar escopo, riscos e validações.
- `src/test/setup.ts` para setup de testes com Vitest + Testing Library.
- Exemplos de testes de hooks: `src/hooks/useRetry.test.ts` e `src/hooks/useSyncStatus.test.tsx`.
