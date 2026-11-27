# Fontes e camadas do Mapbox e o JEO
Como as configurações de fontes e camadas funcionam com a Mapbox Style Specification e como o JEO lida com elas

> **Runtime de mapa**: O JEO oferece suporte a dois runtimes de renderização de mapa — [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/API/) (padrão) e [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/). Ambos compartilham a mesma [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/) para definir fontes, camadas e estilos. Os exemplos abaixo usam a terminologia da API do Mapbox, mas se aplicam igualmente ao MapLibre GL. O runtime ativo é configurado em **Jeo → Configurações → Runtime de mapa**.

## [Índice](#índice)
- [Fontes e camadas do Mapbox e o JEO](#fontes-e-camadas-do-mapbox-e-o-jeo)
  - [Índice](#índice)
  - [Introdução](#introdução)
  - [Estilos do Mapbox](#estilos-do-mapbox)
  - [Camadas do Mapbox](#camadas-do-mapbox)
    - [Tipos e fontes de uma camada](#tipos-e-fontes-de-uma-camada)
  - [Fontes do Mapbox](#fontes-do-mapbox)
    - [Sobre o atributo `sourceLayer` de um componente Source](#sobre-o-atributo-sourcelayer-de-um-componente-source)

## [Introdução](#introdução)

Este documento descreve como interagir com a Mapbox Style Specification conforme usada pelo MapLibre GL JS e pelo Mapbox GL JS no JEO. Ele resume conceitos-chave das documentações dessas bibliotecas e fornece exemplos de como o JEO os utiliza.

## [Estilos do Mapbox](#estilos-do-mapbox)

O serviço Mapbox Maps é composto por diversas APIs, e cada tipo de camada tem particularidades que você precisa conhecer.

De acordo com a documentação do Mapbox, um estilo consiste em um conjunto de propriedades raiz. Algumas, como version, name e metadata, não influenciam a aparência ou o comportamento do seu mapa. Outras, como layers e sources, determinam os recursos do nosso mapa e a aparência deles.

Estas são as particularidades discutidas abaixo.

Mais em [Mapbox Style Specification](https://docs.mapbox.com/style-spec/guides/).

## [Camadas do Mapbox](#camadas-do-mapbox)
A propriedade layers de um estilo lista todas as camadas disponíveis naquele estilo.

### [Tipos e fontes de uma camada](#tipos-e-fontes-de-uma-camada)

O tipo da camada é especificado pela propriedade "type" e deve ser um de:

Para o tipo `vector`:
-  background;
-  fill;
-  line;
-  symbol;
-  circle;
-  fill-extrusion;
-  heatmap;
-  hillshade.

Para o tipo `raster`:
-  raster;

**Exceto pelas camadas do tipo `background`, cada camada precisa fazer referência a uma fonte.**

O `source` de uma camada é o nome de uma descrição de fonte a ser usada para esta camada.

* **Configurações JSON**

As suas configurações de uma camada devem ser algo como:

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

Mais em [documentação de Layer do MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/API/classes/Layer/) e [Mapbox Spec Layers](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/).

* **React Map GL**

O JEO reexporta `Map`, `Source` e `Layer` de `react-map-gl/maplibre` através da fachada `src/js/src/lib/mapgl-react.js`. Sempre importe de `'../lib/mapgl-react'` — nunca importe `react-map-gl` diretamente, para que o plugin possa trocar o runtime subjacente sem alterar o código dos consumidores.

Usando `react-map-gl/maplibre`, podemos definir um componente `<Layer>` como filho do `<Map>`:

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

Mais em [documentação de Layer do react-map-gl](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/layer).

## [Fontes do Mapbox](#fontes-do-mapbox)

As fontes indicam quais dados o mapa deve exibir. Especifique o tipo de fonte com a propriedade `type`, que deve ser uma de:

- vector;
- raster;
- raster-dem;
- geojson;
- image;
- video.

**Observe que uma `Layer` pode ter um `type` e um `source`. E uma `Source` não é a mesma coisa que o `layer source`, e essa `Source` tem um `type`.**

Adicionar uma *source não é suficiente para fazer os dados aparecerem no mapa* porque **as sources não contêm detalhes de estilização** como cor ou largura.

**Sources de tiles, vetoriais e raster, devem especificar os seus detalhes de acordo com a especificação TileJSON**.

No plugin JEO você pode fornecer essas informações como `tiles` ou como `url`.

Note que os exemplos a seguir são baseados em um tipo de source `vector`.

* **Configurações JSON**

As suas configurações de uma source devem ser algo como:

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

Mais em [documentação de Source do react-map-gl](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source).

* **React Map GL**

Usando `react-map-gl/maplibre`, `<Source>` e `<Layer>` são renderizados como filhos do `<Map>`:

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

Para uma source `raster`, podemos definir assim:

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

Mais sobre como configurar um componente Source em [documentação de Source do react-map-gl](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source).

### [Sobre o atributo `sourceLayer` de um componente Source](#sobre-o-atributo-sourcelayer-de-um-componente-source)

Se a sua `Layer` é do tipo `vector`, o seu `sourceLayer` indicará uma *camada individual de dados* dentro da sua `vector source`. Você pode obter mais informações sobre onde encontrar o nome dessa propriedade no [glossário source-layer do Mapbox](https://docs.mapbox.com/help/glossary/source-layer/).

Caso contrário, se a sua `Layer` for do tipo `raster`, esta propriedade **será ignorada**.

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
