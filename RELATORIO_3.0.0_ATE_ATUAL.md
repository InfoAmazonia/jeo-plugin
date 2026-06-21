# Relatório Técnico — Evolução do JEO Plugin

## Da versão 3.0.0 (tag `e156eb5d`) ao HEAD atual

---

## 1. Resumo Executivo

Este relatório descreve todas as implementações e correções significativas realizadas no repositório do **JEO Plugin** desde o commit base da versão **3.0.0** (`e156eb5d176186eb2daa1a1312bef9f713306bc8`) até o **HEAD atual**.

| Métrica | Valor |
|---------|-------|
| **Período abrangido** | 25 de março de 2026 a 21 de junho de 2026 |
| **Total de commits** | 245 commits não-merge |
| **Autores** | 2 — Diego (148 commits) e Leonardo Piccioni / leopiccionia (97 commits) |
| **Arquivos alterados** | 360 arquivos |
| **Linhas inseridas** | ~54.566 |
| **Linhas removidas** | ~11.189 |
| **Versões intermediárias notáveis** | 3.5.0 → 3.5.1/2/3/4 experimental → 3.6.0 → 3.6.3/3.6.4/3.6.5 |

### Principais entregas em alto nível

- **Transformação com Inteligência Artificial**: introdução do **Georreferenciamento com IA**, **Assistente de Contexto editorial**, **Mini-Mapas (AI Minimap)** e **Mini-Camadas (Minilayer)** geradas por IA, tudo sobre uma arquitetura unificada com a biblioteca `hacklabr/ai-assistant` + NeuronAI.
- **RAG (Retrieval-Augmented Generation)**: base de conhecimento vetorial para posts e camadas, com indexação em background, backups e integração aos agentes de IA.
- **Novos blocos Gutenberg**: `jeo/ai-minimap` e `jeo/stories-near-you`.
- **Reformulação do editor de mapas/camadas**: previews ao vivo movidos para blocos internos, eliminando mapas duplicados nas sidebars e melhorando drasticamente a performance no Gutenberg.
- **Conformidade WordPress.org**: passos largos para atender às exigências do diretório oficial, incluindo segurança, privacidade, text domain padronizado (`jeowp`), sanitização, htaccess na vector store e fluxo de desinstalação explícito.
- **Infraestrutura modernizada**: PHP mínimo elevado para 8.2/8.3, Composer separado em dev/prod, Docker de desenvolvimento, build automatizado de ZIP e pipelines de CI aprimoradas.

---

## 2. Inteligência Artificial / Assistentes

Esta é a maior frente de mudanças do período. O plugin deixou de ter apenas geocodificação manual para oferecer um ecossistema completo de agentes de IA.

### 2.1 Georreferenciamento com IA (AI-powered Georeferencing Co-Pilot)

**O que foi implementado/mudado:**
- Novo endpoint REST `POST /jeo/v1/ai-georeference` que recebe título/conteúdo do post e retorna coordenadas, confiança, endereço enriquecido e relevância (primária/secundária).
- Integração com múltiplos provedores de IA via NeuronAI.
- Sistema de **confiança** e **relevância**: pontos primários (`is_primary`) e secundários com thresholds configuráveis.
- Endereço enriquecido: rua, número, bairro, CEP, cidade, região, país.
- Modal de aprovação com preview do mapa e botão **Retry AI**.
- Modo **structured output** ativo por padrão, com fallback automático para parsing de texto livre.

**Por que/importância:**
Elimina a necessidade de o jornalista localizar manualmente cada post no mapa. A IA extrai locais do texto e propõe coordenadas com score de confiança, acelerando a produção de conteúdo geolocalizado em larga escala.

**Arquivos/componentes principais:**
- `src/includes/class-ai-handler.php` — orquestrador central com 12+ rotas REST.
- `src/includes/class-ai-adapter.php` — adaptador base.
- `src/includes/ai/class-neuron-adapter.php`, `class-neuron-agent.php`, `class-neuron-factory.php` — integração NeuronAI.
- `src/includes/ai/structured/class-georeference-result.php`, `class-location-output.php` — DTOs de saída estruturada.
- `src/js/src/posts-sidebar/geo-posts-ai.js` — UI do modal de georreferenciamento IA.
- `src/includes/ai/class-system-prompt-builder.php` — construção de prompts com calibração.

