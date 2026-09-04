/**
 * Generic style-layer-type detection.
 *
 * Style layer types (mapbox, style-json, or any type registered with
 * `isStyle: true` on the frontend JeoLayerTypes registry) load a whole map
 * style instead of being added as individual GL layers. Consumers should key
 * off this helper instead of hardcoding type slugs so future providers work
 * without changes.
 *
 * The registry is loaded both on the frontend and inside the block-editor
 * iframe (`Layer_Types::enqueue_iframe_assets()`), so it is expected to be
 * available; when it is missing the helper degrades to false rather than
 * guessing from a hardcoded list.
 *
 * @param {string} slug     Layer type slug.
 * @param {Object} registry Optional JeoLayerTypes-like registry (mainly for
 *                          tests). Defaults to `window.JeoLayerTypes`.
 * @return {boolean} Whether the type loads a whole map style.
 */
export function isStyleLayerType( slug, registry = window.JeoLayerTypes ) {
	if ( ! slug ) {
		return false;
	}

	return registry?.isStyle?.( slug ) === true;
}
