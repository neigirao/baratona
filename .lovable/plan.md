## Conceder super_admin para neigirao@gmail.com

### Problema
Tabela `platform_roles` está vazia. O hook `usePlatformAdmin` chama `has_platform_role()` que retorna `false`, ocultando o link "Super admin" no Header e bloqueando `/admin/plataforma`.

### Ação
Executar um INSERT idempotente em `platform_roles` resolvendo o `user_id` pelo email em `auth.users`:

```sql
INSERT INTO public.platform_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'neigirao@gmail.com'
ON CONFLICT DO NOTHING;
```

### Validação
1. Query de verificação:
   ```sql
   SELECT pr.user_id, pr.role, u.email
   FROM platform_roles pr
   JOIN auth.users u ON u.id = pr.user_id
   WHERE u.email = 'neigirao@gmail.com';
   ```
2. Logar com `neigirao@gmail.com` no app, abrir o menu do Header e confirmar o item "Super admin" → `/admin/plataforma` carrega o painel.

### Observações
- Operação de dados (não schema) — usada via insert tool, não migration.
- Idempotente: re-executar não duplica.
- Não cria seed por email em código (segurança); reaplicação futura é manual via mesmo INSERT, ou via UI em `/admin/plataforma → Papéis` por outro super_admin.
