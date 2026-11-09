# Plugin JEO

El plugin JEO funciona como una plataforma de geoperiodismo que permite a organizaciones de noticias, blogueros y ONG publicar reportajes como capas de información en mapas digitales. Con JEO, crear la interacción entre capas de datos e información contextual es intuitivo e interactivo.

Puedes publicar historias geolocalizadas y crear páginas con un diseño cuidado para cada una de las historias destacadas. Al mismo tiempo, al configurar capas alojadas en Mapbox y elegir entre MapboxGL y MapLibreGL, puedes administrar mapas sofisticados sin perder rendimiento, añadir leyendas directamente con HTML y definir los parámetros del mapa. Todo directamente desde el panel de WordPress.

## Funcionalidades

- Mapas de [Mapbox](https://www.mapbox.com/) y [MapLibre](https://maplibre.org/)
- Biblioteca [react-map-gl](https://visgl.github.io/react-map-gl/)
- Capas de tiles personalizadas
- Opciones de filtrado de capas, que te permiten combinar capas de tiles.
- Geocodificación de entradas de WordPress con OpenStreetMap (Nominatim), con soporte para el tipo de contenido `Post` y extensibilidad para otros geocodificadores vía hook.
- Íconos de marcadores personalizables, que pueden asociarse a categorías, taxonomías personalizadas o directamente a entradas.
- Consulta de marcadores del mapa integrada en la consulta de entradas.
- Soporte para los plugins multilingües [WPML](https://wpml.org/pt-br/) y [Polylang](https://wordpress.org/plugins/polylang/)
- Georreferenciación, geolocalización masiva y generación de mapas con IA (múltiples proveedores de IA)
- Bloque Historias cerca de ti con descubrimiento de entradas basado en la geolocalización
- Bloque de mapa asistido por IA (Minimapa) con refinamiento por chat y capas generadas automáticamente

## Tutoriales de usuario

### Primeros pasos

- [Conceptos](concepts.md)
- [Instalación y configuración del plugin](getting-started.md)

### Capas

- [Crear capas](layer-post.md)

### Mapas

- [Crear mapas](map-post.md)

### Discovery

- [Usar Discovery](discovery.md)

### Mapa narrativo

- [Crear y usar Mapas narrativos](story-map.md)

### Entradas

- [Geolocalización de entradas](geolocating-posts.md)
- [Georreferenciación con IA](ai-georeferencing.md)
- [Geolocalización masiva con IA](ai-bulk-geolocation.md)
- [Usar un shortcode de mapa](map-shortcode.md)
- [Usar un bloque de mapa](map-block.md)
- [Usar un bloque de mapa de un solo uso](one-time-map-block.md)
- [Usar una incrustación de mapa](map-embed.md)

### Funcionalidades de IA

- [Configuraciones de IA](ai-settings.md)
- [Minimapa — Bloque de mapa asistido por IA](minimap.md)

### Historias cerca de ti

- [Bloque Historias cerca de ti](stories-near-you.md)

## Documentación para desarrolladores

### Tutoriales

- [Añadir nuevos tipos de capa](dev/layer-types.md)
- [Información geográfica de una entrada](dev/geo-information.md)
- [Escribir un geocodificador](dev/geocoders.md)

### Diferencias entre el JEO antiguo y el actual

- [Migración](dev/migration.md)
