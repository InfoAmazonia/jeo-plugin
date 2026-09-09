# Plano de Testes Manuais — JEO 3.6.5

## 1. Escopo

Este documento descreve os cenários de teste manual que o QA deve executar para validar as mudanças implementadas na versão 3.6.5 do plugin JEO.

As áreas cobertas são:

1. **Mini-Mapas (AI Minimap)** — metadados amigáveis de camadas, controle de opacidade por camada e disambiguação na busca manual.
2. **Histórias Perto de Mim (`jeo/stories-near-you`)** — ordenação padrão `recent`, limite de idade de 365 dias e cleanup/SQL parametrizado.
3. **Contexto Adicional por IA (Context Assistant)** — validação pós-geração de links e prompt mais restritivo contra alucinação.

## 2. Ambiente de teste

| Item | Requisito |
|------|-----------|
| WordPress | 6.6+ (preferencialmente 7.0) |
| PHP | 8.2+ |
| Navegador | Chrome/Firefox/Safari em versões estáveis |
| Dados | Site com posts geocodificados, camadas `map-layer` publicadas e conhecimento indexado para o Context Assistant |
| Plugins | JEO ativado; Newspack opcional (para testar renderização alternativa do SNU) |

### Build

Antes de iniciar, certifique-se de que os assets foram buildados:

```bash
npm run build:assets
```

## 3. Mini-Mapas (`jeo/ai-minimap`)

### 3.1 Metadados amigáveis no painel de camadas

**Objetivo:** garantir que o editor consiga entender por que cada camada foi selecionada.

#### Cenário 3.1.1 — Exibir descrição no painel lateral

| Campo | Valor |
|-------|-------|
| Pré-condição | Ter um post com bloco `jeo/ai-minimap` gerado e pelo menos uma camada selecionada |
| Dados | Camada `map-layer` com `excerpt` preenchido e outra com apenas `post_content` |

**Passos:**

1. Edite um `map-layer` e preencha o campo **Resumo (excerpt)**.
2. No post com o Mini-Mapa, gere ou recarregue o mapa para que a camada apareça em **Map layers** (painel lateral).
3. Verifique se abaixo do título da camada aparece a descrição/resumo.
4. Teste com uma camada que não tenha excerpt, mas tenha conteúdo no editor. A descrição deve vir do `post_content`.

**Resultado esperado:**

- [ ] Título e tipo da camada são exibidos.
- [ ] Descrição/excepto é exibido abaixo do título.
- [ ] Tags HTML da descrição são removidas (texto plano).

#### Cenário 3.1.2 — Exibir metadados na busca manual

**Passos:**

1. No Mini-Mapa, clique em **Edit layers settings**.
2. Na busca, digite uma palavra-chave que retorne várias camadas (ex: "rio", "floresta").
3. Observe os cards de resultado.

**Resultado esperado:**

- [ ] Cada card mostra: título + tipo.
- [ ] Descrição/excepto é exibido quando disponível.
- [ ] Fonte/atribuição (`Source:`) é exibida quando a meta `attribution` está preenchida.
- [ ] Temas (`Themes:`) são exibidos quando a camada tem termos na taxonomia `layer-theme`.

---

### 3.2 Controles de opacidade por camada

**Objetivo:** garantir que o editor consiga ajustar a opacidade de cada camada e que ela se aplique no preview e no frontend.

#### Cenário 3.2.1 — Slider de opacidade no editor

**Passos:**

1. No Mini-Mapa, clique em **Edit layers settings**.
2. Na lista **Selected layers**, verifique se há um slider ou campo **Opacity** para cada camada.
3. Altere a opacidade de uma camada para `0.5`.
4. Clique em **Done**.
5. Observe o preview do mapa no editor.

**Resultado esperado:**

- [ ] Slider de opacidade está visível para cada camada selecionada.
- [ ] Valor default é `1.0` (opaco).
- [ ] Ao reduzir a opacidade, a camada fica translúcida no preview.
- [ ] A configuração persiste ao salvar o post e recarregar o editor.

#### Cenário 3.2.2 — Opacidade em camadas raster

**Passos:**

