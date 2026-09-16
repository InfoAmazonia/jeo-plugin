export function resolveTileUrl( url ) {
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
