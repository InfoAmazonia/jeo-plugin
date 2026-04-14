# JEO Plugin - Master Architecture Guide & Mandates (v3.6.4)

Este documento é a autoridade máxima sobre a arquitetura do plugin JEO. Qualquer alteração, refatoração ou adição de funcionalidade deve respeitar estritamente as diretrizes aqui estabelecidas para garantir a estabilidade e a integridade dos dados geográficos.

---

## 1. Visão Geral e Propósito
O JEO é um framework de geojornalismo para WordPress. Ele transforma posts em camadas de dados interativos, permitindo a geolocalização manual ou automatizada (via IA) de matérias jornalísticas.

### Stack Tecnológica:
- **Backend:** PHP 8.2+ (Obrigatório), Composer para gerenciamento de dependências.
- **AI Engine:** Neuron AI Framework.
- **Frontend:** React, Gutenberg Blocks, MapLibre GL / Mapbox GL.
- **Infraestrutura Local:** Docker Compose (Apache + MariaDB, Porta 8072).

---

## 2. Motor de Inteligência Artificial (v3.6.3-experimental)

O JEO utiliza o framework **Neuron AI** como motor universal de LLM. 

### 2.1. Neuron Agent & Adapters
- **Centralização:** Toda chamada de IA deve passar pela classe `Jeo\AI\Neuron_Adapter`. Nunca faça chamadas HTTP diretas para APIs de LLM. O `Neuron_Factory` centraliza a instanciação de provedores de Chat e Embeddings.
- **Configuração Determinística:** Todos os modelos de Chat são configurados com `temperature = 0.1` para garantir que a extração de coordenadas seja precisa e não criativa.
- **Provedores:** Suporte nativo a 10 provedores (Gemini, OpenAI, Anthropic, DeepSeek, Ollama, Mistral, ZAI, HuggingFace, Grok, Cohere) configuráveis na Aba AI.

### 2.2. RAG Knowledge Base (Vector Store)
- **Caminho Seguro:** Os embeddings são armazenados estritamente na pasta `wp-content/uploads/jeo-ai-store/` protegida por `.htaccess` contra acesso público via web.
- **Isolamento de Ambiente:** O JEO possui duas bases vetoriais físicas (`jeo_knowledge.store` para Produção, `jeo_knowledge_test.store` para Testes). O código implementa endpoints REST para a limpeza (`clear`) individual de cada store.
- **Limitações de API:** Modelos de Chat (`gpt-4o`, `gemini-2.5-flash`) não suportam vetorização. O `Neuron_Factory` deve SEMPRE forçar a injeção de modelos focados em embeddings (`text-embedding-3-small`, `text-embedding-004`) para a `EmbeddingsProviderInterface`.

### 2.3. Model-Aware Prompt Optimization & Verbatim Mandate
- O **AI Prompt Engineer Assistant** (Meta-Prompting) intercepta a requisição do usuário via `api_chat_prompt_generator` e gera automaticamente um System Prompt otimizado, injetando "Regras Constitucionais" específicas dependendo do provedor ativo:
  - **Gemini:** Exige Markdown estrito e instrução passo a passo.
  - **OpenAI:** Otimizado com regras abstratas e concisas.
  - **DeepSeek:** Utiliza blocos de tags XML (`<rules>`) para guiar o raciocínio.
  - **Anthropic:** Abordagem negativa constitucional ("O que não fazer").
- **Verbatim Mandate:** O Assistente anexa obrigatoriamente um bloco de texto imutável (verbatim) definindo o contrato JSON do JEO, incluindo o exemplo do "Teatro Amazonas".
- **Live Validator:** Utiliza o `api_validate_prompt` para testar o prompt customizado contra um texto global fixo (Paris, Manaus, Tóquio) garantindo a integridade da saída.

