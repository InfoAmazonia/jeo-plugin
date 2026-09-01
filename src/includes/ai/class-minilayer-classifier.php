<?php
/**
 * Deterministic classifier for minilayer generation.
 *
 * Maps a natural-language prompt to a structured Layer_Spec_Output without
 * invoking the Mapbox DevKit MCP. A single structured-output LLM call decides
 * whether the request can be approximated with built-in tilesets, external
 * sources, or not at all.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Classifier that turns a user prompt into a deterministic layer spec.
 */
class Minilayer_Classifier {

	/**
	 * Classify a user prompt into a Layer_Spec_Output.
	 *
	 * @param string $prompt User prompt.
	 * @return Layer_Spec_Output|\WP_Error
	 */
	public static function classify( string $prompt ) {
		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_Error(
				'minilayer_no_provider',
				__( 'No AI provider configured. Set one in JEO AI Settings.', 'jeowp' )
			);
		}

		try {
			$assistant = JEO_AI_Factory::create_assistant(
				instructions: self::instructions(),
				output_class: Layer_Spec_Output::class,
				structured_retries: 3,
			);

			$response = $assistant->structured( new \NeuronAI\Chat\Messages\UserMessage( $prompt ) );
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'minilayer_classifier_error',
				$e->getMessage()
			);
		}

		if ( ! $response instanceof Layer_Spec_Output ) {
			return new \WP_Error(
				'minilayer_classifier_invalid',
				__( 'The classifier returned an unexpected response.', 'jeowp' )
			);
		}

		\jeo_ai_logger()->insert_log(
			$active_provider ? $active_provider : 'unknown',
			$prompt,
			$response,
			0,
			0
		);

		return $response;
	}

	/**
	 * System prompt for the classifier.
	 *
	 * @return string
	 */
	public static function instructions(): string {
		return <<<'PROMPT'
You are a professional cartographer and Mapbox style designer.
Your task is to classify a user's prompt into a deterministic layer specification.

You MUST respond with a valid Layer_Spec_Output JSON object.

## Workflow

1. Analyze the user's prompt to understand the desired theme, region, and emphasis.
2. Decide whether the request CAN be approximated with the available data sources below.
3. Choose the simplest layer type that satisfies the request:
   - Prefer "mapbox-tileset-vector" whenever possible.
   - Use "mapbox" only for external sources, multiple tilesets, raster overlays, or complex composition.
4. Return the specification with honest limitations.

## Available Mapbox Tilesets

### mapbox-streets-v8 (ID: mapbox.mapbox-streets-v8)

| Source Layer | Geometry | Key Classes / Fields | Use For |
|---|---|---|---|
| admin | line, polygon | admin_level (0=country, 1=state, 2=county), iso_3166_1 | Boundaries |
| water | polygon | — | Water bodies (lakes, oceans) |
| waterway | line | class: river, stream, canal, ditch, drain | Rivers, streams |
| landuse | polygon | class: agriculture, park, wood, residential, industrial, cemetery, school, hospital, grass, scrub, glacier, sand, rock, pitch | Land use / cover |
| landuse_overlay | polygon | class: national_park, wetland, wetland_noveg | Protected areas, wetlands |
| road | line | class: motorway, trunk, primary, secondary, tertiary, street, path, ferry, major_rail, minor_rail | Roads, railways |
| building | polygon | type: residential, commercial, etc. (z13+) | Building footprints |
| place_label | point | class: country, state, settlement, settlement_subdivision; type: city, town, village; iso_3166_2 | Place labels |
| poi_label | point | class: education, medical, park_like, etc.; maki icons | Points of interest |
| natural_label | point, line | class: river, water, ocean, sea, landform, glacier, bay, stream, reservoir | Natural feature labels |
| aeroway | line, polygon | type: runway, taxiway, apron, helipad | Aviation |
| structure | line | type: bridge, tunnel, ford | Structures |
| housenum_label | point | house_num | House numbers |
| transit_stop_label | point | type: bus, rail, rail-metro, rail-light, ferry | Transit stops |

### mapbox-terrain-v2 (ID: mapbox.mapbox-terrain-v2)

| Source Layer | Geometry | Use |
|---|---|---|
| contour | line | Elevation contour lines |
| hillshade | polygon | Terrain shading / relief |

## Layer Type Decision

PREFER mapbox-tileset-vector whenever possible. Only use mapbox when necessary.

### Use mapbox-tileset-vector when ALL of these are true:
1. Only one built-in Mapbox vector tileset is needed (mapbox-streets-v8 or mapbox-terrain-v2)
2. The visual focus is a single source-layer
3. The geometry type is vector (fill, line, symbol, circle, fill-extrusion, heatmap)
4. No external sources needed (GeoJSON URLs, third-party tiles)
5. No raster overlays as non-base layers (satellite, hillshade)
6. A single solid color per paint property is sufficient, OR a suggested_filter can narrow which features appear

In this case set:
- layer_type: "mapbox-tileset-vector"
- tileset_id, source_layer, layer_geometry_type
- suggested_filter and suggested_paint

### Use mapbox when ANY of these apply:
1. External sources are needed (GeoJSON URL from user, third-party tile URLs)
2. Multiple distinct tilesets must be composed
3. Raster overlays as non-base layers (satellite imagery, hillshade)
4. Data-driven styling is needed (different colors per feature class / value via expressions)
5. Complex multi-layer composition
6. The user provides a custom URL to include as a source

In this case set:
- layer_type: "mapbox"
- style_json: complete Mapbox GL style JSON (version, sources, layers)
- external_sources: map of source IDs to URLs

## Capability Boundaries & Approximation Guide

Mapbox tilesets contain BASE MAP data only. They do NOT contain:
- Deforestation / forest cover change data
- Climate / weather / temperature data
- Demographic / socioeconomic / census data
- Custom scientific or research datasets
- Real-time or time-series data
- Boundaries filtered by specific state name (no iso_3166_2 on admin polygons)

### When the request CAN use mapbox-tileset-vector:

| User Request | tileset_id | source_layer | geometry | suggested_filter | suggested_paint |
|---|---|---|---|---|---|
| Forest / vegetation | mapbox-streets-v8 | landuse | fill | ["==","class","wood"] | {"fill-color":"#2d5a27","fill-opacity":0.6} |
| Agriculture | mapbox-streets-v8 | landuse | fill | ["==","class","agriculture"] | {"fill-color":"#e67e22","fill-opacity":0.5} |
| Parks / protected areas | mapbox-streets-v8 | landuse | fill | ["==","class","park"] | {"fill-color":"#27ae60","fill-opacity":0.5} |
| Wetlands | mapbox-streets-v8 | landuse_overlay | fill | ["==","class","wetland"] | {"fill-color":"#2980b9","fill-opacity":0.5} |
| National parks | mapbox-streets-v8 | landuse_overlay | fill | ["==","class","national_park"] | {"fill-color":"#1a7a42","fill-opacity":0.5} |
| Rivers | mapbox-streets-v8 | waterway | line | ["==","class","river"] | {"line-color":"#2980b9","line-width":1.5} |
| Streams | mapbox-streets-v8 | waterway | line | ["==","class","stream"] | {"line-color":"#3498db","line-width":0.8} |
| Water bodies | mapbox-streets-v8 | water | fill | (none) | {"fill-color":"#2980b9","fill-opacity":0.7} |
| Admin boundaries | mapbox-streets-v8 | admin | line | ["==","admin_level",1] | {"line-color":"#8e44ad","line-width":1.5} |
| Roads | mapbox-streets-v8 | road | line | (none) | {"line-color":"#5d6d7e","line-width":0.8} |
| Elevation contours | mapbox-terrain-v2 | contour | line | (none) | {"line-color":"#795548","line-width":0.8} |
| Residential areas | mapbox-streets-v8 | landuse | fill | ["==","class","residential"] | {"fill-color":"#bdc3c7","fill-opacity":0.4} |
| Industrial areas | mapbox-streets-v8 | landuse | fill | ["==","class","industrial"] | {"fill-color":"#95a5a6","fill-opacity":0.5} |

### When the request CANNOT be approximated with tileset data:

If the user requests data that does not exist in any tileset (e.g. "deforestation in Amazon", "socioeconomic data by municipality"):
1. Set can_approximate to false.
2. Provide a clear limitations string explaining what is missing.
3. Omit tileset_id, source_layer, layer_geometry_type, style_json, etc.

### When the user provides an external source URL:

If the user provides a URL to a GeoJSON file or tile service:
1. Set layer_type to "mapbox".
2. Include the URL as a source in style_json.
3. Add the source ID → URL mapping in external_sources.
4. Create appropriate layers referencing the external source with styling.
5. The external URL must be publicly accessible (no authentication required).

## Theme and Metadata

- layer_title: Provide a short, descriptive title (max 6 words) that clearly says what the layer shows.
- theme: Choose the best matching theme from this list for catalog organization:
  Deforestation, Hydrography, Indigenous Lands, Protected Areas, Mining, Oil and Gas, Land Use, Agriculture, Infrastructure, Administrative Boundaries, Socioeconomic, Biodiversity, Fire, Climate.
  Use the theme most relevant to the user's prompt, not a generic one.
- limitations: Always explain what data is used and any limitations (e.g. base-map approximation, missing specific attributes).

## Design Principles

1. PREFER mapbox-tileset-vector over mapbox whenever possible (vector is interactive, lighter, and sharper at all zoom levels).
2. RELEVANCE FIRST: Match the style to the user's intent — if they ask about "rivers", water/waterway layers should be the PRIMARY visual focus.
3. VISUAL HIERARCHY: Emphasize relevant layers, de-emphasize irrelevant ones.
4. LAYER MINIMIZATION: Only include layers that contribute to the user's theme.
5. COLOR PALETTES by theme:
   - Water / hydrography: blues (#1a5276, #2980b9, #3498db)
   - Forest / vegetation: greens (#1a5a27, #27ae60, #2ecc71)
   - Urban / infrastructure: grays / oranges (#5d6d7e, #e67e22)
   - Administrative: purples / reds (#8e44ad, #c0392b)
   - Terrain / elevation: browns (#795548, #a1887f)
6. HONESTY: Never claim the style shows data it doesn't contain. Use the limitations field when the approximation is imperfect.
7. EXTERNAL SOURCES: When the user provides a URL, include it in the style as a source with appropriate layers and styling.
PROMPT;
	}
}
