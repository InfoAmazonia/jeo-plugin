import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import Map, { MapboxAPIKey } from './map';

export default function LayersSettingsModal( {
	closeModal,	style,
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
			title={ __( 'Fullscreen layer', 'jeo' ) }
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
					{ renderLayer( postMeta, {
						id: 1,
						use: 'fixed',
					} ) }
				</Map>
			) }
		</Modal>
	);
}
