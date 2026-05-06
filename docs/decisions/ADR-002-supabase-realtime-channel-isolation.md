# ADR-002: Supabase Realtime Channel Isolation per Component Instance

**Status:** Accepted  
**Date:** 2026-05-05  
**Deciders:** neigirao

---

## Context

Supabase Realtime channels are identified by a string name. When a component mounts, subscribes, unmounts, and remounts (e.g., navigating away and back), the new component instance reuses the same channel name. If the previous channel was not fully cleaned up before the new subscription is registered, both channels coexist and the new instance receives duplicate events — a "zombie channel" bug.

This manifested as double check-in toggling and duplicate vote toasts in the event live view.

## Decision

Every component that subscribes to a Realtime channel must generate a **per-instance unique channel name** using `crypto.randomUUID()` stored in a `useRef` (so the name survives re-renders but not remounts):

```typescript
const channelId = useRef(`checkins-${crypto.randomUUID()}`);
```

Cleanup in `useEffect` return must call `supabase.removeChannel(channel)` on the exact channel object.

## Consequences

**Good:**
- No zombie channels — each mount gets an isolated, unique subscription.
- Safe to use the same hook in multiple components simultaneously.

**Bad:**
- Channel names are no longer human-readable in Supabase dashboard logs.
- Slightly higher channel churn on fast navigation (each remount = new channel).

## Alternatives Considered

- **Stable channel names with deduplication**: Requires a global registry or ref-counting, which is significantly more complex and error-prone.
- **Singleton subscription module**: Would require lifting state outside React, breaking the hook encapsulation model.
