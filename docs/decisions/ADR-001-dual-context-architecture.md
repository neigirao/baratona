# ADR-001: Dual Context Architecture (Legacy vs Platform)

**Status:** Accepted  
**Date:** 2026-04-25  
**Deciders:** neigirao

---

## Context

The application started as a single fixed event ("Baratona do Nei", route `/nei`) backed by legacy Postgres tables (`bars`, `participants`, `checkins`, etc.) with numeric IDs. When multi-tenant support was required, a new schema (`event_*` tables with UUID IDs) was introduced without a migration of the legacy event's historical data.

Both the legacy event and all platform events share a single UI codebase and the same set of components.

## Decision

Two separate React Context providers expose the same `BaratonaContextType` interface:

| Provider | Route | Tables | Bar ID type |
|---|---|---|---|
| `BaratonaProvider` | `/nei`, `/admin` | `bars`, `participants`, … | `number` |
| `EventBaratonaProvider` | `/baratona/:slug/*` | `event_bars`, `event_members`, … | `string` (UUID) |

The `as any` cast in `EventBaratonaProvider` (line ~152) is intentional to reconcile `number` bar IDs in the context type with UUID strings at runtime.

## Consequences

**Good:**
- Zero data migration risk for the legacy event.
- UI components are reused with no modification.
- New events are fully isolated from legacy data.

**Bad:**
- `BaratonaContextType` must be kept in sync across both providers manually.
- Two sets of data hooks (`hooks/data/*` vs `hooks/eventData/*`) with ~80% duplication.
- The `as any` cast hides type errors in `EventBaratonaProvider`.

## Future

If the legacy `/nei` event is ever migrated to the platform schema, both providers can be merged into a single parameterised implementation. Until then, treat provider duplication as intentional technical debt.
