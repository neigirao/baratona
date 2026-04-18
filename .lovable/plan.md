

## Plano: Sistema de convite por código (F1)

Olhando o estado atual:
- Tabela `event_invites` existe (code, max_uses, used_count, expires_at, event_id)
- RLS: SELECT público, INSERT só pelo owner. Falta UPDATE para incrementar `used_count`
- `events.visibility` pode ser `'public'` ou `'private'`
- `joinEventApi` hoje aceita qualquer um — não valida convite

### Mudanças no banco (migration)

1. Adicionar policy `UPDATE` em `event_invites` (qualquer authenticated pode incrementar `used_count` ao usar — alternativa segura via RPC).
2. Criar função `redeem_event_invite(_code text, _display_name text)` SECURITY DEFINER que:
   - Busca invite por `code` (case-insensitive)
   - Valida `expires_at > now()` (ou null) e `used_count < max_uses`
   - Insere em `event_members` (role `participant`)
   - Incrementa `used_count`
   - Retorna `event_id` + `slug` para redirect
3. Restringir SELECT em `event_invites` ao owner do evento (hoje está público — leak de códigos). A RPC contorna via SECURITY DEFINER.

### API (`src/lib/platformApi.ts`)

- `createInviteApi(eventId, { maxUses?, expiresAt? })` — gera código de 6 chars (A-Z0-9), insere
- `listInvitesApi(eventId)` — lista convites do evento (só owner via RLS)
- `redeemInviteApi(code, displayName)` — chama RPC, retorna `{ slug }`
- Helper `generateInviteCode()` local

### UI

**`EventAdmin.tsx`** — nova seção "Convites" (visível só se `visibility === 'private'`):
- Botão "Gerar novo código"
- Lista de convites: código grande copiável, usos (`used_count/max_uses`), validade, botão copiar link `/baratona/:slug?invite=CODE`

**Nova página `src/pages/JoinByInvite.tsx`** rota `/entrar`:
- Input do código + nome de exibição
- Submit → `redeemInviteApi` → redirect `/baratona/:slug`
- Suporta query string `?code=XXXX` para preencher automaticamente

**`EventLanding.tsx`** — quando evento é privado e usuário não é membro:
- Detectar `?invite=CODE` na URL e auto-redimir
- Caso contrário, mostrar form de código inline (em vez do botão "Entrar no evento")

**`Header.tsx`** ou `Home.tsx` — link "Entrar com código" para `/entrar`

**`App.tsx`** — registrar rota `/entrar`

### Fluxo do usuário

```text
Owner: EventAdmin → "Gerar código" → copia link
Convidado: abre link → /baratona/slug?invite=ABC123
  → EventLanding detecta invite → auto-redime → vira