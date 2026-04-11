# Contribuindo com a Baratona

Obrigado por contribuir! Este guia cobre fluxo humano + IA para manter qualidade e previsibilidade.

## Fluxo recomendado

1. Leia `README.md`, `AGENTS.md` e `docs/ARQUITETURA.md`.
2. Crie PRs pequenos (1 objetivo por PR).
3. Atualize docs quando houver mudança de comportamento.
4. Execute validações antes de abrir PR.

## Checklist local

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Para contribuições com IA

- Siga o `docs/AI_PLAYBOOK.md`.
- Não quebre contratos críticos (unicidades, singleton `app_config`, fluxos de realtime).
- Explique riscos e rollback no PR.

## Convenções de commit

Sugestão (Conventional Commits):
- `feat:` nova funcionalidade
- `fix:` correção
- `docs:` documentação
- `test:` testes
- `refactor:` refatoração sem mudança funcional

## Critérios mínimos de aceite

- Código compila.
- Testes passam.
- Lint sem erros.
- Build de produção gerado com sucesso.
- Documentação refletindo a mudança.