1. Adicione uma camada do tipo `mapbox`, `mapbox-tileset-raster` ou `tilelayer`.
2. Ajuste a opacidade para `0.3`.
3. Verifique o preview e o frontend publicado.

**Resultado esperado:**

- [ ] A camada raster é renderizada com transparência no preview.
- [ ] A mesma transparência aparece no frontend publicado.

#### Cenário 3.2.3 — Opacidade em camadas vetoriais

**Passos:**

1. Adicione uma camada do tipo `mvt` ou `mapbox-tileset-vector` com um estilo que tenha `fill-opacity`, `line-opacity` ou `circle-opacity`.
2. Ajuste a opacidade para `0.5`.
3. Verifique o preview e o frontend publicado.

**Resultado esperado:**

- [ ] A opacidade existente no paint é multiplicada pelo valor global (ex: `fill-opacity: 0.8` * `0.5` = `0.4`).
- [ ] Sem estilo definido, a opacidade não quebra a renderização (fallback paint continua visível).

#### Cenário 3.2.4 — Persistência e defaults

**Passos:**

1. Crie um novo Mini-Mapa e adicione uma camada.
2. Salve o post.
3. Inspecione o código do bloco (ou revise o atributo `layers` no banco/REST).

**Resultado esperado:**

- [ ] Cada item de `layers` contém `opacity` como número.
- [ ] Valor default é `1` quando não alterado.
- [ ] Mapas antigos sem `opacity` continuam funcionando normalmente.

---

### 3.3 Disambiguação na busca manual

**Objetivo:** garantir que o editor consiga escolher a camada correta entre várias com nomes parecidos.

#### Cenário 3.3.1 — Várias camadas com nomes parecidos

**Passos:**

1. Crie 2–3 camadas `map-layer` com nomes similares (ex: "Rios da Amazônia", "Rios do Brasil", "Principais Rios").
2. Preencha atribuição e temas diferentes em cada uma.
3. No Mini-Mapa, abra **Edit layers settings** e busque por "rios".

**Resultado esperado:**

- [ ] Cada card mostra informações suficientes para diferenciar as camadas.
- [ ] Source e themes ajudam a identificar a camada correta.
- [ ] É possível adicionar a camada desejada sem erro.

---

### 3.4 Geração de limite administrativo (não automático)

**Objetivo:** garantir que o agente não gere camadas administrativas sem confirmação.

#### Cenário 3.4.1 — Solicitar confirmação antes de gerar

**Passos:**

1. No chat do Mini-Mapa, peça: "Mostre o limite municipal de Altamira".
2. Observe a resposta do agente.

**Resultado esperado:**

- [ ] O agente NÃO gera a camada automaticamente.
- [ ] O agente pede confirmação explicando que vai gerar uma camada.
- [ ] Somente após confirmação explícita (ex: "sim, pode gerar") a camada é criada.

---

## 4. Histórias Perto de Mim (`jeo/stories-near-you`)

### 4.1 Ordenação padrão `recent`

**Objetivo:** garantir que novos blocos ordenem por data decrescente por padrão.

#### Cenário 4.1.1 — Novo bloco default

**Passos:**

1. Crie um novo post e adicione o bloco **Stories Near You**.
2. No painel **Query Settings**, verifique o campo **Order by**.
3. Publique e visualize o frontend.

**Resultado esperado:**

- [ ] O campo **Order by** está preenchido com `Most recent nearby`.
- [ ] Os posts no frontend aparecem do mais novo para o mais antigo.

#### Cenário 4.1.2 — Bloco antigo preserva ordenação

**Passos:**

1. Abra um post que já tinha o bloco configurado com `orderBy: 'relevance'`.
2. Verifique se a ordenação anterior foi preservada.

**Resultado esperado:**

- [ ] Blocos existentes mantêm seu valor anterior (`relevance` ou `nearest`).
- [ ] Apenas novos blocos usam `recent` como default.

---

### 4.2 Limite de idade padrão 365 dias

**Objetivo:** garantir que posts muito antigos não apareçam por padrão.

#### Cenário 4.2.1 — Novo bloco exclui posts antigos

**Passos:**