**Destaques críticos:**
- Calibração consciente: granularidade, peso do título, thresholds primário/secundário, limites de pontos.
- Fallback automático para texto livre quando o provedor não suporta structured output.
- Regras críticas no prompt para evitar alucinações de localidade.

### 2.2 RAG — Base de Conhecimento Vetorial

**O que foi implementado/mudado:**
- Pipeline RAG unificado via `RAG_Worker` com `RAG_Pipeline_Config`.
- Duas stores vetoriais: `jeo_knowledge` (posts) e `jeo_layers_knowledge` (camadas).
- Data loaders especializados: `WP_Post_Data_Loader` e `Layer_Data_Loader`.
- `Color_Describer` para converter cores de legendas em descrições semânticas (HSL → "vermelho vivo", "azul escuro", etc.).
- Indexação em background via WP-Cron com logs visíveis na aba **Knowledge Base**.
- Backups ZIP síncronos com rotação (máx. 3).
- `topK` configurável (1–50, padrão 10) para controle do número de resultados semânticos.
- Deduplicação automática de camadas ao salvar.

**Por que/importância:**
A RAG permite que os agentes de IA encontrem conteúdo e camadas relevantes sem depender apenas de busca textual exata. Isso fundamenta o Context Assistant, o Minimap e futuras funcionalidades de recomendação.

**Arquivos/componentes principais:**
- `src/includes/ai/class-rag-agent.php`, `class-rag-worker.php`, `class-rag-backup.php`, `class-rag-pipeline-config.php`.
- `src/includes/ai/class-wp-post-data-loader.php`, `class-layer-data-loader.php`, `class-color-describer.php`.
- `src/includes/ai/data/*.json` — 10 dicionários geográficos brasileiros (biomas, terras indígenas, unidades de conservação, etc.).
- `src/includes/cli/class-ai-cli.php` — comando WP-CLI `wp jeo ai vectorize`.

### 2.3 Bulk AI Geolocation (Geolocalização em massa)

**O que foi implementado/mudado:**
- Processamento em lotes de posts antigos via WP-Cron.
- Coluna "JEO AI Status" na lista de posts do admin.
- Modal de aprovação individual e em massa.
- Logs de auditoria e controle de confiança mínima.
- Limpeza completa de pontos legados e gerados por IA.

**Por que/importância:**
Permite migrar grandes acervos editoriais para o novo modelo geolocalizado de forma supervisionada, sem sobrecarregar a API de IA com chamadas síncronas.

**Arquivos/componentes principais:**
- `src/includes/ai/class-bulk-processor.php`
- `src/includes/ai/settings/tab-bulk.php`
- Rotas REST `/jeo/v1/bulk-ai-*`

### 2.4 AI Context Assistant — Assistente Editorial

**O que foi implementado/mudado:**
- Nova sidebar no Gutenberg (`jeo-context-sidebar`) que sugere parágrafos e referências relacionadas ao post em edição.
- Geração inicial via `/jeo/v1/context/setup` e refinamento via `/jeo/v1/context/chat`.
- Saída estruturada com parágrafos (inline HTML: `<strong>`, `<em>`, `<a>`), referências e mensagens.
- Persistência de estado: conversation ID, últimas sugestões e mensagens limpas em `post_meta`.
- Armazenamento duplo: `ConversationStore` para contexto da IA, meta `_jeo_ai_context_chat_messages` para UI limpa.
- Retry com backoff exponencial (3 tentativas).
- Validação de conteúdo mínimo (100 caracteres).
- Customização de prompt com **Prompt Engineer Assistant** e armazenamento transparente em JSON.
- Regras críticas: links contextuais inline, fundamentação factual, array de referências, idioma do site.

**Por que/importância:**
Auxilia redatores a expandir artigos com parágrafos contextualizados e links internos, baseados no conteúdo atual e na base de conhecimento, reduzindo tempo de pesquisa.

**Arquivos/componentes principais:**
- `src/includes/ai/class-context-agent.php`, `class-context-handler.php`, `class-context-generation-output.php`.
- `src/includes/ai/class-retrieve-knowledge-tool.php`, `class-get-post-content-tool.php`.
- `src/js/src/context-sidebar/index.js`, `context-chat-panel.js`, `suggested-paragraphs.js`, `context-sidebar.css`.
- `src/includes/ai/settings/tab-context.php`.

