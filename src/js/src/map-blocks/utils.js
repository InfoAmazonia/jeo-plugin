import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export function loadLayer ( settings ) {
	const layers = select( 'core' ).getEntityRecords( 'postType', 'map-layer', {
		include: [settings.id],
	} );
	const layer = layers?.[0];
	return { ...settings, layer };
}

export const layerUseLabels = {
	fixed: __( 'Fixed', 'jeo' ),
	swappable: __( 'Swappable', 'jeo' ),
	switchable: __( 'Switchable', 'jeo' ),
};
