# Shortcode de mapa

Un mapa puede insertarse en cualquier página o entrada usando el shortcode `jeo-map`.

El shortcode acepta tres atributos:

- `map_id` (obligatorio): El ID del mapa que quieres insertar;
- `width` (opcional): El ancho del mapa. Por defecto será de 600px o de lo que el tema activo defina para la clase CSS 'div.jeomap';
- `height` (opcional): La altura del mapa. Por defecto será de 600px o de lo que el tema activo defina para la clase CSS 'div.jeomap'.

Ejemplos:

```html
[jeo-map map_id=99]
```

Debes indicar al menos el ID del mapa que quieres insertar. Por defecto, se insertará con un tamaño de 600&times;600px (o de lo que el tema activo defina), pero también puedes cambiarlo:

```html
[jeo-map map_id=99 width="800px" height="800px"]
```
