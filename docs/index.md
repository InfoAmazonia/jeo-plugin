# JEO Plugin

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps. With JEO, creating the interaction between data layers and contextual information is intuitive and interactive.

You can post geotagged stories and create richly designed pages for each one of the featured stories. At the same time, by simply imputing the ids of layers hosted on MapBox, you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All direct at the WordPress dashboard.

## Features

- [MapBox](http://mapbox.com/) maps
- [ReactMapBoxGL](https://github.com/alex3165/react-mapbox-gl/blob/master/docs/API.md) library
- Custom tile layers
- Layer filtering options, allowing you to mix tile layer.
- Geocoding WordPress posts using OpenStreetMaps (Nominatim), suporting the post type `Post`.
- Customizable marker icons that can be associated to categories, custom taxonomies or posts directly.
- Map markers query integrated to posts query.
- Support [WPML](https://wpml.org/pt-br/) and [Polylang](https://br.wordpress.org/plugins/polylang/) multilanguages plugins

## User tutorials

### Getting started

- [Concepts](concepts.md)
- [Installing and configuring the plugin](getting-started.md)

### Layers

- [Creating layers](layer-post.md)

### Maps

- [Creating maps](map-post.md)

### Posts

- [Geolocating posts](geolocating-posts.md)
- [Using a map shortcode](map-shortcode.md)
- [Using a map block](map-block.md)
- [Using an one-time map block](one-time-map-block.md)
- [Using a map embed](map-embed.md)

## Developer documentation

### Tutorials

- [Adding new Layer Types](dev/layer-types.md)
- [Geographical Information of a post](dev/geo-information.md)
- [Writing a Geocoder](dev/geocoders.md)

### Differences between the old and the present JEO

- [Migration](dev/migration.md)
