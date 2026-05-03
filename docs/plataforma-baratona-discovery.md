# Transformação da Baratona em Plataforma (Discovery v1)

> **Arquivo histórico — fase de discovery.**
> Este documento registra a análise inicial e a visão de produto que originou a plataforma multi-evento.
> A plataforma foi implementada. Para o estado atual, consulte `docs/ARQUITETURA.md`.

---

## 1) Diagnóstico rápido do estado atual

A aplicação já possui uma base sólida para evoluir para plataforma multi-baratona:

- **Frontend React + Vite**, com rotas principais `"/"` e `"/admin"`.
- **Controle de sessão por participante** e flag de admin por usuário (`participants.is_admin`).
- **Funcionalidades de evento já implementadas**:
  - check-in por bar,
  - consumo (bebida/comida, incluindo subtipo),
  - votação por bar (bebida/comida/vibe/atendimento),
  - ranking e conquistas,
  - mapa e roteiro,
  - painel admin operacional,
  - retrospectiva analítica pós-evento.
- **Base Supabase relacional** com tabelas de `bars`, `participants`, `app_config`, `votes`, `consumption`, `checkins`, `achievements`.

Conclusão: hoje o sistema funciona como **“instância única de uma baratona”**. O objetivo é virar **“plataforma com múltiplas baratonas”**.

---

## 2) Visão de produto (alvo)

Transformar em uma plataforma onde qualquer organizador possa:

1. Criar uma baratona própria (nome, data, tema, regras, bares, participantes).
2. Compartilhar por link/convite.
3. Rodar o evento com as mesmas funcionalidades atuais.
4. Criar baratonas especiais por coleção de bares (ex.: **Comida di Buteco/Comida de Boteco**).
5. Manter uma baratona legado específica acessível via rota dedicada (ex.: `/nei`) com acesso restrito ao admin geral.
6. Ter uma **home institucional da plataforma** com proposta de valor, CTA de criação, busca de baratonas e **FAQ**.
7. Nascer com base de **SEO técnico e de conteúdo** para aquisição orgânica.

---

## 3) Squad de 9 especialistas (como você pediu)

### 3.1 Composição

1. **Senior Backend** — modelagem multi-tenant, RLS, APIs e migrações.
2. **Senior Frontend** — arquitetura de rotas, criador de baratona, UX de onboarding.
3. **Senior UX** — fluxos de criação, colaboração, descoberta e participação.
4. **Senior Design** — sistema visual da plataforma, componentes e estados.
5. **Senior Copywriter** — microcopy, onboarding, mensagens operacionais, tom de voz.
6. **Dono de bar (40 anos)** — validação prática de operação, tempos, consumo, atendimento.
7. **Morador do RJ especialista em Comida de Boteco** — curadoria local, lógica de circuitos especiais.
8. **Arquiteto Senior** — desenho técnico de escalabilidade, observabilidade e governança.
9. **Produtor de eventos Senior** — regras operacionais, contingências e experiência ao vivo.

### 3.2 Entregáveis por papel (resumo)

- **Produto + UX + Design + Copy**: blueprint do “Criador de Baratona”.
- **Back + Arquiteto**: novo domínio de dados multi-evento + segurança + permissões.
- **Especialistas de campo (bar/eventos/RJ)**: templates prontos (baratona comum, circuito especial, Comida de Boteco).
- **Frontend**: implementação das jornadas completas + página `/nei` restrita ao admin geral.

---

## 4) Proposta técnica de evolução

### 4.1 Novo núcleo de dados (multi-baratona)

Criar entidades principais:

- `organizations` (opcional na v1, mas recomendado)
- `events` (cada baratona)
- `event_bars`
- `event_participants`
- `event_roles` (owner/admin/participant)
- `event_app_config`
- `event_votes`
- `event_consumption`
- `event_checkins`
- `event_achievements`
- `event_invites`

Regra fundamental: quase tudo passa a ter `event_id`.

### 4.2 Compatibilidade com a baratona atual

- Criar evento legado “Baratona da Nei”.
- Migrar os dados atuais para esse evento.
- Publicar rota dedicada `/nei` apontando para este evento legado.
- Bloquear `/nei` para uso exclusivo do **admin geral** da plataforma.

### 4.3 Permissões

Perfis sugeridos:

- **super_admin**: administra toda a plataforma, inclusive `/nei`.
- **event_owner**: dono da baratona.
- **event_admin**: co-admin de operação do evento.
- **participant**: usuário participante.

### 4.4 “Baratona especial” (Comida de Boteco)

Suporte nativo para tipo de evento:

- `event_type`: `open_baratona` | `special_circuit`
- filtros por bairro/região,
- importação de lista curada de bares,
- regras específicas por circuito,
- selo visual de evento especial.

### 4.5 Home da plataforma + SEO (novo escopo)

Adicionar camada institucional no front, separada da experiência in-app do evento:

- Home com seções:
  - hero com CTA (“Criar minha Baratona”),
  - benefícios da plataforma,
  - como funciona (3 passos),
  - destaque de baratonas públicas,
  - FAQ,
  - CTA final.
- Rotas públicas de aquisição:
  - `/` (home da plataforma),
  - `/faq`,
  - `/baratona/:slug` (landing/evento público),
  - `/nei` (legado restrito, sem indexação).
- Requisitos mínimos de SEO:
  - title/description únicos por página,
  - Open Graph + Twitter Cards,
  - schema.org (`FAQPage`, `WebSite`, `Event` quando aplicável),
  - sitemap.xml e robots.txt configuráveis,
  - canonical por URL pública,
  - heading hierarchy e conteúdo textual indexável.
