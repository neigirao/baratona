// Re-export shim — original hook split into src/hooks/data/* modules for maintainability.
// Keeps existing imports (useParticipants, useBars, useAppConfig, useVotes, useConsumption) working.
export { useParticipants } from './data/useParticipants';
export { useBars } from './data/useBars';
export { useAppConfig } from './data/useAppConfig';
export { useVotes } from './data/useVotes';
export { useConsumption } from './data/useConsumption';
