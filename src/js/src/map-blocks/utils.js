import { __ } from '@wordpress/i18n';

export function loadLayer ( layers, settings ) {
	const layer = ( layers || [] ).find( ( layer ) => layer.id === settings.id );
	return { ...settings, layer };
}

export const layerUseLabels = {
	fixed: __( 'Fixed', 'jeo' ),
	swappable: __( 'Swappable', 'jeo' ),
	switchable: __( 'Switchable', 'jeo' ),
};
