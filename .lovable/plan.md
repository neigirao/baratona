# Aplicar logo oficial do Comida di Buteco

Parceria oficial confirmada — sem disclaimers de marca. A logo (selo laranja "DESDE 2000" sobre madeira) entra em 4 pontos: hero da página do evento, card nas listagens, OG image e favicon dinâmico.

## 1. Preparar assets

Copiar `user-uploads://image.png` para:
- `src/assets/comida-di-buteco-logo.png` — usado nos componentes React (hero + card)
- `public/comida-di-buteco-favicon.png` — favicon dinâmico (32×32 e 180×180 funcionam como PNG único)
- `public/og-comida-di-buteco.jpg` — OG image (a própria imagem original já tem boas proporções para preview social)

## 2. Hero — `SpecialCircuitLanding.tsx`

Adicionar bloco no topo do componente (antes do header existente "Petiscos em concurso"):

- Selo centralizado dentro de um `Card` com `rounded-2xl`, `border-primary/30`, `shadow-xl shadow-primary/10`
- Tamanho: `max-w-[200px]` mobile, `max-w-[260px]` desktop
- Padding generoso (`p-6`) para destacar do True Black
- Sutil `bg-gradient-to-b from-primary/5 to-transparent` ao redor para integrar à estética neon

## 3. Card do evento — `FeaturedEventCard.tsx`

Quando `event.slug === 'comida-di-buteco-rj-2026'`:
- Se não houver `coverImageUrl`, usar `import logo from '@/assets/comida-di-buteco-logo.png'` como cover (no lugar do ícone Beer fallback), com `object-contain` e fundo escuro (`bg-black`)
- Manter o badge "Circuito Especial" como está

## 4. OG image — `EventLanding.tsx`

No `useSeo`, quando `event.slug === 'comida-di-buteco-rj-2026'` e o evento não tiver `coverImageUrl` próprio definido, usar `https://baratona.lovable.app/og-comida-di-buteco.jpg` como `image`. Mantém o canonical e `og:type: article` já existentes.

## 5. Favicon dinâmico

Criar `src/hooks/useDynamicFavicon.ts`:

```ts
useDynamicFavicon(href: string | null)
// Troca <link rel="icon"> ao montar, restaura href original ao desmontar
```

Aplicar em `EventLanding.tsx`:
```ts
const customFavicon = event?.slug === 'comida-di-buteco-rj-2026'
  ? '/comida-di-buteco-favicon.png'
  : null;
useDynamicFavicon(customFavicon);
```

Implementação: guarda o `href` original do `<link rel="icon">` em ref, troca por `href` recebido, restaura no cleanup. Se `href` for `null`, não faz nada.

## Detalhes técnicos

- **Sem mudanças de schema, RLS ou edge functions.**
- **Sem dependências novas.**
- O selo tem fundo de madeira opaco — funciona em qualquer fundo. No favicon 32px ficará reconhecível pela cor laranja, mesmo que "DESDE 2000" não seja legível (aceitável; é o trade-off de "usar como está").
- A logo no card usa `object-contain` (não `cover`) pra não cortar o selo.
- Tudo gated pelo slug do evento — zero impacto em outras baratonas.

## Arquivos afetados

| Ação | Arquivo |
|---|---|
| Criar | `src/assets/comida-di-buteco-logo.png` |
| Criar | `public/comida-di-buteco-favicon.png` |
| Criar | `public/og-comida-di-buteco.jpg` |
| Criar | `src/hooks/useDynamicFavicon.ts` |
| Editar | `src/components/SpecialCircuitLanding.tsx` (adicionar hero com selo) |
| Editar | `src/components/FeaturedEventCard.tsx` (fallback cover gated por slug) |
| Editar | `src/pages/EventLanding.tsx` (OG image + favicon dinâmico gated por slug) |

## Fora de escopo

- Não substituir o `coverImageUrl` no banco — só fallback no frontend (não destrutivo, reversível).
- Não criar versões alternativas (recortada, monocromática) — você pediu "como está".
- Não aplicar em outros eventos — só `comida-di-buteco-rj-2026`.
