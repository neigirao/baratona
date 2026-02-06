

## Resetar configuracoes da Baratona

A tabela `app_config` ainda tem dados do teste:
- **broadcast_msg**: "Teste de comunicado" (precisa ser limpo)
- **current_bar_id**: 4 (precisa voltar para o primeiro bar ou null)
- **global_delay_minutes**: 5 (precisa zerar)
- **status**: "at_bar" (ok, mas deve refletir estado inicial)

### Acoes

1. **Atualizar app_config** para o estado inicial:
   - `broadcast_msg` -> `NULL` (sem comunicado)
   - `current_bar_id` -> `1` (primeiro bar: Pavao Azul)
   - `origin_bar_id` -> `NULL`
   - `destination_bar_id` -> `NULL`
   - `global_delay_minutes` -> `0` (sem atraso)
   - `status` -> `'at_bar'`

Isso vai resetar completamente o painel, removendo o comunicado de teste e posicionando a Baratona no ponto de partida.

