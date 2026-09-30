# JEO Plugin — Auditoria de Issues de Usabilidade

**Data:** 23/09/2026
**Repo:** InfoAmazonia/jeo-plugin
**Escopo:** Issues de usabilidade rastreadas no GitHub + issues encontradas diretamente no código (sem issue aberta).
**Método:** Triagem das issues abertas + verificação pontual no código-fonte (evidências `arquivo:linha`).

---

## Resumo executivo

| Categoria | Quantidade |
|---|---|
| Corrigidas no código e **fechadas** nesta auditoria | 2 (#613, #537) |
| Corrigidas no código, issue mantida aberta | 1 (#630 — decisão do mantenedor) |
| Confirmadas **não corrigidas** no código | 3 (#640, #647, #612) |
| Não verificadas (exigem análise mais profunda) | 9 |
| Issues fora do GitHub (encontradas no código) | 3 TODOs + 1 risco de segurança/higiene |

---

## 1. Issues do GitHub

Legenda de status: ✅ corrigida · 🔧 parcialmente corrigida · ❌ não corrigida · ❔ não verificada

### 1.1 Corrigidas e fechadas nesta auditoria

| Issue | Título | Evidência da correção |
|---|---|---|
| [#613](https://github.com/InfoAmazonia/jeo-plugin/issues/613) | Clarify Mapbox access token settings when using MapLibreGL | ✅ Toggle `toggleMapboxSettings()` / classe `.jeo-mapbox-settings` removidos (nenhuma ocorrência em `src/`); descrição da chave atualizada para "Public access token. Used for MapboxGL rendering, Mapbox layers, and AI layer generation." (`src/includes/settings/settings-page.php:144`) |
| [#537](https://github.com/InfoAmazonia/jeo-plugin/issues/537) | Refinar Botão Geolocalizar (remover referência ao provedor) | ✅ Botão agora é `Geolocate with AI` (`src/js/src/posts-sidebar/index.js:286`); nenhuma menção a Gemini/OpenAI na sidebar |

### 1.2 Corrigidas no código, issue mantida aberta

| Issue | Título | Situação |
|---|---|---|
| [#630](https://github.com/InfoAmazonia/jeo-plugin/issues/630) | Add simple style controls for direct vector layer types | 🔧 Mecanismo de estilo por instância existe: `src/includes/layer-types/mvt.js:58-60` resolve `style.use_default` / `default_style` (shape `{ use_default, paint, layout }`, documentado no AGENTS.md). Issue mantida aberta por decisão do mantenedor (possivelmente faltam controles UI dedicados). |

### 1.3 Confirmadas NÃO corrigidas

| Issue | Título | Evidência do problema |
|---|---|---|
| [#640](https://github.com/InfoAmazonia/jeo-plugin/issues/640) | Render a semantic title and expose theme hooks on single map pages (priority: high) | 🔧 Fix em andamento no working tree: `<h1 class="screen-reader-text"><?php echo esc_html( get_the_title() ); ?></h1>` (`src/templates/single-map.php:52`). Imprime, escapa e é `h1` — mas `screen-reader-text` esconde o título visualmente, contradizendo o critério de aceite ("displays its stored title before the map") e com comportamento inconsistente entre temas que definem (ou não) essa classe. **Faltam:** classe estável (`jeo-map-title`), hooks (`jeo_before/after_single_map_title` ou filtro), mecanismo de override (`locate_template`), teste full-page vs `?embed`, documentação para mantenedores de tema. |
| [#647](https://github.com/InfoAmazonia/jeo-plugin/issues/647) | Clarify Story Map block names and inserter descriptions | ❌ `jeo/storymap` e `jeo/embedded-storymap` continuam com descrição idêntica "Display maps with storytelling" (`src/js/src/map-blocks/index.js:275-276` e `:346-347`). Mesmo ícone, mesmo texto — confusão editorial relatada na issue persiste. |
| [#612](https://github.com/InfoAmazonia/jeo-plugin/issues/612) | Fix Discovery story card width in themes without a global border-box reset | ❌ `.stories .card` mantém `width: calc( 100% + 60px )` + `padding: 16px 30px` **sem** `box-sizing: border-box` (`src/js/src/discovery/style/discovery.scss:1003-1010`). Em temas sem reset global, o card continua estourando a largura do painel. **Fix sugerido (1 linha):** `box-sizing: border-box;` no `.stories .card` — escopo estreito, como a própria issue recomenda. Nota: os `box-sizing` existentes no SCSS (linhas ~774 e ~1411) pertencem a comboboxes, não ao card. |

### 1.4 Não verificadas (exigem análise mais profunda)

| Issue | Título | Observação |
|---|---|---|
| [#647-adjacente] [#639](https://github.com/InfoAmazonia/jeo-plugin/issues/639) | Audit and namespace generic frontend CSS classes | Relacionada a #612 (classe genérica `card` em `article`, `src/js/src/discovery/blocks/stories.js:1400`). Auditoria completa de classes CSS não realizada. |
| [#629](https://github.com/InfoAmazonia/jeo-plugin/issues/629) | Inspect vector sources and suggest source layers (MVT/Mapbox tileset vector) | Não há inspeção automática de source layers visível em `src/includes/layer-types/mvt.js`. |
| [#631](https://github.com/InfoAmazonia/jeo-plugin/issues/631) | Support interactions for MVT and Mapbox tileset vector layers | Sem código de popup/click em `src/includes/layer-types/mvt.js`. Provavelmente aberta. |
| [#634](https://github.com/InfoAmazonia/jeo-plugin/issues/634) | Mal funcionamento do bloco Histórias Perto de Mim | Não reproduzido/verificado. |
| [#635](https://github.com/InfoAmazonia/jeo-plugin/issues/635) | Verificar aplicação de camadas nos Minimapas | Não verificado. |
| [#610](https://github.com/InfoAmazonia/jeo-plugin/issues/610) | Add native block-theme support for Discovery, Map, and Story Map routes | Não verificado. Relacionado às regressões já fechadas #626 (deprecation notices) e #625 (embeds em branco). |
| [#661](https://github.com/InfoAmazonia/jeo-plugin/issues/661) / [#653](https://github.com/InfoAmazonia/jeo-plugin/issues/653) | Consent contract para embeds / integração WP Consent API | Não verificado (privacidade/UX de consentimento). |
| [#540](https://github.com/InfoAmazonia/jeo-plugin/issues/540) | Melhorar Aprovação Lote (tela de revisão prévia / filtro por ranqueamento) | Existe filtragem por `confidence`/thresholds no JS (`src/js/src/posts-sidebar/index.js`), mas não foi encontrada tela de revisão prévia antes da aprovação final. Incerto. |
| [#541](https://github.com/InfoAmazonia/jeo-plugin/issues/541) / [#542](https://github.com/InfoAmazonia/jeo-plugin/issues/542) | Tips de configuração (dicas de uso nos campos) | Tabs de settings AI (`src/includes/ai/settings/tab-*.php`) têm poucas `description`s. Incerto/completo apenas parcialmente. |

### 1.5 Issues fechadas no GitHub com impacto em usabilidade (histórico recente)

Regressões corrigidas que indicam áreas frágeis — vale monitorar em releases:

- **#626** — templates do plugin disparavam avisos de deprecação de header/footer com block themes
- **#625** — embeds de story map renderizavam em branco (assets frontend não enfileirados)
- **#624** — regressão em storymap single com intros
- **#628** — substituição do uso de Mapbox Static Tiles por estilos compostos por mapa

---

## 2. Issues fora do GitHub (encontradas no código)

### 2.1 TODOs de usabilidade pendentes no código

| Local | Problema |
|---|---|
| `src/js/src/map-blocks/layers-settings.js:635` | `// TODO: Remove deleted layers` — camadas deletadas podem continuar listadas nas configurações do bloco de mapa (estado obsoleto na UI). |
| `src/includes/layer-types/class-layer-types.php:265` | `// TODO: Load only when needed via a more specific condition.` — assets de tipos de camada carregados de forma ampla, pesando o editor desnecessariamente. |
| `src/includes/legend-types/class-legend-types.php:197` | `// TODO: Load only when needed.` — mesmo padrão para tipos de legenda (peso no editor/frontend). |

### 2.2 Decisões de UX pendentes (sem issue)

| Local | Problema |
|---|---|
| `src/templates/single-map.php:52` | A escolha de `screen-reader-text` no fix do #640 preempta a decisão visual que a issue delega ao tema (jeo-theme#462) — se mantida, documentar o racional e o comportamento esperado por tema. |
| `src/js/src/discovery/blocks/stories.js:1400` | Classe genérica `card` propensa a colisão com temas (cleanup opcional já sugerido na própria #612: `jeo-discovery-story-card`). |

### 2.3 Higiene do repositório (risco)

| Arquivo (não rastreado) | Risco |
|---|---|
| **`MapboxKey.txt`** | **Alto — provável segredo (token Mapbox) em texto plano na raiz do repo.** Nunca commitar; mover para fora do repositório e rotacionar o token se tiver sido exposto. Considerar adição ao `.gitignore` após remoção. |
| `src/jeowp-old-rc.zip` | Artefato de build antigo dentro de `src/` — risco de incluir em release ZIP (o plugin é deployado a partir de `src/`). Remover. |
| `email.txt`, `sessions.txt`, `todo.txt`, `jsconfig.json`, `melhoria-2a-revisao.md` | Arquivos pessoais/soltos na raiz — mover para fora do repo ou gitignorar. |

---

## 3. Recomendações priorizadas

1. **#640 (high):** concluir o fix — classe neutra `jeo-map-title` visível por padrão, hooks, override via `locate_template`, teste full-page vs `?embed`. Está a um diff pequeno do fechamento.
2. **#612 (quick win):** 1 linha de CSS (`box-sizing: border-box` em `.stories .card`) + screenshot de validação em tema sem reset.
3. **#647 (quick win):** reescrever títulos/descrições dos dois blocos storymap (`map-blocks/index.js:275-276`, `:346-347`) — mudança de copy apenas.
4. **Segurança:** tratar `MapboxKey.txt` imediatamente (remover + rotacionar token).
5. **Dívida técnica UX:** abrir issues no GitHub para os 3 TODOs da seção 2.1 (hoje invisíveis para quem prioriza via board).
6. **Verificar** as issues da seção 1.4 — candidatas a triagem rápida (muitas podem já estar obsoletas, como #613/#537 estavam).
