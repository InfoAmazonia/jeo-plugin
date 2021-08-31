=== JEO ===
Contributors: earthjournalism
Tested up to: 5.7.0
Stable tag: 2.1.5
Requires PHP: 7.2
Requires at least: 5.4
License: GPL-2.0+
License URI: http://www.gnu.org/licenses/gpl-2.0.txt
Version: 2.2.1

The JEO plugin acts as a geojournalism platform that allows news organizations, bloggers and NGOs to publish news storys as layers of information on digital maps.

== Description ==

With JEO, creating the interaction between data layers and contextual information is intuitive and interactive. You can post geotagged storys and create richly designed pages for each one of the featured storys. At the same time, by simply imputing the ids of layers hosted on MapBox, you can manage sophisticated maps without losing performance, add legends directly with HTML and set the map parameters. All direct at the WordPress dashboard.

= Features =

* [Mapbox](https://www.mapbox.com) maps;
* [ReactMapBoxGL](https://github.com/alex3165/react-mapbox-gl/blob/master/docs/API.md) library;
* Custom tile layers;
* Layer filtering options, allowing you to mix tile layer;
* Geocoding WordPress posts using OpenStreetMaps(Nominatim), supporting the post type **Post**;
* Customizable marker icons that can be associated to categories, custom taxonomies or posts directly;
* Map markers query integrated to posts query;
* Support (WPML)[https://wpml.org/pt-br/] and (Polylang)[https://br.wordpress.org/plugins/polylang/] multilanguages plugins.

== Installation ==

1. Upload `jeo.php` to the `/wp-content/plugins/` directory;
2. Activate the plugin through the 'Plugins' menu in WordPress;
3. Select Jeo on the admin menu.

There, you can configure:
* the default latitude, longitude, and zoom for your maps;
* the [Mapbox API key](https://docs.mapbox.com/help/how-mapbox-works/access-tokens) that'll be used by the plugin;
* the geocoder that'll be used by the plugin -- currently only [Nominatim](https://nominatim.openstreetmap.org) is available.

After activating the plugin, a new item will appear on the WordPress dashboard: a menu containing the **Maps** and **Layers** post types, and the JEO settings menus.

== Screenshots ==
1. Map being displayed into a post
2. One-time map block
3. Layer interactions
4. Map with geolocated post
5. Geolocating a post
6. Layer post type
7. Map post type

== Changelog ==
= 2.2.0 =
* Add window.jeomaps global for third party plugins/themes to be able to manipulate map object

= 2.1.1 =
* Tenth Release

= 2.0.0 =
* Ninth release.
JEO Plugin was updated to be compatible with Wordpress version > 5.6.0.

= 1.3.0 =
* Eight release.

= 1.2.1 =
* Seventh release.

= 1.2.0 =
* Sixth release.

= 1.1.1 =
* Fifth release. Minor fixes

= 1.1.0 =
* Fourth release. New feature: Carto Integration

= 1.0.0 =
* Third release.

= 0.2.0 =
* Second release.

== Upgrade Notice ==

= 0.1.0=
* First release.

== Frequently Asked Questions ==

= How to create a layer? =
# Creating a layer

One of the custom post types that JEO plugin provides is **Layer**. Is in the layer where you will be able to add legend and color to your map. A map may contain one or more layers.

Entering the Layer post editor, you'll see a preview of the current layer (or a default layer if the current layer haven't been edited yet) and two sidebar panels: **Settings** and **Legend**.

## Layer settings

On the **Layer settings** panel, you can change the layer type.

JEO supports four layer types out-of-the-box:

* [Mapbox styles](https://docs.mapbox.com/studio-manual/overview/map-styling/);
* [Mapbox tilesets](https://docs.mapbox.com/help/glossary/tileset/);
* [Mapbox vector tiles](https://docs.mapbox.com/vector-tiles/reference/) (MVTs);
* [TileLayers](https://en.wikipedia.org/wiki/Tiled_web_map).

You can also inform an address, following the standard `username/id`, to compose your map style. If an access token is needed for this layer, you can put it into the `Acess token` input.

There's also an **Edit interactions** button. Here, you can add popups to your layer when specific actions (clicking or hovering the mouse) are made (e.g.: Clicking on a building and displaying its height)

On the **Layer legend** panel, you can add legends to your layer (barscale, simple-color, icons or circles) and colorize them.

= How to create a map? =
# Creating maps

One of the custom post types that JEO plugin provides is **Map**.

Entering the Map post editor, you'll see a preview of the current map (or a default map, if no layers are selected) and three sidebar panels: **Map settings**, **Map layers**, and **Related posts**.

On the **Map settings** panel, you can change the initial center of the map setting a latitude and longitude. You can also change the default zoom settings or even disable it.

When visualizing a map in a post, clicking with right button of the mouse and dragging it makes the map rotate. Also, scrolling the mouse wheel changes the map zoom. Both of these options can be enabled or disabled.

## Map layers

On the **Map layers** panel, you can visualize all the layers which are part of the map.

Clicking on the **Edit layers settings**, a popup will open. In there, you can add, remove and rearrange layers, define their types and whether its legends will be shown on the map.

A legend can be of one of these types:

* **Fixed**: the layer will always be shown in the map;
* **Switchable**: the layer visibility can be toggled on and off;
* **Swappable**: only one swappable layer can be visible at a time.

## Related posts

On the **Related posts** panel, you can set which geolocated posts will be used as markers on the post. You can filter the posts by categories, tags, dates interval or, for advanced uses, meta queries using WordPress `post_meta`.

== Other user tutorials ==

= Posts =
# Geolocating posts

When editing a post, JEO will add an extra panel to the sidebar: **Geolocation**. Clicking on **Geolocate this post**, a popup containing two tabs (**Map** and **List**) will then be displayed.

New points can be added to the post by clicking on **Add new point** button. You can search for a specific location in the search bar.

It's also possible to choose the relevance of each point, which is useful when you have more than one point.

## Map tab

The Map tab allows you to move a point by dragging its marker and dropping it on the new location.

## List tab

The List tab allows you to visualize all the created points and delete a specific point.

## Visualizing a map with geolocated posts

Map with geolocated posts contain markers on the localization of each post. Clicking on them will open a popup with its title and publication date. Clicking on the title will take you to the post itself.

# Map shortcode

A map can be inserted on any page or post using the `jeo-map` shortcode.

The shortcode accepts three attributes:

* `map_id` (required): The ID of the map you want to insert;
* `width` (optional): The width of the map. It'll default to 600px or whatever the active theme defines for the 'div.jeomap' CSS class;
* `height` (optional): The height of the map. Will default to 600px or whatever the active theme defines for the 'div.jeomap' CSS class.

Examples:

    [jeo-map map_id=99]

You have to inform at least the ID of the Map you want to insert. By default, it will be inserted with a size of 600&times;600px (or whatever the active theme defines), but you can also change it:

    [jeo-map map_id=99 width="800px" height="800px"]

# Map block

After creating maps, it is possible to display them apart or inside a block. This functionality makes possible to group maps, increasing your post organization.

## Displaying a map apart

When creating a new post, note that is available a new block category: **JEO**.

Selecting **JEO Map** block, you can search for any map you've created.

With a map selected, it is possible to choose an optional alignment (`Left`, `Right`, `Centre`, `Wide Width` or `Full Width`). `Centre` is the standard alignment.

## Displaying grouped maps

Besides the alignment option, there's also a group functionality available to arrange maps.

## Visualizing a map into a post

If your map has more than one layer, you can swap them and select which one do you want to see, depending on the map layer settings.

# One-time map block

It is possible to use maps into posts without having to create a new map or using an existing one. For this, JEO plugin makes available another type of block: **One-time map**.

When creating a new post, note that is available a new block category: **JEO**.

Selecting **JEO One-time Map** block, a standard map preview will appear. This type of map allow all the same customizations of a normal JEO Map, such as: modifying coordinates, zoom settings, related posts, alignment options and layers settings.

# Embedding a map

JEO plugin allows a map to be inserted into a post by pasting a link on the editor. This is what is called `Embed map` and it's very easy to be done.

When editing a Map, one of the setting panels is `Status & Visibility`. There you can find the `embed URL` of that specific map.

Copying this link and pasting on the post editor will result on an embed map.

**Warning**: If your post displays a *Not Found* error, do the following steps:

1. Go to WordPress Dashboard > Settings > Permalinks;
2. Change the Common Settings (you may change to a different setting and then change back to the original) and click on `Save Changes`.

Now you should be able to see the embed maps with no problems.

== Developer documentation ==

= Tutorials =

# Adding new Layer Types

## Introduction

In JEO, maps are rendered using the [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/api/) JavaScript library. Any new layer type will have to interact with this library to add the layer to the map.

Basically, to add a new layer type, there are 2 simple steps:

1. Register the new Layer type using a PHP hook, informing where is the main JavaScript file of your Layer Type;
2. Create a JavaScript class implementing methods to add the layer to the map and to describe what are the options a layer of this type has.

In short, this is all that is needed to do. In some cases, however, you might need to add extra dependencies to the project. For example, to create a Layer Type to support Carto's vector layers, we might want to add CartoVL (which is an extension to MapboxGL) to the project.

## Creating a new Layer Type

First, let's register a new Layer Type by hooking up in the `jeo_register_layer_types` action:

    add_action('jeo_register_layer_types', function($layer_types) {
        $layer_types->register_layer_type( 'my-layer-type', [ 'script_url' => plugin_dir_url( __FILE__ ) . '/js/layertype.js' ] );
    });

`register_layer_type` method gets 2 parameters.

* Layer type slug - A unique sanitized string (make sure to make it unique)
* Options - An array with the layer type options:
  * `script_url`: Required. The absolute URL to your JavaScript file.
  * `dependecies`: Optional. An array of scripts handles registered using [wp_register_script][(](https://developer.wordpress.org/reference/functions/wp_register_script/)) that should be loaded as a dependency to the layer type main script

That's all you need to do on the PHP side. All the magic happens on the JavaScript.

Now, let's create our `layertype.js` file.

In this file, we are going to register a JavaScript object using the globally available `window.JeoLayerTypes.registerLayerType`.

The first parameter must be the same slug you defined when you registered your Layer Type on the PHP side, and second parameter is an object with, at least, three methods.

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

Your Layer Type object MUST implement at least these three methods.

### getSchema(attributes)

**params**:

* `attributes` - object with the layer attributes (see the section below)

**returns**:

* Promise with json-schema

This method will tell JEO which are the options the user has to fill in when creating a new layer of this type.

For example, a raster tile layer-type might have only a URL. A Mapbox layer has the Style ID and the optional Access token.

This method must return a Promise with a json-schema representation of the layer type options.

This schema must only include layer-type specific information. Every layer, despite its type, has a set of common attributes, such as ID and Name.

For example, the "Tile layer" layer type needs only a URL, so that's how its `getSchema` method will look like.

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

## addStyle(map, attributes)

**params**:

* `map` - the initialized Mapbox [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) object
* `attributes` - object with the layer attributes (See Layer attributes section below)

**returns**:

* The return of a call to [`map.setStyle`](https://docs.mapbox.com/mapbox-gl-js/api/#map#setstyle)

In MapboxGL, every map has a [Style](https://docs.mapbox.com/mapbox-gl-js/style-spec/) as a base layer. This method will add the layer as the Map Style, using the [setStyle](https://docs.mapbox.com/mapbox-gl-js/api/#map#setstyle) method of the [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) object.

This method will be invoked when a layer of this type is added to the map as the base layer.

For example, the "Tile Layer" layer type sets the style as a raster layer:

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

**Note**: The `attributes.layer_type_options` object holds all the properties declared in the `getSchema` method. That's why there is a `url` there! (See Layer attributes section below)

## addLayer(map, attributes)

**params**:

* `map` - the initialized Mapbox [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) object
* `attributes` - object with the layer attributes (See Layer attributes section below)

**returns**:

* The return of a call to [`map.addLayer`](https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer)

This method will add the layer to the map using the [addLayer](https://docs.mapbox.com/mapbox-gl-js/api/#map#addlayer) method of the [Map](https://docs.mapbox.com/mapbox-gl-js/api/#map) object.

This method will be invoked when a layer of this type is added to the map.

For example, the "Tile Layer" layer type adds itself as a raster layer:

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

**Note:** This method must verify the value of `attributes.visible` to determine whether this layer should be visible when the map is initialized.

## Layer attributes

As you saw, each of the above methods gets an argument `attributes` as input. This argument holds all the information of the layer the user is editing or viewing.

Some attributes are common to any layer types, and others that are specific to a layer type. Every layer type-specific attribute a layer has is stored under the `layer_type_options` attributes.

So these are the keys available in the `attributes` object:

* `layer_id`: (integer) A unique ID that represents this layer and identify it in the database
* `layer_name`: (string) The layer name, given by the user
* `visible`: (boolean) A flag indicating whether this layer should be visible when the map initializes
* `layer_type_options`: (object) A object with all the layer type-specific attributes (those registered in the `getSchema` method)

# Geographical Information of a post

Each post can be related to one or more points on the map.

For each point, JEO collects geographical information such as city and country names.

## How geographical information is stored

Each related point is stored as one entry of the `_related_point` metadata key. Each entry is an object with all the information retrieved by the geocoder.

Here is an example of two entries related to the same post, that could be get using:

    get_post_meta( $post_id, '_related_point' );

    '_related_point' => [
        'relevance' => 'primary',
        '_geocode_lat' => '-23,54659435',
        '_geocode_lon' => '-46,644533061712',
        '_geocode_full_address' => 'Edifício Copan, Rua Araújo, Vila Buarque, República, São Paulo, Região Imediata de São Paulo, Região Metropolitana de São Paulo, Região Intermediária de São Paulo, São Paulo, Região Sudeste, 01046-010, Brasil',
        '_geocode_country' => 'Brasil',
        '_geocode_country_code' => '',
        '_geocode_city' => 'São Paulo',
        '_geocode_region_level_2' => 'São Paulo',
        '_geocode_region_level_3' => 'Região Intermediária de São Paulo',
        '_geocode_city_level_1' => 'Vila Buarque',
    ],
    '_related_point' => [
        'relevance' => 'secondary',
        '_geocode_lat' => '-23,183525102463',
        '_geocode_lon' => '-46,898231506348',
        '_geocode_full_address' => 'Rua Jorge Gebran, Parque do Colégio, Chácara Urbana, Jundiaí, Região Imediata de Jundiaí, Região Intermediária de Campinas, São Paulo, Região Sudeste, 13209-090, Brasil',
        '_geocode_country' => 'Brasil',
        '_geocode_country_code' => '',
        '_geocode_city' => 'Jundiaí',
        '_geocode_region_level_2' => 'São Paulo',
        '_geocode_region_level_3' => 'Região Intermediária de Campinas',
        '_geocode_city_level_1' => 'Parque do Colégio',
    ]

## How to search for posts by geoinformation? (indexes)

When you save geographical information of the points, JEO also creates other metadata that will allow developers to query posts by specific geographical information.

Since each point is stored as a serialized data in the database, this would not allow us to filter posts by `country_code` for example. That's why we create indexes.

For the example above, this post would also have one individual metadata entry for each information, like this:

    [
        '_geocode_lat_p' => '-23,54659435',
        '_geocode_lon_p' => '-46,644533061712',
        '_geocode_country_p' => 'Brasil',
        '_geocode_country_code_p' => '',
        '_geocode_city_p' => 'São Paulo',
        '_geocode_region_level_2_p' => 'São Paulo',
        '_geocode_region_level_3_p' => 'Região Intermediária de São Paulo',
        '_geocode_city_level_1_p' => 'Vila Buarque',
        '_geocode_lat_s' => '-23,183525102463',
        '_geocode_lon_s' => '-46,898231506348',
        '_geocode_country_s' => 'Brasil',
        '_geocode_country_code_s' => '',
        '_geocode_city_s' => 'Jundiaí',
        '_geocode_region_level_2_s' => 'São Paulo',
        '_geocode_region_level_3_s' => 'Região Intermediária de Campinas',
        '_geocode_city_level_1_s' => 'Parque do Colégio',
    ]

Note: `_s` and `_p` suffixes indicate if the relevance of that information is primary or secondary.

Note 2: Full addresses are not indexed

Now we have all the information as individual metadata and this allows me to query by them, however, the pairs are disconnected (if I had more than one primary point, it would be impossible to know what are the latitude-longitude pairs. That's why the information we actually use is the serialized object).

### Fetching posts by geoinformation

Give me all the posts that have primary points with the country code `'BR'`:

    $posts = new WP_Query([
        'meta_query' => [
            [
                'key' => '_geocode_country_code_p',
                'value' => 'BR'
            ]
        ]
    ]);

Give me all the posts whose city is `'Manaus'`:

    $posts = new WP_Query([
        'meta_query' => [
            [
                'key' => '_geocode_city_s',
                'value' => 'Manaus'
            ],
            [
                'key' => '_geocode_city_p',
                'value' => 'Manaus'
            ],
            'relation' => 'OR'
        ]
    ]);

# Writing a Geocoder

A Geocoder is a service that finds geographical coordinates from a search by address information. It's also able to get address details based on the geographical coordinates, which is called Reverse Geocoding.

JEO needs a geocoder service in a few situations, such as when users indicate to where on a map a story (posts) is related.

JEO comes with two native geocoder services users can choose from: Nominatim and Google. But new services can easily be added by plugins. This page documents how to do this.

## Registering a Geocoder

Hook a function to the `jeo_register_geocoders` action and call the register with the following code:

    add_action('jeo_register_geocoders', function($geocoders) {

        $geocoders->register_geocoder([
            'slug' => 'my-geocoder',
            'name' => 'My Geocoder',
            'description' => __('My Geocoder description', 'my-textdomain'),
            'class_name' => 'MyGeocoderClass'
        ]);

    });

This will tell JEO that there is a new Geocoder service available and give some information about it.

* Name and description will be used in the Administration panel so the admin can recognize and choose from the available Geocoders which one is to be used.
* slug needs to be a unique identifier for the geocoder
* class_name is the name of the Geocoder class

## Creating the Geocoder class

Now we need to create the geocoder class. This will be a class that extends `\Jeo\Geocoder` and implement some methods that do the actual geocoding.

Inside the same hook, declare the class and two required methods:

* `geocode($search_string)` The method that receives the search string, does the request to the geocoder servers and returns the coordinates and address details;
* `reverse_geocode($lat, $lon)` The method that receives latitude and longitude, requests the geocoder server, and returns the full location details in the same format as the `geocode` method does.

While `geocode()` returns an array of search results, `reverse_geocode()` returns only one result.

Each result is an array that must have only the keys expected by the JEO plugin, so each Geocoder must find the best correspondence between each field and the fields expected by JEO.

Note: Only `lat` and `lon` are required.

Sample response with all accepted fields:

    [
            [
                'lat' => '',
                'lon' => '',
                'full_address' => '',
                'country' => '',
                'country_code' => '',
                'region_level_1' => '',
                'region_level_2' => '', // State goes here
                'region_level_3' => '',
                'city' => '',
                'city_level_1' => '',
            ]
    ]

Here is a simple example:

    add_action('jeo_register_geocoders', function($geocoders) {

        $geocoders->register_geocoder([
            'slug' => 'my-geocoder',
            'name' => 'My Geocoder',
            'description' => __('My Geocoder description', 'my-textdomain'),
            'class_name' => 'MyGeocoderClass'
        ]);

        class MyGeocoderClass extends \Jeo\Geocoder {

            public function geocode($search_string) {

                $params = [
                    'q' => $search_string,
                    'format' => 'json',
                    'addressdetails' => 1
                ];

                $r = wp_remote_get( add_query_arg($params, 'https://my-geocoder-server.org/search') );

                $data = wp_remote_retrieve_body( $r );

                $data = \json_decode($data);
                $response = [];

                if (\is_array($data)) {

                    foreach ($data as $match) {
                        $r = $this->format_response_item( (array) $match );
                        if ($r) $response[] = $r;
                    }

                }

                return $response;

            }

            public function reverse_geocode($lat, $lon) {

                $params = [
                    'lat' => $lat,
                    'lon' => $lon,
                    'format' => 'json',
                    'addressdetails' => 1
                ];

                $r = wp_remote_get( add_query_arg($params, 'https://my-geocoder-server.org/reverse') );

                $data = wp_remote_retrieve_body( $r );

                $data = \json_decode($data);

                return $this->format_response_item( (array) $data );

            }

            private function format_response_item($match) {

                $response = [
                    'lat' => $match['lat'],
                    'lon' => $match['lon'],
                    'full_address' => $match['display_name'],
                    'country' => $match['country'],
                    'country_code' => $match['country_code'],
                    'region_level_1' => $match['region_level_1'],
                    'region_level_2' => $match['region_level_2'], // State goes here
                    'region_level_3' => $match['region_level_3'],
                    'city' => $match['city'],
                    'city_level_1' => $match['city_level_1'],
                ];

                return $response;

            }

        }

    });

And that's it! Your new Geocoder is ready!

## Adding additional Settings to the Geocoder

Some geocoder services might need or offer additional settings. Some might require the user to enter its API key, others might let the users restrict the search to a specific country to get better results when searching.

You can also easily add new settings to your Geocoder that will automatically be presented to the user on the Settings page.

Declare a method `get_settings()` in your class that will return an array of all the settings your Geocoder accepts.

Each setting is described by an array with the following keys:

* `slug`: a slug for your option. You don't have to worry about naming conflicts, it will be stored inside your geocoders options;
* `name`: a human-readable name;
* `description`: an explanation to the user of what this setting is.

Let's see an example only with the relevant code:

    add_action('jeo_register_geocoders', function($geocoders) {

        // ...
        class MyGeocoderClass extends \Jeo\Geocoder {

            // ...

            public function get_settings() {

                // Note it is an array of arrays
                return [
                    [
                        'slug' => 'api_key',
                        'name' => __('API Key', 'my-text-domain'),
                        'description' => __('Enter the API key you can get visiting your panel at my-gecoder.org/panel', 'my-text-domain')
                    ]
                ];

            }

        }

    });

And this is what you will see in the admin panel:

## Accessing Settings values

Now that you have registered a setting and the user can change its value in the admin panel, you can use it in your geocoder.

To get its value, simply call `$this->get_option($option_name)`.

Example:

    // ...

            // ...

            public function geocode($search_string) {

                $params = [
                    'q' => $search_string,
                    'format' => 'json',
                    'addressdetails' => 1,
                    'api_key' => $this->get_option('api_key')
                ];

                // ...

                return $response;

            }

    // ...

## Declaring default values

You can also add the `get_default_options()` method to your class to set default values for each setting. This is optional and is done like this:

    add_action('jeo_register_geocoders', function($geocoders) {

        // ...
        class MyGeocoderClass extends \Jeo\Geocoder {

            // ...

            public function get_default_options() {

                return [
                    'api_key' => 'sand-box-api-key' // the key must match the slug of the setting registered in get_settings()
                ];

            }

        }

    });

## Advanced: Even further settings customization

If your geocoder needs some special settings that a simple text input won't handle, there is yet another method you can declare to add arbitrary HTML code to the Settings page.

`settings_footer($settings)` must echo HTML code that will be rendered at the end of your Geocoder settings page.

It received the `$settings` object, which is an instance of `\Jeo\Settings` and have some helpers you can use.

You only need to print form fields with the right names and JEO will take care of saving them for you.

To get the right field name use `$settings->get_geocoder_option_field_name($name)`.

Example:

    // ...

            // ...

            public function settings_footer($settings) {

                ?>
                <p><strong>My Select option</strong></p>

                <select name="<?php echo $settings->get_geocoder_option_field_name('new_option'); ?>">
                    <option value="yes" <?php selected( $this->get_option('new_option'), 'yes' ); ?> >
                        Yes
                    </select>
                    <option value="no" <?php selected( $this->get_option('new_option'), 'no' ); ?> >
                        No
                    </select>
                </select>
                <?php

            }

    // ...

Note: `selected()` is a native WordPress function. See the [official documentation](https://developer.wordpress.org/reference/functions/selected/)

= Differences between the old and the present JEO =

# Migration

Notes on changes in DB structure from old JEO that will need to have migrations written.

## Geocode `post_meta`

On old JEO, some `meta_key`s are prefixed by an underscore (`_`) and others aren't:

- `geocode_address`
- `geocode_latitude`
- `geocode_longitude`
- `_geocode_city`
- `_geocode_country`
- `geocode_viewport`

Let's have them all with a underscore at the beginning.
