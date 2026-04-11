# Baratona 2026

Aplicação web para gerenciamento colaborativo de uma "baratona": roteiro de bares com check-ins, consumo, votação, ranking, painel admin em tempo real e retrospectiva final (Wrapped).

## Sumário
- [Visão geral](#visão-geral)
- [Principais funcionalidades](#principais-funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração local](#configuração-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Modelo de dados](#modelo-de-dados)
- [Fluxos de negócio](#fluxos-de-negócio)
- [Decisões e trade-offs](#decisões-e-trade-offs)
- [Evolução recomendada](#evolução-recomendada)
- [Evolução assistida por IA](#evolução-assistida-por-ia)
- [Contribuição](#contribuição)

## Visão geral

A Baratona centraliza, em uma interface mobile-first:

- seleção de participante;
- status da van e deslocamento entre bares;
- check-in por bar;
- contadores de comida e bebida por participante;
- votação da experiência de cada bar;
- achievements/gamificação;
- ranking do grupo;
- painel de administração (controle operacional do evento);
- retrospectiva final (Baratona Wrapped).

A sincronização é feita via Supabase Realtime, com atualizações em tempo real para todos os dispositivos conectados.

## Principais funcionalidades

### Área do participante
- Escolha de nome com persistência local (`localStorage`).
- Acompanhamento de status atual (no bar/em trânsito/finalizado).
- Check-in no bar atual.
- Registro de consumo com feedback háptico e atualização otimista.
- Votação por bar (bebida, comida, vibe e atendimento).
- Acompanhamento de ranking e estatísticas.
- Conquistas automáticas com notificações toast.

### Área administrativa
- Alteração de bar atual.
- Controle da van (`at_bar` ↔ `in_transit`).
- Configuração de origem/destino em deslocamento.
- Ajuste de atraso global.
- Envio e limpeza de broadcast.
- Finalização/reabertura do evento.

## Arquitetura

A documentação arquitetural completa está em:

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)

Resumo:

- **UI**: páginas + componentes React (modular por domínio).
- **Estado de domínio**: `BaratonaContext` como fachada de leitura/escrita.
- **Dados**: hooks de Supabase com fetch inicial + realtime + refetch.
- **Persistência**: Postgres no Supabase com migrações versionadas.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui + Radix UI
- React Router DOM
- Supabase JS
- TanStack React Query
- Recharts
- Leaflet / React-Leaflet
- Vitest + Testing Library

## Estrutura do projeto

```text
src/
  components/          # UI de domínio + componentes base
  contexts/            # Contexto global da aplicação
  hooks/               # Hooks de integração e regras
  integrations/        # Client/tipos Supabase
  lib/                 # utilitários, constantes, i18n
  pages/               # rotas principais
supabase/
  migrations/          # evolução do schema
docs/
  ARQUITETURA.md       # documentação técnica detalhada
```

## Pré-requisitos

- Node.js 20+
- npm 10+ (ou Bun, opcional)
- Projeto Supabase configurado

## Configuração local

```bash
# 1) Instalar dependências
npm install

# 2) Configurar variáveis de ambiente
cp .env.example .env

# 3) Subir ambiente de desenvolvimento
npm run dev
```

## Variáveis de ambiente

Defina no `.env`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

> Observação: o client Supabase usa essas variáveis em `src/integrations/supabase/client.ts`.

## Scripts

```bash
npm run dev         # desenvolvimento
npm run build       # build de produção
npm run build:dev   # build modo development
npm run preview     # preview local do build
npm run lint        # lint
npm run test        # testes (vitest)
npm run test:watch  # testes em watch mode
```

## Modelo de dados

Entidades principais no banco:

- `participants`
- `bars`
- `app_config`
- `votes`
- `consumption`
- `checkins`
- `achievements`

Detalhes de constraints, índices e políticas em `supabase/migrations`.

## Fluxos de negócio

1. Participante seleciona nome e entra na experiência.
2. Usuários registram check-in/consumo/votos ao longo do roteiro.
3. Admin controla deslocamentos, atraso e comunicação.
4. Quando finalizado, app muda para modo Wrapped com retrospectiva.

## Decisões e trade-offs

- **Pró**: UX rápida com atualização otimista + realtime.
- **Contra**: consistência eventual de curtíssimo prazo.
- **Pró**: simplicidade operacional com Supabase.
- **Contra**: políticas RLS públicas exigem cuidado para ambientes abertos.

## Evolução recomendada

- Adicionar autenticação real e perfis de permissão por papel.
- Restringir updates sensíveis por políticas RLS.
- Incluir testes e2e dos fluxos críticos.
- Evoluir para multi-evento (com `event_id`).


## Evolução assistida por IA

Para tornar a evolução por agentes mais segura e previsível, o projeto agora possui:

- `AGENTS.md`: regras operacionais para agentes (escopo, contratos críticos, checklist de PR).
- `docs/AI_PLAYBOOK.md`: playbook com fluxo de execução, prompt base e definição de pronto.

Recomendação prática para qualquer task via IA:

1. Ler `README.md`, `docs/ARQUITETURA.md` e `AGENTS.md`.
2. Trabalhar em mudanças pequenas e reversíveis.
3. Validar com `npm run typecheck`, `npm run lint`, `npm run test` e `npm run build`.
4. Atualizar documentação junto com a mudança de código.

Fase 2 (implementada):

- Template de PR com checklist de qualidade em `.github/pull_request_template.md`.
- Base de testes para hooks em `src/hooks/*.test.ts(x)` com setup Vitest/JSDOM (`src/test/setup.ts`).



## Contribuição

- Guia de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Regras para agentes: [`AGENTS.md`](AGENTS.md)
- Playbook de execução com IA: [`docs/AI_PLAYBOOK.md`](docs/AI_PLAYBOOK.md)

CI automatizada em PR/push: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
