

O usuário quer integrar o Comida di Buteco como um evento especial pré-cadastrado na plataforma, usando os dados do site oficial (https://comidadibuteco.com.br/butecos/rio-de-janeiro/) que lista os bares participantes do Rio.

Vou usar o Firecrawl (já disponível como connector) para extrair os dados do site oficial, e criar um evento "Comida di Buteco - Rio 2026" como um circuito especial (`special_circuit`) na plataforma.

# Plano: Integrar Comida di Buteco como Evento Especial

## Visão geral

Criar um evento pré-cadastrado "Comida di Buteco RJ" na plataforma usando os dados reais do site oficial. Diferente de uma baratona (sequência cronológica), o Comida di Buteco é um **circuito especial** — visitação livre dos bares ao longo de semanas, votação por petisco.

## Etapas

### 1. Coletar dados do site oficial
- Habilitar conector Firecrawl
- Criar edge function `scrape-comida-di-boteco` que faz scrape de https://comidadibuteco.com.br/butecos/rio-de-janeiro/
- Extrair para cada bar: nome, endereço, bairro, nome do petisco, descrição, foto, telefone (se disponível)
- Salvar em tabela auxiliar `external_bar_sources` para reaproveitar e versionar

### 2. Adaptar schema para circuito especial
- Adicionar à tabela `events`:
  - `event_type` já existe (`open_baratona` | `special_circuit`)
  - Adicionar `start_date` e `end_date` (período do circuito)
  - Adicionar `cover_image_url` e `external_source_url`
- Adicionar à tabela `event_bars`:
  - `featured_dish` (texto - nome do petisco)
  - `dish_description` (texto)
  - `dish_image_url` (texto)
  - Tornar `scheduled_time` opcional (circuitos não têm horário fixo)

### 3. Adaptar UI para tipo "circuito especial"
- `EventLanding`: quando for `special_circuit`, mostrar grid de bares com cards de petiscos (foto + descrição) em vez de timeline cronológica
- `EventLive`: esconder componentes de logística de van (VanStatus, CountdownTimer); manter check-in, votação, mapa
- `BaratonaMap`: mostrar todos os bares como pontos de interesse simultâneos (sem origem/destino)
- `VoteForm`: adaptar para votar no petisco (categoria única) em vez de 4 dimensões

### 4. Seed do evento Comida di Buteco
- Migration que cria o evento "Comida di Buteco RJ 2026" como `special_circuit`, público, visibilidade `public`
- Após scrape, popular `event_bars` com todos os bares retornados (estimativa: 40-80 bares)
- Owner do evento: super_admin (Nei)

### 5. Destaque na Home e Explore
- Seção "Eventos em destaque" na Home mostrando o card do Comida di Buteco
- Filtro no Explore por `event_type` (Baratona vs Circuito Especial)

## Detalhes técnicos

**Por que Firecrawl e não fetch direto?**  
O site provavelmente tem proteção anti-bot e renderização JS. Firecrawl resolve com `formats: ['markdown', { type: 'json', schema }]` retornando dados estruturados.

**Schema do JSON extraction:**
```typescript
{
  bars: [{
    name: string,
    address: string,
    neighborhood: string,
    dish_name: string,
    dish_description: string,
    dish_image_url: string,
    phone?: string,
    instagram?: string
  }]
}
```

**Edge function (Deno) chama Firecrawl REST v2:**
- Endpoint: `POST /scrape` com `formats: [{ type: 'json', schema }]`
- Retorna lista normalizada de bares
- Insere/atualiza `event_bars` para o evento `comida-di-boteco-rj-2026`
- Re-executável (idempotente via `external_id` único)

**Geocoding dos endereços:**  
Para o mapa funcionar, precisamos de lat/lng. Opções:
- (a) Usar Nominatim (OpenStreetMap, gratuito) na própria edge function
- (b) Deixar lat/lng nulo e mapa abrir no Google Maps com endereço como query

Recomendo **(a)** com fallback para (b).

## Perguntas antes de executar

Preciso confirmar 3 pontos antes de começar:
<lov-tool-use id="toolu_vrtx_01MHcefpyoaGhMXcfffS6EFr" name="questions--ask_questions" requires-approval="true" integration-id="questions" data="{\"questions\": [{\"header\":\"Escopo do scrape\",\"question\":\"O Comida di Buteco tem várias edições por ano e cidade. Quero confirmar o escopo inicial:\",\"options\":[{\"label\":\"Só Rio de Janeiro, edição atual\",\"description\":\"Apenas a página do RJ, criar 1 evento único\"},{\"label\":\"Rio + outras capitais\",\"description\":\"Scrape de várias cidades, criar 1 evento por cidade\"},{\"label\":\"Só Rio + permitir clonar\",\"description\":\"Começar com RJ, mas deixar função pronta para outras cidades\"}],\"multiSelect\":false},{\"header\":\"Votação no circuito\",\"question\":\"No Comida di Buteco oficial, vota-se no petisco (uma nota geral). Como adaptar nosso sistema de votação?\",\"options\":[{\"label\":\"Voto único no petisco (1-5)\",\"description\":\"Simplificar: uma nota geral por bar, igual ao oficial\"},{\"label\":\"Manter 4 dimensões (bebida, comida, ambiente, atendimento)\",\"description\":\"Reutilizar o sistema atual sem mudança\"},{\"label\":\"Híbrido: petisco em destaque + 3 outras\",\"description\":\"Petisco vira a nota principal, mantém ambiente e atendimento\"}],\"multiSelect\":false},{\"header\":\"Quem cria\",\"question\":\"Quem deve ser o dono (owner) deste evento Comida di Buteco?\",\"options\":[{\"label\":\"Super admin (Nei)\",\"description\":\"Evento oficial da plataforma, gerenciado pelo admin geral\"},{\"label\":\"Conta institucional 'Comida di Buteco'\",\"description\":\"Criar um perfil específico para eventos parceiros\"},{\"label\":\"Qualquer admin pode clonar\",\"description\":\"Template público que qualquer organizador pode usar como base\"}],\"multiSelect\":false}]}">
</lov-tool-use>
<lov-plan>

# Plano: Integrar Comida di Buteco como Evento Especial

## Contexto

O usuário quer que o evento **Comida di Buteco - Rio de Janeiro** (https://comidadibuteco.com.br/butecos/rio-de-janeiro/) seja um evento pré-cadastrado na plataforma, do tipo **circuito especial** (visitação livre, votação por petisco), reutilizando todas as funcionalidades já criadas.

## Visão geral

1. **Scrape** do site oficial para extrair os bares participantes e seus petiscos
2. **Adaptar** o schema e a UI para suportar circuitos especiais (sem cronograma de van)
3. **Seed** do evento "Comida di Buteco RJ" pronto para uso
4. **Destacar** o evento na Home e Explore

## Etapas

### 1. Coletar dados do site (Firecrawl)
- Habilitar o conector **Firecrawl**
- Edge function `scrape-comida-di-boteco` faz scrape de https://comidadibuteco.com.br/butecos/rio-de-janeiro/ usando `formats: [{ type: 'json', schema }]`
- Para cada bar extrai: `name`, `address`, `neighborhood`, `dish_name`, `dish_description`, `dish_image_url`, `phone`, `instagram`
- Geocoding via Nominatim (OSM, gratuito) para obter `lat`/`lng`
- Insere/atualiza em `event_bars` (idempotente via `external_id`)

### 2. Adaptar schema
**`events`:** adicionar `start_date`, `end_date`, `cover_image_url`, `external_source_url`  
**`event_bars`:** adicionar `featured_dish`, `dish_description`, `dish_image_url`, `external_id`; tornar `scheduled_time` opcional

### 3. Adaptar UI para