### 2.5 Mini-Mapas (AI Minimap) — Bloco `jeo/ai-minimap`

**O que foi implementado/mudado:**
- Bloco Gutenberg que gera mapas contextuais a partir do conteúdo do post ou de prompt textual.
- Dois modos de geração:
  - **RAG** (`/minimap/setup`): busca semântica de camadas existentes.
  - **Agente IA** (`/minimap/setup-prompt` e `/minimap/chat`): geração e refinamento conversacional.
- Saída estruturada `Minimap_Output` com camadas, base layer, centro, zoom e pins.
- Fallback de base layer via heurística de luminância.
- Fallback de pins a partir de `_related_point` do post.
- Chat panel no inspetor com ações: Send, Regenerate, New prompt, Base variant change.
- Integração condicional com Minilayer (geração de estilos Mapbox via MCP).
- Mecanismos de estabilidade para refinamento: persistência de resumo, state context enriquecido e diff guard.
- Taxonomia `layer-theme` para categorização temática de camadas.

**Por que/importância:**
Permite que editores criem mapas temáticos automaticamente a partir do texto, sem precisar configurar manualmente camadas, centro e zoom.

**Arquivos/componentes principais:**
- `src/includes/minimap/class-minimap.php`
- `src/includes/ai/class-minimap-agent.php`, `class-minimap-output.php`
- `src/includes/ai/class-search-layers-tool.php`, `class-geocode-tool.php`, `class-generate-layer-tool.php`
- `src/js/src/map-blocks/minimap-editor.js`, `minimap-display.js`, `minimap-config.js`

### 2.6 Mini-Camadas (Minilayer) — Camadas geradas por IA

**O que foi implementado/mudado:**
- Endpoint `POST /jeo/v1/minilayer/generate` que cria camadas Mapbox a partir de descrição textual.
- Uso de MCP (Mapbox DevKit) para criação de estilos via ferramentas externas.
- Geração de camadas do tipo `mapbox-tileset-vector` (preferencial) ou `mapbox`.
- Armazenamento de `default_style` (filter + paint) no CPT da camada.
- Reutilização pelo `Generate_Layer_Tool` dentro do Minimap.

**Por que/importância:**
Quando nenhuma camada existente atende à necessidade temática, a IA pode criar uma nova camada visual automaticamente, reduzindo dependência de especialistas GIS.

**Arquivos/componentes principais:**
- `src/includes/ai/class-minilayer-agent.php`, `class-minilayer-handler.php`, `class-minilayer-service.php`
- `src/includes/ai/class-generate-layer-tool.php`
- `src/js/src/shared/layer-style-editor.js`

### 2.7 Arquitetura Unificada de IA

**O que foi implementado/mudado:**
- `JEO_AI_Factory` centraliza a criação de Assistants.
- `Tool_Registry` registra ferramentas reutilizáveis (`search_layers`, `geocode`, `generate_layer`, `get_post_content`, `retrieve_knowledge`).
- `AI_REST_Permissions` padroniza permissões das rotas REST.
- `System_Prompt_Builder` extrai construção de prompts calibráveis.
- `Georeferencing_Conversation` habilita sessões multi-turno de georreferenciamento.
- Storages adaptados: `WP_Storage`, `WP_Option_Storage`, `WP_User_Memory_Storage`.

**Por que/importância:**
Padroniza a forma como agentes são criados, testados e auditados, facilitando manutenção e expansão para novos assistentes.

---

## 3. Novos Blocos e Funcionalidades

### 3.1 Bloco `jeo/ai-minimap`

Já detalhado na seção de IA. Do ponto de vista de produto, é um novo bloco que aparece no inseridor de blocos do Gutenberg e oferece:
- Geração a partir do conteúdo do post.
- Geração a partir de prompt livre.
- Painel de chat para refinamento iterativo.
- Preview ao vivo do mapa dentro do editor.

### 3.2 Bloco `jeo/stories-near-you` — Histórias Perto de Você

