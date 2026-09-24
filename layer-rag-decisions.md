# Layer RAG Pipeline — Architectural Decisions

This document records the architectural decisions made during the design of the Layer RAG vectorization pipeline.

## Decision 1: Two Separate Stores vs. One Unified Store

**Decision: Two separate stores** (`jeo_knowledge` for posts, `jeo_layers_knowledge` for layers).

**Rationale:**

- **Targeted retrieval without wasted slots.** With a single store and `topK=3`, a search for "Amazon deforestation layers" could return 3 posts and 0 layers. Separate stores ensure layer queries always return layers.
- **Independent lifecycle.** Layers can be cleared/reset without affecting post embeddings, and vice versa.
- **Faster searches.** Smaller stores per domain mean faster similarity search within each.
- **Same embedding model guarantees cross-compatibility.** Since both stores use the same model, vectors are in the same mathematical space. Cross-store retrieval works by embedding query text with the shared model and searching the target store.

**Alternative considered:** Single store with post-type filtering after retrieval. Rejected because it wastes retrieval slots and requires post-hoc filtering.

## Decision 2: Shared vs. Independent Embedding Models

**Decision: One shared embedding model** for both stores.

**Rationale:**

- **Simpler configuration.** One model selector in the Knowledge Base settings.
- **Guaranteed vector space compatibility.** Same model = same dimensional space = reliable cross-store similarity.
- **No operational complexity.** No risk of mismatched dimensions or incompatible similarity metrics.

**Alternative considered:** Independent model per store. Rejected because it doubles configuration complexity and breaks cross-store retrieval unless both models happen to produce same-dimension vectors.

## Decision 3: Unified Pipeline vs. Separate Worker Classes

**Decision: Unified pipeline** via `RAG_Pipeline_Config` value object, with a single `RAG_Worker` managing multiple named pipelines.

**Rationale:**

- **~95% shared logic.** Batch processing, model lock checking, cron scheduling, logging, and REST patterns are identical between posts and layers — only the configuration differs (store name, post type, data loader, meta key).
- **Bug fixes propagate automatically.** A fix in batch processing applies to both stores.
- **Easy extensibility.** Adding a third pipeline (e.g., for `map` CPTs) requires only a new `RAG_Pipeline_Config` entry.
- **Less code.** Eliminates a would-be duplicate `Layer_RAG_Worker` class (~200 lines).

**Alternative considered:** Separate `Layer_RAG_Worker` class mirroring `RAG_Worker`. Rejected due to code duplication and maintenance burden.

## Decision 4: Single vs. Separate Cron Hooks

**Decision: Single cron hook** (`jeo_rag_index_cron_hook`) with sequential processing of all pipelines.

**Rationale:**

- Layers are a small dataset that can be fully indexed in 1–2 batches. Separate scheduling adds unnecessary complexity.
- When nothing new needs indexing, the query simply returns empty and moves on — negligible overhead.
- Single hook means single schedule configuration (the existing auto-index toggle and interval selector).
- Complemented by a `save_post` hook on `map-layer` for immediate indexing on creation (especially useful for AI-assisted layer creation via Minilayer).

**Alternatives considered:**

- **Separate cron hooks per pipeline.** More granular but over-engineered for the layer dataset size.
- **On-demand only (no cron for layers).** Rejected because some instances have dozens or hundreds of layers, and new layers can be added at any time via Minilayer.

## Decision 5: Color Analysis Strategy for Legend Data

**Decision: HSL-based qualitative color descriptions** paired with legend labels.

**Rationale:**

- Legend data contains hex colors and labels. Raw hex values (e.g., `#ff0000`) are meaningless to embedding models.
- Color properties (hue name, lightness, saturation, temperature) carry semantic value for map design use cases: "suggest layers with warm color palettes", "find layers that harmonize with my pastel blue base layer".
- Colors are described qualitatively (e.g., "dark vivid green") and paired with their labels (e.g., "Forest (dark vivid green)"), amplifying the semantic signal rather than acting as standalone information.
- A palette summary is computed across all legend colors (e.g., "warm, mostly vivid, darker tones") for holistic color characteristics.

**Implementation:** Pure PHP utility (`Color_Describer`) with hex→HSL conversion and threshold lookups. No external dependencies.

**Alternative considered:** Raw hex values in embedding text. Rejected as noise.

## Decision 6: Source URL and Source Layer Readability Heuristic

**Decision: Only include source URLs and source layers in embedding text if they contain human-readable keywords.**

**Rationale:**

- Source URLs like `https://tiles.example.com/a8f3b2/{z}/{x}/{y}.pbf` and source layers like `src_lyr_001` add noise, not signal.
- URLs like `https://tiles.example.com/deforestation/amazon/{z}/{x}/{y}.pbf` and source layers like `deforestation_amazon_2024` carry meaningful semantic content.

**Heuristic:**

- **Source layer:** Include if the string contains ≥1 alphabetic word of 3+ characters.
- **Source URL:** Parse the path component only (strip scheme and domain), then apply the same ≥1 word rule.

## Decision 7: Legend Data Extraction

**Decision: Extract string labels from legend type options JSON**, with type-specific parsing per legend type and a generic recursive fallback.

**Rationale:**

- Legend labels (e.g., "Forest", "Deforested", "Indigenous Land") are semantically rich and highly relevant for matching.
- Each legend type has a known structure (barscale: `left_label`/`right_label`; simple-color/icons: `colors[].label`; circles: `circles[].label`).
- Unknown/custom legend types use a generic recursive string extractor as fallback.

## Decision 8: `post_content` Optional in Layer Embeddings

**Decision: Include `post_content` only if present and non-empty.**

**Rationale:**

- Most map layers lack `post_content` — they are internal CPTs primarily configured via metadata.
- Future plans may populate `post_content` for richer AI suggestions.
- The data loader handles both cases gracefully: title + metadata when no content, title + metadata + content when available.

## Decision 9: Cross-Store Retrieval via `find_matching_layers()`

**Decision: Expose a `find_matching_layers($text, $topK)` static helper** on `RAG_Worker` for cross-store semantic matching.

**Rationale:**

- The primary use case is: given a post about "deforestation in the Amazon rainforest", find the most relevant map layers.
- Implementation: embed the post content (or any text) using the shared embedding model, then search the layer store via NeuronAI's `SimilarityRetrieval`.
- Available via REST (`POST /jeo/v1/ai-suggest-layers` with `post_id` or `query`) and as a PHP static method for programmatic use.

## Decision 10: WP-CLI Aliases

**Decision: Provide convenience aliases** `vectorize-posts` and `vectorize-layers` that delegate to the parameterized `vectorize` command.

**Rationale:**

- The base `vectorize` command supports `--store=posts|layers` for full flexibility.
- Aliases provide discoverable, self-documenting shortcuts that are easier to remember and type.
- Each alias simply pre-sets the `store` parameter and delegates to the shared implementation.
