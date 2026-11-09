# Fuentes y capas de Mapbox y JEO
Cómo funcionan las configuraciones de fuentes y capas con la Mapbox Style Specification y cómo las maneja JEO

> **Runtime del mapa**: JEO soporta dos runtimes de renderizado de mapas — [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/API/) (el predeterminado) y [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/). Ambos comparten la misma [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/) para definir fuentes, capas y estilos. Los ejemplos siguientes usan la terminología de la API de Mapbox, pero se aplican igualmente a MapLibre GL. El runtime activo se configura en **Jeo → Configuraciones → Runtime del mapa**.

## [Índice](#índice)
- [Fuentes y capas de Mapbox y JEO](#fuentes-y-capas-de-mapbox-y-jeo)
  - [Índice](#índice)
  - [Introducción](#introducción)
  - [Estilos de Mapbox](#estilos-de-mapbox)
  - [Capas de Mapbox](#capas-de-mapbox)
    - [Tipos y fuentes de una capa](#tipos-y-fuentes-de-una-capa)
  - [Fuentes de Mapbox](#fuentes-de-mapbox)
    - [Sobre el atributo `sourceLayer` de un componente Source](#sobre-el-atributo-sourcelayer-de-un-componente-source)

## [Introducción](#introducción)

Este documento describe cómo interactuar con la Mapbox Style Specification tal como la usan MapLibre GL JS y Mapbox GL JS en JEO. Resume conceptos clave de su documentación y proporciona ejemplos de cómo los usa JEO.

## [Estilos de Mapbox](#estilos-de-mapbox)

El servicio Mapbox Maps se compone de varias API y cada tipo de capa tiene particularidades que conviene conocer.

Según la documentación de Mapbox, un estilo consiste en un conjunto de propiedades raíz. Algunas, como version, name y metadata, no influyen en la apariencia ni en el comportamiento del mapa. Otras, como layers y sources, determinan las características de nuestro mapa y el aspecto que tendrán.

Estas son las particularidades que se tratan a continuación.

Más en la [Mapbox Style Specification](https://docs.mapbox.com/style-spec/guides/).

## [Capas de Mapbox](#capas-de-mapbox)
La propiedad layers de un estilo lista todas las capas disponibles en ese estilo.

### [Tipos y fuentes de una capa](#tipos-y-fuentes-de-una-capa)

El tipo de capa se especifica con la propiedad "type" y debe ser uno de los siguientes:

Para el tipo `vector`:
-  background;
-  fill;
-  line;
-  symbol;
-  circle;
-  fill-extrusion;
-  heatmap;
-  hillshade.

Para el tipo `raster`:
-  raster;

**Excepto en el caso de las capas de tipo `background`, cada capa necesita hacer referencia a una fuente.**

El `source` de una capa es el nombre de una descripción de fuente que se usará para esta capa.

* **Configuraciones JSON**

Tus configuraciones de una capa deberían ser algo así:

```json
"layers": [{
    "id": "water",
    "source": "mapbox-streets",
    "source-layer": "water",
    "type": "fill",
    "paint": {
    "fill-color": "#00ffff"
    }
}]
```

Más en la [documentación de Layer de MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/API/classes/Layer/) y en [Mapbox Spec Layers](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/).

* **React Map GL**

JEO reexporta `Map`, `Source` y `Layer` desde `react-map-gl/maplibre` mediante la fachada `src/js/src/lib/mapgl-react.js`. Importa siempre desde `'../lib/mapgl-react'` — nunca importes `react-map-gl` directamente, para que el plugin pueda cambiar el runtime subyacente sin tocar el código de los consumidores.

Usando `react-map-gl/maplibre`, podemos definir un componente `<Layer>` como hijo del `<Map>`:

```js
import { Layer, Source } from '../lib/mapgl-react';

...

<Source id="mapbox-streets" type="vector" url="mapbox://mapbox.streets">
  <Layer
    id="water"
    source-layer="water"
    type="fill"
    paint={{ "fill-color": "#00ffff" }} />
</Source>
```

Más en la [documentación de Layer de react-map-gl](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/layer).

## [Fuentes de Mapbox](#fuentes-de-mapbox)

Las fuentes indican qué datos debe mostrar el mapa. Especifica el tipo de fuente con la propiedad `type`, que debe ser uno de los siguientes:

- vector;
- raster;
- raster-dem;
- geojson;
- image;
- video.

**Ten en cuenta que un `Layer` puede tener un `type` y un `source`. Y un `Source` no es lo mismo que el `layer source`, y ese `Source` tiene un `type`.**

Añadir una *fuente no es suficiente para que los datos aparezcan en el mapa*, porque **las fuentes no contienen detalles de estilo** como el color o el ancho.

**Las fuentes de teselas, vectoriales y ráster, deben especificar sus detalles según la especificación TileJSON**.

En el plugin JEO puedes suministrar esa información como `tiles` o como `url`.

Ten en cuenta que los siguientes ejemplos se basan en un tipo de fuente `vector`.

* **Configuraciones JSON**

Tus configuraciones de una fuente deberían ser algo así:

-  `tiles`:

```json
"mapbox-streets": {
    "type": "vector",
    "tiles": [
        "http://a.example.com/tiles/{z}/{x}/{y}.pbf",
        "http://b.example.com/tiles/{z}/{x}/{y}.pbf"
    ],
    "maxzoom": 14
}
```

- `url`:

```json
"mapbox-streets": {
    "type": "vector",
    "url": "http://api.example.com/tilejson.json"
}
```

Más en la [documentación de Source de react-map-gl](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source).

* **React Map GL**

Usando `react-map-gl/maplibre`, `<Source>` y `<Layer>` se renderizan como hijos del `<Map>`:

- `tiles`:

```js
import { Source, Layer } from '../lib/mapgl-react';

...

const SOURCE_OPTIONS = {
    type: "vector",
    tiles: [
        "http://a.example.com/tiles/{z}/{x}/{y}.pbf",
        "http://b.example.com/tiles/{z}/{x}/{y}.pbf"
    ],
    maxzoom: 14
};

<Source id="source_id" {...SOURCE_OPTIONS}>
  <Layer id="layer_id" />
</Source>
```

- `url`:

```js
import { Source, Layer } from '../lib/mapgl-react';

...

const SOURCE_OPTIONS = {
    url: "http://api.example.com/tilejson.json",
    type: "vector",
};

<Source id="source_id" {...SOURCE_OPTIONS}>
  <Layer id="layer_id" source-layer={source_layer} />
</Source>
```

Para una fuente `raster`, podemos definirla así:

```js
import { Source, Layer } from '../lib/mapgl-react';

...

const RASTER_SOURCE_OPTIONS = {
    type: "raster",
    tiles: [
        "https://someurl.com/512/{z}/{x}/{y}",
    ],
    tileSize: 512
};

<Source id="source_id" {...RASTER_SOURCE_OPTIONS}>
  <Layer id="layer_id" type="raster" />
</Source>
```

Más sobre cómo configurar un componente Source en la [documentación de Source de react-map-gl](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source).

### [Sobre el atributo `sourceLayer` de un componente Source](#sobre-el-atributo-sourcelayer-de-un-componente-source)

Si tu `Layer` es del tipo `vector`, tu `sourceLayer` indicará una *capa individual de datos* dentro de tu `vector source`. Puedes encontrar más información sobre dónde hallar el nombre de esta propiedad en el [glosario de source-layer](https://docs.mapbox.com/help/glossary/source-layer/) de Mapbox.

Por el contrario, si tu `Layer` es de tipo `raster`, esta propiedad **será ignorada**.

```jsx
<Source
    id="source_id"
    type="raster"
    tiles={["https://example.com/{z}/{x}/{y}.png"]}
/>
<Layer
    type="raster"
    source-layer="anything" // this info will be ignored
    id="layer_id"
/>
```