**O que foi implementado/mudado:**
- Novo bloco que lista posts geolocalizados próximos ao leitor.
- Geolocalização do navegador com fluxo de consentimento explícito.
- Fallback para coordenadas padrão do JEO quando o usuário nega/ignora a permissão.
- Dois modos de renderização: nativo Gutenberg (estilo `core/latest-posts`) e Newspack Blocks.
- Filtros por categoria, tag, taxonomias customizadas, tipo de post, raio e idade máxima.
- Ordenação por recente, mais próximo ou relevância combinada (distância + idade).
- Dedup entre múltiplos blocos na mesma página.
- Precisão de localização configurável (1–5 casas decimais) para privacidade.
- Skeleton loader, estados de erro e consentimento.

**Por que/importância:**
Conecta leitores a conteúdo hiperlocal de forma transparente e respeitosa com a privacidade, aumentando engajamento com notícias relevantes geograficamente.

**Arquivos/componentes principais:**
- `src/includes/stories-near-you/class-stories-near-you.php`
- `src/includes/stories-near-you/trait-stories-near-you-gutenberg.php`
- `src/includes/stories-near-you/trait-stories-near-you-newspack.php`
- `src/js/src/map-blocks/stories-near-you-editor.js`
- `src/js/src/stories-near-you/stories-near-you-frontend.js`
- `src/css/stories-near-you.css`

### 3.3 Camadas Vetoriais com Estilo por Instância

**O que foi implementado/mudado:**
- Camadas `mvt` e `mapbox-tileset-vector` passaram a suportar estilos por instância no mapa.
- Modal `LayerStyleEditor` para edição de paint/layout.
- Suporte a `default_style` gerado por IA (Minilayer).
- Botão "Use AI Default Style" no editor de camadas.

**Por que/importância:**
A mesma camada pode ter aparências diferentes em mapas diferentes, sem precisar duplicar o CPT de camada.

**Arquivos/componentes principais:**
- `src/js/src/shared/layer-style-editor.js`
- `src/js/src/map-blocks/layer-settings.js`, `layers-settings.js`, `map-preview-layer.js`
- `src/includes/layer-types/mvt.js`, `mapbox-tileset-vector.js`
- `src/js/src/jeo-map/class-jeo-map.js`

---

## 4. Editor de Mapas e Camadas

**O que foi implementado/mudado:**
- **Refatoração da arquitetura de preview**: os previews ao vivo deixaram de ficar nas sidebars (`maps-sidebar`, `layers-sidebar`) e passaram para blocos editor (`jeo/map-editor`, `jeo/layer-editor`) dentro da área de conteúdo do Gutenberg.
- Remoção de mapas redundantes nas sidebars e dos componentes mortos `LayerPreviewPortal` / `MapPreviewPortal`.
- O preview do mapa agora usa `viewState` local durante drag/zoom e persiste apenas em `onMoveEnd`/`onZoomEnd`.
- Atualização in-place (sem remount por `key`).
- Blocos envoltos em `<AsyncModeProvider value={true}>` para reduzir re-renderizações causadas por mudanças no `wp.data`.
- Bridge de pan-limits entre mapa e sidebar via `window.parent.__jeoSetPanLimitsFromMap`.
- Debounce de 500ms nos formulários `SchemaForm` do layer editor.
- Guarda `loadedRef` no `onSourceData` para evitar re-renderizações durante carregamento de tiles.
- Integração com `load_as_style` (camadas Mapbox carregadas como estilo base) em todos os editores.

**Por que/importância:**
Essa mudança resolveu loops de re-renderização que tornavam a edição de mapas/camadas lenta no Gutenberg (especialmente no modo iframe do Block API v3). A experiência do editor ficou mais fluida e previsível.

**Arquivos/componentes principais:**
- `src/js/src/map-blocks/map-editor-preview.js`, `map-editor.js`, `layer-editor-preview.js`
- `src/js/src/maps-sidebar/maps-sidebar.js`
- `src/js/src/layers-sidebar/layers-sidebar.js`, `layer-settings.js`
- `src/js/src/map-blocks/use-style-layer.js`

---

## 5. Frontend e Mapas

### 5.1 Dual Runtime MapLibre/Mapbox

**O que foi implementado/mudado:**
- Sistema de carregamento abstrato via `lib/mapgl-loader.js`.
- MapLibre GL é o padrão e empacotado localmente.
- Mapbox GL é opcional, carregado via `wp_enqueue_script` e ativado apenas se `mapbox_key` existir.
- Patches para compatibilidade de APIs deprecadas/missing (`getLight`, `getSky`, `setSky`).

