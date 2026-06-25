=== JEO Maps ===
Contributors: infoamazonia
Tags: maps, geolocation, gutenberg, storymap, map, geocoding, journalism, interactive-maps, blocks, openstreetmap, news, maplibre
Tested up to: 7.0
Stable tag: 3.6.5
Requires PHP: 8.2
Requires at least: 6.6
License: GPL-3.0-only
License URI: https://www.gnu.org/licenses/gpl-3.0.html
Version: 3.6.5

Geojournalism platform for building maps, geolocating posts, and publishing interactive storymaps in WordPress.

== Description ==

JEO helps newsrooms build interactive maps, geolocate posts, and publish storymaps inside WordPress.

== Installation ==

1. Upload the plugin directory to `/wp-content/plugins/`, or install it through Plugins > Add New in WordPress;
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
* Support for [WPML](https://wpml.org/) and [Polylang](https://wordpress.org/plugins/polylang/).

== Frequently Asked Questions ==

= Which WordPress and PHP versions are validated? =

* Primary support: PHP 8.2, 8.3, and 8.4;
* Experimental monitoring: PHP 8.5;
* Stable WordPress gate: WordPress 7.0 on PHP 8.2, 8.3, and 8.4;
* Experimental WordPress gate: WordPress 7.0 on PHP 8.5;
* Backward-compatibility smoke tests: WordPress 6.6 on PHP 8.0 and 8.1;
* Repository test scripts include static PHP 8.5 checks and experimental WordPress smoke coverage on PHP 8.5.

= Which third-party services can JEO connect to? =

JEO can connect to the following third-party services:

* Mapbox, only when you select Mapbox as the rendering library or use Mapbox-hosted map resources. The site loads JavaScript/CSS from `api.mapbox.com`, and Mapbox receives the configured access token, visitor IP address, browser details, and requested map resources. Terms of Service: [https://www.mapbox.com/legal/tos](https://www.mapbox.com/legal/tos). Privacy Policy: [https://www.mapbox.com/legal/privacy](https://www.mapbox.com/legal/privacy).
* Nominatim (OpenStreetMap), only when an editor explicitly runs an address search or reverse-geocodes a point in the post geolocation UI. The typed address or selected coordinates, the site URL in the request user agent, and the server IP address are sent to `nominatim.openstreetmap.org`. Usage Policy: [https://operations.osmfoundation.org/policies/nominatim/](https://operations.osmfoundation.org/policies/nominatim/). Privacy Policy: [https://osmfoundation.org/wiki/Privacy_Policy](https://osmfoundation.org/wiki/Privacy_Policy).
* OpenStreetMap raster tiles, used by the default MapLibre preview style. The tile service receives the visitor IP address, browser details, and requested tile URLs. Tile Usage Policy: [https://operations.osmfoundation.org/policies/tiles/](https://operations.osmfoundation.org/policies/tiles/). Privacy Policy: [https://osmfoundation.org/wiki/Privacy_Policy](https://osmfoundation.org/wiki/Privacy_Policy).
* Optional external typography and footer logo URLs, only when the site administrator explicitly configures those fields with an external host. In that case the visitor browser requests the asset directly from the chosen host, which may receive the visitor IP address, browser details, and referrer according to that provider's own terms and privacy policy.

= Where can I find more tutorials and developer documentation? =

Visit [https://www.jeowp.org/](https://www.jeowp.org/) for tutorials, user guides, and developer documentation.

== Third Party Services ==

See "Which third-party services can JEO connect to?" in the FAQ above for the required service disclosures.

== Screenshots ==
1. Embed interactive maps in posts with reader-facing layer and legend controls.
2. Configure JEO map defaults, post types, rendering library, and Mapbox access settings.
3. Configure layer interactions, popup behavior, and displayed fields in the layer editor.
4. Preview maps and tune zoom, pan, bounds, and public map controls in the map editor.
5. Select map layers, legends, ordering, and interaction behavior in the map editor.
6. Build immersive story maps with narrative text over map-driven scenes.
7. Geolocate posts directly from the WordPress block editor.
8. Browse geolocated stories and map clusters in the Discovery interface.

== Changelog ==

= 3.0.1 =
* Fixed WordPress.org review findings for release metadata, inline style loading, escaped callback output, admin menu placement, REST pagination limits, public embed visibility, and generic Discovery runtime globals.
* Replaced the invalid repository license URL with the official GNU GPLv3 license URL.
* Moved custom CSS output to WordPress enqueue APIs using the `jeo-map` style handle.
* Hardened rendered story map and map layer content escaping.
* Moved the JEO admin menu out of the core admin group.
* Restored native REST pagination limits for map layer collections while keeping the dedicated JEO layer lookup endpoint for selected layer IDs.
* Enforced WordPress-like visibility handling for map and story map embeds, including non-public posts, disabled embeds, and password-protected content.
* Renamed generic Discovery runtime globals to `jeowpLanguageParams` and `jeowpMapPreferences`.

= 3.0.0 =
This is a major release. Here are some highlights:
* MapLibreGL is now the default rendering library, with MapboxGL still available as an optional external runtime.
* A Mapbox API key is no longer required for MapLibre-only maps; Mapbox-hosted layers can still use a configured token.
* Mapbox styles and URLs can be rendered through MapLibreGL when Mapbox-hosted resources are used.
* Carto integration was removed, reducing the plugin size and maintenance surface.
* WordPress block editor support was modernized for the iframe editor, Block API v3, and newer WordPress versions.
* Discovery, storymaps, post geolocation, public map rendering, legends, and editor previews received stability and performance improvements.

Full changelog:
* Added MapLibreGL support across public maps, map blocks, storymaps, Discovery, and editor previews.
* Defaulted new installs to MapLibreGL and kept MapboxGL available as an opt-in external runtime.
* Rewrote Mapbox URLs and transformed Mapbox styles for MapLibreGL compatibility.
* Improved handling of Mapbox-hosted layers, runtime selection, dynamic chunks, markers, clusters, popups, and map controls.
* Removed Carto integrations and bundled Carto assets.
* Improved Gutenberg editor performance for maps, one-time maps, layers, and storymaps.
* Modernized map, layer, and storymap editors for the iframe editor and Block API v3.
* Added inline map and layer previews in post type editors and improved sidebar/document settings behavior.
* Preserved map blocks during editor insertion and fixed template locking, wrapper attributes, and publish/preview regressions.
* Improved public map initialization, numeric map options, bounds, pan limits, aligned map sizing, compact controls, fullscreen behavior, and responsive layouts.
* Improved legend rendering, legend editor controls, runtime UUID handling, layer visibility, and layer description editing.
* Improved Discovery story fetching, filters, clustering, hover behavior, loading states, sharing, embeds, and map parsing.
* Improved post geolocation address updates, accent-insensitive geocoder fallback, and multi-pin modal layout.
* Improved storymap editor stability, rich text editing panels, layer selection hydration, display state, navigation mode, slide ordering, embedded storymap loading, and admin listing performance.
* Upgraded CKEditor, react-map-gl, WordPress scripts, and other frontend dependencies.
* Replaced deprecated WordPress/Gutenberg components and deprecated helper libraries.
* Replaced `react-beautiful-dnd` and other deprecated frontend dependencies.
* Added Portuguese and Spanish locale fallbacks and standardized the i18n build/release flow.
* Added WordPress language file validation, PHP compatibility checks, WordPress smoke tests, Size Limit bundle budgets, Plugin Check validation, and stable release metadata validation.
* Hardened the WordPress.org deployment workflow, including generated release zip publication.
* BREAKING: Removed support for Carto integrations.
* BREAKING: Replaced [`mapboxgl-spiderifier`](https://github.com/bewithjonam/mapboxgl-spiderifier) with the more modern [`map-gl-js-spiderfy`](https://github.com/nazka/map-gl-js-spiderfy) as the default spiderifier library; the `MapboxGLMapboxglSpiderifier` global variable is not available anymore, being replaced by `Spiderfy` with a different API.
* BREAKING: Some JS and CSS asset handles were renamed to better reflect the new architecture.
* BREAKING: When using MapLibreGL, runtime control CSS classes use the `maplibregl-` prefix instead of the `mapboxgl-` prefix.

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

= 3.0.1 =
Maintenance release for WordPress.org review readiness. No manual migration is required.

= 3.0.0 =
Major release: MapLibreGL is now the default renderer, Carto support was removed, and editor/map internals were modernized. Review Mapbox-hosted layers, custom integrations, and any code relying on old Carto or spiderifier APIs before upgrading.

= 0.1.0=
* First release.
