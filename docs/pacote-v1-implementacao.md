# Pacote V1 — Arquitetura e Plano de Implementação

> **Arquivo histórico — planejamento pré-v1.**
> Este documento foi o plano de design técnico antes da implementação. O v1 foi entregue em produção.
> Para o estado atual da plataforma, consulte `docs/ARQUITETURA.md` e `docs/validacao-time-v1.md`.

---

## 1) Arquitetura final v1 (tabelas, RLS e rotas multi-evento)

### 1.1 Entidades e tabelas

> Regra principal: todas as tabelas operacionais devem carregar `event_id`.

- `profiles`
  - `id (uuid, pk)` = auth user id
  - `display_name`
  - `avatar_url`
  - `created_at`
- `platform_roles`
  - `user_id (uuid, fk profiles.id)`
  - `role` (`super_admin`)

- `events`
  - `id (uuid, pk)`
  - `slug (text, unique)`
  - `name`
  - `description`
  - `visibility` (`public` | `private`)
  - `event_type` (`open_baratona` | `special_circuit`)
  - `owner_user_id (uuid, fk profiles.id)`
  - `status` (`draft` | `published` | `finished`)
  - `starts_at`, `ends_at`
  - `created_at`, `updated_at`

- `event_members`
  - `id (uuid, pk)`
  - `event_id (uuid, fk events.id)`
  - `user_id (uuid, fk profiles.id)`
  - `role` (`event_owner` | `participant`)  
  - **Obs.: na v1 não haverá `event_admin` delegado**

- `event_bars`
  - `id (uuid, pk)`
  - `event_id`
  - `name`, `address`
  - `latitude`, `longitude`
  - `bar_order`
  - `scheduled_time`

- `event_app_config`
  - `event_id (uuid, pk)`
  - `status` (`at_bar` | `in_transit` | `finished`)
  - `current_bar_id`, `origin_bar_id`, `destination_bar_id`
  - `global_delay_minutes`
  - `broadcast_msg`
  - `updated_at`

- `event_checkins`
  - `id (uuid, pk)`
  - `event_id`
  - `bar_id`
  - `user_id`
  - `checked_in_at`

- `event_consumption`
  - `id (uuid, pk)`
  - `event_id`
  - `bar_id`
  - `user_id`
  - `type` (`drink` | `food`)
  - `subtype`
  - `count`
  - `updated_at`

- `event_votes`
  - `id (uuid, pk)`
  - `event_id`
  - `bar_id`
  - `user_id`
  - `drink_score`, `food_score`, `vibe_score`, `service_score`
  - `created_at`

- `event_achievements`
  - `id (uuid, pk)`
  - `event_id`
  - `user_id`
  - `achievement_key`
  - `unlocked_at`

- `event_invites`
  - `id (uuid, pk)`
  - `event_id`
  - `invite_code`
  - `max_uses`
  - `uses`
  - `expires_at`

### 1.2 RLS (resumo objetivo)

- `events`
  - `SELECT`: todos para `visibility = 'public'`; privados apenas owner/membro.
  - `UPDATE/DELETE`: apenas `owner_user_id` e `super_admin`.
- Tabelas `event_*`
  - `SELECT`: membro do evento; se público, leitura pública somente para dados permitidos.
  - `INSERT/UPDATE/DELETE`: owner e participantes conforme ação (ex.: voto/consumo por próprio usuário).
- `/nei`
  - reforço de autorização em app + policy: apenas `super_admin`.

### 1.3 Rotas da aplicação

- `/` Home institucional
- `/faq` FAQ
- `/explorar` Lista de baratonas públicas
- `/criar` Wizard de criação (Google login obrigatório)
- `/baratona/:slug` Página do evento
- `/baratona/:slug/admin` Painel de operação (somente owner)
- `/nei` evento legado (somente super_admin)

---

## 2) Design técnico de autenticação Google + onboarding

### 2.1 Fluxo de login

1. Usuário clica em “Entrar com Google”.
2. Supabase Auth OAuth Google.
3. Callback cria/atualiza `profiles`.
4. Sessão ativa redireciona para:
   - `/criar` se veio do CTA criar,
   - `/explorar` em login genérico.

