# Mapbox Sources, Layers and JEO
How sources and layers settings work with the Mapbox Style Specification and how JEO deals with them

> **Map runtime**: JEO supports two map rendering runtimes — [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/API/) (default) and [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/). Both share the same [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/) for defining sources, layers, and styles. The examples below use Mapbox API terminology, but they apply equally to MapLibre GL. The active runtime is configured in **Jeo → Settings → Map Runtime**.

## [Table of Contents](#table-of-contents)
- [Mapbox Sources, Layers and JEO](#mapbox-sources-layers-and-jeo)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Mapbox Styles](#mapbox-styles)
  - [Mapbox Layers](#mapbox-layers)
    - [Types and Sources of a Layer](#types-and-sources-of-a-layer)
  - [Mapbox Sources](#mapbox-sources)
    - [On `sourceLayer` attribute of a Source component](#on-sourcelayer-attribute-of-a-source-component)

## [Introduction](#introduction)

This document describes how to interact with the Mapbox Style Specification as used by both MapLibre GL JS and Mapbox GL JS in JEO. It summarizes key concepts from their docs and provides examples of how JEO uses them.

## [Mapbox Styles](#mapbox-styles)

The Mapbox Maps service is composed of several APIs and every type of layer has some particularities to be aware of.

According to the Mapbox docs, a style consists of a set of root properties. Some, like version, name and metadata, do not influence the appearance or behavior of your map. Others, like layers and sources, determine our map features and what they will look like.

These are the particularities discussed below.

More at [Mapbox Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec//).

## [Mapbox Layers](#mapbox-layers)
A style's layers property lists all the layers available in that style.

### [Types and Sources of a Layer](#types-and-sources-of-a-layer)

The type of layer is specified by the "type" property and must be one of:

For type `vector`:
-  background;
-  fill;
-  line;
-  symbol;
-  circle;
-  fill-extrusion;
-  heatmap;
-  hillshade.

For type `raster`:
-  raster;

**Except for layers of the `background` type, each layer needs to refer to a source.**

The `source` of a layer is the name of a source description to be user for this layer.

* **JSON settings**

Your settings of a layer should be something like:

```js
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

More at [MapLibre GL Layer docs](https://maplibre.org/maplibre-gl-js/docs/API/classes/Layer/) and [Mapbox Spec Layers](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/).

* **React Map GL**

JEO re-exports `Map`, `Source` and `Layer` from `react-map-gl/maplibre` via the `src/js/src/lib/mapgl-react.js` facade. Always import from `'../lib/mapgl-react'` — never import `react-map-gl` directly, so the plugin can swap the underlying runtime without touching consumer code.

Using `react-map-gl/maplibre`, we can set a `<Layer>` component as a child of the `<Map>`:

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

More at [react-map-gl Layer docs](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/layer).

## [Mapbox Sources](#mapbox-sources)

Sources state which data the map should display. Specify the type of source with the `type` property, which must be one of:

- vector;
- raster;
- raster-dem;
- geojson;
- image;
- video.

**Please note that a `Layer` can have a `type` and a `source`. And a `Source` is not the same as the `layer source` and this `Source` has a `type`.**

Adding a *source isn't enough to make data appear on the map* because **sources don't contain styling** details like color or width.

**Tiled sources, vector and raster, must specify their details according to the TileJSON specification**.

At JEO plugin you can supply those infos as `tiles` or as `url`.

Note that the following examples are based on a `vector` source type.

* **JSON settings**

  Your settings of a source should be something like:

  -  `tiles`:


        ```js
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

        ```js
            "mapbox-streets": {
                "type": "vector",
                "url": "http://api.example.com/tilejson.json"
            }
        ```
More at [react-map-gl Source docs](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source).

* **React Map GL**

    Using `react-map-gl/maplibre`, `<Source>` and `<Layer>` are rendered as children of the `<Map>`:

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

    For a `raster` source, we can define like this:

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
    More about how to configure a Source component at [react-map-gl Source docs](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source).




### [On `sourceLayer` attribute of a Source component](#on-sourcelayer-attribute-of-a-source-component)

If your `Layer` is of the `vector` type, your `sourceLayer` will indicate an *individual layer of data* within your `vector source`. You can learn more info on where you can find the name of this property at Mapbox [source-layer glossary](https://docs.mapbox.com/help/glossary/source-layer/).

Otherwise, if your `Layer` have a `raster` type, this property **will be ignored**.


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
