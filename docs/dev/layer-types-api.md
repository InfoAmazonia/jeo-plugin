# Mapbox Sources, Layers and JEO 
How sources and layers settings works at Mapbox API and how JEO deals with them

## [Table of Contents](#table-of-contents)
- [Mapbox Sources, Layers and JEO](#mapbox-sources-layers-and-jeo)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Mapbox Styles](#mapbox-styles)
  - [Mapbox Layers](#mapbox-layers)
    - [Types and Sources of a Layer](#types-and-sources-of-a-layer)
  - [Mapbox Sources](#mapbox-sources)
    - [On `sourceLayer` attribute of a Source component](#on-sourcelayer-attribute-of-a-source-component)
  - [How the Layer Settings page of JEO Plugin works](#how-the-layer-settings-page-of-jeo-plugin-works)
  - [Corner cases and other observations](#corner-cases-and-other-observations)

## [Introduction](#introduction)

This document describes how to interact with Mapbox, MapboxGL and React MapboxGL APIs. It is organised in a way that summarize key infos of those tools docs and gives examples of we are using them at our code.

## [Mapbox Styles](#mapbox-styles)

Mapbox Maps service is composed of several APIs and every type of layer has some particularities which we must pay attention.

Accordingly which Mapbox docs, a Mapbox style consists of a set of root properties, some of which describe a single global propertie and some of which contain nested properties, like version, and name and metadata and does not influence over the appearance or behavior of your map. Others, like layers and sources determine our map features and what they will look like. 

Those are the particularities that we will further discuss from now.

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

```
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
More at [Mapbox Spec Layers](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/).

* **MapboxGL React**

We can set a `<Layer>` component like:

```
    import { Layer } from "react-mapbox-gl";

    ...

    <Layer
        type="symbol"
        id="water",
        source="mapbox-streets",
        sourceLayer="water", // by definition, the source type must be vector type
        type="fill",
        paint={{ "fill-color": "#00ffff" }}>
    </Layer>

```

More at [react-mapbox-gl <Layer> docs](https://github.com/alex3165/react-mapbox-gl/blob/master/docs/API.md#layer).

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

Note that the following exams is based on a `source vector type`.

* **JSON settings**
  
  Your settings of a source should be something like:

  -  `tiles`:


        ```
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
    
        ```
            "mapbox-streets": {
                "type": "vector",
                "url": "http://api.example.com/tilejson.json"
            }
        ```
More at [react-mapbox-gl docs](https://github.com/alex3165/react-mapbox-gl/blob/master/docs/API.md#layer).
 
* **MapboxGL React**

    We can set up a `<Source/>` component like:
    
    - `tiles`:

        ```
            import { Source } from "react-mapbox-gl";

            ...

            const SOURCE_OPTIONS = {
                "type": "vector",  // note this line
                "tiles": [
                        "http://a.example.com/tiles/{z}/{x}/{y}.pbf",
                        "http://b.example.com/tiles/{z}/{x}/{y}.pbf"
                ],
                "maxzoom": 14
            };

            <Source 
                id="source_id" 
                tileJsonSource={SOURCE_OPTIONS} 
            />
            <Layer 
                type="vector" // note this line
                id="layer_id" 
                sourceId="source_id" 
            /> 
        ```
    - `url`:

        ```
            import { Source } from "react-mapbox-gl";

            ...

            const SOURCE_OPTIONS = {
                "url": "http://api.example.com/tilejson.json",
                "type": "vector", // note this line
            };

            <Source 
                id="source_id" 
                tileJsonSource={SOURCE_OPTIONS} 
            />
            <Layer 
                type="vector" // note this line
                id="layer_id"
                sourceId="source_id" 
                sourceLayer={ source_layer } // see onSource section for more info
            />
        ```

    For a `raster` source, we can define like this:

    ```
        import { Source } from "react-mapbox-gl";

        ...

        const RASTER_SOURCE_OPTIONS = {
            "type": "raster", // note this line
            "tiles": [
                "https://someurl.com/512/{z}/{x}/{y}",
            ],
            "tileSize": 512
        };

        <Source 
            id="source_id" 
            tileJsonSource={RASTER_SOURCE_OPTIONS} 
        />
        <Layer 
            type="raster" // note this line
            id="layer_id" 
            sourceId="source_id"   
        />
    ```
    More about how to configure a Source component at [react-mapbox-gl docs](https://github.com/alex3165/react-mapbox-gl/blob/master/docs/API.md#source).


    

### [On `sourceLayer` attribute of a Source component](#on-sourcelayer-attribute-of-a-source-component)

If your `Layer` is of the `vector` type, your `sourceLayer` will indicate an *individual layer of data* within your `vector source`. You can learn more info on where you can find the name of this property at Mapbox [source-layer glossary](https://docs.mapbox.com/help/glossary/source-layer/).

Otherwise, if your `Layer` have a `raster` type, this property **will be ignored**.


```
    <Source 
        id="source_id" 
        tileJsonSource={{
            type: "raster" // note this line
        }} 
    />
    <Layer 
        type="raster" // note this line
        sourceLayer="anything" // this info will be ignored
        id="layer_id" 
        sourceId="source_id"   
    />
```

## How the Layer Settings page of JEO Plugin works

## Corner cases and other observations