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
- **Campos de Aparência:** Cores e Tipografia devem ser sempre sanitizados. URLs de fontes devem ser validadas como links seguros.

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

### 3.4. Prompt Generator & Language
- O assistente deve sempre oferecer a opção de gerar o prompt em **Inglês (Optimized)** para maior acurácia dos modelos LLM.

---

## 4. Processamento em Lote (Bulk) e RAG

### 4.1. Bulk Processor & Workflow de Aprovação
- **Engine de Background:** Utiliza a classe `Jeo\AI\Bulk_Processor` integrada ao `WP-Cron`.
- **Isolamento de Dados:** Sugestões da IA são salvas em `_jeo_ai_pending_point` até aprovação humana.
- **Modal de Confirmação (UX):** A ação em massa intercepta o formulário para exibir um sumário via AJAX (`/bulk-ai-preview-approval`), comparando a confiança com o **Threshold** definido nas configurações.

### 4.2. RAG Knowledge Base (Vector Store)
- **Model Lock:** Uma vez inicializado um Vector Store, o modelo de embedding é travado em `.model_info`. É proibido trocar o modelo sem o reset completo do banco.
- **Backup:** O sistema mantém os últimos 3 backups `.zip` do banco vetorial para recuperação em caso de erros de reindexação.

---

## 5. Interface e Dashboards

### 5.1. Dashboard Cinematográfico
- **Interface:** Bottom-UI focada em imersão.
- **Filtros Dinâmicos:** Date Range do tipo **Dual-Point** (Início e Fim) com timeline baseada na query de menor data (`MIN(post_date)`).
- **Taxonomia:** Filtros cruzados dinâmicos (Post Type > Taxonomia > Termo) via AJAX.

### 5.2. Settings UI
- **Isolamento de Abas:** Conteúdo deve estar sempre encapsulado em `div.tabs-content` para evitar vazamentos de estilo.
- **Embedded Data:** Aba dedicada para dicionários territoriais locais.

---

## 6. Fluxos de DevOps

### 6.1. Build de Release (`build.sh`)
- O script de build deve injetar a pasta `vendor` (Neuron AI) na raiz do plugin e limpar arquivos de desenvolvimento.

### 6.2. Versionamento
- Toda mudança estrutural exige atualização deste guia.

---
*Este guia é a defesa contra o caos técnico. Respeite os mandatos ou o sistema falhará.*