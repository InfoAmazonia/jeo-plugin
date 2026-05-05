# Minilayer (AI-Generated Layers)

Creates Mapbox map styles from natural-language prompts and auto-creates a JEO layer (CPT `map-layer`).

## Key Files

| File | Class | Role |
|------|-------|------|
| `src/includes/ai/class-minilayer-agent.php` | `Minilayer_Agent` | NeuronAI Agent with Mapbox DevKit MCP tools |
| `src/includes/ai/class-minilayer-handler.php` | `Minilayer_Handler` | REST endpoint, JSON parsing, layer CPT creation |

## Flow

```mermaid
sequenceDiagram
    participant Client
    participant REST as /minilayer/generate
    participant H as Minilayer_Handler
    participant A as Minilayer_Agent
    participant MCP as Mapbox DevKit MCP
    participant LLM as AI Provider

    Client->>REST: POST { prompt }
    REST->>H: api_generate()
    H->>H: Validate Mapbox key + AI provider
    H->>A: generate(prompt)
    A->>A: tools() → McpConnector → Mapbox DevKit
    A->>LLM: Chat with MCP tools available
    LLM-->>A: Tool calls (StyleBuilderTool, CreateStyleTool, ...)
    A->>MCP: callTool() via StreamableHttpTransport
    MCP-->>A: Style created
    A->>A: Determine layer_type (tileset-vector vs mapbox)
    A-->>H: { style_id, layer_title, style_json, layer_type, ... }
    H->>H: is_tileset_vector() → choose CPT type
    H->>H: Create map-layer CPT
    H-->>REST: { style, layer }
    REST-->>Client: 200 OK
```

## MCP Connection

- **Endpoint**: `https://mcp-devkit.mapbox.com/mcp` (hosted, StreamableHttpTransport)
- **Auth**: Mapbox access token from `jeo_settings()->get_option('mapbox_key')` as Bearer token
- **Tools used**: `StyleBuilderTool`, `CreateStyleTool`, `ValidateStyleTool`, `PreviewStyleTool`, `RetrieveStyleTool`, `ListStylesTool`

## REST Endpoint

```
POST /jeo/v1/minilayer/generate
Permission: edit_posts
Body: { "prompt": string, "layer_name"?: string }
Response: { "success": true, "style": {...}, "layer": { "id", "title", "type", "style_id", "edit_url", ... } }
```

## Response Parsing

The handler extracts a JSON object from the AI response (handling thinking tags, markdown fences, bracket matching). Expected keys: `style_id`, `style_name`, `layer_title`, `style_url`, `preview_url`, `style_json`, `layer_type`.

## Layer Type Selection

The agent determines the layer type after creating the style:

| Condition | `layer_type` | CPT `type` |
|-----------|-------------|------------|
| Style only styles/filters a single Mapbox vector tileset, primary layer is vector | `mapbox-tileset-vector` | `mapbox-tileset-vector` |
| Style needs custom sources, raster overlays, multiple tilesets, or satellite imagery | `mapbox` | `mapbox` |

### `mapbox-tileset-vector` additional response fields

`tileset_id`, `source_layer`, `layer_geometry_type`

### `is_tileset_vector()` validation

Requires all three tileset fields present and `layer_geometry_type` to be one of: `fill`, `line`, `symbol`, `circle`, `fill-extrusion`, `heatmap`.

## Layer CPT Creation

Creates a `map-layer` post. The type depends on the layer selection:

### mapbox-tileset-vector

- `type` = `mapbox-tileset-vector`
- `layer_type_options` = `{ tileset_id, source_layer, type, style_source_type: "vector" }`

### mapbox (fallback)

- `type` = `mapbox`
- `layer_type_options` = `{ style_id: "username/style_id" }`

Title: from `layer_title` (AI-derived from prompt) > `layer_name` param > `style_name` > fallback

## Design Principles

The agent is instructed to:
- Prefer vector layers over raster for thematic/data layers
- Base/terrain layers (background, land, water, roads, labels) may use raster
- Prefer `mapbox-tileset-vector` when only styling/filtering Mapbox built-in tilesets
- Use Mapbox vector tilesets (e.g. `mapbox://mapbox-streets-v8`) when possible
- Ensure good contrast and readability
- Keep styles performant with minimal layers
