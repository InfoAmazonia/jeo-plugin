# JEO Plugin - Master Architecture Guide & Mandates (v3.6.4)

Este documento é a autoridade máxima sobre a arquitetura do plugin JEO. Qualquer alteração, refatoração ou adição de funcionalidade deve respeitar estritamente as diretrizes aqui estabelecidas para garantir a estabilidade e a integridade dos dados geográficos.

---

## 1. Visão Geral e Propósito
O JEO é um framework de geojornalismo para WordPress. Ele transforma posts em camadas de dados interativos, permitindo a geolocalização manual ou automatizada (via IA) de matérias jornalísticas.

---

## 2. Mandatos de Integridade Técnica (Prevenção de Regressões)

### 2.1. Padrão de Nomenclatura de Geodata
- **Longitude:** O sufixo padrão para longitude em todo o sistema (PHP, JS, REST e Database) é estritamente `lng`. O uso de `lon` é obsoleto e proibido, exceto em integrações externas (como Leaflet/Mapbox) onde a conversão deve ser feita imediatamente.
- **Campos Meta:** `map_default_lat` e `map_default_lng` são as chaves mestre. Nunca use `_geocode_lon` em novos componentes.

### 2.2. Registry-First Mandate (Configurações)
- Toda nova opção de configuração **DEVE** ser registrada em três lugares no arquivo `Jeo\Settings`:
  1. No array `$default_options` do método `init()`.
  2. No método `get_option()` (se houver lógica de fallback).
  3. No método `sanitize_settings()` para permitir a persistência no banco.
- **Campos de Aparência:** Cores (`jeo_primary-color`, etc.) e Tipografia (`jeo_font-url`, etc.) devem ser sempre sanitizados com `sanitize_hex_color` ou `sanitize_text_field`.

### 2.3. Blindagem de Templates Admin
- Templates PHP em `includes/admin/` ou `includes/settings/` não devem conter lógica de negócio pesada.
- **Chamadas de Método:** Nunca chame métodos de classes Core (como `Geocode_Handler`) sem verificar a existência do método ou sua compatibilidade com a versão atual. Mudanças em assinaturas de métodos Core exigem auditoria imediata em todos os arquivos `.php` da pasta `settings`.

---

## 3. Motor de Inteligência Artificial (AI Engine)

### 3.1. O Contrato JSON Imutável
Toda extração de IA deve retornar obrigatoriamente um array plano de objetos com as seguintes chaves:
- `name`: Nome do local.
- `lat`: Latitude (float/string).
- `lng`: Longitude (float/string).
- `quote`: Trecho literal do texto (contexto).
- `confidence`: Inteiro de 0 a 100.
**Mandato:** O `AI_Adapter::get_system_prompt()` injeta agressivamente este contrato. Nunca remova a injeção do `confidence`.

### 3.2. Lógica de Relevância e Corte (UI/UX)
- **High Confidence (>= 75%):** Ponto Primário, selecionado por padrão.
- **Medium Confidence (35% - 74%):** Ponto Secundário, selecionado por padrão.
- **Low Confidence (< 35%):** Ponto Secundário, **desabilitado** para seleção (proteção contra ruído).

### 3.3. Prompt Generator & Language
- O assistente deve sempre oferecer a opção de gerar o prompt em **Inglês (Optimized)** para maior performance dos LLMs, independente do idioma do site.

---

## 4. Processamento em Lote (Bulk) e RAG

### 4.1. Isolamento de Dados
- Sugestões da IA em lote são salvas em `_jeo_ai_pending_point`. Elas **nunca** devem ser movidas para `_related_point` sem aprovação humana ou sem atingir o **Threshold de Confiança** configurado.

### 4.2. Segurança do Banco Vetorial (Model Lock)
- Uma vez inicializado um Vector Store (`.store`), o modelo de embedding usado é travado em um arquivo `.model_info`.
- **Proibição:** É terminantemente proibido trocar o `ai_embedding_model` nas configurações se um banco já existir, a menos que o botão "Clear & Reset Model" seja acionado.

---

## 5. Interface e Dashboards

### 5.1. Dashboard Cinematográfico
- **Localização:** Rodapé (Bottom-UI).
- **Filtros:** Devem ser sempre dinâmicos e cruzados. O Date Range deve ser do tipo **Dual-Point** (Início e Fim).
- **Performance:** Consultas ao `/all-pins` devem usar `INNER JOIN` apenas sob demanda de filtros de taxonomia/busca.

### 5.2. Isolamento de Abas (Settings UI)
- O conteúdo de cada aba no painel de configurações deve ser encapsulado em uma `div.tabs-content`.
- **Embedded Data:** Aba dedicada para dicionários de territórios brasileiros, evitando poluição visual em outras abas.

---

## 6. Fluxos de DevOps

### 6.1. Build de Release (`build.sh`)
- O script de build é responsável por injetar a pasta `vendor` (framework Neuron AI) na raiz do plugin. 
- **Mandato:** Sempre rode o build e verifique a integridade do `.zip` gerado antes da entrega, garantindo que o `autoload.php` esteja no caminho correto.

### 6.2. Documentação
- Arquivos `README*.md` devem residir na raiz do projeto. A API do JEO está configurada para buscá-los tanto em `src/` quanto em `../` para compatibilidade com Docker de desenvolvimento.

---
*Este guia é a defesa contra o caos técnico. Respeite os mandatos ou o sistema falhará.*