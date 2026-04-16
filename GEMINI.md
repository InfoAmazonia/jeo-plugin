# JEO Plugin - Master Architecture Guide & Mandates (v3.6.4)

Este documento é a autoridade máxima sobre a arquitetura do plugin JEO. Qualquer alteração, refatoração ou adição de funcionalidade deve respeitar estritamente as diretrizes aqui estabelecidas para garantir a estabilidade e a integridade dos dados geográficos.

---

## 1. Visão Geral e Propósito
O JEO é um framework de geojornalismo para WordPress. Ele transforma posts em camadas de dados interativos, permitindo a geolocalização manual ou automatizada (via IA) de matérias jornalísticas.

---

## 2. Mandatos de Integridade Técnica (Prevenção de Regressões)

### 2.1. Padrão de Nomenclatura de Geodata
- **Longitude:** O sufixo padrão para longitude em todo o sistema (PHP, JS, REST e Database) é estritamente `lng`. O uso de `lon` é obsoleto e proibido em novos desenvolvimentos.
- **Campos Meta:** `map_default_lat` e `map_default_lng` são as chaves mestre. Nunca use `_geocode_lon` em novos componentes ou tabelas.
- **Normalização Automática:** Todo input de coordenadas deve ser validado para evitar `NaN`. Use `parseFloat` e verifique `isNaN()` antes de passar dados para Leaflet ou Mapbox.
- **Migração em Runtime (Legacy Data):** Componentes que carregam metadados do banco devem implementar um mapeamento imediato no `constructor` ou inicialização: se existir `_geocode_lon` mas não `_geocode_lng`, o valor deve ser transferido para a chave nova para garantir compatibilidade com posts antigos.

### 2.2. Registry-First Mandate (Configurações)
- Toda nova opção de configuração **DEVE** ser registrada em três lugares no arquivo `Jeo\Settings`:
  1. No array `$default_options` do método `init()`.
  2. No método `get_option()` (garantindo o merge com defaults).
  3. No método `sanitize_settings()` para permitir a persistência segura no banco.

### 2.3. Blindagem de Templates Admin
- Templates em `includes/admin/` ou `includes/settings/` devem ser puramente declarativos.
- **Chamadas de Método:** Mudanças em assinaturas de métodos Core exigem auditoria imediata em todos os arquivos da pasta `settings`. Nunca presuma a existência de um método sem checar sua classe de origem.

---

## 3. Motor de Inteligência Artificial (AI Engine)

### 3.1. Neuron Agent & Universal Adapters
- **Centralização:** Toda chamada de IA deve passar pela classe `Jeo\AI\Neuron_Adapter`. Nunca faça chamadas HTTP diretas para APIs de LLM. 
- **Provedores:** Suporte nativo a 10 provedores. No seletor de Chat, apenas modelos de Texto/GPT devem ser listados (excluindo Vision, Audio e Embedding).

### 3.2. O Contrato JSON Imutável
Toda extração de IA deve retornar obrigatoriamente um array plano de objetos com as seguintes chaves:
- `name`: Nome do local.
- `lat`: Latitude (float/string).
- `lng`: Longitude (float/string).
- `quote`: Trecho literal do texto (contexto).
- `confidence`: Inteiro de 0 a 100.

### 3.3. Lógica de Relevância e Corte (UI/UX)
- **High Confidence (>= 75%):** Ponto Primário, selecionado por padrão.
- **Medium Confidence (35% - 74%):** Ponto Secundário, selecionado por padrão.
- **Low Confidence (< 35%):** Ponto Secundário, **desabilitado** para seleção para evitar poluição visual e imprecisões.
- **Relevance Switcher:** A interface de revisão utiliza um `ToggleControl` (Switcher) para alternar entre Primário e Secundário.

### 3.4. Enriquecimento de Geodata (Enrichment)
- **Enrich Data:** A interface de revisão inclui um botão para buscar dados oficiais do Geocodificador (Nominatim/Mapbox) via lat/lng.
- **Dados Estruturados:** O enriquecimento deve extrair não apenas a cidade, mas também: **Rua** (`address`), **Número** (`address_number`) e **CEP** (`postcode`).
- **Visualização:** Dados enriquecidos aparecem como uma "Citação Verificada" (verde) abaixo do "Contexto da IA" (azul).

---

## 4. Persistência e Processamento em Lote

### 4.1. Esquema de Metadados (Metadata Master)
Todos os pontos de um post residem no array `_related_point`. O schema obrigatório para persistência e indexação é:
- `_geocode_lat`, `_geocode_lng`: Coordenadas decimais.
- `_geocode_full_address`: Endereço humano formatado.
- `_geocode_address`, `_geocode_address_number`, `_geocode_postcode`: Detalhes de logradouro.
- `_geocode_city`, `_geocode_city_level_1`: Cidade e Bairro.
- `_geocode_region_level_1/2/3`: Estado e Divisões Regionais.
- `_geocode_country`, `_geocode_country_code`: País e ISO Code.
- `relevance`: `primary` ou `secondary`.
- `_ai_quote`: Trecho de contexto da IA.

### 4.2. Indexação de Performance (Sufixos _p e _s)
**Mandato:** Todo salvamento de geodata dispara a indexação automática que espelha os campos acima em metadados individuais com sufixos `_p` (Primary) e `_s` (Secondary), permitindo buscas via `WP_Query`.

### 4.3. Bulk Processor & RAG
- **Background Engine:** Classe `Jeo\AI\Bulk_Processor` via `WP-Cron`.
- **Threshold:** Limite de confiança configurável para aprovação automática em massa.
- **Model Lock:** Travamento do modelo de embedding em `.model_info` para evitar corrupção do Vector Store.

---

## 5. Interface e Dashboards

### 5.1. Dashboard Cinematográfico
- **Localização:** Rodapé (Bottom-UI).
- **Filtros Dinâmicos:** Date Range do tipo **Dual-Point** (Início e Fim) e hierarquia de busca Post Type > Taxonomia > Termo.

### 5.2. Settings UI
- **Isolamento de Abas:** Conteúdo encapsulado em `div.tabs-content`.
- **Aba Embedded Data:** Espaço exclusivo para dicionários territoriais locais.

---

## 6. Fluxos de DevOps

### 6.1. Build de Release (`build.sh`)
- Injeta a pasta `vendor` (Neuron AI) na raiz do plugin e limpa arquivos de desenvolvimento.

### 6.2. Versionamento
- Toda mudança estrutural exige atualização deste guia.

---
*Este guia é a defesa contra o caos técnico. Respeite os mandatos ou o sistema falhará.*