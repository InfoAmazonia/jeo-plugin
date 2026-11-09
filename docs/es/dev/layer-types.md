# Añadir nuevos tipos de capa

Este documento describe cómo registrar nuevos tipos de capa para usarlos en los mapas creados con JEO.

## Introducción

En JEO, los mapas se renderizan con [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/API/) (el predeterminado) o [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/), según la configuración de **runtime del mapa** definida en **Jeo → Configuraciones**. Ambas bibliotecas comparten una API compatible basada en la [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/), así que cualquier tipo de capa nuevo funcionará con cualquiera de los dos runtimes. El objeto `map` inicializado que se pasa a los métodos del tipo de capa es una instancia `Map` de MapLibre GL o de Mapbox GL — ambas exponen los mismos métodos principales (`setStyle`, `addLayer`, `addSource`, etc.).

Básicamente, para añadir un tipo de capa nuevo hay 2 pasos sencillos:

1. Registrar el nuevo tipo de capa mediante un hook de PHP, indicando dónde está el archivo JavaScript principal de tu tipo de capa;
2. Crear una clase de JavaScript que implemente métodos para añadir la capa al mapa y para describir cuáles son las opciones que tiene una capa de este tipo.

En resumen, esto es todo lo que hay que hacer. En algunos casos, sin embargo, es posible que necesites añadir dependencias extra al proyecto. Por ejemplo, para crear un tipo de capa que soporte las capas vectoriales de Carto, podríamos querer añadir CartoVL (que es una extensión de MapboxGL) al proyecto.

## Crear un tipo de capa nuevo

Primero, registremos un tipo de capa nuevo enganchándonos a la acción `jeo_register_layer_types`:

```php
add_action('jeo_register_layer_types', function($layer_types) {
    $layer_types->register_layer_type( 'my-layer-type', [ 'script_url' => plugin_dir_url( __FILE__ ) . '/js/layertype.js' ] );
});
```

El método `register_layer_type` recibe 2 parámetros.