### 2.4. Surgical JSON Parser (Depth Balancing)
- **Resiliência contra Lixo:** O JEO utiliza um extrator de JSON via profundidade de colchetes. Ele localiza o primeiro `[` e busca o seu `]` correspondente exato, ignorando lixo fora do array.
- **Negative Key Constraints:** Proíbe inventar chaves (como `"city"` ou `"country"`). O retorno restrito do schema é `"name"`, `"lat"`, `"lng"`, `"quote"`.

### 2.5. Dicionários Geográficos Locais
- Localizados em `src/includes/ai/data/`, fornecem contexto geográfico focado no Brasil e na Amazônia (ex: `biomes.json`, `indigenous-territories.json`) que podem ser processados localmente ou baixados para grounding avançado.

### 2.6. Processamento em Lote (Legacy Bulk Processor)
- **Engine de Background:** Utiliza a classe `Jeo\AI\Bulk_Processor` integrada ao `WP-Cron` para processar posts antigos de forma assíncrona.
- **Armazenamento Temporário:** Os resultados sugeridos pela IA são salvos no meta privado `_jeo_ai_pending_point` até que um humano os aprove. O status do processamento é rastreado via `_jeo_legacy_status`.
- **Workflow de Aprovação:**
  - **Individual:** Um "Notice" de aviso no sidebar do Gutenberg alerta sobre locais encontrados e permite a revisão/aprovação via modal.
  - **Em Massa:** Adiciona uma coluna "Status IA JEO" na listagem de posts (`edit.php`) e uma "Ação em Massa" para aprovação rápida de múltiplos posts simultaneamente.
- **Configuração & Monitoramento:** Interface dedicada na aba "Bulk Geolocation" para gerenciar intervalo do cron, tamanho do lote e post types habilitados.
- **Controle Manual e Auditoria:**
  - **Botão "Run 1 Batch Now":** Permite o disparo manual imediato via REST API para testes e processamento sob demanda.
  - **Logging e Limpeza:** Sistema de logs em tempo real salvo em `jeo-bulk-ai.log` com interface de visualização no painel e botão para limpeza rápida do arquivo.

### 2.7. Cost Dashboard (Gestão de Custos)
- **Salvamento de Tokens:** Utiliza a classe `AI_Logger` para persistir o consumo (`input_tokens`, `output_tokens`) no Custom Post Type privado `jeo-ai-log`. Tokens de embeddings são estimados (1 token =~ 4 caracteres) e agregados na tabela `options`.

---

## 3. Experiência do Usuário (Settings UI)

### 3.1. Configurações de IA e Interceptações
- **Tradução Dinâmica (Hardcoded):** Para evitar a recompilação de `.mo` a cada nova funcionalidade, o `AI_Handler` intercepta o filtro `gettext` e traduz dezenas de strings dinamicamente para `pt_BR`.
- **Proteção Anti-Vazamento:** Um script JS injetado na página de plugins alerta na desativação: desativar o JEO expurga permanentemente todas as chaves de API por motivos de segurança.
- **Dynamic Model Fetcher:** Consulta as APIs dos provedores em tempo real (`api_get_models`) e popula um campo de busca Select2 para seleção do LLM.

---

## 4. Persistência de Dados e Geolocalização

### 4.1. O Metadado Mestre: `_related_point`
Todos os dados geográficos de um post são armazenados no metadado mestre (array de objetos) `_related_point`.
- **Campos do Schema:** `_geocode_lat`, `_geocode_lon`, `name`, `quote` (foco da IA). A API REST também expõe e mapeia a estrutura complexa do provedor de mapa: `_geocode_city_level_1`, `_geocode_city`, `_geocode_region_level_1/2/3`, `_geocode_country_code`, `_geocode_country`, e o controle de `relevance` (primary, secondary).
- **Citação da IA:** Usa especificamente a chave `_ai_quote` para armazenar o trecho do texto onde o local foi encontrado.

### 4.2. Indexação Automática de Performance
**NUNCA desative ou faça bypass nas funções de hook do `Geocode_Handler`.**
- Como consultas em arrays serializados via `WP_Query` destroem a performance do banco, o JEO implementa um sistema de **indexação "On Save"**.
- Ao salvar o post, o handler destrincha o array e cria dezenas de metadados avulsos (ex: `_geocode_lat_p` para latitude do ponto primário, `_geocode_country_s` para país secundário), permitindo buscas e filtros geográficos otimizados.