1. Crie um novo bloco Stories Near You.
2. No painel **Query Settings**, verifique **Max age (days)**.
3. Tenha posts geocodificados próximos com datas: um de ontem, um de 6 meses atrás e um de 2 anos atrás.
4. Publique e visualize.

**Resultado esperado:**

- [ ] **Max age (days)** default é `365`.
- [ ] Posts com mais de 365 dias não aparecem no frontend.
- [ ] Posts recentes (até 365 dias) aparecem normalmente.

#### Cenário 4.2.2 — Permitir desativar limite

**Passos:**

1. No bloco, altere **Max age (days)** para `0`.
2. Atualize e visualize.

**Resultado esperado:**

- [ ] O label indica "0 = no limit".
- [ ] Posts antigos passam a aparecer.

---

### 4.3 Cleanup e estabilidade do frontend

**Objetivo:** garantir que o frontend continue funcionando após a remoção de código morto.

#### Cenário 4.3.1 — Requisição REST correta

**Passos:**

1. Abra a página com o bloco no frontend.
2. Abra o DevTools → Network.
3. Limpe o cache e recarregue.
4. Clique em **Use my location** (ou **Skip**) e observe a requisição para `/wp-json/jeo/v1/stories-near-you`.

**Resultado esperado:**

- [ ] A URL contém `radius`, `orderBy`, `maxAgeDays`, `distanceWeight`, `dateWeight`.
- [ ] Não há parâmetro `radiusKm` na requisição.
- [ ] Não há parâmetros duplicados.
- [ ] A resposta retorna HTML renderizado corretamente.

#### Cenário 4.3.2 — Múltiplos blocos na mesma página

**Passos:**

1. Crie uma página com dois blocos Stories Near You.
2. No frontend, clique em **Use my location** em um deles.

**Resultado esperado:**

- [ ] Ambos os blocos carregam sem erro.
- [ ] Posts não se repetem entre os blocos.

---

## 5. Contexto Adicional por IA (`jeo-context-sidebar`)

### 5.1 Validação pós-geração de links

**Objetivo:** garantir que links cujo texto âncora não existe na referência sejam removidos.

#### Cenário 5.1.1 — Link com âncora suportada

**Passos:**

1. Crie/abra um post com conteúdo suficiente (> 100 caracteres).
2. Abra o painel **AI Context** e clique em **Generate Suggestions**.
3. Quando o agente retornar parágrafos, procure por links `<a>`.

**Resultado esperado:**

- [ ] Links cujo texto aparece no título/excerpt/conteúdo da referência são mantidos.
- [ ] O parágrafo pode ser inserido no editor sem erro.

#### Cenário 5.1.2 — Link com âncora não suportada

**Passos:**

1. Em um ambiente de teste, force uma resposta do agente com um link cuja âncora não existe na referência (pode ser feito via mock ou prompt específico).
2. Observe a resposta no painel.

**Resultado esperado:**

- [ ] O link é removido; o texto permanece como texto plano.
- [ ] Uma nota de verificação aparece no final da mensagem do assistente.
- [ ] O parágrafo inserido não contém link inválido.

#### Cenário 5.1.3 — Link para URL não listada em referências

**Passos:**

1. Force uma resposta com um `<a href="URL">` cuja URL não está no array `references`.
2. Observe a resposta.

**Resultado esperado:**

- [ ] O link é removido e o texto permanece plano.
- [ ] Nota de verificação informa que o link foi removido por não estar nas referências.

---

### 5.2 Prompt mais restritivo

**Objetivo:** garantir que o agente não combine referências nem insista em termos corrigidos.

#### Cenário 5.2.1 — Não combinar fatos de referências diferentes

**Passos:**

1. Peça ao agente para sugerir um parágrafo sobre um tema que apareça em múltiplas referências.
2. Verifique se cada fato está atribuído à sua fonte.

**Resultado esperado:**

- [ ] Cada fato é atribuído explicitamente (ex: "Segundo a reportagem X...", "De acordo com dados de Y...").
- [ ] Não há frases que misturem informações de duas referências sem citar ambas.

#### Cenário 5.2.2 — Retração de termo corrigido

**Passos:**

1. Gere sugestões.
2. No chat, diga: "O termo 'Nome Inventado' não existe na fonte. Remova."
3. Envie e observe a nova resposta.

