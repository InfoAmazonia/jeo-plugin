# Guia de Apresentação — Correções v3.6.5

**Projeto:** JEO Plugin  
**Versão:** 3.6.5  
**Data:** 25 de junho de 2026  
**Elaborado por:** Hacklab/

---

## 1. Resumo executivo

Neste ciclo foram atuadas as três frentes levantadas no feedback do cliente:

1. **Mini-Mapas** — metadados amigáveis, controle de opacidade, disambiguação de busca e correção da regressão de loop infinito.
2. **Histórias Perto de Mim** — ordenação padrão ajustada, janela temporal de 365 dias e SQL revisado.
3. **Contexto Adicional por IA** — validação de links gerados e regras mais restritivas no prompt.

Todas as alterações passaram pelos quality gates do projeto (PHPCS, Jest, build report) e foram validadas no ambiente Docker local.

---

## 2. Contexto do feedback

O cliente solicitou ajustes nas funcionalidades de IA do plugin, com ênfase em:

- Melhorar a usabilidade do painel de camadas do Mini-Mapa.
- Tornar a ordenação e o filtro temporal do *Stories Near You* mais previsíveis.
- Garantir que o conteúdo gerado pelo Context Assistant seja factual e bem referenciado.
- Corrigir a regressão crítica: o bloco `jeo/ai-minimap` entrava em loop infinito ao gerar o mapa.

---

## 3. Correções por pilar

### 3.1 Mini-Mapas (`jeo/ai-minimap`)

#### O que mudou

| Item | Antes | Depois |
|------|-------|--------|
| Metadados de camadas | Apenas título e tipo eram exibidos | Exibem resumo, fonte/atribuição e temas |
| Opacidade | Não era possível ajustar | Slider de opacidade por camada (0–1) no editor e no preview |
| Busca manual | Resultados sem contexto | Cards de busca mostram resumo, tipo, fonte e temas |
| Disambiguação | Não havia tratamento | Evita adicionar a mesma camada duas vezes e permite remover da busca |
| Geração do mapa | Loop infinito / spinner eterno | Geração restaurada com tratamento de erros defensivo |

#### Destaque técnico

- A opacidade é armazenada por instância do mapa (`layers[i].opacity`), permitindo que a mesma camada tenha opacidades diferentes em mapas distintos.
- No preview do editor e no frontend, camadas do tipo raster usam `raster-opacity`; camadas vetoriais multiplicam as propriedades de opacidade existentes (`fill-opacity`, `line-opacity`, etc.).

#### Regressão crítica corrigida

**Sintoma:** ao inserir o bloco e clicar em "Gerar mapa", o spinner aparecia e nenhuma requisição AJAX era enviada.

**Causa raiz:** o arquivo `.docker/docker-compose.yml` montava o diretório `../vendor` (dev) sobre `src/vendor/` (produção), corrompendo o autoloader do Composer dentro do container. O endpoint `/jeo/v1/minimap/setup` retornava erro fatal 500:

```
Class "NeuronAI\RAG\RAG" not found
```

**Correção:**

1. Removida a montagem incorreta do `../vendor` no `docker-compose.yml`.
2. Adicionado fallback manual para geração de UUID em contextos não seguros.
3. Adicionado `try/catch` em todas as chamadas `apiFetch` do Mini-Mapa para capturar falhas síncronas e sair do estado de `loading`.
4. Verificação de `postId` antes de iniciar a geração, com mensagem amigável quando o post ainda não foi salvo.

**Validação:** endpoint testado no Docker e retornando `200` com camadas e base layer.

---

### 3.2 Histórias Perto de Mim (`jeo/stories-near-you`)

#### O que mudou

| Item | Antes | Depois |
|------|-------|--------|
| Ordenação padrão | `relevance` | `recent` (mais recentes primeiro) |
| Janela temporal | Ilimitada | Últimos 365 dias por padrão |
| Parâmetro `radiusKm` | Existente, mas não utilizado | Removido para evitar confusão |
| SQL | Concatenação direta de valores | Totalmente parametrizado com `$wpdb->prepare` |

#### Bug crítico adicional corrigido

Durante a investigação da regressão do Mini-Mapa, identificamos que a ordem dos parâmetros no `$wpdb->prepare()` de `get_nearby_posts()` estava incorreta. Isso deslocava `lat`, `lng`, `radius` e `post_type`, gerando SQL malformado:

```sql
AND p.post_type IN ('-9.04998517','post')
```

Em alguns cenários isso causava `Allowed memory size exhausted`. A ordem dos parâmetros foi corrigida e o SQL agora é executado corretamente.

---

### 3.3 Contexto Adicional por IA (`jeo-context-sidebar`)

#### O que mudou

| Item | Antes | Depois |
|------|-------|--------|
| Validação de links | Nenhuma | Links gerados são validados contra as referências e o conteúdo do post |
| Regras do prompt | Genéricas | Regras restritivas: não misturar referências, não reutilizar termos corrigidos pelo usuário |
| Factualidade | Dependia apenas do prompt | Garantia explícita de que fatos devem vir de `get_post_content` ou `retrieve_knowledge` |

#### Destaque técnico

A validação de links é feita no servidor após a geração, sem quebrar o fluxo de *structured output*. Links inválidos são convertidos em texto plano e um aviso é anexado à mensagem do assistente.

---

## 4. Quality gates executados

Todos os gates passaram após as correções:

| Gate | Resultado |
|------|-----------|
| `vendor/bin/phpcs src/` | ✅ Aprovado |
| `npm run test:unit` | ✅ 72/72 testes |
| `npm run build:assets` | ✅ Compilado |
| `npm run build:report` | ✅ Dentro dos limites de tamanho |
| Endpoint `/jeo/v1/minimap/setup` no Docker | ✅ HTTP 200 |
| Endpoint `/jeo/v1/stories-near-you` no Docker | ✅ HTTP 200 |

---

## 5. Como aplicar no ambiente do cliente

### 5.1 Atualização do plugin

1. Realizar o deploy da branch `feature/experimental` (ou da release v3.6.5).
2. Garantir que `src/vendor/` contenha as dependências de produção (`composer install --no-dev --optimize-autoloader` dentro de `src/`).
3. Limpar cache de objetos e de página, se houver.

### 5.2 Ambiente Docker local

Se o cliente usa o Docker do projeto, recriar os containers para que a correção de volume entre em vigor:

```bash
docker compose -f .docker/docker-compose.yml down
docker compose -f .docker/docker-compose.yml up -d
```

### 5.3 Testes sugeridos ao cliente

1. Inserir um bloco `jeo/ai-minimap` em um post salvo e clicar em "Gerar mapa".
2. Verificar que camadas sugeridas aparecem e que o slider de opacidade funciona.
3. Inserir um bloco `jeo/stories-near-you` e confirmar que a lista respeita a ordenação "recente" e o filtro de 365 dias.
4. Usar o Context Assistant e verificar que links inseridos apontam para referências reais.

---

## 6. Próximos passos recomendados

- Acompanhar métricas de uso das três funcionalidades nos primeiros 7 dias após o deploy.
- Coletar feedback específico sobre a disambiguação de camadas no Mini-Mapa.
- Avaliar se a janela de 365 dias do *Stories Near You* atende todos os casos de uso editoriais.

---

**Documento confidencial — Hacklab/**  
*As informações contidas neste documento são estritamente internas e não devem ser compartilhadas fora da equipe autorizada.*