**Por que/importância:**
Oferece flexibilidade de runtime sem forçar dependência de Mapbox, mantendo o plugin funcional mesmo sem chave paga.

### 5.2 Compatibilidade com Iframe (Block API v3)

**O que foi implementado/mudado:**
- Patches extensivos para `instanceof` cross-document (`HTMLElement`, `MouseEvent`).
- Rebinding de event listeners entre documento pai e iframe.
- FullscreenControl ajustado para `document.fullscreenElement` correto.
- ResizeObserver para detectar mudanças no container do mapa.
- Detecção de CSS ausente no iframe.

**Por que/importância:**
O Gutenberg moderno renderiza blocos dentro de iframes. Sem esses patches, controles de mapa, drag e fullscreen quebravam no editor.

### 5.3 Dashboard Geográfico

**O que foi implementado/mudado:**
- Página **JEO → Dashboard** com mapa fullscreen.
- Clusterização nativa de todos os pins.
- Painel de filtros avançados: busca, tipo de post, taxonomia, termo, slider de timeline.
- Endpoints `/jeo/v1/all-pins` e `/jeo/v1/dashboard-stats`.
- Remoção de dependência do Carto.

**Por que/importância:**
Visão consolidada de todo o conteúdo geolocalizado da publicação, com exploração interativa e filtros.

### 5.4 Camadas e Estilos

**O que foi implementado/mudado:**
- Suporte a `load_as_style` para camadas Mapbox no frontend e no editor.
- Personalização de estilo de camadas vetoriais (MVP).
- Fallback de ícones de pin primário/secundário via jsDelivr.
- Configuração de URLs dos ícones de pin nas configurações.
- Correção de renderização de layers retina e popups do minimap.

**Arquivos/componentes principais:**
- `src/js/src/jeo-map/class-jeo-map.js` — grande refactor (~941 linhas alteradas).
- `src/includes/layer-types/*.js`
- `src/js/src/lib/mapgl-loader.js`, `mapgl-react.js`

---

## 6. Storymap

**O que foi implementado/mudado:**
- Verificação de storymap CPT não vazio antes de atribuir template.
- Restrição de 1 bloco `jeo/storymap` por post.
- Suporte a co-authors no CPT storymap.
- Ajustes gerais de compatibilidade com o novo sistema de mapas.

**Por que/importância:**
Manutenção da funcionalidade de scrollytelling à medida que o restante do plugin evoluiu.

**Arquivos/componentes principais:**
- `src/includes/storymap/class-storymap.php`
- `src/js/src/jeo-storymap/storymap-display.js`
- `src/js/src/maps-sidebar/storymap-sidebar.js`

---

## 7. Discovery / Busca e Filtros

**O que foi implementado/mudado:**
- Ajustes no app Discovery para novos endpoints e filtros.
- Range picker de timeline estilizado.
- Integração com clusters do dashboard.

**Por que/importância:**
Discovery continua sendo o aplicativo de exploração de mapas e histórias; as melhorias mantêm a funcionalidade alinhada com as novas APIs.

**Arquivos/componentes principais:**
- `src/js/src/discovery/*`
- `src/templates/discovery.php`, `embed-discovery.php`

---

## 8. Build, Deploy e Conformidade WordPress.org

### 8.1 Build e Scripts

**O que foi implementado/mudado:**
- Novo script `scripts/build-wordpress-zip.sh` para gerar ZIP autocontido do plugin.
- Melhorias no `scripts/build.sh`, `install-and-build.sh`.
- Auto-detecção do Node 24 via fallback nvm.
- `patch-build-compliance.mjs` remove URLs proibidas dos bundles (`raw.githubusercontent.com` do ajv).
- Separação de dependências Composer em dev (raiz) e prod (`src/composer.json`/`src/composer.lock`).
- `vendor/` de produção instalado automaticamente em `src/vendor/` via `post-install-cmd`/`post-update-cmd`.

**Por que/importância:**
Torna o processo de release reprodutível e compatível com as regras do diretório WordPress.org.

### 8.2 Docker de Desenvolvimento

