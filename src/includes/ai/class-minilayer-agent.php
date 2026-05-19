<?php
/**
 * Minilayer AI agent — creates Mapbox styles from text prompts via MCP.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\Agent\Agent;
use NeuronAI\Chat\Messages\UserMessage;
use NeuronAI\MCP\McpConnector;
use NeuronAI\Providers\AIProviderInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * NeuronAI agent that connects to the Mapbox DevKit MCP server
 * to generate map styles from natural-language prompts.
 */
class Minilayer_Agent extends Agent {

	/**
	 * Mapbox DevKit MCP hosted endpoint.
	 *
	 * @var string
	 */
	const MCP_ENDPOINT = 'https://mcp-devkit.mapbox.com/mcp';

	/**
	 * Mapbox access token with styles:write scope.
	 *
	 * @var string
	 */
	protected string $mapbox_token;

	/**
	 * Constructor.
	 *
	 * @param string $mapbox_token Mapbox public or secret access token.
	 */
	public function __construct( string $mapbox_token ) {
		$this->mapbox_token = $mapbox_token;
		parent::__construct();
	}

	/**
	 * Return the active JEO AI provider.
	 *
	 * @return AIProviderInterface
	 */
	protected function provider(): AIProviderInterface {
		return Neuron_Factory::get_active_provider( true );
	}

	/**
	 * System prompt for the cartographer agent.
	 *
	 * @return string
	 */
	public function instructions(): string {
		return <<<'PROMPT'
You are a professional cartographer and Mapbox style designer.

Your task is to create beautiful, functional map styles based on the user's text description.

## Workflow

1. Analyze the user's prompt to understand the desired map theme, colors, and emphasis.
2. Use the available Mapbox tools to create a style:
   - Prefer the StyleBuilderTool for conversational style creation from a description.
   - Alternatively, use CreateStyleTool directly if you need precise control over the style JSON.
3. Validate the created style using ValidateStyleTool.
4. Generate a preview URL using PreviewStyleTool.
5. Determine the optimal layer type (see Layer Type Selection below).
6. Return a JSON object with the style details.

## Layer Type Selection

After creating the style, determine which layer type to use:

- If the style ONLY styles and filters built-in Mapbox vector tilesets (e.g. mapbox-streets-v8,
  mapbox-terrain-v2) and the primary layer is a vector type (fill, line, symbol, circle,
  fill-extrusion, heatmap), set `"layer_type": "mapbox-tileset-vector"` and include the
  `tileset_id`, `source_layer`, and `layer_geometry_type` fields.

- If the style requires custom sources, external tile URLs, multiple distinct tilesets, raster
  overlay layers (satellite, hillshade), or cannot be represented as a single vector tileset
  layer, set `"layer_type": "mapbox"`.

- Base/terrain layers (background, land, water, roads, labels) may use raster sources. All other
  thematic or data layers MUST prefer vector sources and vector layer types.

## Response Format

You MUST respond ONLY with a raw JSON object (no markdown, no conversational text).

When layer_type is "mapbox-tileset-vector":
{
  "style_id": "username/abc123",
  "style_name": "Human-readable style name",
  "layer_title": "Short descriptive title derived from the prompt",
  "style_url": "mapbox://styles/username/abc123",
  "preview_url": "https://mapbox.com/...",
  "style_json": { ... },
  "layer_type": "mapbox-tileset-vector",
  "tileset_id": "mapbox.mapbox-streets-v8",
  "source_layer": "water",
  "layer_geometry_type": "fill"
}

When layer_type is "mapbox":
{
  "style_id": "username/abc123",
  "style_name": "Human-readable style name",
  "layer_title": "Short descriptive title derived from the prompt",
  "style_url": "mapbox://styles/username/abc123",
  "preview_url": "https://mapbox.com/...",
  "style_json": { ... },
  "layer_type": "mapbox"
}

## Design Principles

- ALWAYS prefer vector layers (fill, line, symbol, circle, fill-extrusion) over raster sources
  for thematic and data layers. Base/terrain layers (background, land, water, roads, labels)
  may use raster.
- Only use raster sources for non-base layers when there is no vector equivalent available
  (e.g. satellite imagery).
- Choose appropriate base layers (background, land, water, roads, labels).
- Use harmonious color palettes.
- Ensure good contrast and readability.
- Consider the map's intended use (navigation, thematic, editorial, etc.).
- Keep the style performant — avoid excessive layers.
- When using Mapbox tilesets, prefer mapbox://mapbox-streets-v8 or similar vector sources.
PROMPT;
	}

	/**
	 * Provide Mapbox DevKit MCP tools to the agent.
	 *
	 * @return array
	 */
	protected function tools(): array {
		try {
			$connector = McpConnector::make(
				array(
					'url'     => self::MCP_ENDPOINT,
					'token'   => $this->mapbox_token,
					'timeout' => 60,
				)
			)->only(
				array(
					'StyleBuilderTool',
					'CreateStyleTool',
					'ValidateStyleTool',
					'PreviewStyleTool',
					'RetrieveStyleTool',
					'ListStylesTool',
				)
			);

			return $connector->tools();
		} catch ( \Exception $e ) {
			return array();
		}
	}

	/**
	 * Handle tool execution errors gracefully.
	 *
	 * @return callable|null
	 */
	protected function resolveToolErrorHandler(): ?callable {
		return function ( \Throwable $e, $tool ): string {
			return wp_json_encode(
				array(
					'error'   => true,
					'message' => $e->getMessage(),
					'tool'    => $tool->getName(),
				)
			);
		};
	}

	/**
	 * Run the minilayer generation.
	 *
	 * @param string $prompt User's text description of the desired map style.
	 * @return string Raw response from the AI.
	 * @throws \Exception On agent failure.
	 */
	public function generate( string $prompt ): string {
		$this->setInstructions( $this->instructions() );
		$message = $this->chat( new UserMessage( $prompt ) )->getMessage();
		return $message->getContent();
	}
}