---

## 5. Interface, Integrações e APIs Restritas

### 5.1. Customização e Discovery Mode
- **Motor CSS Dinâmico:** O arquivo `loaders.php` processa propriedades globais de aparência (como `jeo_primary-color` e fontes do Google) e injeta um `<style>` no cabeçalho com variáveis nativas CSS (`:root`) modificando luminosidade dinamicamente (para os hovers).
- **Discovery Mode:** Um template especial `discovery.php` permite uma navegação exploratória do mapa em tela cheia com layouts em React específicos.
- **Embedder Universal:** Um hook de `wp_embed` expõe os Mapas e Storymaps para serem incorporados globalmente (`iframe`) em qualquer plataforma externa, aceitando query strings para manipular dimensões (`height`, `width`).

### 5.2. Ecossistema WordPress
- **WPML:** Há checagens nativas para carregar blocos traduzidos usando `currentLang` injetado na localização dos scripts JS.
- **Co-Authors Plus:** A API de respostas de Storymaps (`class-storymap.php`) detecta automaticamente se múltiplos autores estão registrados e os exibe dentro do bloco de resposta REST na chave `jeo_authors`.
- **REST API Limits Override:** O JEO força um overwrite violento em alguns endpoints REST. Em `map-layer`, o `per_page` máximo é desativado para garantir que mapas com infinitas camadas não escondam dados devido à limitação padrão de paginação do WP. E as tags chegam ao limite arbitrário de `1000` itens.

---

## 6. Mandatos de Estabilidade (O que NÃO fazer)

1. **NÃO baixe a versão do PHP:** O plugin exige **PHP 8.2**.
2. **NÃO altere o Schema do `_related_point` sem atualizar o JS e o `Geocode_Handler`.** Lembre-se que você pode quebrar os sufixos de indexação (`_p` / `_s`).
3. **NÃO use `file_put_contents` para logs de custos:** Use a classe `AI_Logger`.
4. **NÃO publique a pasta `vendor` no Git.**
5. **NÃO permita que a IA defina o formato de saída:** Sempre injete o contrato JSON agressivo (`enforced_schema`).
6. **NÃO injete prompts via `$this->instructions()` no Neuron AI:** Na classe base, esse método é um getter interno. Utilize o **setter** correto: `$this->setInstructions($prompt);`.
7. **NÃO remova a flag `[SKIP_ENFORCED_SCHEMA]` de ferramentas internas:** Ferramentas que geram texto ao invés de coordenadas (como o Meta-Prompt Generator) não funcionarão se presas na prisão constitucional de JSON do JEO.
8. **NÃO acesse Vector Stores no painel web:** A vetorização massiva esgota `max_execution_time`. SEMPRE injete documentos via CLI (`wp jeo ai vectorize --post_type=X`).
9. **NÃO reverta as anulações da REST API:** Nunca adicione os limites de `per_page` nos params de colletion das camadas (`map-layer`), senão o React quebrará ao renderizar camadas ocultas por paginação.

---

## 7. Fluxos de Trabalho (DevOps)

### 7.1. Ambiente de Desenvolvimento (`setup.sh`)
- Utilize `./setup.sh` para subir o ambiente em **http://localhost:8072**.
- Credenciais: `admin` / `admin`.
- **Limites Generosos (Docker):** O ambiente é pré-configurado para requisições massivas de IA e geojornalismo: `memory_limit=2048M`, `upload_max_filesize=1024M`, `max_execution_time=600s`, `max_allowed_packet=256M`.

### 7.2. Build de Release (`build.sh`)
- Sempre gere o pacote oficial via `./build.sh`. O script constrói dependências do Composer e npm isoladamente e higieniza a pasta para produção.

---
*Este guia deve ser atualizado sempre que uma mudança estrutural for implementada.*