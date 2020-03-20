# Concepts

## Layer

A layer is the basic building block for map interactions. Each layer can have its legends, attributions, etc.

JEO supports four layer types out-of-the-box:

- [Mapbox styles](https://docs.mapbox.com/studio-manual/overview/map-styling/)
- [Mapbox tilesets](https://docs.mapbox.com/help/glossary/tileset/)
- [Mapbox vector tiles](https://docs.mapbox.com/vector-tiles/reference/) (MVTs)
- [TileLayers](https://en.wikipedia.org/wiki/Tiled_web_map)

## Map

A map is composed of one or more layers and can be associated with related geolocated posts, that'll be rendered as markers on the map.

A map post is used for reusable map interactions, that can be embedded in any post as a [shortcode](map-shortcode.md) or [Gutenberg block](map-block.md).

## One-time Map

Instead of creating a reusable map any time you want to add a map interaction, you can create and configure an inline single-use map via the [One-Time Map block](one-time-map-block.md) for Gutenberg.