- Slug del tipo de capa - Una cadena única y saneada (asegúrate de que sea única)
- Opciones - Un array con las opciones del tipo de capa:
  - `script_url`: Obligatorio. La URL absoluta de tu archivo JavaScript.
  - `dependencies`: Opcional. Un array de handles de scripts registrados mediante [wp_register_script](https://developer.wordpress.org/reference/functions/wp_register_script/) que deben cargarse como dependencias del script principal del tipo de capa

Eso es todo lo que necesitas hacer en el lado de PHP. Toda la magia ocurre en el JavaScript.

Ahora, creemos nuestro archivo `layertype.js`.

En este archivo vamos a registrar un objeto de JavaScript usando el `window.JeoLayerTypes.registerLayerType` disponible globalmente.

El primer parámetro debe ser el mismo slug que definiste al registrar tu tipo de capa en el lado de PHP, y el segundo parámetro es un objeto con, al menos, tres métodos.

```js
window.JeoLayerTypes.registerLayerType('tilelayer', {

    addStyle: function(map, attributes) {
        // ...
    },

    addLayer: function(map, attributes) {
        // ...
    },

    getSchema: function(attributes) {
        // ...
    }
});
```

Tu objeto de tipo de capa DEBE implementar al menos estos tres métodos.

### getSchema(attributes)

**parámetros**:

- `attributes` - objeto con los atributos de la capa (ver la sección siguiente)

**devuelve**:

- Una promesa con un json-schema

Este método le indicará a JEO cuáles son las opciones que el usuario debe rellenar al crear una capa nueva de este tipo.

Por ejemplo, un tipo de capa de teselas ráster podría tener solo una URL. Una capa de Mapbox tiene el ID del estilo y el Token de acceso opcional.

Este método debe devolver una promesa con una representación en json-schema de las opciones del tipo de capa.

Este esquema debe incluir únicamente información específica del tipo de capa. Toda capa, independientemente de su tipo, tiene un conjunto de atributos comunes, como el ID y el Nombre.

Por ejemplo, al tipo de capa "Capa de teselas" solo le hace falta una URL, así es como se verá su método `getSchema`:

```js
    // ...

    getSchema: function(attributes) {
        return new Promise( function(resolve, reject) {

            resolve({
                "type": "object",
                "required": [
                    "url"
                ],
                "properties": {
                    "url": {
                        "type": "string",
                        "title": "URL"
                    }
                }
            });

        });
    }
```

## addStyle(map, attributes)

**parámetros**:

- `map` - el objeto [Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) de MapLibre GL o [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) de Mapbox GL inicializado, según el runtime del mapa configurado
- `attributes` - objeto con los atributos de la capa (ver la sección Atributos de la capa más abajo)

**devuelve**:

- El resultado de una llamada a [`map.setStyle`](https://docs.mapbox.com/mapbox-gl-js/api/#map#setstyle)

Ambos runtimes usan la [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/) como capa base. Este método añadirá la capa como el estilo del mapa, usando el método [`setStyle`](https://docs.mapbox.com/mapbox-gl-js/api/#map#setstyle) del objeto `Map`.

Este método se invocará cuando se añada al mapa una capa de este tipo como capa base.

Por ejemplo, el tipo de capa "Capa de teselas" define el estilo como una capa ráster:

```js
    // ...

    addStyle: function(map, attributes) {
        return map.setStyle({
            'version': 8,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': [attributes.layer_type_options.url],
                    'tileSize': 256
                }
            },
            'layers': [{
                id: attributes.layer_id,
                type: 'raster',
                source: 'raster-tiles'
            }]
        })
    }
```

**Nota**: El objeto `attributes.layer_type_options` contiene todas las propiedades declaradas en el método `getSchema`. ¡Por eso hay un `url` ahí! (ver la sección Atributos de la capa más abajo)

## addLayer(map, attributes)

**parámetros**:

- `map` - el objeto [Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/) de MapLibre GL o [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) de Mapbox GL inicializado, según el runtime del mapa configurado
- `attributes` - objeto con los atributos de la capa (ver la sección Atributos de la capa más abajo)

**devuelve**:

- El resultado de una llamada a [`map.addLayer`](https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer)

Este método añadirá la capa al mapa usando el método [`addLayer`](https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer) del objeto `Map`.

Este método se invocará cuando se añada al mapa una capa de este tipo.

Por ejemplo, el tipo de capa "Capa de teselas" se añade a sí mismo como una capa ráster:

```js
    // ...

    addLayer: function(map, attributes) {
        var layer = {
            id: attributes.layer_id,
            source: {
              type: 'raster',
              tiles: [attributes.layer_type_options.url],
              "tileSize": 256
            },
            type: 'raster'
        };
        if ( ! attributes.visible ) {
            layer.layout = {
                visibility: 'none'
            };
        }
        return map.addLayer(layer);
    }

```

**Nota:** Este método debe verificar el valor de `attributes.visible` para determinar si esta capa debe ser visible cuando se inicializa el mapa.

## Atributos de la capa

Como viste, cada uno de los métodos anteriores recibe como entrada un argumento `attributes`. Este argumento contiene toda la información de la capa que el usuario está editando o viendo.

Algunos atributos son comunes a todos los tipos de capa y otros son específicos de un tipo de capa. Todos los atributos específicos del tipo de capa que tiene una capa se guardan bajo el atributo `layer_type_options`.

Estas son las claves disponibles en el objeto `attributes`:

- `layer_id`: (integer) Un ID único que representa esta capa y la identifica en la base de datos
- `layer_name`: (string) El nombre de la capa, dado por el usuario
- `visible`: (boolean) Un indicador que señala si esta capa debe ser visible cuando el mapa se inicializa
- `layer_type_options`: (object) Un objeto con todos los atributos específicos del tipo de capa (los registrados en el método `getSchema`)
