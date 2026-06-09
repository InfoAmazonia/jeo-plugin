const TRANSIENT_LAYER_VISIBILITY_ERRORS = [
	'Style is not done loading',
	'does not exist in the map',
];

function isTransientLayerVisibilityError( error ) {
	const message = error?.message || '';

	return TRANSIENT_LAYER_VISIBILITY_ERRORS.some( ( expectedMessage ) =>
		message.includes( expectedMessage )
	);
}

export function isMapStyleReady( map ) {
	if ( ! map ) {
		return false;
	}

	if ( typeof map.isStyleLoaded !== 'function' ) {
		return true;
	}

	try {
		return map.isStyleLoaded();
	} catch ( error ) {
		return false;
	}
}

function hasMapLayer( map, layerSlug ) {
	if ( typeof map?.getLayer !== 'function' ) {
		return false;
	}

	try {
		return Boolean( map.getLayer( layerSlug ) );
	} catch ( error ) {
		if ( isTransientLayerVisibilityError( error ) ) {
			return false;
		}

		throw error;
	}
}

export function setMapLayerVisibility( map, layerSlug, visibility ) {
	if (
		! layerSlug ||
		! isMapStyleReady( map ) ||
		! hasMapLayer( map, layerSlug ) ||
		typeof map?.setLayoutProperty !== 'function'
	) {
		return false;
	}

	try {
		map.setLayoutProperty( layerSlug, 'visibility', visibility );
		return true;
	} catch ( error ) {
		if ( isTransientLayerVisibilityError( error ) ) {
			return false;
		}

		throw error;
	}
}
