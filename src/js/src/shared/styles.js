export function resolveTileUrl( url ) {
	// Tolerate transient undefined/empty values while the layer form syncs
	// (a mid-typing frame used to crash the block into the core error
	// boundary — GAP-A).
	if ( typeof url !== 'string' ) {
		return '';
	}
	return url.replace( /\{r\}/g, window.devicePixelRatio >= 2 ? '@2x' : '' );
}

export const EMPTY_STYLE = {
	version: 8,
	name: 'Empty',
	sources: {},
	layers: [
		{
			id: 'jeo-empty',
			type: 'background',
			paint: {
				'background-color': 'rgba(0,0,0,0)'
			}
		}
	]
}
