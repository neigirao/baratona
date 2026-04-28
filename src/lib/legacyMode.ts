/**
 * Modo somente-leitura para o evento legado (/nei).
 *
 * As tabelas legadas (participants, votes, consumption, checkins, achievements,
 * app_config, bars) tiveram suas políticas RLS de escrita revogadas. Qualquer
 * tentativa de INSERT/UPDATE/DELETE será rejeitada pelo banco.
 *
 * Esta flag global é lida pelos hooks legados (useSupabaseData, useCheckins,
 * useAchievements) para evitar mutações otimistas em vão e exibir feedback
 * apropriado ao usuário.
 */

let readOnly = false;

export function setLegacyReadOnly(value: boolean): void {
  readOnly = value;
}

export function isLegacyReadOnly(): boolean {
  return readOnly;
}
