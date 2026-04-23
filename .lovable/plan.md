

## Plano: Tratar logo do Comida di Buteco como **logo**, não como banner

### Problema visual atual

A `cover_image_url` do evento `comida-di-buteco-rj-2026` já aponta para a logo oficial:
`https://comidadibuteco.com.br/wp-content/uploads/2024/03/logo-cdb-2024.png`

Mas o `BaratonaHero` foi desenhado pra **fotos de fundo** (banner do Nei). Resultado quando recebe uma logo PNG transparente:
- `object-cover` corta/estica a logo a perder de vista
- `opacity-60` apaga a logo
- gradiente preto descendo cobre o que sobrou
- o título "Comida di Buteco RJ 2026" em Orbitron amarelo fica disputando atenção com a logo deformada

A página **tem** a logo, mas o usuário não vê.

### Diagnóstico de design (resto da página)

O que está bom:
- Hero unificado, tipografia Orbitron consistente
- Cards de petisco bem diagramados (foto 4:3, badge de favorito, badge de rating)
- Sticky CTA "Criar minha baratona" com contador de favoritos
- Filtros por bairro, ordenação e mapa com pins customizados

O que está fraco visualmente:
1. **Logo oficial invisível** (problema #1 acima)
2. Faixa de chips de bairros estoura em ~30 botões empilhados — visual ruidoso
3. Sem nenhuma referência cromática ao branding amarelo/preto do Comida di Buteco — parece um evento genérico
4. Header da página (breadcrumb com `<` + cidade + nº butecos + data) fica solto logo abaixo do hero, sem hierarquia clara
5. Card "Organizador / Tipo / Fonte oficial" é puramente textual — poderia virar um rodapé sutil

### Solução

**1. Diferenciar logo de cover no `BaratonaHero`** (núcleo da correção)

Adicionar prop `logoUrl?: string` separada de `imageUrl`. Quando presente:
- Renderiza a logo `<img>` com `object-contain`, `max-h-24 sm:max-h-32`, sem opacity, centralizada
- Substitui o título Orbitron (a logo já É o título)
- Fundo passa a ser: foto opcional OU fallback do banner do Nei OU gradiente sólido `from-background to-card` quando não há foto
- Mantém o gradiente descendo só quando há foto de fundo

Detecção automática para retrocompatibilidade: se `imageUrl` aponta pra um arquivo cujo nome contém `logo` (ou se for PNG e `<` 100KB), tratar como logo automaticamente. Mais simples: aceitar a nova prop e migrar `EventLanding.tsx` pra passar `logoUrl={event.coverImageUrl}` quando o nome do arquivo bater com `/logo/i`.

Decisão recomendada: **prop explícita** `logoUrl` + um campo opcional novo no schema. Como não temos coluna `logo_url`, a forma rápida e segura é detectar pelo URL. Implemento heurística: se `coverImageUrl` contém `logo` no caminho → trata como logo.

**2. Hero do Comida di Buteco fica assim**
- Fundo: gradiente sutil `bg-gradient-to-b from-card via-background to-background` (sem foto)
- Logo oficial centralizada, contained, ~96px de altura mobile / 128px desktop
- Subtítulo pequeno embaixo: "Circuito Especial · Rio de Janeiro"
- Sem título Orbitron disputando

**3. Polimentos pequenos na página (mesma rodada)**
- Header secundário: agrupar `cidade · butecos · data` num chip único centralizado, com hierarquia melhor
- Chips de bairro: colocar num scroll horizontal (`overflow-x-auto`) ao invés de `flex-wrap`, evita parede de botões em mobile (eram 30+ bairros)
- Card de "Organizador/Fonte" → vira rodapé `<footer>` discreto com texto menor

### Arquivos afetados

**Modificados:**
- `src/components/BaratonaHero.tsx` — adicionar suporte a logo (prop `logoUrl` + auto-detecção via `/logo/i` na URL)
- `src/pages/EventLanding.tsx` — passar logo corretamente; reorganizar header secundário; mover bloco organizador pra footer
- `src/components/SpecialCircuitLanding.tsx` — chips de bairro em scroll horizontal

### Fora de escopo desta rodada
- Nova coluna `logo_url` em `events` (heurística por URL resolve por ora)
- Sprint D/E/F/G do roadmap anterior