### 2.2 Regras de onboarding

- Primeiro login:
  - completar `display_name`;
  - aceitar termos básicos da plataforma.
- Criar baratona:
  - permitido para qualquer usuário logado.
- Participar de baratona privada:
  - via `invite_code`.

---

## 3) Backlog priorizado por sprint (com critério de aceite)

## Sprint 1 — Fundação técnica

1. Migrações `events` + `event_*` + `profiles` + `platform_roles`.
   - Aceite: tabelas criadas e relacionamentos válidos.
2. RLS base (público/privado + owner/super_admin).
   - Aceite: testes de policy passam em cenários básicos.
3. Auth Google + callback.
   - Aceite: login funciona ponta a ponta.

## Sprint 2 — Core de produto

1. Wizard `/criar` (dados gerais + visibilidade + bares).
   - Aceite: usuário cria evento e recebe slug válido.
2. `/explorar` com eventos públicos.
   - Aceite: listagem paginada por data/popularidade.
3. `/baratona/:slug` com módulos atuais (checkin/consumo/voto/mapa).
   - Aceite: paridade funcional mínima com a app atual.

## Sprint 3 — Operação e legado

1. `/baratona/:slug/admin` com operação completa.
   - Aceite: owner controla status, atraso e comunicados.
2. Seed + migração evento legado `nei`.
   - Aceite: dados antigos acessíveis no novo modelo.
3. `/nei` com guarda de super_admin.
   - Aceite: não-super-admin recebe 403.

## Sprint 4 — SEO + conteúdo

1. Home + FAQ publicados.
   - Aceite: conteúdo indexável e responsivo.
2. SEO técnico (meta, schema, sitemap, canonical).
   - Aceite: validação sem erros críticos no Rich Results Test.
3. Landing pública por slug otimizada para compartilhamento.
   - Aceite: OpenGraph completo em preview.

---

## 4) Plano de migração sem quebrar a baratona atual

1. Criar novas tabelas sem tocar nas antigas.
2. Script de migração batch:
   - gerar evento legado `nei`;
   - copiar `bars`, `participants`, `votes`, `consumption`, `checkins`, `achievements`.
3. Validar contagens antes/depois.
4. Habilitar leitura da UI via novo modelo por feature flag.
5. Ativar `/nei` no novo fluxo.
6. Após estabilização, descontinuar leitura antiga.

---

## 5) Especificação da rota `/nei` (super_admin)

- Middleware de rota:
  - exige usuário autenticado;
  - verifica `platform_roles.role = 'super_admin'`.
- Comportamento:
  - autorizado: entra no evento legado;
  - não autorizado: 403 + mensagem amigável.
- SEO:
  - `noindex` para `/nei`.

---

## 6) Blueprint de descoberta pública + privados por convite

### 6.1 Descoberta pública

- Página `/explorar` com:
  - busca por nome,
  - filtro por cidade/bairro,
  - filtro por tipo (`open_baratona`, `special_circuit`),
  - cards com CTA “Ver baratona”.

### 6.2 Privados por convite

- Entrada por código em `/entrar`.
- Validar `invite_code` ativo e não expirado.
- Criar vínculo em `event_members`.

---

## 7) Governança de slugs + anti-spam

### 7.1 Slugs

- Formato: `a-z`, `0-9`, `-`, tamanho 4–50.
- Lista de palavras reservadas (`admin`, `api`, `faq`, `explorar`, `nei`, etc.).
- Garantia de unicidade com sufixo quando necessário.

### 7.2 Anti-spam

- Rate limit por usuário para criação de eventos.
- Captcha no fluxo de criação (se abuse detectado).
- Flag de moderação para ocultar evento público reportado.

---

## 8) Entregáveis imediatos após aprovação deste pacote

1. ERD detalhado + SQL de migração inicial.
2. Matriz completa de permissões (endpoint x role).
3. Wireframes low-fidelity das rotas públicas e wizard.
4. Plano de rollout por feature flags.
