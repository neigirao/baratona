#!/usr/bin/env bash
# lint-rpc-grants.sh
# Detecta RPCs chamadas pelo frontend que não têm GRANT EXECUTE nas migrations.
# Uso: bash scripts/lint-rpc-grants.sh
# Retorna exit 1 se encontrar RPCs sem grant (útil em CI).

set -euo pipefail

MIGRATIONS_DIR="supabase/migrations"
SRC_DIR="src"

# Extrai nomes de RPCs chamadas via callRpc() ou supabase.rpc() no frontend
FRONTEND_RPCS=$(grep -rh "callRpc\|supabase\.rpc(" "$SRC_DIR" --include="*.ts" --include="*.tsx" \
  | grep -oP "'[a-z_]+'" | tr -d "'" | sort -u)

# Extrai nomes de funções que têm GRANT EXECUTE nas migrations
GRANTED_RPCS=$(grep -rh "GRANT EXECUTE ON FUNCTION public\." "$MIGRATIONS_DIR"/*.sql \
  | grep -oP "public\.\w+" | sed 's/public\.//' | sort -u)

echo "RPCs chamadas pelo frontend: $(echo "$FRONTEND_RPCS" | wc -l | tr -d ' ')"
echo "RPCs com GRANT nas migrations: $(echo "$GRANTED_RPCS" | wc -l | tr -d ' ')"
echo ""

MISSING=0
while IFS= read -r rpc; do
  if ! echo "$GRANTED_RPCS" | grep -qx "$rpc"; then
    echo "❌  FALTA GRANT: $rpc"
    MISSING=$((MISSING + 1))
  fi
done <<< "$FRONTEND_RPCS"

if [ "$MISSING" -eq 0 ]; then
  echo "✅  Todas as RPCs têm GRANT EXECUTE."
  exit 0
else
  echo ""
  echo "⚠️   $MISSING RPC(s) sem GRANT. Adicione às migrations antes de deployar."
  exit 1
fi