- Conteúdo SEO inicial:
  - cluster “baratona no RJ”,
  - cluster “roteiro de bares / eventos entre amigos”,
  - páginas de apoio com termos e perguntas frequentes.

---

## 5) Roadmap sugerido

### Fase 1 — Fundação (1–2 sprints)

- Modelagem multi-evento + migrações + RLS.
- Contexto de evento no frontend (`eventSlug/eventId`).
- Seed do evento legado e rota `/nei`.
- Estrutura base de SEO técnico (metatags dinâmicas, sitemap e robots).

### Fase 2 — Criador de baratona (2–3 sprints)

- Wizard de criação (dados gerais, bares, agenda, participantes, regras).
- Compartilhamento por link/convite.
- Duplicação a partir de template.
- Home institucional + FAQ publicados.

### Fase 3 — Baratonas especiais (1–2 sprints)

- Template “Comida de Boteco”.
- Catálogo de bares por circuito especial.
- Ajustes operacionais para evento temático.
- Páginas de conteúdo SEO para eventos especiais e guias temáticos.

### Fase 4 — Escala e operação (contínuo)

- Auditoria, métricas, antifraude básico, exportação e observabilidade.

---

## 6) Requisitos já confirmados (input do cliente)

1. **Plataforma aberta ao público**: qualquer usuário pode criar sua própria baratona.
2. **Descoberta de baratonas**: usuários podem buscar baratonas existentes.
3. **Privacidade por evento**: cada baratona pode ser **pública** ou **privada**.
4. **Autenticação Google obrigatória para criação** de baratona.
5. Rota legado `/nei` restrita ao **super_admin global**.
6. O criador deve incluir **100% das funcionalidades atuais** já existentes na aplicação.
7. Eventos especiais (como Comida de Boteco) com **curadoria manual e importação** (ambos).
8. Modelo de negócio inicial: **plataforma gratuita**.
9. Cada baratona terá URL por **slug** no domínio da aplicação (ex.: `dominio.com/baratona/meu-slug`).
10. O dono do evento **não** delega co-admins nesta primeira versão.
11. Circuitos especiais **sem versionamento anual** na v1 (avaliar depois).
12. Relatórios obrigatórios: manter os **relatórios que já existem hoje**.
13. Visibilidade de consumo individual: **visível** (sim).
14. Sem requisitos extras de LGPD neste momento.
15. Home da plataforma com FAQ é parte obrigatória do escopo.
16. SEO deve ser considerado desde a v1 (técnico + conteúdo).

### Implicações técnicas imediatas

- Adotar autenticação social com Google no fluxo de entrada da plataforma.
- Diferenciar permissão de leitura por visibilidade do evento (`public` | `private`).
- Criar catálogo/índice de baratonas públicas para descoberta.
- Garantir isolamento forte por `event_id` para manter dados privados por evento.
- Incluir no wizard de criação suporte a:
  - seleção de visibilidade,
  - configuração de evento especial,
  - importação de bares via arquivo + edição manual.
- Publicar home institucional e FAQ desacoplados da experiência interna da baratona.
- Implementar camada de SEO técnico (metas, schema, sitemap, canonical).

### Pontos ainda em aberto (próxima rodada)

1. Definir se o slug será livre, reservado ou com validação de palavras bloqueadas.
2. Confirmar se o consumo individual visível vale para eventos privados e públicos igualmente.
3. Estabelecer limite de criação por usuário (anti-spam em plataforma aberta).

### Sugestões de novos relatórios (além dos atuais)

1. **Taxa de presença por etapa**: check-in por bar ao longo do tempo.
2. **Tempo médio de deslocamento real x previsto** por trecho.
3. **Distribuição de consumo por horário** (picos de demanda).
4. **Conversão de convidados**: convidados que realmente participaram.
5. **Resumo financeiro opcional** (quando o organizador informar gastos).

---

## 7) Decisões críticas (status)

### Fechadas

1. Autenticação via Google para criação de baratona.
2. Plataforma aberta ao público para criação.
3. Eventos com opção público/privado.
4. Rota `/nei` exclusiva do super_admin.
5. Eventos especiais com curadoria manual + importação.
6. Criador com paridade funcional total da app atual.
7. Plataforma gratuita na v1.
8. URL por slug dentro do domínio oficial da aplicação.
9. Sem delegação de `event_admin` na v1.
10. Sem versionamento anual de circuitos especiais na v1.
11. Relatórios atuais mantidos como obrigatórios.
12. Visibilidade de consumo individual habilitada.
13. Sem requisitos LGPD adicionais por enquanto.
14. Home institucional + FAQ obrigatórios na v1.
15. SEO técnico e de conteúdo obrigatório desde o início.

### Pendentes

1. Política anti-spam e limites de criação em plataforma aberta.
2. Regra final de validação e reserva de slugs públicos.
3. Evolução de relatórios adicionais (priorização).

---

## 8) Próximo passo sugerido

Com os requisitos confirmados, o próximo pacote será:

- arquitetura final v1 (tabelas, RLS e rotas multi-evento),
- design técnico de autenticação Google + onboarding,
- backlog priorizado por sprint com critério de aceite,
- plano de migração sem quebrar a baratona atual,
- especificação detalhada da rota `/nei` com política de super_admin,
- blueprint da busca de baratonas públicas + entrada em baratonas privadas por convite,
- e proposta de governança de slugs + controle anti-spam.