**O que foi implementado/mudado:**
- Ambiente Docker completo em `.docker/` (não commitado).
- WordPress + MariaDB com portas 8081/3307.
- Script `.docker/start.sh` e helpers `.docker/wp.sh`, `switch-php.sh`.
- Tema moderno ativado automaticamente para evitar WSOD.
- Mapeamento de porta 8072 em iterações anteriores, depois padronizado em 8081.

**Por que/importância:**
Permite que desenvolvedores rodem o plugin localmente sem configurar manualmente PHP/MySQL/WordPress.

### 8.3 Conformidade WordPress.org

**O que foi implementado/mudado:**
- Text domain unificado para `jeowp` em todas as strings internacionalizadas.
- Plugin slug `jeowp` em builds, CI, smoke tests e nomes de arquivos de idioma.
- Cabeçalhos `Requires PHP:` alinhados em `src/jeo.php`, `src/readme.txt` e verificação runtime.
- Seção `== Third Party Services ==` no readme.
- Proteção `.htaccess` na vector store RAG.
- Sanitização de runtime Mapbox em `Settings::sanitize_settings()`.
- Verificações `current_user_can('edit_posts')` em endpoints/AJAX que expõem dados.
- Scripts de compliance: `check-wporg-compliance.mjs`, `validate-release-meta.mjs`, `check-php-compat.php`.

**Por que/importância:**
Sem esses ajustes o plugin não poderia ser distribuído pelo repositório oficial do WordPress.

### 8.4 CI/CD

**O que foi implementado/mudado:**
- Workflows do GitHub Actions aprimorados (`wordpress-smoke.yml`, `phpcs-wpcs.yml`, `php-compat.yml`, etc.).
- Smoke test reutiliza artefatos de build entre jobs.
- Validação de idiomas (POT/PO).
- Action composta para WordPress Plugin Check.

**Arquivos/componentes principais:**
- `.github/workflows/*`
- `scripts/*`
- `composer.json` (raiz e `src/`)
- `webpack.config.js`

---

## 9. Documentação e Arquitetura

**O que foi implementado/mudado:**
- Criação da pasta `.architecture/` com documentação detalhada por domínio: AI, blocks, build, context, deployment, discovery, frontend, geocoding, layers, maps, minimap, minilayer, rest-api, settings, stories-near-you, storymap, templates.
- Atualização massiva de `AGENTS.md` com convenções, stack, comandos e padrões de IA.
- Documentação de usuário em `docs/` com prints e guias para AI bulk geolocation, context assistant, georeferencing, settings, minimap, stories-near-you.
- `GEMINI.md` com mandados de arquitetura para modelos de IA.
- Site MkDocs movido para `/docs`.
- READMEs atualizados para v3.6.x.

**Por que/importância:**
A documentação acompanhou a complexidade do sistema, servindo tanto para desenvolvedores quanto para usuários finais e agentes de IA.

**Arquivos/componentes principais:**
- `.architecture/**/*.md`
- `AGENTS.md`, `GEMINI.md`, `README.md`, `README_BR.md`
- `docs/**/*.md`
- `mkdocs.yml`

---

## 10. Correções de Bugs e Estabilidade

Abaixo estão as correções críticas que merecem destaque:

| Problema | Correção |
|----------|----------|
| Loop infinito no bulk processing manual | Remoção do loop recursivo no endpoint manual |
| Deadlock na indexação RAG em background | Ajuste no contador de progresso e prefixos de modelo legado |
| NaN em coordenadas de mapas | Casting explícito para float em PHP e React; migração runtime de dados legados |
| Validação REST rejeitando números | Padronização de `lon` vs `lng` e casting float no sanitizer |
| Schema validation 500 no REST | Float casting estrito no metadata sanitizer |
| Bulk clear não apagava pontos legados | Limpeza completa de `_related_point`, `_geocode_*` e metas de IA |
| Minimap recriando Map com key destrutiva | Validação de IDs de camadas e remoção de remount por key |
| Retry frágil da IA | Retry com backoff exponencial, tratamento de timeout e rede |
| Copy do Context Assistant perdendo formatação | Triple-fallback rich-text clipboard com `execCommand` reforçado para iframe |
| Stories Near You repetindo posts | Sistema de deduplicação cross-block no frontend e no editor |
| Stories Near You ordenação incorreta | Correção do `ORDER BY` no SQL |
| Stories Near You localização superprecisa | Precisão configurável e cast `DECIMAL(10,N)` no SQL |
| Minimap popup quebrado | Correção de resolução retina e renderização de popups |
| Camadas não renderizavam em one-time maps | Ajustes no `load_as_style` e renderização de vetores |
| Camadas vetoriais do Minimap apareciam invisíveis (só pins) | Fallback de paint por geometria quando a camada não tem estilo salvo |
| Minimap selecionava camadas publicadas mas não renderizáveis | Validação de renderabilidade (tileset/source_layer/style_id), com reporte de removidas |
| Histórias Perto de Mim retornavam conteúdo não-próximo | Ordenação padrão por relevância (distância+data) e descarte de coordenadas inválidas |
| Bloco Histórias Perto de Mim não carregava no frontend | Enqueue garantido via `render_callback` + estilos do `core/latest-posts` |
| Context Assistant não exibia as referências usadas | Referências passam a ser renderadas no painel de sugestões |
| Context Assistant perdia respostas anteriores ao refinar | Arquivo de versões de sugestão com navegação na visão expandida |

