# Conceptos

## Capa

Una capa es el bloque básico de construcción de las interacciones de mapa. Cada capa puede tener sus propias leyendas, atribuciones, etc.

JEO admite cuatro tipos de capa listos para usar:

- [Estilos de Mapbox](https://docs.mapbox.com/studio-manual/overview/map-styling/)
- [Tilesets de Mapbox](https://docs.mapbox.com/help/glossary/tileset/)
- [Teselas vectoriales de Mapbox](https://docs.mapbox.com/vector-tiles/reference/) (MVTs)
- [TileLayers](https://en.wikipedia.org/wiki/Tiled_web_map)

Además, JEO puede generar capas personalizadas con IA (consulta [Mapa generado por IA](#mapa-generado-por-ia)).

## Mapa

Un mapa se compone de una o más capas y puede asociarse a entradas geolocalizadas relacionadas, que se mostrarán como marcadores en el mapa.

Una entrada de tipo mapa se usa para interacciones de mapa reutilizables, que se pueden incrustar en cualquier entrada como [shortcode](map-shortcode.md) o [bloque de Gutenberg](map-block.md).

## Mapa de un solo uso

En lugar de crear un mapa reutilizable cada vez que quieras añadir una interacción de mapa, puedes crear y configurar un mapa de un solo uso integrado en el contenido mediante el [bloque de mapa de un solo uso](one-time-map-block.md) para Gutenberg.

## Geolocalización de entradas

Las entradas se pueden geolocalizar manualmente buscando y añadiendo puntos en la barra lateral de Geolocalización, o automáticamente con la georreferenciación por IA, que analiza el contenido de la entrada y sugiere ubicaciones con puntuaciones de confianza. Consulta [Geolocalización de entradas](geolocating-posts.md) y [Georreferenciación con IA](ai-georeferencing.md).

## Funcionalidades de IA

Las funcionalidades de IA de JEO se basan en un proveedor de IA externo configurable, con una base de conocimiento integrada (RAG), agentes especializados y salida estructurada. Consulta [IA en JEO](ai-in-jeo.md) para una explicación detallada de cómo funcionan juntas estas piezas.

## Mapa generado por IA

Un bloque de mapa asistido por IA que genera mapas contextuales a partir de un prompt de texto o del contenido de una entrada, con una interfaz de chat para refinarlos. También puede generar capas de mapa personalizadas cuando hay una clave de Mapbox configurada. Consulta [Minimapa](minimap.md).

## Mapa narrativo

Un Mapa narrativo es una experiencia de scrollytelling: cada **slide** tiene una ubicación, capas y texto. A medida que el lector se desplaza, el mapa transiciona entre slides. Consulta [Mapa narrativo](story-map.md).

## Discovery

Un mapa interactivo a página completa donde los lectores pueden explorar historias geolocalizadas, activar y desactivar capas de diferentes mapas y compartir una vista personalizada. Consulta [Discovery](discovery.md).

## Historias cerca de ti

Un bloque que muestra las entradas geolocalizadas más cercanas a la ubicación del lector, con geolocalización del navegador basada en consentimiento y respaldo automático. Consulta [Historias cerca de ti](stories-near-you.md).
