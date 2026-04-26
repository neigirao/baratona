## Sprint S8 — Super-admin global + Edição completa de eventos

Foco desta sprint: dar ao `super_admin` da plataforma um painel para gerenciar **todas** as baratonas (públicas, especiais e privadas) e padronizar a **edição de informações** do evento e dos bares em um único editor — usado igualmente para Comida di Buteco, circuitos especiais e baratonas públicas comuns.

### 1. Painel `/admin/plataforma` (Super-admin global)

Novo painel separado da rota legada `/admin` (que continua sendo do Nei). Acesso via `has_platform_role(auth.uid(), 'super_admin')`.

- **Listagem global de eventos** com busca por nome/slug/cidade, filtros por `visibility` (public/private), `event_type` (open_baratona/special_circuit) e `status` (draft/published/finished).
- **Métricas por linha**: nº de bares, nº de membros, data, dono.
- **Ações por evento**:
  - "Abrir como organizador" → entra no `EventAdmin` como se fosse o owner (bypass via role).
  - "Editar informações" → abre o novo `EventInfoEditor` (ver seção 3).
  - "Mudar status" (draft/published/finished).
  - "Mudar visibilidade" (public/private).
  - "Transferir propriedade" (trocar `owner_user_id`).
  - "Excluir evento" (soft delete via `status = 'archived'`, sem DELETE físico para preservar histórico).
- **Gestão de papéis da plataforma**: pequena seção para listar `platform_roles` e promover/demover `super_admin` (escrita só com RPC SECURITY DEFINER que verifica que o chamador já é super_admin).

### 2. Permitir super-admin a editar qualquer evento (RLS)

Hoje as policies de UPDATE em `events`, `event_bars`, `event_app_config`, `event_invites` exigem `owner_user_id = auth.uid()`. Precisa estender para `OR has_platform_role(auth.uid(), 'super_admin')`:

- `events` UPDATE → owner OR super_admin.
- `events` DELETE (nova) → super_admin only (mas preferimos arquivar, não deletar).
- `event_bars` INSERT/UPDATE/DELETE → owner OR super_admin.
- `event_app_config` INSERT/UPDATE → owner OR super_admin.
- `event_invites` INSERT/SELECT/DELETE → owner OR super_admin.
- RPCs novas: `admin_update_event_owner(_event_id, _new_owner)`, `admin_set_platform_role(_user_id, _role)`, ambas SECURITY DEFINER + checagem de `has_platform_role`.

### 3. `EventInfoEditor` — editor unificado de informações

Componente novo usado tanto pelo `EventAdmin` (owner) quanto pelo painel global (super-admin). Hoje o `EventAdmin` só permite controle de status e broadcast — não edita nome, descrição, capa, datas, cidade nem dados dos bares (apenas o scrape do Comida di Buteco popula). Vamos padronizar:

**Aba "Informações do evento"** (nova em `EventAdmin`):
- Campos editáveis: `name`, `description`, `city`, `event_date`/`start_date`/`end_date`, `cover_image_url`, `external_source_url`, `visibility`, `event_type`.
- Para super-admin: também `slug` (com validação de unicidade e reserva) e `owner_user_id`.

**Aba "Bares" — modo edição completo** (substitui a listagem read-only atual):
- CRUD completo de `event_bars`: nome, endereço, bairro, lat/lng, ordem, horário agendado, telefone, instagram, prato em destaque, descrição do prato, imagem do prato.
- Reordenação drag-and-drop (atualiza `bar_order` em batch).
- Upload de imagem de capa do bar/prato → bucket `bar-dishes` (já previsto na S4.2; pode ficar como URL externa nesta sprint se quiser separar).
- Botão "Adicionar buteco/bar" manual (independente do scrape).
- Botão "Importar do Comida di Buteco" continua disponível só para o evento `comida-di-buteco-rj-2026` (já existe).

**Comportamento idêntico** para os três tipos de evento (público, especial, privado). A única diferença é o botão de scrape, que aparece só no Comida di Buteco.

### 4. Pendências mapeadas no histórico/planos antigos que entram junto

Aproveitando o tema de "admin e edição", incluímos itens P0/P1 que ainda não foram fechados:

- **S4.2 — Storage de imagens** (bucket `event-covers` + `bar-dishes` com policies públicas de leitura, upload restrito a owner/super_admin). Necessário para o uploader do editor.
- **S4.3 — Limpeza de RLS legadas**: rodar `supabase--linter` + `security--run_security_scan`, tratar warnings em `achievements`, `participants`, `bars`, `votes`, `checkins`, `consumption`, `app_config` (tabelas do Nei). Não removeremos as policies anônimas — são contrato do Nei legado — mas documentamos e suprimimos warnings irrelevantes.
- **Auditoria de segurança pós-S1**: rodar `security--run_security_scan` antes e depois das mudanças de RLS desta sprint.

### 5. Fora do escopo desta sprint (continuam no roadmap)

Mantidos no plano consolidado para sprints seguintes, sem mudança:

- **S5** Discovery & SEO: sitemap, OG dinâmico, `/circuitos`, páginas de cidade.
- **S6** Engajamento: deep-link do `BarDetailDrawer` (`/baratona/:slug/bar/:id`), comentários por bar, push opt-in por evento, `EventWrapped` genérico.
- **S7** Confiabilidade: testes dos hooks (`usePlatformAuth`, `useEventData`, `platformApi`), error boundaries por rota, logs estruturados nas Edge Functions.
- **Débitos pequenos**: split de `SpecialCircuitLanding.tsx` (>500 linhas) em `CircuitFilters`/`BarGrid`/`FavoritesStickyBar`, extração de `useEventMembership` em `EventLanding.tsx`, adaptar `OnboardingOverlay` para qualquer evento, meta tags PWA + manifest no `index.html`.
- **Extração da camada de serviços do `BaratonaContext`** (AGENTS.md item 7.3).

---

### Detalhes técnicos

**Migração SQL (resumo):**

```sql
-- Estender RLS para super_admin
DROP POLICY "Owner can update event" ON public.events;
CREATE POLICY "Owner or super_admin can update event" ON public.events
  FOR UPDATE USING (
    auth.uid() = owner_user_id
    OR public.has_platform_role(auth.uid(), 'super_admin')
  );

-- Mesmo padrão em event_bars, event_app_config, event_invites
-- (INSERT/UPDATE/DELETE/SELECT conforme cada tabela)

-- RPC para transferência de propriedade (super_admin only)
CREATE OR REPLACE FUNCTION public.admin_update_event_owner(
  _event_id uuid, _new_owner uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.events SET owner_user_id = _new_owner WHERE id = _event_id;
END $$;

-- RPC para promover/demover super_admin
CREATE OR REPLACE FUNCTION public.admin_set_platform_role(
  _user_id uuid, _role text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_platform_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.platform_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Adicionar 'archived' ao status de events (campo já é text livre)
-- Bucket de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true),
       ('bar-dishes', 'bar-dishes', true);
-- + policies de upload restritas a owner/super_admin
```

**Arquivos novos:**
- `src/pages/PlatformAdmin.tsx` — listagem/ações globais (`/admin/plataforma`).
- `src/components/admin/EventInfoEditor.tsx` — editor de metadados do evento.
- `src/components/admin/EventBarsEditor.tsx` — CRUD + reordenação dos bares.
- `src/components/admin/EventCoverUploader.tsx` — upload de imagem (storage).
- `src/hooks/usePlatformAdmin.ts` — checa `has_platform_role` e expõe ações globais.
- `src/lib/api/admin.ts` — wrappers das RPCs (`adminUpdateEventOwner`, `adminSetPlatformRole`, `adminListAllEvents`).

**Arquivos editados:**
- `src/App.tsx` — nova rota `/admin/plataforma` protegida por `usePlatformAdmin`.
- `src/pages/EventAdmin.tsx` — adicionar abas "Informações" e refatorar aba "Bares" para usar `EventBarsEditor`. Liberar entrada quando `super_admin` (não só owner).
- `src/lib/api/events.ts` — `updateEventApi`, `archiveEventApi`.
- `src/lib/api/bars.ts` — `createBarApi`, `updateBarApi`, `deleteBarApi`, `reorderBarsApi`.
- `src/components/Header.tsx` — link para `/admin/plataforma` quando `super_admin`.

**Ordem de implementação sugerida:**
1. Migração RLS + RPCs + buckets de storage.
2. Hook `usePlatformAdmin` + rota `/admin/plataforma` (listagem mínima funcional).
3. `EventInfoEditor` + aba "Informações" no `EventAdmin`.
4. `EventBarsEditor` (CRUD + reorder) substituindo a listagem read-only.
5. Uploader de imagens conectado ao Storage.
6. Ações globais no `/admin/plataforma` (transferir owner, mudar status, arquivar, gerenciar roles).
7. Rodar `security--run_security_scan` + `supabase--linter` final.