---

## 11. Segurança, Privacidade e Dados Pessoais

**O que foi implementado/mudado:**
- Fluxo de desinstalação explícito com página de confirção (`admin.php?page=jeo-uninstall-confirm`) listando todos os dados removidos.
- `uninstall.php` remove opções, metas geolocalizadas, logs de IA, cron hooks e diretório da vector store.
- Implementação de `wp_add_privacy_policy_content()`.
- Exporters/erasers para dados pessoais de `_related_point`.
- Sanitização de chaves de API com exibição mascarada (dual-state text/password).
- Proteção `.htaccess` no diretório da vector store RAG.
- Consentimento explícito antes de chamar `navigator.geolocation.getCurrentPosition()` no Stories Near You.
- Precisão de geolocalização do usuário configurável para reduzir exposição de local exato.
- Validação de permissões em endpoints REST e AJAX (`edit_posts`, `manage_options`).
- Sanitização de CSS dinâmico gerado a partir de configurações.
- Remoção de URLs proibidas (`raw.githubusercontent.com`, `fonts.openmaptiles.org`) e uso de `cdn.jsdelivr.net/gh` como alternativa.

**Por que/importância:**
Essas mudanças atendem às exigências do WordPress.org, do GDPR e de boas práticas de segurança, protegendo tanto a publicação quanto os dados dos leitores.

**Arquivos/componentes principais:**
- `src/uninstall.php`
- `src/includes/admin/uninstall-handler.php`, `uninstall-page.php`
- `src/includes/privacy.php`
- `src/includes/settings/class-settings.php`
- `src/includes/stories-near-you/class-stories-near-you.php`
- `src/includes/ai/class-ai-rest-permissions.php`

---

## 12. Correções a partir do Feedback Editorial (junho/2026)

Após a entrega das funcionalidades de IA, a equipe editorial da InfoAmazonia (Carolina Dantas, Juliana Mori e Thayane Guimarães) realizou uma rodada de revisão prática de **Mini-Mapas**, **Histórias Perto de Mim** e **Contexto Adicional por IA**. As lacunas apontadas foram tratadas em uma frente dedicada de correções, resumida abaixo.

### 12.1 Mini-Mapas

**O que foi implementado/mudado:**
- **Render de camadas vetoriais sem estilo salvo**: camadas do acervo selecionadas pela IA que não tinham `style`/`default_style` entravam com o paint default do Mapbox e ficavam invisíveis (sintoma "só aparecem os pins"). Foi adicionado um **fallback de paint por geometria** (`fill`/`line`/`circle`/`fill-extrusion`) em `JeoLayerTypes.getFallbackPaint()`, aplicado em `mvt.js` e `mapbox-tileset-vector.js`.
- **Validação de renderabilidade**: `is_renderable_layer()` passa a exigir os campos mínimos por tipo (tileset/source_layer/style_id). Camadas publicadas mas não renderizáveis são reportadas como removidas, em vez de gerar mapa vazio.
- **Transparência no painel**: camadas com estilo automático recebem a flag `auto_style` e um aviso editável; a justificativa (`reason`) de cada camada é sempre exibida.
- **Limite + tema**: o prompt do agente passou a exigir, em pedidos do tipo "limite de X destacando Y", a presença do limite administrativo **e** do tema, sem colapsar para um único pin.
- **Recuperação RAG por nomenclatura**: sinônimos de domínio (PT/EN) foram acrescentados ao texto indexado das camadas (`Layer_Data_Loader`), ampliando o recall para termos como rios/hidrografia, desmatamento/Prodes, mineração/garimpo.

