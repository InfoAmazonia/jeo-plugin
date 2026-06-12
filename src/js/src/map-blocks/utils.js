import { _x } from '@wordpress/i18n';

export function loadLayer ( layers, settings ) {
	const layer = ( layers || [] ).find( ( layer ) => layer.id === settings.id );
	return { ...settings, layer };
}

export const layerUseLabels = {
	fixed: _x( 'Fixed', 'layer', 'jeo' ),
	swappable: _x( 'Swappable', 'layer', 'jeo' ),
	switchable: _x( 'Switchable', 'layer', 'jeo' ),
};
