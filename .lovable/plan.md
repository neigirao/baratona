

# Plano: Configurar Numero de Emergencia e Remover Testes

## Resumo

Atualizar o numero de telefone do Nei para o numero real (21989921711) em todos os locais do codigo e remover a secao de testes do escopo do projeto.

---

## Alteracoes a Implementar

### 1. Atualizar Numero de Emergencia

**Arquivo:** `src/components/EmergencyPanel.tsx`
- Linha 6: Alterar `5521999999999` para `5521989921711`
- Formatar com codigo do pais (+55) + DDD (21) + numero

**Arquivo:** `src/pages/Admin.tsx`
- Linha 121: Atualizar link do WhatsApp de `5521999999999` para `5521989921711`

### 2. Remover Arquivos de Teste

**Arquivos a remover:**
- `src/test/example.test.ts`
- `src/test/setup.ts`
- `vitest.config.ts`

---

## Detalhes Tecnicos

### Formato do Numero

O numero sera configurado no formato internacional para garantir compatibilidade:
- **Ligacao telefonica:** `5521989921711` (sem espacos ou caracteres especiais)
- **WhatsApp:** `5521989921711` (mesmo formato)

### Impacto

| Componente | Funcao | Numero Atualizado |
|------------|--------|-------------------|
| EmergencyPanel | Botao "SOS Nei" | tel:5521989921711 |
| Admin | Botao WhatsApp | wa.me/5521989921711 |

---

## Resultado Esperado

Apos a implementacao:
- O botao "SOS Nei" no painel de emergencia ligara diretamente para 21 98992-1711
- O botao de WhatsApp no painel admin abrira conversa com o numero correto
- Arquivos de teste removidos do projeto

