# IA no JEO

O JEO inclui capacidades de IA integradas para georreferenciar posts, gerar mapas e sugerir conteúdo editorial. Esta página explica os conceitos por trás dessas funcionalidades para que você entenda o que acontece nos bastidores e como obter os melhores resultados.

## Visão geral

Os recursos de IA do JEO são alimentados por um provedor de IA externo configurável. O plugin nunca executa seu próprio modelo de IA — em vez disso, ele envia requisições para o provedor que você escolher (como OpenAI, Google Gemini ou uma instância local do Ollama) e processa os resultados.

Todos os recursos de IA são **opcionais**. Eles só são ativados depois que você configura um provedor em **Jeo → IA** (veja [Configurações de IA](ai-settings.md)).

A ideia central é que cada recurso de IA é um **agente** especializado — um assistente de IA com um papel específico, um conjunto de **ferramentas** que ele pode usar e acesso ao conteúdo do seu site por meio de uma **base de conhecimento**.

## Provedores de IA

O JEO oferece suporte a vários provedores de IA por meio do [NeuronAI](https://docs.neuron-ai.dev/providers/ai-provider). A maioria dos provedores roda na nuvem e requer uma chave de API, enquanto outros (como o Ollama) rodam localmente no seu próprio servidor — o que significa que nenhum dado sai do seu servidor.

Você seleciona um provedor e um modelo em **Jeo → IA → Provedor de IA**. O mesmo provedor é usado em todos os recursos de IA. A lista de provedores disponíveis é exibida na página de configurações e pode crescer com o tempo, conforme o NeuronAI adiciona novas integrações.

## Base de Conhecimento (RAG)

**RAG** significa *Retrieval-Augmented Generation* (Geração Aumentada por Recuperação). É uma técnica que permite à IA pesquisar no seu próprio conteúdo antes de responder, de modo que suas respostas sejam fundamentadas nos dados do seu site, e não em conhecimento genérico.

### Como funciona

O JEO mantém **duas bases de conhecimento separadas** (chamadas de *armazenamentos de vetores*):

| Base de conhecimento | Conteúdo | Usada por |
|----------------|---------|---------|
| **Posts** (`jeo_knowledge`) | Seus posts publicados — títulos e corpo do texto | [Assistente de Contexto](ai-context-assistant.md) |
| **Camadas** (`jeo_layers_knowledge`) | Suas camadas de mapa — títulos, tipos, legendas e descrições | [Minimapa](minimap.md) |

Cada item é convertido em uma representação numérica (um *embedding*) e armazenado em um índice local baseado em arquivos. Quando um recurso de IA precisa de contexto, ele:

1. Converte a consulta em um embedding usando o mesmo modelo.
2. Pesquisa no índice as entradas mais semelhantes.
3. Passa o conteúdo correspondente para a IA junto com a requisição original.

Isso significa que a IA pode referenciar seus artigos e camadas reais ao gerar resultados.

### Indexação

O conteúdo é adicionado à base de conhecimento por meio da *indexação*. Você controla isso em **Jeo → IA → Base de Conhecimento**:

- A **indexação automática** roda em segundo plano via cron do WordPress e captura posts e camadas novos ou atualizados.
- A **indexação manual** permite disparar uma reindexação completa ou parcial a partir da página de configurações.
- O **WP-CLI** também está disponível para indexação em larga escala: `wp jeo ai vectorize --store=posts --batch_size=20`.

### Modelos de embedding

Os embeddings são gerados por um modelo separado do seu provedor de IA. Você configura o modelo de embedding na aba Base de Conhecimento. Escolhas comuns incluem `text-embedding-3-small` (OpenAI), `text-embedding-004` (Gemini) ou `nomic-embed-text` (Ollama).

Depois que uma base de conhecimento é criada com um modelo de embedding específico, esse modelo fica *bloqueado* — alterá-lo exige limpar e reconstruir o armazenamento, porque embeddings de modelos diferentes não são comparáveis.

### Resultados da busca (topK)

A configuração **topK** (na aba Base de Conhecimento, intervalo de 1–50, padrão 10) controla quantos documentos são retornados por busca. Valores mais altos dão mais contexto à IA, mas aumentam o uso de tokens. Para a maioria dos casos de uso, 10 é um bom padrão.

## Como cada funcionalidade usa o RAG

| Funcionalidade | Usa RAG? | Base de conhecimento | Finalidade |
|---------|-----------|----------------|---------|
| [Georreferenciamento com IA](ai-georeferencing.md) | Opcional | — | Pode incluir contexto de taxonomia; não usa o armazenamento de vetores diretamente |
| [Minimapa](minimap.md) | Sim | Camadas (`jeo_layers_knowledge`) | Pesquisa camadas de mapa relevantes para incluir no mapa gerado |
| [Assistente de Contexto](ai-context-assistant.md) | Sim | Posts (`jeo_knowledge`) | Encontra artigos relacionados para referenciar nas sugestões |
| [Geolocalização em lote com IA](ai-bulk-geolocation.md) | Não | — | Processa posts individualmente, sem RAG |
| Minilayer | Não | — | Usa MCP em vez disso (veja abaixo) |

## Saída estruturada

Quando a IA retorna dados — como pontos de geolocalização ou configurações de mapa — o JEO precisa analisá-los de forma confiável. A **saída estruturada** é um mecanismo em que o provedor de IA impõe um esquema JSON específico no nível da API, garantindo que a resposta corresponda ao formato esperado.

Ela é ativada por padrão e usada por:

- **Georreferenciamento** — retorna localizações com nome, coordenadas, pontuação de confiança e classificação principal/secundária.
- **Minimapa** — retorna a configuração completa do mapa (camadas, centro, zoom, pins).
- **Assistente de Contexto** — retorna parágrafos e referências.

Se o seu provedor não oferecer suporte à saída estruturada, ou se ela falhar por qualquer motivo, o JEO recorre automaticamente a um modo de texto livre que extrai os dados usando correspondência de padrões. Você não precisa configurar nada — o fallback é transparente.

## Agentes e ferramentas

Cada recurso de IA é construído em torno de um **agente** — um assistente de IA configurado para uma tarefa específica. Os agentes recebem um prompt do sistema (instruções), um conjunto de **ferramentas** que podem chamar e, opcionalmente, acesso a **subagentes** para trabalhos delegados.

### As ferramentas

| Ferramenta | O que faz | Usada por |
|------|-------------|---------|
| `search_layers` | Pesquisa na base de conhecimento de camadas por camadas relevantes | Minimapa |
| `geocode` | Converte um nome de local em coordenadas de latitude/longitude | Minimapa |
| `retrieve_knowledge` | Pesquisa na base de conhecimento de posts por artigos relacionados | Assistente de Contexto |
| `get_post_content` | Recupera título, conteúdo, categorias, tags e geolocalizações de um post | Minimapa, Assistente de Contexto |
| `generate_layer` | Cria um novo estilo Mapbox e um CPT de camada a partir de uma descrição | Minimapa (requer chave do Mapbox) |

Quando você pede ao Minimapa para "mostrar dados de desmatamento na Amazônia", o agente pode:

1. Usar `get_post_content` para entender o artigo atual.
2. Usar `search_layers` para encontrar camadas sobre desmatamento.
3. Usar `geocode` para localizar a região amazônica.
4. Retornar uma configuração completa de mapa.

### Subagentes

Alguns agentes delegam trabalho a subagentes especializados. Tanto o Minimapa quanto o Assistente de Contexto usam um subagente **analisador de posts** que lê o conteúdo do post e extrai temas, localizações, tom e consultas de busca sugeridas. Essa análise orienta as decisões do agente principal.

## Memória de conversa

Os recursos de IA com suporte a chat (Minimapa, Assistente de Contexto e Georreferenciamento) mantêm um **histórico de conversa** por post. Isso significa que:

- Você pode refinar os resultados por meio de uma conversa vai e volta, sem repetir contexto.
- As conversas persistem entre recarregamentos de página — fechar o editor e voltar mais tarde retoma de onde você parou.
- Cada post tem sua própria conversa independente.

### Aprendizado e memória do usuário

Os agentes do Minimapa e do Assistente de Contexto podem **aprender** com as interações. Com o tempo, eles acumulam conhecimento sobre padrões e preferências. Eles também armazenam memória por usuário (por exemplo, estilo de escrita preferido), de modo que as sugestões ficam mais personalizadas quanto mais você as usa.

## MCP (Model Context Protocol)

O **MCP** é um protocolo que conecta agentes de IA a serviços externos. No JEO, ele é usado exclusivamente pelo recurso **Minilayer** para se comunicar com o Mapbox MCP DevKit — um serviço externo que gera estilos de mapa do Mapbox.

Quando você pede à IA para criar uma camada personalizada (por exemplo, "gere um mapa de calor de desmatamento para a Amazônia"), o agente do Minilayer:

1. Conecta-se ao servidor MCP do Mapbox usando sua chave de API do Mapbox.
2. Usa as ferramentas do Mapbox para construir, validar e pré-visualizar o estilo.
3. Cria um novo post de camada no WordPress com o estilo gerado.

O MCP requer uma chave de API do Mapbox configurada em **Jeo → Configurações**. Ele não é usado por nenhum outro recurso.

## Privacidade e dados

Entenda quais dados são enviados e para onde:

| Dado | Enviado para | Armazenado |
|------------|---------|--------|
| Conteúdo do post (para análise) | Seu provedor de IA configurado | Não — usado de forma transitória |
| Consultas de geolocalização | Seu provedor de IA configurado | Não |
| Embeddings (base de conhecimento) | Seu provedor de IA configurado (durante a indexação) | Sim — armazenados localmente em `wp-content/uploads/jeo-ai-store/` |
| Histórico de conversa | Não é enviado ao provedor de IA após a chamada inicial | Sim — armazenado nos metadados de post do WordPress |
| Preferências do usuário (memória) | Não é enviado externamente | Sim — armazenado nos metadados de usuário do WordPress |
| Estilos do Mapbox (somente MCP) | Mapbox MCP DevKit | Sim — armazenados como posts de camada no WordPress |

Se você usar um **provedor local** (Ollama), nenhum dado sai do seu servidor.

### Uso de tokens

O JEO rastreia o uso de tokens de IA em **Jeo → Logs de Debug da IA**. Cada entrada de log registra o provedor, o modelo, os tokens de entrada e saída, além do prompt e da resposta. Use isso para monitorar custos e solucionar problemas nos resultados.

## Matriz de funcionalidades e conceitos

Uma referência rápida de quais conceitos se aplicam a cada funcionalidade:

| | Provedor | RAG | Saída estruturada | Ferramentas | Memória de conversa | MCP |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| [Georreferenciamento com IA](ai-georeferencing.md) | ✓ | — | ✓ | — | ✓ | — |
| [Geolocalização em lote com IA](ai-bulk-geolocation.md) | ✓ | — | ✓ | — | — | — |
| [Minimapa](minimap.md) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| [Assistente de Contexto](ai-context-assistant.md) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Minilayer | ✓ | — | — | — | — | ✓ |

## Próximos passos

- **Configure um provedor**: [Configurações de IA](ai-settings.md)
- **Indexe seu conteúdo**: aba Base de Conhecimento em **Jeo → IA**
- **Comece a usar as funcionalidades**:
  - [Georreferenciamento com IA](ai-georeferencing.md) — marque posts com localizações automaticamente
  - [Minimapa](minimap.md) — gere mapas a partir de texto ou do conteúdo do post
  - [Assistente de Contexto](ai-context-assistant.md) — receba sugestões editoriais com IA
  - [Geolocalização em lote com IA](ai-bulk-geolocation.md) — processe muitos posts de uma só vez
