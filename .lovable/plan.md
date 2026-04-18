# Status Geral do Projeto e Pendências

## 1. Comida di Buteco — Está pronta?

**Resposta curta:** A infraestrutura está pronta, mas o evento ainda precisa ser populado com dados reais.

### O que já existe

- Evento `comida-di-buteco-rj-2026` criado no banco (seed via migration)
- Schema adaptado: `event_bars` com `featured_dish`, `dish_description`, `dish_image_url`, `external_id`, `neighborhood`, `phone`, `instagram`
- Edge function `scrape-comida-di-boteco` pronta (Firecrawl + geocoding Nominatim)
- UI `SpecialCircuitLanding` renderizando grid de petiscos
- `EventLanding` faz branch automático para circuito
- Mapa adaptado para modo circuito (bounding box multi-POI)
- Voto único por petisco (`dish_score`) implementado
- Botão "Importar / Atualizar butecos" no `EventAdmin`
- Card aparece em "Eventos em destaque" na Home

### O que falta para estar 100%

- **Rodar o scrape** (botão no admin) — sem isso `event_bars` está vazio e a página fica sem bares
- Validar que Firecrawl extraiu ≥30 bares e que Nominatim geocodou ≥80%
- QA visual: abrir `/baratona/comida-di-buteco-rj-2026` e conferir grid de petiscos + mapa
- Logs da edge function estão vazios → função nunca foi executada ainda

## 2. Roadmap consolidado — O que falta

### Bloqueadores (alta prioridade)


| #   | Item                                                     | Status      |
| --- | -------------------------------------------------------- | ----------- |
| B1  | Executar e validar scrape do Comida di Buteco end-to-end | Não rodado  |
| B6  | Seed `super_admin` em `platform_roles` para owner do Nei | Pendente    |
| B7  | Edge function logs vazios — confirmar deploy ativo       | A verificar |


### Funcionalidades pendentes do plano original


| #   | Item                                                                         | Estado                                 |
| --- | ---------------------------------------------------------------------------- | -------------------------------------- |
| F1  | **Convite por código** (gerar no admin + tela de entrada)                    | Tabela `event_invites` existe, UI zero |
| F2  | **Editar evento** após criação (nome, bares, datas)                          | Não existe                             |
| F3  | **Página "Minhas Baratonas"** (criadas + participadas)                       | Não existe                             |
| F4  | **Filtro por cidade** no Explore                                             | Só busca texto + tipo                  |
| F5  | **Web Share + og:image dinâmico** por evento                                 | Botão sem og tags                      |
| F6  | **Indicador "Modo Legado"** no `/nei`                                        | Não existe                             |
| F8  | Remover `as any` do `platformApi.ts`                                         | Pendente                               |
| F9  | `BaratonaWrapped` ler de `event_*` (multi-evento)                            | Só funciona no `/nei`                  |
| F10 | `AdminRetrospective` multi-evento (com ranking de petiscos via `dish_score`) | Só legado                              |
| F11 | Notificações push para broadcasts em eventos novos                           | Só legado                              |


### Polimento e UX


| #   | Item                                                                       |
| --- | -------------------------------------------------------------------------- |
| P1  | Loading skeleton em `EventLanding` (hoje só "Carregando...")               |
| P3  | Validação de slug duplicado + mínimo 1 bar no `CreateEvent`                |
| P4  | OG meta tags dinâmicas via `useSeo` no `EventLanding`                      |
| P5  | Upload de capa do evento (storage bucket + UI admin) — hoje só URL externa |
| P6  | Empty state no Explore destacando o Comida di Buteco como sugestão fixa    |


### Já entregues (limpando o roadmap)

- ✅ B2/B3 — VoteForm + `event_votes` adaptados (voto único `dish_score`)
- ✅ B4/B5 — UNIQUE constraints em `event_checkins` e `event_consumption`
- ✅ F12 — `event_app_config` auto-criado no `createEventApi`
- ✅ Eventos em destaque na Home
- ✅ Mapa modo circuito (bounding box + rota dinâmica)
- ✅ Filtro por tipo (Baratona / Circuito) no Explore

## 3. Análise crítica adicional (não estava no roadmap original)


| #   | Item                                                                                                                     | Por quê importa                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| N1  | **Ranking de petiscos no `SpecialCircuitLanding**` — agregar `dish_score` médio + nº de votos por bar                    | Hoje os petiscos não mostram nota; é o coração do Comida di Buteco |
| N2  | **Ordenação dos cards no circuito** — atualmente por `bar_order`; deveria oferecer "melhor avaliados" e "mais visitados" | UX de descoberta                                                   |
| N3  | `**event_invites` sem RLS de DELETE/UPDATE** — owner não consegue revogar código                                         | Segurança                                                          |
| N4  | **Página de busca de bar individual** dentro do circuito (filtro por bairro)                                             | 40-80 bares ficam difíceis de navegar sem filtro                   |
| N5  | **Compartilhar petisco específico** (deep link `?bar=<id>`)                                                              | Viralização                                                        |
| N6  | `**useSeo` não usado em `EventLanding**` — sem título/descrição dinâmicos no browser                                     | SEO + share                                                        |


## 4. Ordem de execução proposta para os próximos ciclos

```text
CICLO ATUAL (próximo):
1. Executar scrape do Comida di Buteco e validar dados (B1, B7)
2. Ranking de petiscos no SpecialCircuitLanding (N1) — média de dish_score + nº votos
3. Filtro por bairro no circuito (N4)

CICLO SEGUINTE:
4. Convite por código (F1) — gerar no admin + tela de entrada
5. Página "Minhas Baratonas" (F3)
6. Editar evento (F2) + filtro cidade no Explore (F4)

CICLO 3:
7. OG tags dinâmicas + Web Share (F5, P4, useSeo no EventLanding)
8. Wrapped + Retrospective multi-evento com ranking de petiscos (F9, F10)
9. Loading skeletons + validações (P1, P3)

CICLO 4 (polimento):
10. Upload de capa via storage bucket (P5)
11. Notificações push multi-evento (F11)
12. Limpeza: remover `as any`, indicador legado, seed super_admin (F8, F6, B6)
```

## 5. Ação recomendada agora

**Sugiro começar pelo ciclo atual:**

1. Rodar por script dessa vezimportação do Comida di Buteco (sem a necessidade de clicar no botão "Importar / Atualizar butecos" em `/baratona/comida-di-buteco-rj-2026/admin`)
2. Validar resultado (quantos bares vieram, quantos geocodaram)
3. Implementar ranking de petiscos por `dish_score` no grid

Quer que eu já implemente o **ranking de petiscos + filtro por bairro** enquanto você roda o scrape, ou prefere validar o scrape primeiro?