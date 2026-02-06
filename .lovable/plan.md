

## Limpar conquistas restantes e prevenir re-criacao automatica

### Problema identificado
A base de dados mostra que **check-ins, consumo e votos estao zerados**, mas **3 conquistas do Nei** permaneceram:
- `first_drink` (Primeiro Gole)
- `ten_drinks` (Dez+)
- `twenty_drinks` (Lenda)

Estas foram provavelmente re-criadas pelo hook `useAchievementChecker` que roda automaticamente na pagina principal. O hook verifica condicoes e desbloqueia conquistas, mas nao protege contra re-insercoes apos uma limpeza de dados.

### Plano de acao

**Passo 1: Deletar as 3 conquistas restantes**
- Executar `DELETE FROM achievements` para remover os registros restantes

**Passo 2: Corrigir o hook useAchievementChecker para nao re-criar conquistas indevidamente**
- O problema e que o hook usa `prevDrinks.current` inicializado em 0 e algumas verificacoes (como `first_drink`) nao dependem de valores anteriores - apenas checam `drinks > 0`
- Quando ha dados em cache no React mas a base ja foi limpa, o checker pode re-inserir conquistas
- Adicionar uma verificacao para que conquistas baseadas em threshold (`ten_drinks`, `twenty_drinks`) exijam que o valor anterior (`prevDrinks.current`) seja maior que 0 antes de comparar thresholds, evitando falsos positivos quando o app carrega pela primeira vez

### Detalhes tecnicos

**Correcoes no `useAchievementChecker.ts`:**
- Para `first_drink`: Manter como esta (so desbloqueia se `drinks > 0`)
- Para `ten_drinks`: Adicionar condicao `prevDrinks.current > 0` para evitar desbloqueio no carregamento inicial
- Para `twenty_drinks`: Mesma correcao acima
- Inicializar `prevDrinks.current` com `-1` em vez de `0` e usar um flag `hasInitialized` para pular a primeira execucao do effect (evitando disparos no mount)

**Resultado esperado:** Conquistas so serao desbloqueadas quando o usuario efetivamente realizar acoes durante a sessao, e nao quando a pagina carrega com dados pre-existentes.

