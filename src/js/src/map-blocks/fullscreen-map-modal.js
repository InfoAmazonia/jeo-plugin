import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import Map, { MapboxAPIKey } from './map';

export default function LayersSettingsModal( {
	closeModal,
	loadedLayers,
	style,
	containerStyle,
	zoom,
	center,
	animationOptions,
	onMoveEnd,
	renderLayer,
	postMeta,
} ) {
	return (
		<Modal
			className="jeo-layers-modal full-screen-map-modal"
			title={ __( 'Fullscreen map', 'jeo' ) }
			onRequestClose={ closeModal }
		>
			{ MapboxAPIKey && (
				<Map
					className="full-screen-map-modal"
					style={ style }
					containerStyle={ containerStyle }
					zoom={ zoom }
					center={ center }
					animationOptions={ animationOptions }
					onMoveEnd={ onMoveEnd }
				>
					{ loadedLayers && postMeta.layers.map( ( layer ) => {
						const layerOptions = loadedLayers.find( ( { id } ) => id === layer.id ).meta;
						return renderLayer( layerOptions, layer );
					} ) }
				</Map>
			) }
		</Modal>
	);
}