**Arquivos principais:** `src/includes/layer-types/JeoLayerTypes.js`, `mvt.js`, `mapbox-tileset-vector.js`, `src/includes/minimap/class-minimap.php`, `src/includes/ai/class-minimap-agent.php`, `src/includes/ai/class-layer-data-loader.php`, `src/js/src/map-blocks/layers-panel.js`.

### 12.2 Histórias Perto de Mim

**O que foi implementado/mudado:**
- **Ordenação padrão** alterada de `recent` para **`relevance`** (distância + atualidade), corrigindo resultados pouco próximos.
- **Guarda de coordenadas inválidas** na consulta de proximidade (descarta valores fora de faixa e o sentinela `0,0`).
- **Consistência de metadados**: o índice realmente gravado (`_geocode_lon_*`) passou a ser o registrado.
- **Carregamento do bloco no frontend**: enqueue garantido a partir do `render_callback` (e não apenas via `has_block`), além do enfileiramento dos estilos do `core/latest-posts` e correção do dimensionamento de imagens destacadas.

**Arquivos principais:** `src/includes/stories-near-you/class-stories-near-you.php`, `src/includes/geocode/class-geocode-handler.php`, `src/js/src/map-blocks/stories-near-you-editor.js`, `src/css/stories-near-you.css`.

### 12.3 Contexto Adicional por IA

**O que foi implementado/mudado:**
- **Links contextuais inline** e **regras anti-alucinação** reforçadas no prompt (não inventar termos fora das fontes, citar a referência exata quando questionado, retratar-se quando apontado o erro).
- **Exibição das referências**: as matérias usadas para embasar cada sugestão passam a ser renderizadas no painel (antes eram recuperadas mas não mostradas).
- **Arquivo de versões de sugestão**: nova meta `_jeo_ai_context_suggestion_history` persiste cada versão; a visão expandida ganhou um navegador de "Sugestões anteriores" para rever/reaproveitar respostas substituídas no refino. A resposta refinada passou a ser persistida e as metas são removidas no fluxo de desinstalação.

**Arquivos principais:** `src/includes/ai/class-context-agent.php`, `src/includes/ai/class-context-handler.php`, `src/js/src/context-sidebar/context-chat-panel.js`, `suggested-paragraphs.js`, `src/uninstall.php`.

**Por que/importância:**
Esta frente fecha o ciclo entre entrega técnica e uso editorial real, convertendo a devolutiva qualitativa das editoras em correções verificáveis. Recomenda-se validação reproduzindo os mesmos casos do feedback (Eneva, COP de Biodiversidade, BR-319 e proximidade a partir de Belém).

---

## 13. Considerações Finais

O período analisado representa uma **evolução substantiva** do JEO Plugin. A base cartográfica foi preservada e aprimorada, enquanto uma camada completa de Inteligência Artificial foi adicionada, transformando o plugin em uma plataforma de auxílio editorial geoespacial.

Principais indicadores dessa transformação:

- **Mais de metade dos commits** (129 de 245) envolvem diretamente IA, agentes, RAG, prompts ou structured output.
- **Novos blocos** expandem as possibilidades de narrativa geoespacial no Gutenberg.
- **Arquitetura de editor** foi reescrita para performance e compatibilidade com o Block API v3.
- **Conformidade e segurança** foram tratadas como primeira classe, preparando o plugin para distribuição no diretório WordPress.org.
- **Documentação** acompanhou o crescimento, com guias técnicos e de usuário para todas as grandes funcionalidades.

Recomenda-se que a equipe de produto e engenharia acompanhe de perto:
1. A estabilidade dos agentes de IA em produção (custo, latência, alucinações).
2. A evolução da cobertura de testes automatizados sobre o novo código de IA.
3. O processo de release utilizando o novo ZIP builder e as validações de compliance.

---

*Relatório gerado automaticamente a partir da análise do histórico Git do repositório `/home/diegosanches/Projects/www/hacklab/jeo-plugin`.*
*Base: tag 3.0.0 (`e156eb5d`) até HEAD (`ddc8b615`).*
