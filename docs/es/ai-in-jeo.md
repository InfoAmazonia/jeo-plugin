# IA en JEO

JEO incluye funcionalidades de IA integradas para georreferenciar entradas, generar mapas y sugerir contenido editorial. Esta página explica los conceptos subyacentes para que entiendas qué ocurre detrás de escena y cómo obtener los mejores resultados.

## Descripción general

Las funcionalidades de IA de JEO funcionan con un proveedor de IA externo configurable. El plugin nunca ejecuta su propio modelo de IA; en su lugar, envía solicitudes al proveedor que elijas (como OpenAI, Google Gemini o una instancia local de Ollama) y procesa los resultados.

Todas las funcionalidades de IA son **opcionales**. Solo se activan después de que configures un proveedor en **Jeo → IA** (consulta [Configuraciones de IA](ai-settings.md)).

La idea clave es que cada funcionalidad de IA es un **agente** especializado: un asistente de IA con un rol específico, un conjunto de **herramientas** que puede usar y acceso al contenido de tu sitio a través de una **Base de conocimiento**.

## Proveedores de IA

JEO es compatible con múltiples proveedores de IA a través de [NeuronAI](https://docs.neuron-ai.dev/providers/ai-provider). La mayoría de los proveedores se ejecutan en la nube y requieren una clave de API, mientras que otros (como Ollama) se ejecutan localmente en tu propio servidor, lo que significa que ningún dato sale jamás de tu servidor.

Seleccionas un proveedor y un modelo en **Jeo → IA → Proveedor**. El mismo proveedor se usa en todas las funcionalidades de IA. La lista de proveedores disponibles se muestra en la página de configuración y puede crecer con el tiempo a medida que NeuronAI añada nuevas integraciones.

## Base de conocimiento (RAG)

**RAG** corresponde a *Retrieval-Augmented Generation* (generación aumentada por recuperación). Es una técnica que permite a la IA buscar en tu propio contenido antes de responder, de modo que sus respuestas se basen en los datos de tu sitio y no en conocimiento genérico.

### Cómo funciona

JEO mantiene **dos bases de conocimiento separadas** (llamadas *Almacenes de Vectores*):

| Base de conocimiento | Contenido | Usada por |
|----------------|---------|---------|
| **Entradas** (`jeo_knowledge`) | Tus entradas publicadas — títulos y cuerpo del texto | [Asistente de contexto](ai-context-assistant.md) |
| **Capas** (`jeo_layers_knowledge`) | Tus capas de mapa — títulos, tipos, leyendas y descripciones | [Minimapa](minimap.md) |

Cada elemento se convierte en una representación numérica (un *embedding*) y se almacena en un índice local basado en archivos. Cuando una funcionalidad de IA necesita contexto:

1. Convierte la consulta en un embedding usando el mismo modelo.
2. Busca en el índice los elementos más similares.
3. Pasa el contenido coincidente a la IA junto con la solicitud original.

Esto significa que la IA puede hacer referencia a tus artículos y capas reales al generar resultados.

### Indexación

El contenido se añade a la Base de conocimiento mediante la *indexación*. Lo controlas en **Jeo → IA → Base de conocimiento**:

- La **indexación automática** se ejecuta en segundo plano mediante el cron de WordPress y detecta entradas y capas nuevas o actualizadas.
- La **indexación manual** te permite disparar una reindexación total o parcial desde la página de configuración.
- **WP-CLI** también está disponible para indexación a gran escala: `wp jeo ai vectorize --store=posts --batch_size=20`.

### Modelos de Embedding

Los embeddings los genera un modelo separado de tu proveedor de IA. Configuras el modelo de Embedding en la pestaña Base de conocimiento. Algunas opciones comunes son `text-embedding-3-small` (OpenAI), `text-embedding-004` (Gemini) o `nomic-embed-text` (Ollama).

Una vez creada una Base de conocimiento con un modelo de Embedding específico, ese modelo queda *bloqueado*: cambiarlo requiere limpiar y reconstruir el almacén, porque los embeddings de modelos diferentes no son comparables.

### Resultados de búsqueda (topK)

La configuración **topK** (en la pestaña Base de conocimiento, rango 1–50, valor predeterminado 10) controla cuántos documentos se devuelven por búsqueda. Valores más altos dan a la IA más contexto, pero aumentan el uso de tokens. Para la mayoría de los casos de uso, 10 es un buen valor predeterminado.

## Cómo usa RAG cada funcionalidad

| Funcionalidad | ¿Usa RAG? | Base de conocimiento | Finalidad |
|---------|-----------|----------------|---------|
| [Georreferenciación con IA](ai-georeferencing.md) | Opcional | — | Puede incluir contexto de taxonomías; no usa el Almacén de Vectores directamente |
| [Minimapa](minimap.md) | Sí | Capas (`jeo_layers_knowledge`) | Busca capas de mapa relevantes para incluirlas en el mapa generado |
| [Asistente de contexto](ai-context-assistant.md) | Sí | Entradas (`jeo_knowledge`) | Encuentra artículos relacionados para referenciarlos en las sugerencias |
| [Geolocalización masiva con IA](ai-bulk-geolocation.md) | No | — | Procesa las entradas individualmente, sin RAG |
| Minilayer | No | — | Usa MCP en su lugar (ver más abajo) |

## Salida estructurada

Cuando la IA devuelve datos —como puntos de geolocalización o configuraciones de mapa—, JEO necesita analizarlos de forma confiable. La **salida estructurada** es un mecanismo en el que el proveedor de IA impone un esquema JSON específico a nivel de API, garantizando que la respuesta coincida con el formato esperado.

Está activada de forma predeterminada y la usan:

- **Georreferenciación** — devuelve ubicaciones con nombre, coordenadas, puntuación de confianza y clasificación principal/secundaria.
- **Minimapa** — devuelve la configuración completa del mapa (capas, centro, zoom, pines).
- **Asistente de contexto** — devuelve párrafos y referencias.

Si tu proveedor no es compatible con la salida estructurada, o si falla por cualquier motivo, JEO hace un fallback automático a un modo de texto libre que extrae los datos mediante coincidencia de patrones. No necesitas configurar nada: el fallback es transparente.

## Agentes y herramientas

Cada funcionalidad de IA se construye en torno a un **agente**: un asistente de IA configurado para una tarea específica. Los agentes reciben un prompt del sistema (instrucciones), un conjunto de **herramientas** que pueden invocar y, opcionalmente, acceso a **subagentes** para el trabajo delegado.

### Las herramientas

| Herramienta | Qué hace | Usada por |
|------|-------------|---------|
| `search_layers` | Busca capas relevantes en la Base de conocimiento de capas | Minimapa |
| `geocode` | Convierte un nombre de ubicación en coordenadas de latitud/longitud | Minimapa |
| `retrieve_knowledge` | Busca artículos relacionados en la Base de conocimiento de entradas | Asistente de contexto |
| `get_post_content` | Recupera el título, el contenido, las categorías, las etiquetas y las geolocalizaciones de una entrada | Minimapa, Asistente de contexto |
| `generate_layer` | Crea un nuevo estilo de Mapbox y una entrada de capa a partir de una descripción | Minimapa (requiere clave de Mapbox) |

Cuando le pides al Minimapa que "muestre datos de deforestación en la Amazonía", el agente podría:

1. Usar `get_post_content` para entender el artículo actual.
2. Usar `search_layers` para encontrar capas sobre deforestación.
3. Usar `geocode` para ubicar la región amazónica.
4. Devolver una configuración completa del mapa.

### Subagentes

Algunos agentes delegan trabajo en subagentes especializados. Tanto el Minimapa como el Asistente de contexto usan un subagente **analizador de entradas** que lee el contenido de la entrada y extrae temas, ubicaciones, tono y consultas de búsqueda sugeridas. Este análisis guía las decisiones del agente principal.

## Memoria de conversación

Las funcionalidades de IA con chat (Minimapa, Asistente de contexto y Georreferenciación) mantienen un **historial de conversación** por entrada. Esto significa que:

- Puedes refinar los resultados mediante un chat de ida y vuelta sin repetir contexto.
- Las conversaciones persisten entre recargas de la página: si cierras el editor y vuelves más tarde, continúas donde lo dejaste.
- Cada entrada tiene su propia conversación independiente.

### Aprendizaje y memoria de usuario

Los agentes del Minimapa y del Asistente de contexto pueden **aprender** de las interacciones. Con el tiempo acumulan conocimiento sobre patrones y preferencias. También almacenan memoria por usuario (ej.: el estilo de escritura preferido), de modo que las sugerencias se personalizan más cuanto más las usas.

## MCP (Model Context Protocol)

**MCP** es un protocolo que conecta agentes de IA con servicios externos. En JEO lo usa exclusivamente la funcionalidad **Minilayer** para comunicarse con el Mapbox MCP DevKit, un servicio externo que genera estilos de mapas de Mapbox.

Cuando le pides a la IA que cree una capa personalizada (ej.: "genera un mapa de calor de deforestación para la Amazonía"), el agente Minilayer:

1. Se conecta al servidor MCP de Mapbox con tu clave de API de Mapbox.
2. Usa las herramientas de Mapbox para construir, validar y previsualizar el estilo.
3. Crea una nueva entrada de capa en WordPress con el estilo generado.

MCP requiere una clave de API de Mapbox configurada en **Jeo → Configuraciones**. Ninguna otra funcionalidad lo usa.

## Privacidad y datos

Entender qué datos se envían y a dónde:

| Dato | Enviado a | Almacenado |
|------------|---------|--------|
| Contenido de la entrada (para análisis) | Tu proveedor de IA configurado | No — se usa de forma transitoria |
| Consultas de geolocalización | Tu proveedor de IA configurado | No |
| Embeddings (Base de conocimiento) | Tu proveedor de IA configurado (durante la indexación) | Sí — almacenados localmente en `wp-content/uploads/jeo-ai-store/` |
| Historial de conversación | No se envía al proveedor de IA después de la llamada inicial | Sí — almacenado en los metadatos de la entrada de WordPress |
| Preferencias del usuario (memoria) | No se envían externamente | Sí — almacenadas en los metadatos de usuario de WordPress |
| Estilos de Mapbox (solo MCP) | Mapbox MCP DevKit | Sí — almacenados como entradas de capa en WordPress |

Si usas un **proveedor local** (Ollama), ningún dato sale de tu servidor.

### Uso de tokens

JEO registra el uso de tokens de IA en **Jeo → Registros de Debug de IA**. Cada registro guarda el proveedor, el modelo, los tokens de entrada y salida, y el prompt y la respuesta. Úsalo para monitorear costos y solucionar problemas con los resultados.

## Matriz funcionalidad — concepto

Una referencia rápida de qué conceptos aplican a cada funcionalidad:

| | Proveedor | RAG | Salida estructurada | Herramientas | Memoria de conversación | MCP |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| [Georreferenciación con IA](ai-georeferencing.md) | ✓ | — | ✓ | — | ✓ | — |
| [Geolocalización masiva con IA](ai-bulk-geolocation.md) | ✓ | — | ✓ | — | — | — |
| [Minimapa](minimap.md) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| [Asistente de contexto](ai-context-assistant.md) | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Minilayer | ✓ | — | — | — | — | ✓ |

## Próximos pasos

- **Configura un proveedor**: [Configuraciones de IA](ai-settings.md)
- **Indexa tu contenido**: pestaña Base de conocimiento en **Jeo → IA**
- **Empieza a usar las funcionalidades**:
  - [Georreferenciación con IA](ai-georeferencing.md) — etiqueta entradas automáticamente con ubicaciones
  - [Minimapa](minimap.md) — genera mapas a partir de texto o del contenido de una entrada
  - [Asistente de contexto](ai-context-assistant.md) — obtén sugerencias editoriales potenciadas por IA
  - [Geolocalización masiva con IA](ai-bulk-geolocation.md) — procesa muchas entradas a la vez
