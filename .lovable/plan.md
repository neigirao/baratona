# Mapa filtrado + Seleção explícita para criar baratona

Na página do Comida di Boteco (e qualquer evento "especial"), dois ajustes:

## 1. Filtros refletem no mapa

Hoje o `CircuitMap` recebe a lista completa de bares (`bars`). Vamos passar `filteredBars`, para que busca, bairro e "só marcados" também filtrem os pinos no mapa.

- O componente `CircuitMap` já mostra contagem "X de Y" e tem o próprio toggle "Só marcados". Vamos:
  - Passar `filteredBars` como prop (em vez de `bars`).
  - Esconder o toggle interno "Mostrar todos / Só marcados" quando os filtros externos já estão aplicando o recorte (evita duplicar controles). O toggle de favoritos da página continua sendo a fonte de verdade.
- Texto do botão "Abrir no Google Maps" passa a refletir os bares visíveis após filtro (já é o comportamento natural).

## 2. Botão "Criar minha baratona" com seleção explícita

Hoje só dá pra criar baratona depois de marcar favoritos (Bookmark). Vamos adicionar um fluxo direto:

- **Novo botão fixo no topo da página**: "Criar minha baratona" (sempre visível, não depende de ter favoritos).
- Ao clicar, abre um **novo dialog `SelectBarsForBaratonaDialog`** com:
  - Lista de todos os bares do evento (com busca e filtro por bairro).
  - Checkbox por bar; pré-seleciona os favoritos atuais (se houver).
  - Contador "X selecionados" + regras 3–15 bares (mesma regra do RPC `create_baratona_from_favorites`).
  - Campo de nome da baratona.
  - Botão "Criar e abrir" → chama `createBaratonaFromFavoritesApi(eventId, name, selectedIds)` e navega para `/baratona/{slug}/admin`.
  - Se usuário não está logado, dispara `signInWithGoogle()` antes (mesmo padrão do favorito).
- O botão antigo "Criar minha baratona" da barra de favoritos continua funcionando (atalho rápido para quem já marcou).

## Detalhes técnicos

- **Arquivo novo**: `src/components/SelectBarsForBaratonaDialog.tsx` — reaproveita o RPC já existente (`create_baratona_from_favorites`), nenhuma migração necessária.
- **Editar `src/components/SpecialCircuitLanding.tsx`**:
  - Trocar `<CircuitMap bars={bars} ... />` por `<CircuitMap bars={filteredBars} ... />`.
  - Adicionar botão "Criar minha baratona" no header da seção (ao lado de "Petiscos em concurso") ou como CTA dedicado acima do mapa.
  - Estado `selectDialogOpen` + render do novo dialog.
- **Editar `src/components/CircuitMap.tsx`**:
  - Aceitar prop opcional `hideViewToggle?: boolean` para esconder os botões internos "Mostrar todos / Só marcados" quando os filtros externos já fazem o trabalho.
  - Ajustar o texto da contagem para "X bares no mapa" quando filtrado externamente.
- **Analytics**: novo evento `create_baratona_select_dialog_opened` e `create_baratona_created_from_select` para diferenciar do fluxo via favoritos.

## Fora de escopo

- Nenhuma mudança de schema, RLS ou edge functions.
- Eventos públicos não-especiais (ex: open_baratona) não recebem o botão por ora — o fluxo "criar baseado em" faz mais sentido em circuitos grandes (Comida di Boteco). Pode ser estendido depois.