**Resultado esperado:**

- [ ] O agente pede desculpas e remove o termo.
- [ ] Em mensagens seguintes, o agente NÃO reutiliza o termo corrigido.
- [ ] Se o usuário não reintroduzir o termo, ele continua ausente.

---

## 6. Regressão geral

### 6.1 Editor Gutenberg

**Passos:**

1. Crie um post com todos os blocos JEO: `jeo/map`, `jeo/onetime-map`, `jeo/ai-minimap`, `jeo/stories-near-you`, `jeo/layer-editor`, `jeo/map-editor`.
2. Salve e recarregue.

**Resultado esperado:**

- [ ] Todos os blocos carregam sem erro fatal no console.
- [ ] Nenhum aviso de bloco inválido ou deprecado.
- [ ] Atributos dos blocos são preservados.

### 6.2 Frontend publicado

**Passos:**

1. Publique a página do cenário 6.1.
2. Visualize no frontend.

**Resultado esperado:**

- [ ] Mapas e blocos renderizam corretamente.
- [ ] Nenhum erro de JavaScript que impeça a interação.
- [ ] Camadas com opacidade aparecem translúcidas.

### 6.3 Responsividade

**Passos:**

1. Visualize o frontend em desktop, tablet e mobile.

**Resultado esperado:**

- [ ] Layout do Stories Near You adapta-se (grid/list).
- [ ] Painel do Context Assistant é utilizável em telas menores.

---

## 7. Checklist final de aprovação

| # | Item | Aprovado |
|---|------|----------|
| 1 | Mini-Mapa exibe descrição e metadados das camadas | ☐ |
| 2 | Slider de opacidade funciona no editor e no frontend | ☐ |
| 3 | Busca manual de camadas mostra informações de disambiguação | ☐ |
| 4 | Agente do Mini-Mapa não gera camadas sem confirmação | ☐ |
| 5 | Stories Near You default ordena por `recent` | ☐ |
| 6 | Stories Near You default limita a 365 dias | ☐ |
| 7 | Frontend SNU não envia `radiusKm` e não duplica parâmetros | ☐ |
| 8 | Múltiplos blocos SNU na mesma página funcionam | ☐ |
| 9 | Context Assistant valida links pós-geração | ☐ |
| 10 | Context Assistant não combina referências nem reutiliza termos corrigidos | ☐ |
| 11 | Build e testes unitários passam | ☐ |
| 12 | Nenhum erro de PHPCS nos arquivos alterados | ☐ |

---

## 8. Anexos

### 8.1 Comandos úteis para o QA

```bash
# Build de assets
npm run build:assets

# Testes unitários
npm run test:unit

# PHPCS
vendor/bin/phpcs --standard=phpcs.xml.dist src/

# Smoke test (requer Docker/MariaDB)
bash scripts/wordpress-smoke.sh
```

### 8.2 Arquivos alterados nesta versão

- `src/includes/layers/class-layers.php`
- `src/js/src/map-blocks/layers-panel.js`
- `src/js/src/map-blocks/layers-settings.js`
- `src/js/src/map-blocks/layer-settings.js`
- `src/js/src/map-blocks/minimap-config.js`
- `src/js/src/map-blocks/index.js`
- `src/js/src/map-blocks/map-preview-layer.js`
- `src/includes/layer-types/mvt.js`
- `src/includes/layer-types/mapbox-tileset-vector.js`
- `src/includes/layer-types/mapbox-tileset-raster.js`
- `src/includes/layer-types/mapbox.js`
- `src/includes/layer-types/tilelayer.js`
- `src/js/src/jeo-map/class-jeo-map.js`
- `src/includes/stories-near-you/class-stories-near-you.php`
- `src/js/src/map-blocks/stories-near-you-editor.js`
- `src/js/src/stories-near-you/stories-near-you-frontend.js`
- `src/includes/ai/class-context-agent.php`
- `src/includes/ai/class-context-handler.php`
- `src/includes/ai/class-context-generation-output.php`
- `.architecture/minimap/README.md`
- `.architecture/layers/README.md`
- `.architecture/stories-near-you/README.md`
- `.architecture/context/README.md`
- `AGENTS.md`
