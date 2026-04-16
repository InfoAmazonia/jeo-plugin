=== JEO Maps ===
Contributors: infoamazonia
Tested up to: 6.9
Stable tag: 3.0.0-rc.3
Requires PHP: 8.0
Requires at least: 6.6
License: GPL-3.0-only
License URI: https://github.com/InfoAmazonia/jeo-plugin/blob/main/LICENSE
Version: 3.0.0-rc.3

Geojournalism platform for building maps, geolocating posts, and publishing interactive storymaps in WordPress.

== Description ==

JEO helps newsrooms build interactive maps, geolocate posts, and publish storymaps inside WordPress.

== Installation ==

1. Upload `jeo.php` to the `/wp-content/plugins/` directory;
2. Activate the plugin through the 'Plugins' menu in WordPress;
3. Select JEO on the admin menu.

There, you can configure:
* The map rendering library (MapLibreGL by default, or MapboxGL loaded externally from Mapbox);
* The default latitude, longitude, and zoom for your maps;
* The [Mapbox API key](https://docs.mapbox.com/help/how-mapbox-works/access-tokens), only required if you select MapboxGL or use Mapbox-hosted layers;
* The geocoder that'll be used by the plugin -- currently only [Nominatim](https://nominatim.openstreetmap.org) is available by default;

After activating the plugin, a new item will appear on the WordPress dashboard: a menu containing the **Maps** and **Layers** post types, and the JEO settings menus.

JEO includes:
* [MapLibreGL](https://maplibre.org/maplibre-gl-js/docs/) by default, with optional external [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/);
* Support for Mapbox-hosted layers, custom tile layers, and layer filtering;
* Geocoded posts via [Nominatim](https://nominatim.org/);
* Customizable marker icons;
* Support for [WPML](https://wpml.org/pt-br/) and [Polylang](https://br.wordpress.org/plugins/polylang/).

== Frequently Asked Questions ==

= Which WordPress and PHP versions are validated? =

Compatibility snapshot validated on March 17, 2026:

* Primary support: PHP 8.2, 8.3, and 8.4;
* Experimental monitoring: PHP 8.5;
* Stable WordPress gate: WordPress 6.9.4 on PHP 8.2, 8.3, and 8.4;
* Experimental WordPress gate: WordPress 6.9.4 on PHP 8.5;
* Backward-compatibility smoke tests: WordPress 6.6 on PHP 8.0 and 8.1;
* Forward-compatibility smoke tests: WordPress 7.0-beta4 on PHP 8.2, 8.3, 8.4, and experimentally on PHP 8.5;
* Repository test scripts include static PHP 8.5 checks and experimental WordPress smoke coverage on PHP 8.5.

= Which third-party services can JEO connect to? =

JEO can connect to the following third-party services:

* Mapbox, only when you select Mapbox as the rendering library or use Mapbox-hosted map resources. The site loads JavaScript/CSS from `api.mapbox.com`, and Mapbox receives the configured access token, visitor IP address, browser details, and requested map resources. Terms of Service: [https://www.mapbox.com/legal/tos](https://www.mapbox.com/legal/tos). Privacy Policy: [https://www.mapbox.com/legal/privacy](https://www.mapbox.com/legal/privacy).
* Nominatim (OpenStreetMap), only when an editor explicitly runs an address search or reverse-geocodes a point in the post geolocation UI. The typed address or selected coordinates, the site URL in the request user agent, and the server IP address are sent to `nominatim.openstreetmap.org`. Usage Policy: [https://operations.osmfoundation.org/policies/nominatim/](https://operations.osmfoundation.org/policies/nominatim/). Privacy Policy: [https://osmfoundation.org/wiki/Privacy_Policy](https://osmfoundation.org/wiki/Privacy_Policy).
* OpenStreetMap raster tiles, used by the default MapLibre preview style. The tile service receives the visitor IP address, browser details, and requested tile URLs. Tile Usage Policy: [https://operations.osmfoundation.org/policies/tiles/](https://operations.osmfoundation.org/policies/tiles/). Privacy Policy: [https://osmfoundation.org/wiki/Privacy_Policy](https://osmfoundation.org/wiki/Privacy_Policy).
* Optional external typography and footer logo URLs, only when the site administrator explicitly configures those fields with an external host. In that case the visitor browser requests the asset directly from the chosen host, which may receive the visitor IP address, browser details, and referrer according to that provider's own terms and privacy policy.

== Third Party Services ==

See "Which third-party services can JEO connect to?" in the FAQ above for the required service disclosures.

== Screenshots ==
1. Map being displayed in a post
2. One-time map block
3. Layer interactions
4. Map with geolocated post
5. Geolocating a post
6. Layer post type
7. Map post type

== Changelog ==

= 3.0.0 =
This is a major release. Here are some highlights:
* Support for MapLibreGL as an alternative rendering library (for compatibility, MapboxGL is still the default library)
* When using MapLibreGL without Mapbox-hosted layers, the use of Mapbox API key is not required anymore
* Removed support for Carto integration (reducing plugin size in ~60%)

Full changelog:
* Support for MapLibreGL  as an alternative rendering library
* When using MapLibreGL without Mapbox-hosted layers, the use of Mapbox API key is not required anymore
* Improved performance in Gutenberg editors
* Upgraded `react-map-gl` library
* BREAKING: Removed support for Carto integrations
* BREAKING: Replaced [`mapboxgl-spiderifier`](https://github.com/bewithjonam/mapboxgl-spiderifier) with more modern [`map-gl-js-spiderfy`](https://github.com/nazka/map-gl-js-spiderfy) as default spiderifier library; `MapboxGLMapboxglSpiderifier` global variable is not available anymore, being replaced by `Spiderfy` global variable (with different API)
* BREAKING: Some JS and CSS assets had their handles renamed to better reflect the new architecture
* BREAKING: When using MapLibreGL, some CSS classes use the `maplibregl-` instead of the `mapboxgl-` prefix

= 2.15.2 =
* bugfix: Popup behavior when there's more than one mouseover interaction

= 2.15.1 =
* Auto-enqueue Jeo assets when using embedded-storymap block
* bugfix: Ensure interactions are added to the correct style layer

= 2.15.0 =
* Upgrade MapboxGL

= 2.14.1 =
* bugfix: Regression in layers pagination inside storymap editor

= 2.14.0 =
* Optimize the loading speed of storymaps editor
* Optimize the size of saved storymaps (up to ~50%)

= 2.13.1 =
* Fix preview on posts geolocation

= 2.13.0 =
* Support for Co-Authors for `map` and `postmap` post types
* Initial support for right-to-left UIs

= 2.12.6 =
* bugfix: Fix layer insertion bug when interactive style is not bottommost style layer

= 2.12.5 =
* bugfix: Fix position handling on storymap editor

= 2.12.2 =
* bugfix: Fix regression on updating `mapbox-tileset-vector` layers

= 2.12.1 =
* bugfix: Fix bugs on saving legends changes

= 2.12.0 =
* Consume MapboxGL from CDN
* bugfix: Fix max zoom for cluster layer

= 2.11.2 =
* bugfix: Fix regression on interactions loading

= 2.11.1 =
* Improve rendering of maps and storymaps

= 2.11.0 =
* Upgrade to MapboxGL v3
* Replace react-mapbox-gl with react-map-gl
* Improve rendering of pages with many maps
* bugfix: Improve rendering of maps that require custom Mapbox access tokens
* bugfix: Fix pagination of stories on discovery page

= 2.10.0 =
* Update dependencies

= 2.9.3 =
* Add support for more syntax in EJS templates, via [eta](https://eta.js.org/docs/intro/template-syntax)
* bugfix: Fix a regression that made popup template compilation fail
* bugfix: Fix a warning on some wp-admin pages

= 2.9.2 =
* Update dependencies
* Add missing translations

= 2.9.1 =
* bugfix: Fix story map size on new Chrome browsers

= 2.9.0 =
* Add support for PHP 8.2
* Allow moving markers away from a found address

= 2.8.2 =
* bugfix: Always show spiderifier on max zoom

= 2.8.1 =
* bugfix: Layer/legend toggle of switchable layers

= 2.8.0 =
* Initialize lazily maps and story maps

= 2.7.8 =
* bugfix: Don't send nonces for unlogged requests
* bugfix: Admin menu icon

= 2.7.3 =
* bugfix: Map embeds not working on Firefox
* bugfix: Fix some deprecations

= 2.7.2 =
* bugfix: Avoid rendering Yoast-powered invalid JSON

= 2.7.1 =
* Include over 400+ default colors to the story map colors palette

= 2.7.0 =
* Use legends colors on the story map colors palette

= 2.6.3 =
* bugfix: Search of layers on interactions modal

= 2.6.2 =
* Allow HTML embeds inside story maps

= 2.6.1 =
* bugfix: Rendering problems in attribution links and popups

= 2.6.0 =
* Allow uploading images and embedding videos to the story map editor

= 2.5.4 =
* Add support for TMS raster layers
* Add more text formatting options to the story map editor

= 2.5.2 =
* bugfix: Remove warning if WPML plugin is not enabled

= 2.5.0 =
* Add a new block for embedded story maps
* Generate URLs for embedding story maps inside posts
* Many improvements in editing and viewing story maps

= 2.4.1 =
* bugfix: Remove PHP short tag open in templates/map-content-layers-list.php (<? instead <?php )

= 2.4.0 =
* feature: Add spiderifier effect to open clusters with features with the same coordinates

= 2.3.1 =
* bugfix: Cluster zoom on click
* feature: Pin/cluster mouse over effect (change cursor style)

= 2.3.0 =
* Add 'jeomap_js_images' and 'jeomap_js_cluster' filters to change markers style

= 2.2.7 =
* Add window.JeoInitMaps() JavaScript function to init maps

= 2.2.6 =
* Show geolocate sidebar to another post types

= 2.2.5 =
* Improve custom post-type geo localization

= 2.2.4 =
* Fix related posts pin when the site has less than 101 posts

= 2.2.3 =
* Add option to set post types to load jeomap assets
* Add filter jeo_should_load_assets for enabled/disabled load assets

= 2.2.0 =
* Add window.jeomaps global for third-party plugins/themes to be able to manipulate map object

= 2.1.1 =
* Tenth Release

= 2.0.0 =
* Ninth release.
JEO Plugin was updated to be compatible with WordPress version > 5.6.0.

= 1.3.0 =
* Eighth release.

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

One of the custom post types that the JEO plugin provides is **Layer**. Is in the layer where you will be able to add legend and color to your map. A map may contain one or more layers.

Entering the Layer post editor, you'll see a preview of the current layer (or a default layer if the current layer hasn't been edited yet) and two sidebar panels: **Settings** and **Legend**.

## Layer settings

On the **Layer settings** panel, you can change the layer type.

JEO supports for layer types out-of-the-box:

* [Mapbox styles](https://docs.mapbox.com/studio-manual/overview/map-styling/);
* [Mapbox tilesets](https://docs.mapbox.com/help/glossary/tileset/);
* [Mapbox vector tiles](https://docs.mapbox.com/vector-tiles/reference/) (MVTs);
* [TileLayers](https://en.wikipedia.org/wiki/Tiled_web_map).

You can also inform an address, following the standard `username/id`, to compose your map style. If an access token is needed for this layer, you can put it into the `Acess token` input.

There's also an **Edit interactions** button. Here, you can add popups to your layer when specific actions (clicking or hovering the mouse) are made (e.g.: Clicking on a building and displaying its height)

On the **Layer legend** panel, you can add legends to your layer (bar scale, simple color, icons or circles) and colorize them.

= How to create a map? =
# Creating maps

One of the custom post types that the JEO plugin provides is **Map**.

Entering the Map post editor, you'll see a preview of the current map (or a default map, if no layers are selected) and three sidebar panels: **Map settings**, **Map layers**, and **Related posts**.

On the **Map settings** panel, you can change the initial center of the map setting a latitude and longitude. You can also change the default zoom settings or even disable it.

When visualizing a map in a post, right-clicking and dragging it makes the map rotate. Also, scrolling the mouse wheel changes the map zoom. Both of these options can be enabled or disabled.

## Map layers

On the **Map layers** panel, you can visualize all the layers which are part of the map.

Clicking on the **Edit layers settings**, a popup will open. In there, you can add, remove and rearrange layers, define their types and whether their legends will be shown on the map.

A legend can be of one of these types:

* **Fixed**: the layer will always be shown on the map;
* **Switchable**: the layer visibility can be toggled on and off;
* **Swappable**: only one swappable layer can be visible at a time.

## Related posts

On the **Related posts** panel, you can set which geolocated posts will be used as markers on the post. You can filter the posts by categories, tags, dates interval or, for advanced uses, meta queries using WordPress `post_meta`.

= Where can I find more tutorials and developer documentation? =

Visit [https://www.jeowp.org/](https://www.jeowp.org/) for user guides, publishing tips, and developer extension examples.

= Why do I see a "memory exhausted" fatal error when editing a storymap? =

One likely reason is that the Gutenberg editor is loading too many revisions of the post. We recommend keeping only the last 5 revisions for each storymap; see [Jetpack documentation](https://jetpack.com/resources/wordpress-revisions/) for more details.

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

A Geocoder is a service that finds geographical coordinates from a search by address information. It's also able to get address details based on geographical coordinates, which is called Reverse Geocoding.

JEO needs a geocoder service in a few situations, such as when users indicate to where on a map a story (posts) is related.

JEO ships with Nominatim as its native geocoder. Additional geocoders can be added by plugins through the `jeo_register_geocoders` hook. This page documents how to do this.

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
* `reverse_geocode($lat, $lon)` The method that receives latitude and longitude, requests the geocoder server and returns the full location details in the same format as the `geocode` method does.

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
                    'api_key' => 'sand-box-api-key' // The key must match the slug of the setting registered in get_settings()
                ];

            }

        }

    });

## Advanced: Even further settings customization

If your geocoder needs some special settings that a simple text input won't handle, there is yet another method you can declare to add arbitrary HTML code to the Settings page.

`settings_footer($settings)` must echo the HTML code that will be rendered at the end of your Geocoder settings page.

It received the `$settings` object, which is an instance of `\Jeo\Settings` and has some helpers you can use.

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
