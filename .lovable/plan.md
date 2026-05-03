Codificar o Design System Baratona (Gold Edition) no codebase para que todas as páginas/componentes consumam os mesmos tokens. O DS já está parcialmente refletido em `src/index.css` e `tailwind.config.ts` — vou alinhar aos valores oficiais do anexo (HTML) e completar as lacunas (paleta de zonas, spacing scale, radius scale, shadows, motion easings).

## Mudanças

### 1. Salvar referência viva
- Copiar `Baratona_Design_System.html` → `docs/baratona-design-system.html` para servir como referência consultável.

### 2. `src/index.css` — tokens alinhados ao DS
- **Paleta**: ajustar HSL para bater com #0A0A0F, #0D0D15, #13131B, #181820, #1E1E2A, #252530, #5A5A6A, #F0EDE8, #F5A623, #FFD166, #E8850A.
- **Adicionar tokens semânticos**:
  - `--card-2` (#181820), `--border-2` (#252530), `--text-2` (#9A97A0)
  - Pins de zona: `--zone-sul` (purple #A855F7), `--zone-centro` (#F5A623), `--zone-norte` (green #2ECC71), `--zone-niteroi` (blue #3B82F6)
  - Radius scale: `--radius-sm 6px`, `--radius 10px`, `--radius-md 14px`, `--radius-lg 20px`, `--radius-full 99px`
  - Spacing scale (`--space-1`..`--space-16`)
  - Shadows: `--shadow-sm`, `--shadow-md` (gold), `--shadow-lg`, `--shadow-card`
  - Motion: `--ease-micro`, `--ease-ui`, `--ease-page`
- Ajustar `--radius` base para 0.625rem (10px) para conformar com DS.
- Manter `contrast-boost` e classes existentes.

### 3. `tailwind.config.ts` — expor novos tokens
- Adicionar cores: `gold.light`, `gold.dark` (já existem), e `zone.{sul,centro,norte,niteroi}` ligadas às CSS vars.
- Adicionar `boxShadow` map: `gold-sm/md/lg`, `card`.
- Adicionar `transitionTimingFunction`: `micro`, `ui`, `page`.
- Manter `fontFamily` (display: Bebas Neue, heading: Syne, sans: DM Sans) — já está correto.

### 4. Memory rule
- Salvar `mem://style/design-system-tokens` documentando: tokens canônicos vivem em `src/index.css`; nunca usar cores hex direto em componentes; consultar `docs/baratona-design-system.html` antes de criar novos componentes; usar utilitários Tailwind semânticos (`bg-card`, `text-foreground`, `border-border`, `shadow-card`, etc.).
- Atualizar `mem://index.md` com referência.

## Não vou alterar agora
- Componentes individuais (Header, Cards, Hero, etc.) — eles já consomem tokens semânticos via shadcn. Após esta padronização, novos ajustes pontuais podem ser feitos sob demanda. O objetivo desta entrega é estabelecer a fonte única de verdade.

## Risco
- Pequenas variações visuais nas superfícies escuras por causa do reajuste HSL (mais saturadas, mais "violeta-frio" como o DS pede). Esperado e desejado pelo DS.