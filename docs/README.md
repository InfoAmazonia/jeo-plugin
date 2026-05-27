# JEO Documentation

JEO acts as a geojournalism platform which allows news organizations, bloggers and NGOs to publish news stories as layers of information on digital maps. With JEO, creating the interaction between data layers and contextual information is much more intuitive and interactive.

You can post geotagged stories and create richly designed pages for each one of the featured stories. At the same time, by configuring layers hosted on Mapbox and choosing between MapboxGL and MapLibreGL, you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All directly at the WordPress dashboard.

JEO wants to help journalists and NGOs to improve storytelling with maps. Creating a child theme with all its functionality is easy since it contains all the necessary hooks to customize layouts and data visualization.

[Get Started](getting-started.md)

## Features

- MapboxGL and MapLibreGL map rendering
- Custom tile layers
- [Mapbox](https://www.mapbox.com/) maps
- Layer filtering options, allowing you to mix tile layers.
- Geocoding WordPress posts using OpenStreetMap (Nominatim), with extensibility for additional geocoders via hook.
- Customizable marker icons that can be associated to categories, custom taxonomies or posts directly.
- Map markers query integrated to posts query.
- Support [WPML](https://wpml.org/pt-br/) and [Polylang](https://br.wordpress.org/plugins/polylang/) multilingual plugins
- AI-powered georeferencing with 10 AI providers
- AI-assisted map generation (Minimap) with chat refinement
- Stories Near You block with geolocation-based post discovery

## User tutorials

- **Layers**

  - [Creating a layer](layer-post.md)

- **Maps**

  - [Creating maps](map-post.md)
  - [Editing map layers](map-post.md#map-layers)

- **Posts**

  - [Geolocating posts](geolocating-posts.md)
  - [AI Georeferencing](ai-georeferencing.md)
  - [AI Bulk Geolocation](ai-bulk-geolocation.md)

- **AI Features**

  - [AI Settings](ai-settings.md)
  - [Minimap — AI-Assisted Map Block](minimap.md)

- **Stories Near You**

  - [Stories Near You block](stories-near-you.md)

## Developer documentation

### Tutorials

- [Adding new Layer Types](dev/layer-types.md)
- [Geographical Information of a post](dev/geo-information.md)
- [Writing a Geocoder](dev/geocoders.md)

### Features

- [Map Shortcode](map-shortcode.md)

### Differences between the old and the present JEO

- [Migration](dev/migration.md)
