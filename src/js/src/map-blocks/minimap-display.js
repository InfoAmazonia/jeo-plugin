import { useBlockProps } from '@wordpress/block-editor';

export default function MinimapDisplay( { attributes } ) {
	const allLayers = [];

	if ( attributes.base_layer ) {
		allLayers.push( attributes.base_layer );
	}

	if ( attributes.layers && attributes.layers.length > 0 ) {
		allLayers.push( ...attributes.layers );
	}

	const hasPins = attributes.pins && attributes.pins.length > 0;

	const blockProps = useBlockProps.save( {
		className: 'jeomap',
		'data-center_lat': attributes.center_lat,
		'data-center_lon': attributes.center_lon,
		'data-initial_zoom': attributes.initial_zoom,
		'data-min_zoom': attributes.min_zoom,
		'data-max_zoom': attributes.max_zoom,
		'data-disable_scroll_zoom': attributes.disable_scroll_zoom || undefined,
		'data-disable_drag_pan': attributes.disable_drag_pan || undefined,
		'data-disable_drag_rotate': attributes.disable_drag_rotate || undefined,
		'data-enable_fullscreen': attributes.enable_fullscreen || undefined,
		'data-layers': allLayers.length > 0 ? JSON.stringify( allLayers ) : undefined,
		'data-pan_limits': attributes.pan_limits ? JSON.stringify( attributes.pan_limits ) : undefined,
		'data-pins': hasPins ? JSON.stringify( attributes.pins ) : undefined,
		'data-show_pins': hasPins ? String( !! attributes.show_pins ) : undefined,
	} );

	return (
		<div { ...blockProps } />
	);
}
